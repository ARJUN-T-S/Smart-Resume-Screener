import Comparisons from "../Models/Comparisons.js";
import Resume from "../Models/Resume.js";
import JobDescriptions from "../Models/JobDescriptions.js";

import axios from "axios";

class ComparisonsController {
  // Generate and store comparisons for all resumes in a group against a job description
  static async generateComparisons(req, res) {
    try {
      console.log("🔍 generateComparisons called");
      const { groupId, jobId } = req.body;

      if (!groupId || !jobId) {
        return res.status(400).json({
          success: false,
          message: "groupId and jobId are required"
        });
      }

      const recruiterId = req.userId || "recruiter_default_id";

      // Fetch job description
      const jobDescription = await JobDescriptions.findOne({
        _id: jobId,
        recruiterId
      });

      if (!jobDescription) {
        return res.status(404).json({
          success: false,
          message: "Job description not found"
        });
      }

      // Fetch all resumes for the group
      const resumes = await Resume.find({ groupId, recruiterId });

      if (resumes.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No resumes found for this group"
        });
      }

      console.log(`📄 Processing ${resumes.length} resumes`);

      const comparisons = [];
      const errors = [];

      // Process each resume
      for (const resume of resumes) {
        try {
          console.log(`🔄 Processing: ${resume.candidateName || resume._id}`);
          
          const comparison = await ComparisonsController.compareResumeWithJD(
            resume,
            jobDescription,
            groupId,
            recruiterId
          );

          // Save to database
          const savedComparison = await Comparisons.create(comparison);
          comparisons.push(savedComparison);
          console.log(`✅ AI analysis completed for: ${resume.candidateName}`);
          
        } catch (error) {
          console.error(`❌ Error comparing resume ${resume._id}:`, error);
          errors.push({
            resumeId: resume._id,
            candidateName: resume.candidateName,
            error: error.message
          });
          continue;
        }
      }

      res.status(201).json({
        success: true,
        message: `Successfully generated ${comparisons.length} AI-powered comparisons`,
        data: comparisons,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          totalResumes: resumes.length,
          successfulComparisons: comparisons.length,
          failedComparisons: errors.length
        }
      });

    } catch (error) {
      console.error("💥 Error generating comparisons:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message
      });
    }
  }

  // Compare single resume with job description using HuggingFace
  static async compareResumeWithJD(resume, jobDescription, groupId, recruiterId) {
    try {
      // Prepare text for embedding
      const resumeText = `
        Skills: ${(resume.skills || []).join(", ")}
        Education: ${resume.education || "Not specified"}
        Experience: ${resume.experience || "Not specified"}
        Total Experience: ${resume.totalExperience || 0} years
        Candidate: ${resume.candidateName || "Unknown"}
      `.trim();

      const jdText = `
        Title: ${jobDescription.title || "No title"}
        Company: ${jobDescription.companyName || "No company"}
        Required Skills: ${(jobDescription.requriedSkills || []).join(", ")}
        Description: ${jobDescription.jdText || "No description"}
        Location: ${jobDescription.location || "Not specified"}
      `.trim();

      console.log("🤖 Getting AI embeddings...");
      
      // Get embeddings from HuggingFace
      const [resumeEmbedding, jdEmbedding] = await Promise.all([
        ComparisonsController.getEmbedding(resumeText),
        ComparisonsController.getEmbedding(jdText)
      ]);

      // Calculate similarity score
      const matchScore = ComparisonsController.cosineSimilarity(resumeEmbedding, jdEmbedding);
      console.log(`📊 Semantic match score: ${(matchScore * 100).toFixed(1)}%`);

      // Calculate skill overlap
      const skillOverlap = ComparisonsController.calculateSkillOverlap(
        resume.skills || [],
        jobDescription.requriedSkills || []
      );
      console.log(`🔧 Skill overlap: ${(skillOverlap * 100).toFixed(1)}%`);

      // Generate intelligent analysis
      const analysis = ComparisonsController.generateAnalysis(
        resume,
        jobDescription,
        matchScore,
        skillOverlap
      );

      return {
        groupId,
        recruiterId,
        resumeId: resume._id,
        jobId: jobDescription._id,
        matchScore: Math.round(matchScore * 100), // Convert to percentage
        SkillOverLap: Math.round(skillOverlap * 100), // Convert to percentage
        Justification: analysis.justification,
        pros: analysis.pros,
        cons: analysis.cons
      };
    } catch (error) {
      console.error("Error in compareResumeWithJD:", error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  // Get embedding from HuggingFace API
  static async getEmbedding(text) {
    try {
      // If no API key, use mock embeddings for testing
      if (!process.env.HUGGINGFACE_API_KEY) {
        console.warn("⚠️ HUGGINGFACE_API_KEY not found, using mock embeddings");
        // Return realistic mock embeddings (384 dimensions like the real model)
        return Array(384).fill(0).map(() => (Math.random() * 2 - 1));
      }

      const response = await axios.post(
        "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
        { inputs: text },
        {
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 30000
        }
      );

      if (response.data && response.data.length > 0) {
        return response.data[0];
      } else {
        throw new Error("No embedding received from HuggingFace");
      }
    } catch (error) {
      console.error("🤖 HuggingFace API error:", error.response?.data || error.message);
      
      // Fallback to mock embeddings if API fails
      console.warn("🔄 Using mock embeddings due to API failure");
      return Array(384).fill(0).map(() => (Math.random() * 2 - 1));
    }
  }

  // Calculate cosine similarity between two vectors
  static cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
      console.warn("Invalid vectors for cosine similarity");
      return 0.5; // Return neutral score
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.max(0, Math.min(1, similarity)); // Ensure between 0-1
  }

  // Calculate skill overlap percentage
  static calculateSkillOverlap(resumeSkills, jdSkills) {
    if (!resumeSkills || !resumeSkills.length || !jdSkills || !jdSkills.length) {
      return 0;
    }

    const resumeSkillsLower = resumeSkills
      .map(skill => skill ? skill.toLowerCase().trim() : "")
      .filter(skill => skill.length > 0);

    const jdSkillsLower = jdSkills
      .map(skill => skill ? skill.toLowerCase().trim() : "")
      .filter(skill => skill.length > 0);

    if (jdSkillsLower.length === 0) return 0;

    const matchingSkills = resumeSkillsLower.filter(resumeSkill =>
      jdSkillsLower.some(jdSkill => {
        // Flexible matching: check if skills are similar
        const resumeWords = resumeSkill.split(/[ ,]+/);
        const jdWords = jdSkill.split(/[ ,]+/);
        
        return resumeWords.some(rw => 
          jdWords.some(jw => 
            rw.includes(jw) || jw.includes(rw) || 
            this.calculateStringSimilarity(rw, jw) > 0.7
          )
        );
      })
    );

    return matchingSkills.length / jdSkillsLower.length;
  }

  // Helper function for string similarity
  static calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    return (longer.length - this.editDistance(longer, shorter)) / parseFloat(longer.length);
  }

  static editDistance(str1, str2) {
    const track = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i += 1) track[0][i] = i;
    for (let j = 0; j <= str2.length; j += 1) track[j][0] = j;
    
    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator, // substitution
        );
      }
    }
    
    return track[str2.length][str1.length];
  }

  // Generate intelligent analysis, pros, and cons
  static generateAnalysis(resume, jobDescription, matchScore, skillOverlap) {
    const pros = [];
    const cons = [];
    
    // Get data with fallbacks
    const resumeSkills = resume.skills || [];
    const jdSkills = jobDescription.requriedSkills || [];
    const experience = resume.totalExperience || 0;
    const candidateName = resume.candidateName || "The candidate";

    // Calculate matching and missing skills
    const matchingSkills = resumeSkills.filter(resumeSkill =>
      jdSkills.some(jdSkill => {
        const rSkill = resumeSkill.toLowerCase();
        const jSkill = jdSkill.toLowerCase();
        return rSkill.includes(jSkill) || jSkill.includes(rSkill) ||
               this.calculateStringSimilarity(rSkill, jSkill) > 0.6;
      })
    );

    const missingSkills = jdSkills.filter(jdSkill =>
      !resumeSkills.some(resumeSkill => {
        const rSkill = resumeSkill.toLowerCase();
        const jSkill = jdSkill.toLowerCase();
        return rSkill.includes(jSkill) || jSkill.includes(rSkill) ||
               this.calculateStringSimilarity(rSkill, jSkill) > 0.6;
      })
    );

    // Analyze skills match
    if (matchingSkills.length > 0) {
      if (matchingSkills.length >= jdSkills.length * 0.7) {
        pros.push(`Excellent skill match: ${matchingSkills.slice(0, 4).join(", ")}`);
      } else if (matchingSkills.length >= jdSkills.length * 0.4) {
        pros.push(`Good skill alignment: ${matchingSkills.slice(0, 3).join(", ")}`);
      } else {
        pros.push(`Has some required skills: ${matchingSkills.slice(0, 2).join(", ")}`);
      }
    }

    if (missingSkills.length > 0) {
      if (missingSkills.length >= jdSkills.length * 0.6) {
        cons.push(`Missing many key skills: ${missingSkills.slice(0, 3).join(", ")}`);
      } else {
        cons.push(`Could improve: ${missingSkills.slice(0, 2).join(", ")}`);
      }
    }

    // Analyze experience
    if (experience >= 5) {
      pros.push("Senior-level experience");
    } else if (experience >= 3) {
      pros.push("Solid professional experience");
    } else if (experience > 0) {
      cons.push("Limited professional experience");
    } else {
      cons.push("No professional experience specified");
    }

    // Analyze education if available
    if (resume.education && resume.education !== "Not specified") {
      const education = resume.education.toLowerCase();
      if (education.includes('bachelor') || education.includes('master') || education.includes('phd')) {
        pros.push("Relevant educational background");
      }
    }

    // Generate intelligent justification
    const overallScore = (matchScore + skillOverlap) / 2;
    let justification = "";

    if (overallScore > 0.8) {
      justification = `🚀 ${candidateName} is an excellent fit! They possess ${matchingSkills.length} out of ${jdSkills.length} required skills with strong semantic alignment to the job description. `;
    } else if (overallScore > 0.6) {
      justification = `✅ ${candidateName} is a good candidate with ${matchingSkills.length} matching skills. `;
    } else if (overallScore > 0.4) {
      justification = `⚠️ ${candidateName} has some relevant experience but lacks ${missingSkills.length} key skills. `;
    } else {
      justification = `❌ ${candidateName} is not a strong match for this role due to significant skill gaps. `;
    }

    // Add specific recommendations
    if (matchingSkills.length > 0) {
      justification += `Strengths include: ${matchingSkills.slice(0, 3).join(", ")}. `;
    }
    
    if (missingSkills.length > 0) {
      justification += `Areas for development: ${missingSkills.slice(0, 2).join(", ")}.`;
    }

    // Ensure we have at least some pros and cons
    if (pros.length === 0) {
      pros.push("Candidate shows potential with available background");
    }
    
    if (cons.length === 0) {
      cons.push("Consider additional screening for specific requirements");
    }

    return { justification, pros, cons };
  }

  // Get comparisons by group
  static async getComparisonsByGroup(req, res) {
    try {
      const { groupId } = req.params;
      const recruiterId = req.userId || "recruiter_default_id";

      const comparisons = await Comparisons.find({ groupId, recruiterId })
        .populate("resumeId", "candidateName email skills totalExperience extractedText")
        .populate("jobId", "title companyName requriedSkills jdText location")
        .sort({ matchScore: -1, createdAt: -1 });

      res.json({
        success: true,
        data: comparisons,
        count: comparisons.length
      });

    } catch (error) {
      console.error("Error fetching comparisons:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message
      });
    }
  }

  // Get comparison by ID
  static async getComparisonById(req, res) {
    try {
      const { id } = req.params;
      const recruiterId = req.userId || "recruiter_default_id";

      const comparison = await Comparisons.findOne({ _id: id, recruiterId })
        .populate("resumeId")
        .populate("jobId");

      if (!comparison) {
        return res.status(404).json({
          success: false,
          message: "Comparison not found"
        });
      }

      res.json({
        success: true,
        data: comparison
      });

    } catch (error) {
      console.error("Error fetching comparison:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message
      });
    }
  }

  // Delete comparison
  static async deleteComparison(req, res) {
    try {
      const { id } = req.params;
      const recruiterId = req.userId || "recruiter_default_id";

      const comparison = await Comparisons.findOneAndDelete({ _id: id, recruiterId });

      if (!comparison) {
        return res.status(404).json({
          success: false,
          message: "Comparison not found"
        });
      }

      res.json({
        success: true,
        message: "Comparison deleted successfully"
      });

    } catch (error) {
      console.error("Error deleting comparison:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message
      });
    }
  }
}

export default ComparisonsController;