import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import ResumeRoutes from "./Routes/ResumeRoutes.js"
import RecruiterRoutes from "./Routes/RecruiterRoutes.js"
import GroupRoutes from "./Routes/GroupRoutes.js"
import JobDescripotions from "./Routes/JobDescriptions.js"
import Comparisons from "./Routes/ComparisonRoutes.js"
import OtherRoutes from "./Routes/OtherRoutes.js"
import cors from 'cors'
dotenv.config();

const app = express();
app.use(express.json()); // This is crucial for parsing JSON bodies
app.use(express.urlencoded({ extended: true }))
app.use(cors({
  origin: "*", // Allows ALL frontend URLs
  credentials: true
}));
// Step 1: Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// Step 2: Test route
app.get("/", (req, res) => {
  res.send("API is running and database is connected!");
});
app.use("/recruiter",RecruiterRoutes);
app.use("/resume",ResumeRoutes);
app.use("/groups",GroupRoutes);
app.use("/job-desc",JobDescripotions);
app.use("/comparison",Comparisons);
app.use("/other",OtherRoutes)
const PORT = process.env.PORT || 5000;

// Step 3: Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
