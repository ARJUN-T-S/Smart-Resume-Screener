import dotenv from "dotenv";
dotenv.config();

import { TextAnalyticsClient, AzureKeyCredential } from "@azure/ai-text-analytics";

const languageClient = new TextAnalyticsClient(
  process.env.AZURE_LANGUAGE_ENDPOINT,
  new AzureKeyCredential(process.env.AZURE_LANGUAGE_KEY)
);

export { languageClient };
