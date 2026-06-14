import dotenv from "dotenv";
import { app } from "./app.js";
import supabase from "./db/index.js";

dotenv.config({
    path: './.env'
});

const PORT = process.env.PORT || 8000;

// Increase timeout to 5 minutes
const server = app.listen(PORT, "0.0.0.0", async () => {
    console.log(`⚙️ Server is running at port : ${PORT}`);

    // Verify Supabase Connection
    try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
            let errorMessage = error.message;
            if (errorMessage.includes("Project paused") || (typeof error === 'string' && error.includes("Project paused"))) {
                console.error("❌ Supabase Project is PAUSED. Please go to the Supabase dashboard and unpause it.");
            } else {
                console.error("❌ Supabase Connection Failed:", errorMessage);
            }
        } else {
            console.log("✅ Supabase Connected Successfully!");
        }
    } catch (err) {
        if (err.message && err.message.includes("Unexpected token 'P'")) {
            console.error("❌ Supabase Connection Error: Project likely PAUSED (Received HTML instead of JSON).");
        } else {
            console.error("❌ Supabase Connection Error:", err.message);
        }
    }
});
server.setTimeout(300000); // 5 minutes

// Keep alive hack
setInterval(() => { }, 1000);
