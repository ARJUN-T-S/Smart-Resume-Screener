import Comparisons from "../Models/Comparisons.js";
import Resume from "../Models/Resume.js";
import mongoose from "mongoose";

// Generate comparisons for a group and job
const generateComparisons = async (req, res) => {
  try {
    const { groupId, jobId } = req.body;
    const recruiterId = req.userId;

    if (!groupId || !jobId) {
      return res.status(400).json({
        success: false,
        message: "groupId and jobId are required"
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid groupId or jobId format"
      });
    }

    // In a real implementation, you would have AI logic here to generate comparisons
    // For now, we'll return a mock response
    const mockComparisons = [
      {
        groupId: new mongoose.Types.ObjectId(groupId),
        recruiterId,
        jobId: new mongoose.Types.ObjectId(jobId),
        resumeId: new mongoose.Types.ObjectId(),
        matchScore: 85,
        SkillOverLap: 78,
        Justification: "Strong alignment with required skills and experience",
        pros: ["Excellent technical skills", "Relevant industry experience", "Good cultural fit"],
        cons: ["Limited management experience", "Gap in employment history"]
      },
      {
        groupId: new mongoose.Types.ObjectId(groupId),
        recruiterId,
        jobId: new mongoose.Types.ObjectId(jobId),
        resumeId: new mongoose.Types.ObjectId(),
        matchScore: 72,
        SkillOverLap: 65,
        Justification: "Good technical foundation but lacks some specific skills",
        pros: ["Fast learner", "Strong educational background", "Good communication skills"],
        cons: ["Limited practical experience", "Missing some required technologies"]
      }
    ];

    // Save comparisons to database
    const savedComparisons = await Comparisons.insertMany(mockComparisons);

    res.status(201).json({
      success: true,
      message: "Comparisons generated successfully",
      data: savedComparisons
    });

  } catch (error) {
    console.error("Generate comparisons error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get all comparisons for a group and job
// Get all comparisons for a group and job
const getComparisonsByGroupAndJob = async (req, res) => {
  try {
    const { groupId, jobId } = req.params;
    const recruiterId = req.userId;

    console.log('=== GET COMPARISONS REQUEST ===');
    console.log('groupId:', groupId);
    console.log('jobId:', jobId);
    console.log('recruiterId:', recruiterId);
    console.log('===============================');

    if (!groupId || !jobId) {
      return res.status(400).json({
        success: false,
        message: "groupId and jobId are required"
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      console.log('Invalid groupId format:', groupId);
      return res.status(400).json({
        success: false,
        message: "Invalid groupId format"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      console.log('Invalid jobId format:', jobId);
      return res.status(400).json({
        success: false,
        message: "Invalid jobId format"
      });
    }

    console.log('Searching for comparisons in database...');

    const comparisons = await Comparisons.find({
      groupId: new mongoose.Types.ObjectId(groupId),
      jobId: new mongoose.Types.ObjectId(jobId),
      recruiterId
    })
    .populate('resumeId', 'candidateName email totalExperience skills')
    .sort({ matchScore: -1 })
    .exec();

    console.log(`Found ${comparisons.length} comparisons`);

    if (!comparisons.length) {
      console.log('No comparisons found for the given criteria');
      return res.status(404).json({
        success: false,
        message: "No comparisons found for this group and job"
      });
    }

    console.log('Successfully returning comparisons');
    res.status(200).json({
      success: true,
      message: "Comparisons retrieved successfully",
      data: comparisons
    });

  } catch (error) {
    console.error("=== GET COMPARISONS ERROR ===");
    console.error("Error:", error);
    console.error("Stack:", error.stack);
    console.error("=============================");
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
// Get top N comparisons by match score
const getTopNByMatchScore = async (req, res) => {
  try {
    const { groupId, jobId, limit } = req.params;
    const recruiterId = req.userId;

    const comparisons = await Comparisons.find({
      groupId: new mongoose.Types.ObjectId(groupId),
      jobId: new mongoose.Types.ObjectId(jobId),
      recruiterId
    })
    .populate('resumeId', 'candidateName email totalExperience skills')
    .sort({ matchScore: -1 })
    .limit(parseInt(limit))
    .exec();

    res.status(200).json({
      success: true,
      message: `Top ${limit} comparisons by match score retrieved successfully`,
      data: comparisons
    });

  } catch (error) {
    console.error("Get top match score error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get top N comparisons by skill overlap
const getTopNBySkillOverlap = async (req, res) => {
  try {
    const { groupId, jobId, limit } = req.params;
    const recruiterId = req.userId;

    const comparisons = await Comparisons.find({
      groupId: new mongoose.Types.ObjectId(groupId),
      jobId: new mongoose.Types.ObjectId(jobId),
      recruiterId
    })
    .populate('resumeId', 'candidateName email totalExperience skills')
    .sort({ SkillOverLap: -1 })
    .limit(parseInt(limit))
    .exec();

    res.status(200).json({
      success: true,
      message: `Top ${limit} comparisons by skill overlap retrieved successfully`,
      data: comparisons
    });

  } catch (error) {
    console.error("Get top skill overlap error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get all comparisons with additional analytics
const getAllComparisons = async (req, res) => {
  try {
    const { groupId, jobId } = req.params;
    const recruiterId = req.userId;

    const comparisons = await Comparisons.find({
      groupId: new mongoose.Types.ObjectId(groupId),
      jobId: new mongoose.Types.ObjectId(jobId),
      recruiterId
    })
    .populate('resumeId', 'candidateName email totalExperience skills')
    .sort({ matchScore: -1 })
    .exec();

    // Calculate analytics
    const analytics = {
      totalComparisons: comparisons.length,
      averageMatchScore: comparisons.reduce((acc, curr) => acc + curr.matchScore, 0) / comparisons.length,
      averageSkillOverlap: comparisons.reduce((acc, curr) => acc + curr.SkillOverLap, 0) / comparisons.length,
      topMatchScore: comparisons.length > 0 ? Math.max(...comparisons.map(c => c.matchScore)) : 0,
      topSkillOverlap: comparisons.length > 0 ? Math.max(...comparisons.map(c => c.SkillOverLap)) : 0
    };

    res.status(200).json({
      success: true,
      message: "All comparisons with analytics retrieved successfully",
      data: {
        comparisons,
        analytics
      }
    });

  } catch (error) {
    console.error("Get all comparisons error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export {
  generateComparisons,
  getComparisonsByGroupAndJob,
  getTopNByMatchScore,
  getTopNBySkillOverlap,
  getAllComparisons
};