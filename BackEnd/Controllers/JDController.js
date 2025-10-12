import { documentClient } from "../Config/AzureDoc.js";
import JobDescriptions from "../Models/JobDescriptions.js";
import { extractFieldsFromJD } from "../Utils/TextMappingForJD.js";
import { uploadPdfToCloudinary } from "../Utils/CloudUtil.js";  // 🟢 Added import
import Comparisons from "../Models/Comparisons.js";
import mongoose from "mongoose";

const getJobDescById= async (req, res) => {
    try {
      const userId = req.userId;
      const { jdId } = req.params;

      // ✅ Check if user is authenticated
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized: user not identified" });
      }

      // ✅ Check if jdId is provided
      if (!jdId) {
        return res
          .status(400)
          .json({ success: false, message: "jdId is required" });
      }

      // ✅ Validate jdId format
      if (!mongoose.Types.ObjectId.isValid(jdId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid jdId format" });
      }

      // ✅ Find the job description that belongs to the recruiter
      const jobDesc = await JobDescriptions.findOne({
        _id: jdId,
        recruiterId: userId,
      });

      // ✅ Handle not found
      if (!jobDesc) {
        return res
          .status(404)
          .json({ success: false, message: "Job description not found" });
      }

      // ✅ Success
      return res.status(200).json({
        success: true,
        message: "Job description fetched successfully",
        data: jobDesc,
      });
    } catch (err) {
      console.error("Error in getJobDescById:", err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: err.message,
      });
    }
  }

const getAllJDs = async (req, res) => {
  try {
    const recruiterId = req.userId;

    // Fetch all job descriptions for this recruiter
    const jobDescriptions = await JobDescriptions.find({ recruiterId }).sort({ createdAt: -1 });

    if (!jobDescriptions || jobDescriptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No job descriptions found for this recruiter.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Job descriptions retrieved successfully.",
      total: jobDescriptions.length,
      data: jobDescriptions,
    });
  } catch (error) {
    console.error("Get JD Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};



const extractAndSaveJD = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, error: "No JD PDF uploaded" });

    const buffer = req.file.buffer;

    // 🟢 1️⃣ Upload the PDF to Cloudinary first (raw type for PDFs)
    const uploadResult = await uploadPdfToCloudinary(buffer, req.file.originalname);
    const pdfUrl = uploadResult.secure_url; // this will be the downloadable link

    // 2️⃣ Extract raw text using Azure Document Intelligence
    const poller = await documentClient.beginAnalyzeDocument("prebuilt-read", buffer);
    const result = await poller.pollUntilDone();

    let extractedText = "";
    result.pages.forEach((page) => {
      page.lines.forEach((line) => {
        extractedText += line.content + "\n";
      });
    });
    extractedText = extractedText.trim();

    // 3️⃣ Extract structured JD fields
    const fields = await extractFieldsFromJD(extractedText);

    // 4️⃣ Save to MongoDB
    const jdDoc = new JobDescriptions({
      recruiterId: req.userId,
      title: fields.title,
      companyName: fields.companyName,
      jdText: extractedText,
      requriedSkills: fields.requriedSkills,
      location: fields.location,
      jdUrl:pdfUrl, // 🟢 Store Cloudinary link in DB
    });

    await jdDoc.save();

    // 5️⃣ Send response
    res.status(201).json({
      success: true,
      message: "Job description extracted, uploaded, and saved successfully.",
      data: jdDoc,
    });

  } catch (error) {
    console.error("JD Extraction Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export { extractAndSaveJD,getAllJDs,getJobDescById};
