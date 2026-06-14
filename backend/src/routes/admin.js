import express from "express";
import supabase from "../db/index.js";

const router = express.Router();

// GET /api/admin/users
router.get("/users", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("app_users")
            .select("*")
            .order("last_login", { ascending: false });

        if (error) throw error;

        const users = (data || []).map(u => ({
            id: u.id,
            email: u.email,
            name: u.name || u.email?.split('@')[0] || 'User',
            picture: u.picture || null,
            signupDate: new Date(u.created_at).toLocaleDateString(),
            lastLogin: u.last_login ? new Date(u.last_login).toLocaleString() : 'Never',
            provider: u.provider || 'google',
            status: u.status === 'Blocked' ? 'Blocked' :
                (u.last_login && (Date.now() - new Date(u.last_login).getTime() < 15 * 60 * 1000) ? 'Active' : 'Inactive')
        }));

        res.json({ status: "success", data: users });
    } catch (err) {
        res.json({ status: "success", data: [] });
    }
});

// GET /api/admin/datasets
router.get("/datasets", async (req, res) => {
    try {
        const { data, error } = await supabase.storage.from("csv-uploads").list("", { limit: 100 });
        if (error) throw error;
        const datasets = (data || []).filter(f => f.name !== '.emptyFolderPlaceholder').map((f, idx) => ({
            id: f.id || `f_${idx}`,
            name: f.name,
            owner: 'System User',
            size: f.metadata?.size ? (f.metadata.size / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown',
            type: f.metadata?.mimetype || 'csv',
            date: new Date(f.created_at).toLocaleDateString()
        }));
        res.json({ status: "success", data: datasets });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// GET /api/admin/models
router.get("/models", async (req, res) => {
    try {
        const { data, error } = await supabase.storage.from("models").list("", { limit: 100 });
        if (error) throw error;
        const models = (data || []).filter(m => m.name !== '.emptyFolderPlaceholder').map((m, idx) => ({
            id: m.id || `m_${idx}`,
            name: m.name,
            type: m.name.includes('rf') ? 'Random Forest' : 'AutoML Model',
            size: m.metadata?.size ? (m.metadata.size / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown',
            savedAt: new Date(m.created_at || Date.now()).toLocaleDateString(),
            status: 'Saved'
        }));
        res.json({ status: "success", data: models });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// DELETE /api/admin/user/:id
router.delete("/user/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.auth.admin.deleteUser(id);
        if (error) throw error;
        res.json({ status: "success", message: "User deleted" });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// GET /api/admin/download?bucket=...&file=...
router.get("/download", async (req, res) => {
    try {
        const { bucket, file } = req.query;
        if (!bucket || !file) return res.status(400).json({ status: "error", message: "Bucket and file required" });

        const { data, error } = await supabase.storage.from(bucket).download(file);
        if (error) throw error;

        // Set proper headers for file download
        res.setHeader('Content-Type', data.type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${file}"`);

        const buffer = Buffer.from(await data.arrayBuffer());
        res.send(buffer);
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// DELETE /api/admin/dataset/:name

// DELETE /api/admin/datasets/all
router.delete("/datasets/all", async (req, res) => {
    try {
        const { data: files } = await supabase.storage.from("csv-uploads").list();
        const filesToDelete = (files || []).map(f => f.name).filter(name => name !== '.emptyFolderPlaceholder');
        if (filesToDelete.length > 0) {
            await supabase.storage.from("csv-uploads").remove(filesToDelete);
        }
        res.json({ status: "success", message: `History cleared` });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// GET /api/admin/overview-stats
router.get("/overview-stats", async (req, res) => {
    try {
        const { count: userCount } = await supabase.from("app_users").select("*", { count: 'exact', head: true });

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: logs } = await supabase.from("activity_logs").select("*").gte("created_at", thirtyDaysAgo.toISOString()).order("created_at", { ascending: true });
        const { data: datasets } = await supabase.storage.from("csv-uploads").list("", { limit: 100 });
        const { data: models } = await supabase.storage.from("models").list("", { limit: 100 });

        const currentDatasetsCount = (datasets || []).filter(f => f.name !== '.emptyFolderPlaceholder').length;
        const currentModelsCount = (models || []).filter(m => m.name !== '.emptyFolderPlaceholder').length;

        const dailyStats = {};
        (logs || []).forEach(log => {
            const date = new Date(log.created_at).toISOString().split('T')[0];
            if (!dailyStats[date]) {
                dailyStats[date] = { date, users: 0, uploads: 0, models: 0, sessions: 0, totalSessionTime: 0, activeUserEmails: new Set() };
            }
            if (log.event_type === 'login') dailyStats[date].users++;
            else if (log.event_type === 'dataset_upload') dailyStats[date].uploads++;
            else if (log.event_type === 'model_trained') dailyStats[date].models++;
            else if (log.event_type === 'session_heartbeat') {
                dailyStats[date].totalSessionTime += 30;
                dailyStats[date].sessions++;
                if (log.user_email) dailyStats[date].activeUserEmails.add(log.user_email);
            }
        });

        // Strict activity filter
        const chartData = Object.values(dailyStats)
            .filter(d => (d.users > 0 || d.uploads > 0 || d.models > 0 || d.sessions > 0))
            .sort((a, b) => a.date.localeCompare(b.date));

        const { data: allUploads } = await supabase.from("activity_logs").select("id").eq("event_type", "dataset_upload");
        const historicalUploads = allUploads?.length || 0;

        let totalHeartbeats = (logs || []).filter(l => l.event_type === 'session_heartbeat').length;
        const avgSessionSec = totalHeartbeats > 0 ? (totalHeartbeats * 30 / 10) : 120;
        const avgSessionHours = parseFloat((avgSessionSec / 3600).toFixed(2));

        res.json({
            status: "success",
            data: {
                totalUsers: userCount || 0,
                totalDatasets: currentDatasetsCount,
                historicalTotalDatasets: Math.max(currentDatasetsCount, historicalUploads),
                totalModels: currentModelsCount,
                avgSessionTime: avgSessionHours,
                chartData,
                userActivity: chartData.map(d => ({
                    date: d.date,
                    // Convert total session time to HOURS (seconds / 3600)
                    avgTime: parseFloat((d.totalSessionTime / 3600).toFixed(2)),
                    // Count unique users active this day
                    userCount: d.activeUserEmails.size || (d.users > 0 ? d.users : 1)
                }))
            }
        });
    } catch (err) {
        console.error("Overview stats error:", err);
        res.status(500).json({ status: "error", message: err.message });
    }
});

export default router;
