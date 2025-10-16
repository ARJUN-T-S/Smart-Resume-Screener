# 🧠 Smart Resume Screener

An AI-powered application that analyzes resumes, extracts structured data, and semantically compares them with job descriptions using HuggingFace embeddings and Azure AI Services.

---

## 📘 Table of Contents
1. [Overview](#overview)
2. [Key Features](#key-features)
3. [System Architecture](#system-architecture)
4. [Document Processing Pipeline](#document-processing-pipeline)
5. [LLM Integration](#llm-integration)
6. [Tech Stack](#tech-stack)
7. [API Endpoints](#api-endpoints)
8. [Deployment Links](#deployment-links)
9. [Demo Video](#demo-video)
10. [Installation Guide](#installation-guide)
11. [Future Enhancements](#future-enhancements)
12. [Author](#author)

---

## 🧩 Overview

**Smart Resume Screener** intelligently parses PDF or text-based resumes, extracts key fields such as skills, education, and experience, and compares them against job descriptions using AI models.  
The system generates a **semantic similarity score** and a **justification report**, helping recruiters shortlist the most relevant candidates efficiently.

---

## 🚀 Key Features

- 📄 Automated resume parsing via **Azure Document Intelligence**
- 🧠 Semantic similarity scoring using **HuggingFace sentence embeddings**
- ⚙️ Backend API for handling resume and job uploads
- 💾 MongoDB for structured data storage
- 🔐 Firebase Authentication for user access
- 💻 Responsive frontend built with **React + Tailwind CSS**
- ☁️ Cloud-based deployment (Frontend + Backend)

---

## ⚙️ System Architecture

### **Frontend Layer**
- **React + Vite** – Modern build tooling  
- **Tailwind CSS** – Utility-first styling  
- **Redux Toolkit** – State management  
- **React Router** – Navigation  
- **Firebase Auth** – User authentication  

### **Backend Layer**
- **Node.js + Express** – API server  
- **MongoDB + Mongoose** – Database & ODM  
- **Firebase Admin SDK** – Backend auth  
- **JWT Tokens** – Secure API communication  

### **AI Services Layer**
- **HuggingFace** – Sentence embeddings  
- **Azure AI Services** – Document processing  
- **Cloudinary** – PDF storage & delivery  

---

## 🧾 Document Processing Pipeline

```text
PDF Upload → Azure Document Intelligence → Field Mapping → Database Storage
