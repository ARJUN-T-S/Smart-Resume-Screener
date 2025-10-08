import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import RecruiterRoutes from "./Routes/RecruiterRoutes.js"
dotenv.config();

const app = express();
app.use(express.json());

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

const PORT = process.env.PORT || 5000;

// Step 3: Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
