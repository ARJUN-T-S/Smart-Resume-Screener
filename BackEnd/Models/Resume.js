import mongoose from "mongoose";
const { Schema } = mongoose;

const ResumeSchema = new Schema({
    groupId: { type: Schema.Types.ObjectId, ref: "Groups", required: true },
    recruiterId: { type: String, ref: "Recruiters", required: true },
    candidateName: { type: String },
    email: { type: String },
    extractedText: { type: String },
    skills: [{ type: String }],
    education: { type: String },
    experience: { type: String },
    totalExperience: { type: Number,default:0},
    uploadDate: { type: Date, default: Date.now },
    pdfUrl:{type:String}
});

export default mongoose.model("Resume", ResumeSchema);
