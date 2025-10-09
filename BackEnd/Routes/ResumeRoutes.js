import express from "express";
import {extractAndSaveResume } from "../Controllers/ResumeContent.js";
import { upload, handleMulterError } from "../Middlewares/MulterMiddleware.js";
import AuthMiddleware from "../Middlewares/Auth.js";

const router = express.Router();

router.post("/extract-text",AuthMiddleware.Auth,upload.single("pdf"), handleMulterError, extractAndSaveResume);

export default router;
