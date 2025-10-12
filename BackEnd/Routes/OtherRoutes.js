import express from "express";
import AuthMiddleware from "../Middlewares/Auth.js";
import otherController from "../Controllers/OtherController.js";

const router = express.Router();

// Get all Job Descriptions for a specific group (requires auth)
router.get("/getGroupsForJd/:groupId", AuthMiddleware.Auth, otherController.getJobDesc);
router.get("/group/:jobId", AuthMiddleware.Auth,otherController.getGroupsByJobId);

export default router;
