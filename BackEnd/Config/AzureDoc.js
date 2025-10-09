import { DocumentAnalysisClient, AzureKeyCredential } from "@azure/ai-form-recognizer";
import dotenv from "dotenv";

dotenv.config();

// Initialize Azure Form Recognizer (Document Intelligence) client
const documentClient = new DocumentAnalysisClient(
  process.env.AZURE_DOC_INTELLIGENCE,
  new AzureKeyCredential(process.env.AZURE_DOC_INTELLIGENCE_KEY)
);

export { documentClient };
