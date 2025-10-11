// controllers/patient.controller.js
import mongoose from "mongoose";
import Patient from "../models/Patient.js";
import Diagnosis from "../models/Diagnosis.js";

/**
 * Crear paciente
 */
export const createPatient = async (req, res) => {
  try {
    const { fullname, diseases, email, phone, age, bloodtype } = req.body;

    if (
      !fullname ||
      !Array.isArray(diseases) || !diseases.length ||
      !email || !phone ||
      age == null || !bloodtype
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const doc = await Patient.create({
      fullname, diseases, email, phone, age, bloodtype,
      createdBy: req.user._id,
    });

    return res.status(201).json(doc);
  } catch (err) {
    // índices únicos compuestos (createdBy+email/phone/fullname) -> E11000
    if (err?.code === 11000) {
      return res.status(400).json({ error: "Duplicate key: patient already exists for this user" });
    }
    console.error("createPatient error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Listar mis pacientes (búsqueda + filtros + paginación)
 * GET /api/patients?category=0-12|13-17|18-59|60+&q=&page=&limit=
 */
export const getMyPatients = async (req, res) => {
  try {
    const { category, q } = req.query;

    // soporta bloodtype simple o múltiple
    const rawBT = req.query.bloodtype; // puede ser string | string[] | undefined
    let bloodtypeFilter = null;
    if (rawBT && rawBT !== "All") {
      const arr = Array.isArray(rawBT) ? rawBT : [rawBT];
      const ups = arr
        .map(x => String(x || "").trim().toUpperCase())
        .filter(Boolean);                     // limpia vacíos
      if (ups.length > 0) bloodtypeFilter = ups.length === 1 ? ups[0] : { $in: ups };
    }

    const page = Math.max(1, parseInt(req.query.page ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? "20", 10)));
    const skip = (page - 1) * limit;

    const query = { createdBy: req.user._id };

    // filtro por categoría de edad
    if (category && category !== "All") query.ageCategory = category;

    // filtro por tipo(s) de sangre
    if (bloodtypeFilter) query.bloodtype = bloodtypeFilter;

    // búsqueda por nombre/email/teléfono
    const term = q?.trim();
    if (term) {
      query.$or = [
        { fullname: { $regex: term, $options: "i" } },
        { email:    { $regex: term, $options: "i" } },
        { phone:    { $regex: term, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      Patient.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Patient.countDocuments(query),
    ]);

    return res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("getMyPatients error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Obtener paciente por id
 */
export const getPatientById = async (req, res) => {
  try {
    const doc = await Patient.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    }).lean();

    if (!doc) return res.status(404).json({ error: "Paciente no encontrado" });
    return res.json(doc);
  } catch (err) {
    console.error("getPatientById error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Actualizar paciente
 */
export const updatePatient = async (req, res) => {
  try {
    const { fullname, diseases, email, phone, age, bloodtype } = req.body;

    const updated = await Patient.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { fullname, diseases, email, phone, age, bloodtype },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: "Paciente no encontrado" });
    return res.json(updated);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ error: "Duplicate key: patient already exists for this user" });
    }
    console.error("updatePatient error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const deletePatient = async (req, res) => {
  try {
    // 1) Asegura ownership (solo puedes borrar tus pacientes)
    const patient = await Patient.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });
    if (!patient) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    // 2) Borra TODOS los diagnósticos que referencian al paciente
    await Diagnosis.deleteMany({ patient: patient._id }); // sin createdBy

    // 3) Borra el paciente
    await patient.deleteOne(); // (si luego agregas hook pre('deleteOne'), también se disparará)

    // 4) Respuesta
    return res.status(204).end();
  } catch (err) {
    console.error("deletePatient error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
