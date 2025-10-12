import Recruiters from "../Models/Recruiters";
import Groups from "../Models/Groups";
import JobDescriptions from "../Models/JobDescriptions";
import Comparisons from "../Models/Comparisons";
import mongoose from "mongoose";

const otherController = {
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