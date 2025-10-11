import mongoose from "mongoose";

export const AGE_BANDS = [
  { key: "0-12",  min: 0,  max: 12 },
  { key: "13-17", min: 13, max: 17 },
  { key: "18-59", min: 18, max: 59 },
  { key: "60+",   min: 60, max: Infinity }
];

const BLOOD_TYPES = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

function mapAgeToBand(age) {
  if (age == null) return undefined;
  const band = AGE_BANDS.find(b => age >= b.min && age <= b.max);
  return band?.key;
}

const patientSchema = new mongoose.Schema({
  fullname: { type: String, required: true, trim: true },
  diseases: { type: [String], default: [], validate: v => v.length > 0 },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 0, max: 120 },
  ageCategory: { type: String, enum: AGE_BANDS.map(b => b.key) },
  bloodtype: { type: String, required: true, enum: BLOOD_TYPES, uppercase: true, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true, versionKey: false });

patientSchema.pre("save", function(next){
  this.ageCategory = mapAgeToBand(this.age);
  next();
});
patientSchema.pre("findOneAndUpdate", function(next){
  const upd = this.getUpdate() || {};
  if (Object.prototype.hasOwnProperty.call(upd, "age")) {
    upd.ageCategory = mapAgeToBand(upd.age);
    this.setUpdate(upd);
  }
  if (upd.bloodtype) upd.bloodtype = String(upd.bloodtype).toUpperCase().trim();
  next();
});

// Índices compuestos por usuario
patientSchema.index({ createdBy: 1, email: 1 }, { unique: true });
patientSchema.index({ createdBy: 1, phone: 1 }, { unique: true });
patientSchema.index({ createdBy: 1, fullname: 1 }, { unique: true });
patientSchema.index({ createdBy: 1, age: 1 });

const Patient = mongoose.model("Patient", patientSchema);
export default Patient;
