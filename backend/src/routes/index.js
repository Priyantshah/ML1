import express from "express";
import uploadRoutes from "./upload.js";
import predictRoutes from "./predict.js";
import trainRoutes from "./train.js";
import previewRoutes from "./preview.js";
import edaRoutes from "./eda.js";
import imputeRoutes from "./impute.js";
import chatRoutes from "./chat.js";
import authRoutes from "./authRoute.js";
import adminRoutes from "./admin.js";
import blogRoutes from "./blog.js";

const router = express.Router();

router.use("/upload", uploadRoutes);
router.use("/predict", predictRoutes);
router.use("/train", trainRoutes);
router.use("/preview", previewRoutes);
router.use("/eda", edaRoutes);
router.use("/impute", imputeRoutes);
router.use("/chat", chatRoutes);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/blog", blogRoutes);

export default router;

