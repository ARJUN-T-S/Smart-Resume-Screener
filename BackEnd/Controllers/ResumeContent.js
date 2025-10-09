import { documentClient } from "../Config/AzureDoc.js";
import { extractFieldsFromText } from "../Utils/TextMapping.js";
import Resume from "../Models/Resume.js";

const extractAndSaveResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "No PDF uploaded" });

    // 1️⃣ Extract raw text using Document Intelligence
    const buffer = req.file.buffer;
    const poller = await documentClient.beginAnalyzeDocument("prebuilt-read", buffer);
    const result = await poller.pollUntilDone();

    let extractedText = "";
    result.pages.forEach((page) => {
      page.lines.forEach((line) => extractedText += line.content + "\n");
    });
    extractedText = extractedText.trim();

    // 2️⃣ Extract structured fields
    const fields = await extractFieldsFromText(extractedText);

    // 3️⃣ Save to MongoDB
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
    });

    await resumeDoc.save();

    res.json({ success: true, data: resumeDoc });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export { extractAndSaveResume };
