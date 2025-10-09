import { documentClient } from "../Config/AzureDoc.js";

/**
 * Extract text from a PDF using Azure Form Recognizer
 */
const extractTextFromPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file uploaded. Please upload with field name "pdf".',
      });
    }

    console.log(`📄 Processing file: ${req.file.originalname}`);

    // Convert file buffer to stream
    const buffer = req.file.buffer;

    // Start analyzing with prebuilt-read model
    const poller = await documentClient.beginAnalyzeDocument("prebuilt-read", buffer);
    const result = await poller.pollUntilDone();

    // Extract text from pages
    let extractedText = "";
    if (result.pages && result.pages.length > 0) {
      for (const page of result.pages) {
        if (page.lines) {
          for (const line of page.lines) {
            extractedText += line.content + "\n";
          }
        }
        extractedText += "\n--- Page Break ---\n\n";
      }
    }

    extractedText = extractedText.trim() || "No text could be extracted. The file may be image-only or encrypted.";

    console.log(`✅ Extracted ${extractedText.length} characters`);

    // Send response
    res.json({
      success: true,
      fileName: req.file.originalname,
      pageCount: result.pages?.length || 0,
      characterCount: extractedText.length,
      text: extractedText,
      modelUsed: "prebuilt-read",
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ Error extracting text:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to extract text from PDF.",
      message: error.message,
    });
  }
};

/**
 * Health check endpoint
 */
const healthCheck = (req, res) => {
  res.json({
    success: true,
    service: "Azure PDF Text Extraction",
    status: "Operational",
    model: "prebuilt-read",
    azureConfigured: Boolean(process.env.FORM_RECOGNIZER_ENDPOINT && process.env.FORM_RECOGNIZER_KEY),
    timestamp: new Date().toISOString(),
  });
};

export { extractTextFromPDF, healthCheck };
