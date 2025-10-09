import { TextAnalyticsClient, AzureKeyCredential } from "@azure/ai-language-text";
import dotenv from "dotenv";
dotenv.config();

const languageClient = new TextAnalyticsClient(
  process.env.AZURE_LANGUAGE_ENDPOINT,
  new AzureKeyCredential(process.env.AZURE_LANGUAGE_KEY)
);

export { languageClient };
