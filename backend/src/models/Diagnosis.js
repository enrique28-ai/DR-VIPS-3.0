import mongoose from "mongoose";

const diagnosisSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true }, // antes "Diagnostic"
  description: { type: String, required: true, trim: true },
  medicine: { type: [String], default: [], validate: v => v.length > 0 },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true, versionKey: false });

diagnosisSchema.index({ createdBy: 1, patient: 1, createdAt: -1 });
diagnosisSchema.index({ title: "text", description: "text" });

const Diagnosis = mongoose.model("Diagnosis", diagnosisSchema);
export default Diagnosis;
