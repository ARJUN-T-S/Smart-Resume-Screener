import express from "express";
import {extractAndSaveJD,getAllJDs, } from "../Controllers/JDController.js";
import { upload, handleMulterError } from "../Middlewares/MulterMiddleware.js";
import AuthMiddleware from "../Middlewares/Auth.js";

const router = express.Router();

router.get("/",AuthMiddleware.Auth,getAllJDs)
router.post("/postJD",AuthMiddleware.Auth,upload.single("pdf"), handleMulterError, extractAndSaveJD);

export default router;
