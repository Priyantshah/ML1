import express from "express";
import { chatWithAssistant } from "../controllers/chatController.js";

const router = express.Router();

router.post("/", chatWithAssistant);

export default router;

