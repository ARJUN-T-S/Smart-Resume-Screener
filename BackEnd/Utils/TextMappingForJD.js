import { languageClient } from "../Config/AzureNer.js";

/**
 * Extracts structured information from a Job Description (JD)
 * using Azure Text Analytics NER + Key Phrase Extraction + Regex fallbacks.
 */
const extractFieldsFromJD = async (text) => {
  const job = {
    title: null,
    companyName: null,
    requriedSkills: [],
    location: null,
    jdText: text,
  };

  // 1️⃣ Named Entity Recognition
  const nerResult = await languageClient.recognizeEntities([text]);
  const entities = nerResult[0].entities;

  entities.forEach((e) => {
    switch (e.category) {
      case "Organization":
        if (!job.companyName) job.companyName = e.text;
        break;
      case "Skill":
        job.requriedSkills.push(e.text);
        break;
      case "Location":
        if (!job.location) job.location = e.text;
        break;
      default:
        break;
    }
  });

  // 2️⃣ Fallback: extract title heuristically
  // Matches lines starting with "Job Title", "Position", "Role", or first line if nothing found
  const titleMatch =
    text.match(/(?:Job\s*Title|Position|Role)\s*[:\-]\s*(.+)/i) ||
    text.match(/^(.*?)\n/);
  if (titleMatch) job.title = titleMatch[1].trim();

  // 3️⃣ Key Phrase Extraction — adds additional skill-like terms dynamically
  const keyPhraseResult = await languageClient.extractKeyPhrases([text]);
  const keyPhrases = keyPhraseResult[0].keyPhrases;

  // Merge skills + key phrases (deduplicated)
  job.requriedSkills = [...new Set([...job.requriedSkills, ...keyPhrases])];

  // 4️⃣ Regex fallback for location (if Azure misses it)
  if (!job.location) {
    const locMatch = text.match(
      /\b(?:in|at)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/
    );
    if (locMatch) job.location = locMatch[1];
  }

  // 5️⃣ Default handling for missing values
  if (!job.requriedSkills.length) job.requriedSkills = [];
  if (!job.title) job.title = "Unknown Title";
  if (!job.companyName) job.companyName = "Unknown Company";
  if (!job.location) job.location = "Not Specified";

  return job;
};

export { extractFieldsFromJD };
