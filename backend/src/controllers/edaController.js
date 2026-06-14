import { runPython } from "../utils/pythonBridge.js";

export const performEDA = async (req, res) => {
    try {
        const { fileUrl, targetColumn } = req.body;

        if (!fileUrl) {
            return res.status(400).json({ error: "fileUrl is required" });
        }

        let result = null;
        let useFallback = false;

        try {
            const args = ["./python/eda.py", "--file", fileUrl];
            if (targetColumn) {
                args.push("--target", targetColumn);
            }
            result = await runPython(args);
            if (result.error) {
                throw new Error(result.error);
            }
        } catch (pyError) {
            console.warn("Python EDA failed, falling back to pure JavaScript EDA:", pyError.message);
            useFallback = true;
        }

        if (useFallback) {
            try {
                const { performEDAJS } = await import("../utils/eda.js");
                result = await performEDAJS(fileUrl, targetColumn);
            } catch (jsError) {
                console.error("JavaScript EDA failed:", jsError);
                return res.status(500).json({ error: jsError.message });
            }
        }

        res.json({ status: "success", data: result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
