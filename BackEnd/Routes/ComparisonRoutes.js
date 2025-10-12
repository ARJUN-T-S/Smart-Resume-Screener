import express from "express";
import ComparisonsController from "../Controllers/ComparisonController.js";
import authMiddleware from "../Middlewares/Auth.js"; // Your auth middleware

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware.Auth);

// Generate comparisons for all resumes in a group against a job description
router.post("/generate", ComparisonsController.generateComparisons);

// Get all comparisons for a group
router.get("/group/:groupId", ComparisonsController.getComparisonsByGroup);
// Get specific comparison by ID
router.get("/:id", ComparisonsController.getComparisonById);

// Delete comparison
router.delete("/:id", ComparisonsController.deleteComparison);

export default router;