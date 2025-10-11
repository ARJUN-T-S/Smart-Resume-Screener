import Groups from "../Models/Groups.js";


/** Add a new group */
const addGroup = async (req, res) => {
  try {
    const { groupName } = req.body;
    const userId = req.userId;

    if (!groupName || !userId) {
      return res.status(400).json({ success: false, error: "groupName and userId are required" });
    }

    const newGroup = new Groups({ groupName, userId });
    await newGroup.save();

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: newGroup,
    });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/** Remove a group by ID */
const removeGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedGroup = await Groups.findByIdAndDelete(id);

    if (!deletedGroup) {
      return res.status(404).json({ success: false, error: "Group not found" });
    }

    res.json({ success: true, message: "Group deleted successfully", data: deletedGroup });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/** Get all groups for a specific userId */
const getGroups = async (req, res) => {
  try {
    const userId = req.userId;
    const groups = await Groups.find({ userId }); // <-- use find, not findOne

    res.json({ success: true, data: groups });
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export { addGroup, removeGroup, getGroups };
