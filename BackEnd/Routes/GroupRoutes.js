import express from "express";
import { addGroup, removeGroup, getGroups } from "../Controllers/GroupController.js";
import AuthMiddleware from "../Middlewares/Auth.js"
const router = express.Router();

// Add a new group
router.post("/add",AuthMiddleware.Auth,addGroup);

// Remove a group by ID
router.delete("/remove/:id",AuthMiddleware.Auth,removeGroup);

// Get all groups for a specific user
router.get("/user/:userId",AuthMiddleware.Auth,getGroups);

export default router;
