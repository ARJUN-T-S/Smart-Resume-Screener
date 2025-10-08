import express from "express";
import RecruiterController from "../Controllers/RecruiterController.js";
import AuthMiddleware from "../Middlewares/Auth.js";

const router = express.Router();

router.get("/", AuthMiddleware.Auth, RecruiterController.getDetails);
router.post("/postRecruiter", AuthMiddleware.Auth, RecruiterController.postRecruiter);

export default router;
