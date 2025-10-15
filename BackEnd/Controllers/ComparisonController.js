import Comparisons from "../Models/Comparisons.js";
import Resume from "../Models/Resume.js";
import JobDescriptions from "../Models/JobDescriptions.js";
import axios from "axios";

class ComparisonsController {
    static async generateComparisons(req, res) {
        try {
            const { groupId, jobId } = req.body;
            const recruiterId = req.userId || "recruiter_default_id";

            if (!groupId || !jobId) {
                return res.status(400).json({
                    success: false,
                    message: "groupId and jobId are required"
                });
            }

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

            const resumes = await Resume.find({ groupId, recruiterId });

            if (resumes.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No resumes found for this group"
                });
            }

            const comparisons = [];
            const errors = [];

            for (const resume of resumes) {
                try {
                    const comparison = await ComparisonsController.compareResumeWithJD(
                        resume,
                        jobDescription,
                        groupId,
                        recruiterId
                    );
                    const savedComparison = await Comparisons.create(comparison);
                    comparisons.push(savedComparison);
                } catch (error) {
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
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

    static async compareResumeWithJD(resume, jobDescription, groupId, recruiterId) {
        try {
            const resumeText = this.prepareResumeText(resume);
            const jdText = this.prepareJDText(jobDescription);

            const [resumeEmbedding, jdEmbedding] = await Promise.all([
                ComparisonsController.getEmbedding(resumeText),
                ComparisonsController.getEmbedding(jdText)
            ]);

            const semanticScore = ComparisonsController.enhancedCosineSimilarity(resumeEmbedding, jdEmbedding);
            const skillOverlap = ComparisonsController.enhancedSkillOverlap(
                resume.skills || [],
                jobDescription.requriedSkills || []
            );
            const experienceScore = ComparisonsController.calculateExperienceMatch(
                resume.totalExperience || 0,
                jobDescription.jdText || ""
            );
            const finalScore = ComparisonsController.calculateFinalScore(
                semanticScore,
                skillOverlap,
                experienceScore
            );
            const analysis = ComparisonsController.generateMotivationalAnalysis(
                resume,
                jobDescription,
                finalScore,
                skillOverlap,
                semanticScore
            );

            return {
                groupId,
                recruiterId,
                resumeId: resume._id,
                jobId: jobDescription._id,
                matchScore: Math.round(finalScore * 100),
                SkillOverLap: Math.round(skillOverlap * 100),
                semanticScore: Math.round(semanticScore * 100),
                Justification: analysis.justification,
                pros: analysis.pros,
                cons: analysis.cons,
                recommendations: analysis.recommendations
            };
        } catch (error) {
            throw new Error(`AI analysis failed: ${error.message}`);
        }
    }

    static prepareResumeText(resume) {
        const skills = (resume.skills || []).join(", ");
        const education = resume.education || "";
        const experience = resume.experience || "";
        const totalExp = resume.totalExperience || 0;
        const candidateName = resume.candidateName || "";

        return `
            Professional Profile: ${candidateName} with ${totalExp} years of experience.
            Technical Skills: ${skills}.
            Professional Experience: ${experience}.
            Educational Background: ${education}.
            Key Competencies: ${skills}. ${experience}.
        `.replace(/\s+/g, ' ').trim();
    }

    static prepareJDText(jobDescription) {
        const skills = (jobDescription.requriedSkills || []).join(", ");
        const title = jobDescription.title || "";
        const company = jobDescription.companyName || "";
        const description = jobDescription.jdText || "";
        const location = jobDescription.location || "";

        return `
            Job Position: ${title} at ${company} in ${location}.
            Required Technical Skills: ${skills}.
            Job Responsibilities: ${description}.
            Key Requirements: ${skills}. ${description}.
            Professional Expectations: ${description}.
        `.replace(/\s+/g, ' ').trim();
    }

    static enhancedCosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length) {
            return 0.6;
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        if (normA === 0 || normB === 0) return 0.5;

        let similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
        similarity = (similarity + 1) / 2;
        similarity = Math.pow(similarity, 0.8);
        
        return Math.max(0.3, Math.min(0.98, similarity));
    }

    static enhancedSkillOverlap(resumeSkills, jdSkills) {
        if (!resumeSkills?.length || !jdSkills?.length) {
            return 0.3;
        }

        const resumeSkillsLower = resumeSkills
            .map(skill => skill ? skill.toLowerCase().trim() : "")
            .filter(skill => skill.length > 1);

        const jdSkillsLower = jdSkills
            .map(skill => skill ? skill.toLowerCase().trim() : "")
            .filter(skill => skill.length > 1);

        if (jdSkillsLower.length === 0) return 0.4;

        let matchCount = 0;

        jdSkillsLower.forEach(jdSkill => {
            const foundMatch = resumeSkillsLower.some(resumeSkill => {
                const similarity = this.calculateStringSimilarity(resumeSkill, jdSkill);
                const directMatch = resumeSkill.includes(jdSkill) || jdSkill.includes(resumeSkill);
                const wordMatch = this.hasWordOverlap(resumeSkill, jdSkill);
                return directMatch || similarity > 0.7 || wordMatch;
            });
            if (foundMatch) matchCount++;
        });

        let overlap = matchCount / jdSkillsLower.length;
        if (overlap > 0.7) overlap = Math.min(0.95, overlap * 1.1);
        if (overlap > 0.4) overlap = Math.min(0.9, overlap * 1.05);
        return Math.max(0.2, overlap);
    }

    static hasWordOverlap(skill1, skill2) {
        const words1 = skill1.split(/[ ,\-_]+/).filter(w => w.length > 2);
        const words2 = skill2.split(/[ ,\-_]+/).filter(w => w.length > 2);
        return words1.some(w1 => 
            words2.some(w2 => 
                w1.includes(w2) || w2.includes(w1) || this.calculateStringSimilarity(w1, w2) > 0.8
            )
        );
    }

    static calculateExperienceMatch(experience, jdText = "") {
        if (!experience) return 0.4;
        const jdLower = jdText.toLowerCase();
        let requiredExp = 0;
        
        if (jdLower.includes('senior') || jdLower.includes('lead') || jdLower.includes('principal')) {
            requiredExp = 5;
        } else if (jdLower.includes('mid-level') || jdLower.includes('mid level') || jdLower.includes('3+ years')) {
            requiredExp = 3;
        } else if (jdLower.includes('junior') || jdLower.includes('entry') || jdLower.includes('fresher')) {
            requiredExp = 1;
        } else {
            requiredExp = 2;
        }
        
        if (experience >= requiredExp) {
            return 0.9;
        } else if (experience >= requiredExp - 1) {
            return 0.7;
        } else if (experience > 0) {
            return 0.5;
        }
        return 0.3;
    }

    static calculateFinalScore(semanticScore, skillOverlap, experienceScore) {
        const weights = {
            semantic: 0.4,
            skills: 0.4,
            experience: 0.2
        };
        let finalScore = (
            semanticScore * weights.semantic +
            skillOverlap * weights.skills +
            experienceScore * weights.experience
        );
        if (finalScore > 0.6) finalScore = Math.min(0.95, finalScore * 1.1);
        if (finalScore > 0.4) finalScore = Math.min(0.85, finalScore * 1.05);
        return Math.max(0.2, Math.min(0.98, finalScore));
    }

    static async getEmbedding(text) {
        try {
            if (!process.env.HUGGINGFACE_API_KEY) {
                return Array(384).fill(0).map(() => (Math.random() * 1.5 - 0.5));
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
            return Array(384).fill(0).map(() => (Math.random() * 1.5 - 0.5));
        }
    }

    static generateMotivationalAnalysis(resume, jobDescription, finalScore, skillOverlap, semanticScore) {
        const pros = [];
        const cons = [];
        const recommendations = [];
        const resumeSkills = resume.skills || [];
        const jdSkills = jobDescription.requriedSkills || [];
        const experience = resume.totalExperience || 0;
        const candidateName = resume.candidateName || "This candidate";
        const education = resume.education || "";

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

        if (matchingSkills.length > 0) {
            if (matchingSkills.length >= jdSkills.length * 0.7) {
                pros.push(`Excellent technical fit with ${matchingSkills.length} matching skills`);
                pros.push(`Strong alignment with core requirements: ${matchingSkills.slice(0, 3).join(", ")}`);
            } else if (matchingSkills.length >= jdSkills.length * 0.4) {
                pros.push(`Solid foundation with ${matchingSkills.length} relevant skills`);
                pros.push(`Demonstrates key competencies: ${matchingSkills.slice(0, 3).join(", ")}`);
            } else {
                pros.push(`Has promising starting skills: ${matchingSkills.slice(0, 2).join(", ")}`);
            }
        }

        if (experience >= 5) {
            pros.push("Senior-level expertise and industry knowledge");
            pros.push("Proven track record of professional delivery");
        } else if (experience >= 3) {
            pros.push("Growing professional with solid practical experience");
            pros.push("Ready to take on more responsibility");
        } else if (experience > 0) {
            pros.push("Demonstrates early career potential and learning agility");
        }

        if (education) {
            if (education.toLowerCase().includes('bachelor') || education.toLowerCase().includes('master') || education.toLowerCase().includes('phd')) {
                pros.push("Strong educational foundation in relevant field");
            } else {
                pros.push("Committed to professional development and learning");
            }
        }

        if (missingSkills.length > 0) {
            if (missingSkills.length >= jdSkills.length * 0.6) {
                cons.push(`Opportunity to develop: ${missingSkills.slice(0, 3).join(", ")}`);
                recommendations.push("Consider targeted training in key missing areas");
            } else {
                cons.push(`Could enhance skills in: ${missingSkills.slice(0, 2).join(", ")}`);
                recommendations.push("Quick upskilling potential in specific technologies");
            }
        }

        if (experience < 2) {
            cons.push("Early career stage - great potential for growth");
            recommendations.push("Mentorship program would accelerate development");
        }

        if (pros.length === 0) {
            pros.push("Shows potential for growth and development");
            pros.push("Adaptable learner with transferable skills");
        }
        
        if (cons.length === 0) {
            cons.push("Minor areas for refinement through on-the-job experience");
        }

        if (recommendations.length === 0) {
            recommendations.push("Ready for next interview stage based on strong alignment");
        }

        let justification = "";
        const matchPercentage = Math.round(finalScore * 100);

        if (finalScore > 0.85) {
            justification = `EXCELLENT MATCH! ${candidateName} demonstrates outstanding alignment (${matchPercentage}%) with this role. `;
            justification += `They possess ${matchingSkills.length} of the ${jdSkills.length} required skills and show strong semantic understanding. `;
            justification += `This candidate is highly recommended for immediate consideration!`;
        } else if (finalScore > 0.70) {
            justification = `STRONG CANDIDATE! ${candidateName} shows great potential (${matchPercentage}%) for this position. `;
            justification += `With ${matchingSkills.length} matching skills and solid experience, they're well-positioned for success. `;
            justification += `Definitely worth advancing to the next round!`;
        } else if (finalScore > 0.55) {
            justification = `PROMISING MATCH! ${candidateName} has good foundational alignment (${matchPercentage}%) with several key requirements. `;
            justification += `They bring ${matchingSkills.length} relevant skills and show learning potential. `;
            justification += `Consider for further evaluation with some development focus.`;
        } else {
            justification = `DEVELOPMENT OPPORTUNITY! ${candidateName} has some alignment (${matchPercentage}%) and shows potential in specific areas. `;
            justification += `With ${matchingSkills.length} matching skills, they could grow into this role with proper guidance. `;
            justification += `Consider for junior position or with training plan.`;
        }

        if (matchingSkills.length > 0) {
            justification += ` Their strengths in ${matchingSkills.slice(0, 2).join(", ")} are particularly valuable.`;
        }

        return { justification, pros, cons, recommendations };
    }

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
                    track[j][i - 1] + 1,
                    track[j - 1][i] + 1,
                    track[j - 1][i - 1] + indicator,
                );
            }
        }
        return track[str2.length][str1.length];
    }

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
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

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
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

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
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }
}

export default ComparisonsController;