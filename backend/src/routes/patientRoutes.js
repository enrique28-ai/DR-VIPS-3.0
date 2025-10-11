import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { requireVerified } from "../middleware/requireVerified.js";
import {
  createPatient,
  getMyPatients,
  getPatientById,
  updatePatient,
  deletePatient,
} from "../controllers/patientController.js";

const router = Router();

router.post("/",  protect, requireVerified, createPatient);
router.get("/",   protect, requireVerified, getMyPatients);
router.get("/:id",protect, requireVerified, getPatientById);
router.put("/:id",protect, requireVerified, updatePatient);
router.delete("/:id", protect, requireVerified, deletePatient);

export default router;
