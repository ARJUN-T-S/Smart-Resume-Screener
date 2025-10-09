import cloudinary from "../Config/Cloudinary.js";
import fs from "fs";
import path from "path";

export const uploadPdfToCloudinary = async (fileBuffer, fileName) => {
  // 1️⃣ Save buffer to temporary file
  if (!fs.existsSync("tmp")) fs.mkdirSync("tmp"); // ensure tmp folder exists
  const tmpFilePath = path.join("tmp", `${Date.now()}-${fileName}`);
  fs.writeFileSync(tmpFilePath, fileBuffer);

  // 2️⃣ Upload temp file to Cloudinary
  const result = await cloudinary.uploader.upload(tmpFilePath, {
    folder: "resumes",
    resource_type: "raw",     // must be "raw" for PDF
    use_filename: true,
    unique_filename: false,
  });

  // 3️⃣ Delete temporary file
  fs.unlinkSync(tmpFilePath);

  // 4️⃣ Return secure URL for browser viewing
  return { ...result, secure_url: `${result.secure_url}?fl_attachment=false` };
};
