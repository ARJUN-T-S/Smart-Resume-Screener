import express from "express";
import AuthMiddleware from "../Middlewares/Auth.js";
import otherController from "../Controllers/OtherController.js";
import {getTopNByMatchScore,getTopNBySkillOverlap,getAllComparisons,getComparisonsByGroupAndJob} from "../Controllers/dbOps.js";
const router = express.Router();

// Get all Job Descriptions for a specific group (requires auth)
router.get("/getGroupsForJd/:groupId", AuthMiddleware.Auth, otherController.getJobDesc);
router.get("/group/:jobId", AuthMiddleware.Auth,otherController.getGroupsByJobId);

router.get("/:groupId/:jobId", AuthMiddleware.Auth, getComparisonsByGroupAndJob);
router.get("/top-match/:groupId/:jobId/:limit", AuthMiddleware.Auth, getTopNByMatchScore);
router.get("/top-skills/:groupId/:jobId/:limit", AuthMiddleware.Auth, getTopNBySkillOverlap);
router.get("/all/:groupId/:jobId", AuthMiddleware.Auth, getAllComparisons);
export default router;
