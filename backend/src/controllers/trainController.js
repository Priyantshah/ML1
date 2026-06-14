import { runPython } from "../utils/pythonBridge.js";
import supabase from "../db/index.js";
import fs from "fs";
import path from "path";
import os from "os";
import https from "https";
import http from "http";
import { spawn } from "child_process";

const uploadModelToSupabase = async (modelPath) => {
    let modelUrl = "";

    if (!modelPath || !fs.existsSync(modelPath)) {
        return modelUrl;
    }

    try {
        const modelFileContent = fs.readFileSync(modelPath);
        const modelFileName = path.basename(modelPath);
        const bucketName = "models";

        // Ensure bucket exists
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        if (!listError) {
            const bucketExists = buckets.find((b) => b.name === bucketName);
            if (!bucketExists) {
                console.log(`Bucket '${bucketName}' not found. Creating...`);
                const { error: createError } = await supabase.storage.createBucket(bucketName, {
                    public: true
                });
                if (createError) {
                    console.error("Failed to create bucket:", createError);
                }
            }
        }

        const { error } = await supabase.storage
            .from(bucketName)
            .upload(modelFileName, modelFileContent, {
                contentType: "application/octet-stream",
                upsert: true
            });

        if (error) {
            console.error("Model upload failed:", error);
            return modelUrl;
        }

        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(modelFileName);
        modelUrl = publicUrlData.publicUrl;

        // Cleanup local file only if upload succeeded
        try {
            if (fs.existsSync(modelPath)) {
                fs.unlinkSync(modelPath);
            }
        } catch (cleanupErr) {
            console.error("Failed to cleanup model file:", cleanupErr);
        }
    } catch (uploadErr) {
        console.error("Model upload error:", uploadErr);
    }

    return modelUrl;
};

const logTrainingActivity = (fileUrl, targetColumn, result) => {
    import("../utils/activityLogger.js").then(({ logActivity }) => {
        logActivity("model_trained", "system_user", {
            fileUrl,
            targetColumn,
            accuracy: result.accuracy,
            model_type: result.model_type
        });
    });
};

const resetTrainingArtifacts = () => {
    const cwd = process.cwd();
    const repoRoot = path.resolve(cwd, "..");
    const candidatePaths = [
        path.join(cwd, "best_model_Classification.pkl"),
        path.join(cwd, "preprocessor.pkl"),
        path.join(cwd, "best_model_Regression.pkl"),
        path.join(cwd, "python", "best_model_Classification.pkl"),
        path.join(cwd, "python", "preprocessor.pkl"),
        path.join(cwd, "python", "best_model_Regression.pkl"),
        path.join(repoRoot, "best_model_Classification.pkl"),
        path.join(repoRoot, "preprocessor.pkl"),
        path.join(repoRoot, "best_model_Regression.pkl"),
        path.join(repoRoot, "best_model_Classification_KNN_Classifier.pkl")
    ];

    const deleted = [];
    const missing = [];
    const errors = [];

    for (const filePath of candidatePaths) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                deleted.push(filePath);
            } else {
                missing.push(filePath);
            }
        } catch (err) {
            errors.push({ file: filePath, error: err.message });
        }
    }

    return { deleted, missing, errors };
};

export const trainModels = async (req, res) => {
    try {
        const { fileUrl, targetColumn, eda_config } = req.body;

        if (!fileUrl || !targetColumn) {
            return res.status(400).json({ error: "fileUrl and targetColumn are required" });
        }

        let edaJsonPath = null;
        if (eda_config) {
            edaJsonPath = path.join(process.cwd(), `eda_config_legacy_${Date.now()}.json`);
            fs.writeFileSync(edaJsonPath, JSON.stringify(eda_config, null, 2));
        }

        const args = [
            "./python/train.py",
            "--file", fileUrl,
            "--target", targetColumn
        ];

        if (edaJsonPath) {
            args.push("--eda_json", edaJsonPath);
        }

        // 1. Run Training Script
        const result = await runPython(args, (data) => {
            console.log(`Training Progress: ${data.progress}%`);
        });

        if (edaJsonPath && fs.existsSync(edaJsonPath)) {
            fs.unlinkSync(edaJsonPath);
        }

        if (result.error) {
            if (edaJsonPath && fs.existsSync(edaJsonPath)) fs.unlinkSync(edaJsonPath);
            return res.status(500).json({ status: "error", error: result.error });
        }

        // 2. Upload Best Model to Supabase
        const modelUrl = await uploadModelToSupabase(result.model_path);

        // Log Activity
        logTrainingActivity(fileUrl, targetColumn, result);

        // Send final result as standard JSON
        res.json({
            status: "success",
            data: {
                ...result,
                model_url: modelUrl
            }
        });

    } catch (err) {
        console.error("Train Controller Error:", err);
        res.status(500).json({ status: "error", error: err.message });
    }
};

export const trainModelsStream = async (req, res) => {
    const { fileUrl, targetColumn, eda_config } = req.body;

    if (!fileUrl || !targetColumn) {
        return res.status(400).json({ error: "fileUrl and targetColumn are required" });
    }

    // Bypass 120s Node.js timeout for long ML processes
    req.setTimeout(0);
    res.setTimeout(0);

    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    if (typeof res.flushHeaders === "function") {
        res.flushHeaders();
    }

    // Keepalive ping to prevent proxy/browser timeout (ERR_CONNECTION_RESET)
    const keepAliveId = setInterval(() => {
        if (!res.writableEnded) {
            try { res.write("\n"); } catch (e) { clearInterval(keepAliveId); }
        } else {
            clearInterval(keepAliveId);
        }
    }, 25000);

    const sendEvent = (payload) => {
        if (!res.writableEnded) {
            try { res.write(`${JSON.stringify(payload)}\n`); } catch (e) { /* ignore */ }
        }
    };

    let edaJsonPath = null;
    try {
        if (eda_config) {
            edaJsonPath = path.join(os.tmpdir(), `eda_config_${Date.now()}.json`);
            fs.writeFileSync(edaJsonPath, JSON.stringify(eda_config, null, 2));
        }

        // Download file if it's a remote URL to a local temp path
        let localFilePath = fileUrl;
        let tempFilePath = null;
        if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
            tempFilePath = path.join(os.tmpdir(), `automl_dataset_${Date.now()}.csv`);
            console.log(`[TrainController] Downloading remote file to: ${tempFilePath}`);

            // Recursive helper that follows HTTP redirects
            const downloadWithRedirects = (url, destPath, maxRedirects = 5) => new Promise((resolve, reject) => {
                if (maxRedirects < 0) { reject(new Error('Too many redirects')); return; }
                const protocol = url.startsWith('https://') ? https : http;
                const file = fs.createWriteStream(destPath);
                protocol.get(url, { timeout: 60000 }, (response) => {
                    if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
                        file.close();
                        downloadWithRedirects(response.headers.location, destPath, maxRedirects - 1)
                            .then(resolve).catch(reject);
                        return;
                    }
                    if (response.statusCode !== 200) {
                        file.close();
                        reject(new Error(`HTTP ${response.statusCode} downloading dataset`));
                        return;
                    }
                    response.pipe(file);
                    file.on('finish', () => file.close(resolve));
                    file.on('error', reject);
                }).on('error', reject);
            });

            await downloadWithRedirects(fileUrl, tempFilePath);
            localFilePath = tempFilePath;
            console.log(`[TrainController] Download complete. File size: ${fs.statSync(tempFilePath).size} bytes`);
        }

        const pythonCommand = process.platform === "win32" ? "python" : "python3";
        const scriptPath = path.resolve(process.cwd(), "python", "train.py");
        const args = [
            "-u",
            scriptPath,
            "--file", localFilePath,
            "--target", targetColumn
        ];
        if (edaJsonPath) {
            args.push("--eda_json", path.resolve(edaJsonPath));
        }

        console.log(`[TrainController] Spawning: ${pythonCommand} ${args.join(' ')}`);
        let py;
        try {
            py = spawn(pythonCommand, args, {
                env: { ...process.env, PYTHONUNBUFFERED: "1", PYTHONIOENCODING: "utf-8" }
            });
            console.log(`[TrainController] Process started with PID: ${py.pid}`);
        } catch (spawnError) {
            console.error(`[TrainController] CRITICAL SPAWN ERROR:`, spawnError);
            throw new Error(`Failed to initialize training engine: ${spawnError.message}`);
        }

        req.on("close", () => {
            clearInterval(keepAliveId);
            if (!py.killed) py.kill();
        });

        let output = "";
        let stderr = "";
        let lineBuffer = "";

        py.stdout.on("data", (data) => {
            const str = data.toString();
            output += str;
            lineBuffer += str;
            const lines = lineBuffer.split("\n");
            lineBuffer = lines.pop() || "";

            lines.forEach((line) => {
                if (line.startsWith("PROGRESS:")) {
                    const progress = parseInt(line.split(":")[1]?.trim(), 10);
                    if (!Number.isNaN(progress)) {
                        sendEvent({ type: "progress", progress });
                    }
                }
            });
        });

        py.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        py.on("error", (err) => {
            clearInterval(keepAliveId);
            if (edaJsonPath && fs.existsSync(edaJsonPath)) fs.unlinkSync(edaJsonPath);
            sendEvent({ type: "error", error: `Failed to start Python process: ${err.message}` });
            if (!res.writableEnded) res.end();
        });

        py.on("close", async (code, signal) => {
            clearInterval(keepAliveId);
            if (edaJsonPath && fs.existsSync(edaJsonPath)) fs.unlinkSync(edaJsonPath);
            if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            if (stderr) {
                console.error(`[TrainController] Python Process ${py.pid} Stderr (Raw):`, stderr);
            }
            console.log(`[TrainController] Process ${py.pid} Final Raw Output Catch: ${output.slice(0, 500)}... (Code: ${code}, Signal: ${signal})`);

            try {
                const lines = output.split("\n").filter((line) => {
                    const t = line.trim();
                    return t &&
                        !t.startsWith("PROGRESS:") &&
                        !t.startsWith("[TRAIN]") &&
                        !t.startsWith("DEBUG:") &&
                        !t.startsWith("INFO:");
                });
                const cleanOutput = lines.join("\n").trim();
                let result = null;

                // If Python exited unsuccessfully and produced stderr, surface that directly.
                if (code !== 0 && stderr.trim()) {
                    const conciseErr = stderr.trim().split("\n").slice(-8).join("\n");
                    throw new Error(`Python training failed:\n${conciseErr}`);
                }

                // Attempt 1: Parse the whole cleaned output (works if Python only printed JSON + progress)
                try {
                    result = JSON.parse(cleanOutput);
                } catch (e1) {
                    // Attempt 2: Scan for the last line that looks like a JSON object
                    for (let i = lines.length - 1; i >= 0; i -= 1) {
                        const line = lines[i].trim();
                        if (line.startsWith("{") && line.endsWith("}")) {
                            try {
                                result = JSON.parse(line);
                                break;
                            } catch (e2) {
                                continue;
                            }
                        }
                    }
                    // Attempt 3: Regex to find the largest JSON-like block
                    if (!result) {
                        const match = cleanOutput.match(/\{[\s\S]*\}/);
                        if (match) {
                            try {
                                result = JSON.parse(match[0]);
                            } catch (e3) {
                                // fall through
                            }
                        }
                    }
                }

                if (!result) {
                    const outputTail = cleanOutput ? cleanOutput.slice(-600) : "";
                    const stderrTail = stderr ? stderr.trim().slice(-600) : "";
                    const details = stderrTail || outputTail || "No output captured from Python process.";
                    throw new Error(`Failed to parse Python script output. Details: ${details}`);
                }

                if (result.error) {
                    sendEvent({ type: "error", error: result.error });
                    if (!res.writableEnded) return res.end();
                    return;
                }

                const modelUrl = await uploadModelToSupabase(result.model_path);
                logTrainingActivity(fileUrl, targetColumn, result);

                sendEvent({
                    type: "result",
                    status: "success",
                    data: {
                        ...result,
                        model_url: modelUrl
                    }
                });
                if (!res.writableEnded) res.end();
            } catch (err) {
                sendEvent({ type: "error", error: err.message });
                if (!res.writableEnded) res.end();
            }
        });
    } catch (err) {
        clearInterval(keepAliveId);
        sendEvent({ type: "error", error: err.message });
        if (!res.writableEnded) res.end();
    }
};

export const resetTrainingSystem = async (req, res) => {
    try {
        const resetResult = resetTrainingArtifacts();
        return res.json({
            status: "success",
            message: "Training system reset completed from zero state.",
            ...resetResult
        });
    } catch (err) {
        console.error("Train Reset Error:", err);
        return res.status(500).json({ status: "error", error: err.message });
    }
};
