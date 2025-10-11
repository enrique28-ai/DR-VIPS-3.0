// controllers/diagnosis.controller.js
// routes/diagnosis.routes.js
import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { requireVerified } from "../middleware/requireVerified.js";
import {
  createDiagnosis,
  getDiagnosesByPatient,
  getDiagnosisById,
  updateDiagnosis,
  deleteDiagnosis
} from "../controllers/diagnosisController.js";

const router = Router();

router.post("/", protect, requireVerified, createDiagnosis);
router.get("/patient/:patientId", protect, requireVerified, getDiagnosesByPatient); // ?q=&page=&limit=
router.get("/:id", protect, requireVerified, getDiagnosisById);
router.put("/:id", protect, requireVerified, updateDiagnosis);
router.delete("/:id", protect, requireVerified, deleteDiagnosis);

export default router;
