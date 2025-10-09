import express from "express";
import { extractTextFromPDF, healthCheck } from "../Controllers/ResumeContent.js";
import { upload, handleMulterError } from "../Middlewares/MulterMiddleware.js";

const router = express.Router();

router.post("/extract-text", upload.single("pdf"), handleMulterError, extractTextFromPDF);

export default router;
