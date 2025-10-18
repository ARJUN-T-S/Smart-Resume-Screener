# 🧠 Smart Resume Screener

---

## 1️⃣ Project Overview

The **Smart Resume Screener** is an **AI-powered web application** that automatically parses resumes, extracts key information such as **skills** and **experience**, and matches them with a given job description using a **Large Language Model (LLM)**.  
The system then generates a **match score** along with a **justification** for each candidate, helping recruiters shortlist applicants efficiently.

---

## 2️⃣ LLM PROMPTS

### a) Prompt

```javascript
const prepareResumeText = (resume) => {
  return `
    Professional Profile: ${resume.candidateName} with
${resume.totalExperience} years of experience.
    Technical Skills: ${resume.skills.join(", ")}.
    Professional Experience: ${resume.experience}.
    Educational Background: ${resume.education}.
    Key Competencies: ${resume.skills.join(", ")}. ${resume.experience}.
  `.replace(/\s+/g, ' ').trim();
};
b) Prompt Explanation
The prepareResumeText() function converts structured resume data (like name, skills, experience, and education) into a clean, natural-language paragraph.
This makes the text more understandable for the HuggingFace model.
The generated text is then passed to the sentence-transformers/all-MiniLM-L6-v2 model, which transforms it into a semantic embedding — a numerical vector that represents the meaning of the resume.
These embeddings are later compared with job description embeddings using cosine similarity to calculate how closely a candidate’s profile matches the job requirements.

3️⃣ System Architecture
Frontend Layer
React + Vite – Modern build tooling

Tailwind CSS – Utility-first styling

Redux Toolkit – State management

React Router – Navigation

Firebase Auth – User authentication

Backend Layer
Node.js + Express – API server

MongoDB + Mongoose – Database & ODM

Firebase Admin SDK – Backend authentication

JWT Tokens – Secure API communication

AI Services Layer
HuggingFace – Sentence embeddings

Azure AI Services – Document processing

Cloudinary – PDF storage & delivery

4️⃣ Data Flow Pipeline
Document Processing Pipeline
PDF Upload → Cloudinary Storage

Text Extraction → Azure Document Intelligence

Field Mapping → Azure Language Service (NER)

Database Storage → MongoDB Collections

AI Comparison Pipeline
Text Preparation → Structured formatting

Embedding Generation → HuggingFace API

Similarity Calculation → Cosine similarity

Analysis Generation → Multi-factor scoring

5️⃣ HuggingFace LLM Pipeline
Model: sentence-transformers/all-MiniLM-L6-v2

Why This Model is Efficient
Lightweight (6 transformer layers)

Fast (~10,000 sentences/sec)

Accurate and cost-effective

Ideal for resume–JD similarity tasks

6️⃣ API Endpoints Summary
Resume Management
POST /resume/upload

GET /resume/getAllResumesForGroups/:groupId

Job Description Management
POST /job-desc/upload

GET /job-desc/

GET /job-desc/:jdId

AI Comparisons
POST /comparison/generate

GET /other/:groupId/:jobId

GET /other/top-match/:groupId/:jobId/:limit

Groups Management
POST /groups/addGroup

GET /groups/getGroups

DELETE /groups/:id

📦 Technologies Used
Layer	Technologies
Frontend	React, Vite, Tailwind CSS, Redux Toolkit, Firebase Auth
Backend	Node.js, Express.js
Database	MongoDB
Cloud Services	Cloudinary, Azure AI Services
LLM	HuggingFace Sentence Transformers
Authentication	Firebase Admin SDK, JWT

👨‍💻 Author
Name: Arjun Sivakumar
Reg. No: 22BCE0507
