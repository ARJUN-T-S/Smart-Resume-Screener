import mongoose from "mongoose";

const GroupsSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Groups", GroupsSchema);
