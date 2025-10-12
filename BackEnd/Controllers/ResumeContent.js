import { documentClient } from "../Config/AzureDoc.js";
import { extractFieldsFromText } from "../Utils/TextMapping.js";
import Resume from "../Models/Resume.js";
import { uploadPdfToCloudinary } from "../Utils/CloudUtil.js";

import mongoose from "mongoose";

const getAllResumes = async (req, res) => {
  try {
    const userId = req.userId; // recruiterId from auth middleware
    const { groupId } = req.params; // sent as /resumes/:groupId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: recruiter not identified",
      });
    }

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "Missing groupId parameter",
      });
    }

    // Fetch all resumes in this group belonging to the recruiter
    const resumes = await Resume.find({
      recruiterId: userId,
      groupId: new mongoose.Types.ObjectId(groupId),
    });

    if (!resumes.length) {
      return res.status(404).json({
        success: false,
        message: "No resumes found for this group",
      });
    }

    res.status(200).json({
      success: true,
      message: "Resumes fetched successfully",
      data: resumes,
    });
  } catch (error) {
    console.error("Error fetching resumes:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};



const extractAndSaveResume = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, error: "No PDF uploaded" });

    // 1️⃣ Upload PDF immediately to Cloudinary
    const pdfUpload = await uploadPdfToCloudinary(req.file.buffer, req.file.originalname);

    // Optional: append ?fl_attachment=false to force inline viewing
    const pdfUrl = `${pdfUpload.secure_url}?fl_attachment=false`;

    // 2️⃣ Extract text using Azure Document Intelligence
    const poller = await documentClient.beginAnalyzeDocument(
      "prebuilt-read",
      req.file.buffer // ✅ use the same original buffer
    );
    const result = await poller.pollUntilDone();

    let extractedText = "";
    result.pages.forEach((page) => {
      page.lines.forEach((line) => (extractedText += line.content + "\n"));
    });
    extractedText = extractedText.trim();

    // 3️⃣ Extract structured fields
    const fields = await extractFieldsFromText(extractedText);

    // 4️⃣ Save to MongoDB
    const resumeDoc = new Resume({
      groupId: req.body.groupId,
      recruiterId: req.userId,
      candidateName: fields.candidateName,
      email: fields.email,
      extractedText,
      skills: fields.skills,
      education: fields.education,
      experience: fields.experience,
      totalExperience: fields.totalExperience,
      pdfUrl, // ✅ working browser-viewable link
    });

    await resumeDoc.save();

    res.json({ success: true, data: resumeDoc });
  } catch (error) {
    console.error("Error in extractAndSaveResume:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export { extractAndSaveResume,getAllResumes };