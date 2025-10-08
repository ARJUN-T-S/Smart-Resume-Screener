import Recruiter from "../Models/Recruiters.js";

const RecruiterController = {
  // GET /api/recruiter → get recruiter details
  getDetails: async (req, res) => {
    try {
      // req.user is added by your AuthMiddleware (Firebase decoded token)
      const userId = req.userId;

      const recruiter = await Recruiter.findOne({userId: userId });
      if (!recruiter) {
        return res.status(404).json({ message: "Recruiter not found" });
      }

      res.status(200).json(recruiter);
    } catch (error) {
      console.error("❌ Error in getDetails:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  // POST /api/recruiter/postRecruiter → add new recruiter details
  postRecruiter: async (req, res) => {
    try {
      const userId = req.userId;
      const { name, email } = req.body;

      // Check if already exists
      const existing = await Recruiter.findOne({ userId: userId });
      if (existing) {
        return res.status(400).json({ message: "Recruiter already exists" });
      }

      const newRecruiter = new Recruiter({
        userId,
        name,
        email
      });

      await newRecruiter.save();
      res.status(201).json({ message: "Recruiter created successfully", recruiter: newRecruiter });
    } catch (error) {
      console.error("❌ Error in postRecruiter:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
};

export default RecruiterController;
