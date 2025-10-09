import { languageClient } from "../Config/AzureNer.js";

const extractFieldsFromText = async (text) => {
  const candidate = {
    candidateName: null,
    email: null,
    skills: [],
    education: null,
    experience: null,
    totalExperience: null,
  };

  // 1️⃣ Named Entity Recognition
  const nerResult = await languageClient.recognizeEntities([text]);
  const entities = nerResult[0].entities;

  entities.forEach((e) => {
    switch (e.category) {
      case "Person":
        if (!candidate.candidateName) candidate.candidateName = e.text;
        break;
      case "Email":
        if (!candidate.email) candidate.email = e.text;
        break;
      case "Organization":
        if (!candidate.education) candidate.education = e.text;
        break;
      case "Skill":
        candidate.skills.push(e.text);
        break;
      default:
        break;
    }
  });

  // 2️⃣ Regex fallback for email
  if (!candidate.email) {
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/);
    if (emailMatch) candidate.email = emailMatch[0];
  }

  // 3️⃣ Regex for total experience (years)
let totalExp = 0;

const expMatch = text.match(/(\d+(\.\d+)?)\s*(years|yrs)/i);
if (expMatch) totalExp = parseFloat(expMatch[1]);

candidate.totalExperience = totalExp; 

  // 4️⃣ Key Phrase extraction for skills
  const keyPhraseResult = await languageClient.extractKeyPhrases([text]);
  const keyPhrases = keyPhraseResult[0].keyPhrases;
  const knownSkills = ["Java", "JavaScript", "Node.js", "React", "MongoDB", "Express", "Python"];
  candidate.skills = [...new Set([...candidate.skills, ...keyPhrases.filter(k => knownSkills.includes(k))])];

  // 5️⃣ Optional fallback: education & experience
  const educationMatch = text.match(/Bachelor|Master|B\.Tech|BSc|MSc/i);
  if (educationMatch) candidate.education = educationMatch[0];

  const experienceMatch = text.match(/Professional Summary[\s\S]*?(?=Technical Skills|Education)/i);
  if (experienceMatch) candidate.experience = experienceMatch[0].trim();

  return candidate;
};

export { extractFieldsFromText };
