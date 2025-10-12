import mongoose from "mongoose";
import Comparisons from "../Models/Comparisons.js";



const otherController = {
   
  getGroupsByJobId: async (req, res) => {
    try {
      const userId = req.userId;
      const { jobId } = req.params;

      // ✅ Validate Auth
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized: user not identified" });
      }

      // ✅ Validate jobId presence
      if (!jobId) {
        return res
          .status(400)
          .json({ success: false, message: "jobId is required" });
      }

      // ✅ Validate jobId format
      if (!mongoose.Types.ObjectId.isValid(jobId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid jobId format" });
      }

      // ✅ Fetch distinct groupIds where this recruiter has comparisons for that job
      const groups = await Comparisons.aggregate([
        {
          $match: {
            recruiterId: userId,
            jobId: new mongoose.Types.ObjectId(jobId),
          },
        },
        {
          $group: {
            _id: "$groupId",
          },
        },
        {
          $project: {
            _id: 0,
            groupId: "$_id",
          },
        },
      ]);

      // ✅ Handle no data found
      if (!groups.length) {
        return res.status(404).json({
          success: false,
          message: "No groups found for this jobId",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Groups fetched successfully",
        data: groups,
      });
    } catch (err) {
      console.error("Error in getGroupsByJobId:", err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: err.message,
      });
    }
  },


  getJobDesc: async (req, res) => {
    try {
      const userId = req.userId;
      const { groupId } = req.params; // or req.body, depending on how you send it

      if (!userId) {
        return res
          .status(404)
          .json({ success: false, message: "Failed to identify user" });
      }

      if (!groupId) {
        return res
          .status(400)
          .json({ success: false, message: "groupId is required" });
      }

      // Aggregate comparisons for that recruiter and group
      const records = await Comparisons.aggregate([
        {
          $match: {
            recruiterId: userId, // use recruiterId, not userId
            groupId: new mongoose.Types.ObjectId(groupId),
          },
        },
        {
          $group: {
            _id: "$jobId",
            record: { $first: "$$ROOT" },
          },
        },
        {
          $replaceRoot: { newRoot: "$record" },
        },
      ]);

      return res.status(200).json({
        success: true,
        message: "Job descriptions fetched successfully",
        data: records,
      });
    } catch (err) {
      console.error("Error in getJobDesc:", err);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: err.message,
      });
    }
  },
};

export default otherController;