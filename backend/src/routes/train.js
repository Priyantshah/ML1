import express from "express";
import { resetTrainingSystem, trainModels, trainModelsStream } from "../controllers/trainController.js";

const router = express.Router();

router.post("/", trainModels);
router.post("/stream", trainModelsStream);
router.post("/reset", resetTrainingSystem);

export default router;
