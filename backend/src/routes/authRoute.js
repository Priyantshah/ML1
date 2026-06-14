import express from "express";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
import supabase from "../db/index.js";

dotenv.config({ path: "./.env" });

const router = express.Router();
let oauth2Client = null;

function getOAuth2Client() {
    if (!oauth2Client) {
        oauth2Client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            "postmessage" // For React auth code flow
        );
    }
    return oauth2Client;
}

router.post("/google", async (req, res) => {
    try {
        const { code } = req.body;
        const client = getOAuth2Client();

        // Exchange the authorization code for tokens
        const { tokens } = await client.getToken(code);

        // Validate the ID token to get the user information
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        // Track user in app_users table (upsert on email)
        try {
            await supabase.from("app_users").upsert(
                {
                    email: payload.email,
                    name: payload.name,
                    picture: payload.picture,
                    provider: "google",
                    status: "Active",
                    last_login: new Date().toISOString(),
                },
                { onConflict: "email" }
            );

            // LOG ACTIVITY
            import("../utils/activityLogger.js").then(({ logActivity }) => {
                logActivity("login", payload.email, { name: payload.name, provider: "google" });
            });
        } catch (dbErr) {
            // Non-fatal: table may not exist yet
            console.warn("Could not save user to app_users:", dbErr.message);
        }

        // Returns verified user credentials from Google!
        res.json({
            status: "success",
            data: {
                user: {
                    email: payload.email,
                    name: payload.name,
                    picture: payload.picture,
                    provider: "google",
                    app_metadata: { provider: "google" }
                },
            },
        });
    } catch (err) {
        console.error("Google auth backend error:", err);
        res.status(401).json({ status: "error", message: "Invalid Google Authentication" });
    }
});

// NEW: Endpoint to sync user activity for all login types
router.post("/sync", async (req, res) => {
    try {
        const { email, name, picture } = req.body;
        if (!email) return res.status(400).json({ status: "error", message: "Email is required" });

        await supabase.from("app_users").upsert(
            {
                email,
                name: name || email.split('@')[0],
                picture: picture || null,
                last_login: new Date().toISOString(),
            },
            { onConflict: "email" }
        );

        res.json({ status: "success" });
    } catch (err) {
        console.error("User sync error:", err);
        res.status(500).json({ status: "error", message: err.message });
    }
});

router.post("/heartbeat", async (req, res) => {
    try {
        const { email } = req.body;
        if (email) {
            import("../utils/activityLogger.js").then(({ logActivity }) => {
                logActivity("session_heartbeat", email);
            });
        }
        res.json({ status: "success" });
    } catch (err) {
        res.status(500).json({ status: "error" });
    }
});

export default router;
