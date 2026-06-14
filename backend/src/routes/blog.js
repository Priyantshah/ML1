import express from "express";
import supabase from "../db/index.js";
import upload from "../middlewares/imageUploadMiddleware.js";

const router = express.Router();

// Upload image (admin only)
router.post("/upload", upload.single("image"), async (req, res) => {
    try {
        console.log("📸 Image upload request received");
        if (!req.file) {
            console.log("❌ No file in request");
            return res.status(400).json({ error: "No image uploaded" });
        }

        const file = req.file;
        console.log(`📦 File size: ${file.size}, Mimetype: ${file.mimetype}`);

        const fileName = `blog_images/${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
        const bucketName = "csv-uploads";

        console.log(`🚀 Uploading to bucket: ${bucketName}, path: ${fileName}`);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) {
            console.error("❌ Supabase Storage Error:", error);
            throw error;
        }

        console.log("✅ Upload successful, determining public URL...");

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        const url = publicUrlData?.publicUrl;
        console.log(`🔗 Public URL: ${url}`);

        res.json({
            status: "success",
            data: { url }
        });
    } catch (err) {
        console.error("💥 Blog image upload crash:", err);
        res.status(500).json({
            status: "error",
            message: err.message,
            stack: err.stack,
            fullError: err
        });
    }
});

// GET all published posts (public)
router.get("/", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("blog_posts")
            .select("*")
            .eq("published", true)
            .order("created_at", { ascending: false });

        if (error) throw error;
        res.json({ status: "success", data: data || [] });
    } catch (err) {
        console.error("Blog fetch error:", err);
        res.status(500).json({ status: "error", message: err.message });
    }
});

// GET all posts for admin (including drafts)
router.get("/all", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("blog_posts")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        res.json({ status: "success", data: data || [] });
    } catch (err) {
        console.error("Blog admin fetch error:", err);
        res.status(500).json({ status: "error", message: err.message });
    }
});

// GET single post by ID
router.get("/:id", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("blog_posts")
            .select("*")
            .eq("id", req.params.id)
            .single();

        if (error) throw error;
        res.json({ status: "success", data });
    } catch (err) {
        console.error("Blog post fetch error:", err);
        res.status(404).json({ status: "error", message: "Post not found" });
    }
});

// POST create new post (admin only)
router.post("/", async (req, res) => {
    try {
        const { title, slug, excerpt, content, cover_image, tags, published, author } = req.body;

        if (!title || !content) {
            return res.status(400).json({ status: "error", message: "Title and content are required." });
        }

        const { data, error } = await supabase.from("blog_posts").insert([{
            title,
            slug: slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            excerpt: excerpt || content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').substring(0, 160).trim() + '...',
            content,
            cover_image: cover_image || null,
            tags: tags || [],
            published: published ?? false,
            author: author || "AutoML Team",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }]).select().single();

        if (error) throw error;
        res.json({ status: "success", data });
    } catch (err) {
        console.error("Blog create error:", err);
        res.status(500).json({ status: "error", message: err.message });
    }
});

// PUT update post (admin only)
router.put("/:id", async (req, res) => {
    try {
        const { title, slug, excerpt, content, cover_image, tags, published, author } = req.body;

        const { data, error } = await supabase
            .from("blog_posts")
            .update({
                title,
                slug: slug || title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                excerpt: excerpt || (content ? content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').substring(0, 160).trim() + '...' : undefined),
                content,
                cover_image,
                tags,
                published,
                author,
                updated_at: new Date().toISOString()
            })
            .eq("id", req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ status: "success", data });
    } catch (err) {
        console.error("Blog update error:", err);
        res.status(500).json({ status: "error", message: err.message });
    }
});

// DELETE post (admin only)
router.delete("/:id", async (req, res) => {
    try {
        const { error } = await supabase
            .from("blog_posts")
            .delete()
            .eq("id", req.params.id);

        if (error) throw error;
        res.json({ status: "success", message: "Post deleted successfully" });
    } catch (err) {
        console.error("Blog delete error:", err);
        res.status(500).json({ status: "error", message: err.message });
    }
});

export default router;
