import { runPython } from "../utils/pythonBridge.js";
import supabase from "../db/index.js";
import fs from "fs";
import path from "path";
import os from "os";

export const imputeData = async (req, res) => {
    try {
        const { fileUrl, column, strategy = 'auto' } = req.body;

        if (!fileUrl || !column) {
            return res.status(400).json({ error: "fileUrl and column are required" });
        }

        // 1. Download the file from Supabase to a temp file to ensure we have the latest version
        // (Avoiding potential caching issues with pd.read_csv(url))
        // Handle potential query params in URL
        const cleanUrl = fileUrl.split('?')[0];
        const urlParts = cleanUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const bucketName = "csv-uploads";

        let result = null;
        let useFallback = false;

        try {
            // 1. Download the file from Supabase to a temp file
            const { data: fileData, error: downloadError } = await supabase.storage
                .from(bucketName)
                .download(fileName);

            if (downloadError) {
                throw new Error("Failed to download file from storage: " + downloadError.message);
            }

            const tempDir = os.tmpdir();
            const tempInputPath = path.join(tempDir, `input_${Date.now()}_${fileName}`);
            const buffer = Buffer.from(await fileData.arrayBuffer());
            fs.writeFileSync(tempInputPath, buffer);

            // 2. Run Imputation on the local temp file
            result = await runPython([
                "./python/impute.py",
                "--file",
                tempInputPath,
                "--column",
                column,
                "--strategy",
                strategy
            ]);

            // Cleanup input temp file
            try {
                fs.unlinkSync(tempInputPath);
            } catch (e) { console.error("Failed to cleanup input temp file", e); }

            if (result.error) {
                throw new Error(result.error);
            }

            // 3. Upload the result back to Supabase
            if (result.temp_path && fs.existsSync(result.temp_path)) {
                try {
                    const fileContent = fs.readFileSync(result.temp_path);

                    const { error: uploadError } = await supabase.storage
                        .from(bucketName)
                        .upload(fileName, fileContent, {
                            contentType: 'text/csv',
                            upsert: true
                        });

                    if (uploadError) {
                        throw new Error("Failed to update remote file: " + uploadError.message);
                    }

                } catch (uploadErr) {
                    throw uploadErr;
                } finally {
                    // Cleanup output temp file
                    try {
                        fs.unlinkSync(result.temp_path);
                    } catch (cleanupErr) {
                        console.error("Failed to cleanup output temp file:", cleanupErr);
                    }
                }
            }
        } catch (err) {
            console.warn("Python imputation failed, falling back to pure JavaScript Imputer:", err.message);
            useFallback = true;
        }

        // JS In-Memory Imputation Fallback
        if (useFallback) {
            try {
                const { imputeCSVJS } = await import("../utils/imputer.js");
                const jsResult = await imputeCSVJS(fileUrl, column, strategy);

                // Upload the in-memory CSV result back to Supabase
                const { error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(fileName, jsResult.csvContent, {
                        contentType: 'text/csv',
                        upsert: true
                    });

                if (uploadError) {
                    throw new Error("Failed to update remote file via JS: " + uploadError.message);
                }

                // Remove csvContent before returning to client (keep clean payload)
                delete jsResult.csvContent;
                result = jsResult;
            } catch (jsErr) {
                console.error("JavaScript imputation failed:", jsErr);
                return res.status(500).json({ error: jsErr.message });
            }
        }

        res.json({ status: "success", data: result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
