// controllers/diagnosis.controller.js
import Diagnosis from "../models/Diagnosis.js";
import Patient from "../models/Patient.js";

// Helper: confirmar que el paciente pertenece al usuario autenticado
const ownsPatient = async (patientId, userId) =>
  !!(await Patient.exists({ _id: patientId, createdBy: userId }));

// POST /api/diagnoses
export const createDiagnosis = async (req, res, next) => {
  try {
    const { title, description, medicine, patient } = req.body;

    if (!title?.trim() || !patient) {
      return res.status(400).json({ error: "title y patient son requeridos" });
    }
    if (!Array.isArray(medicine) || medicine.length === 0) {
      return res.status(400).json({ error: "medicine debe tener al menos 1 elemento" });
    }
    if (!(await ownsPatient(patient, req.user._id))) {
      return res.status(403).json({ error: "No autorizado para este paciente" });
    }

    const doc = await Diagnosis.create({
      title: title.trim(),
      description: description?.trim() ?? "",
      medicine,
      patient,
      createdBy: req.user._id,
    });

    return res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

// GET /api/diagnoses/patient/:patientId?q=&page=&limit=
// Si envías q, usa el índice de texto (title/description); ordena por relevancia y luego recientes
export const getDiagnosesByPatient = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const q = req.query.q?.trim();
    const page = Math.max(1, parseInt(req.query.page ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? "20", 10)));
    const skip = (page - 1) * limit;

    if (!(await ownsPatient(patientId, req.user._id))) {
      return res.status(403).json({ error: "No autorizado para este paciente" });
    }

    const baseFilter = { createdBy: req.user._id, patient: patientId };
    let items, total;

    if (q) {
      // búsqueda por texto (usa tu índice text en title/description)
      [items, total] = await Promise.all([
        Diagnosis.find({ ...baseFilter, $text: { $search: q } },
                       { score: { $meta: "textScore" } })
                 .sort({ score: { $meta: "textScore" }, createdAt: -1 })
                 .skip(skip).limit(limit),
        Diagnosis.countDocuments({ ...baseFilter, $text: { $search: q } })
      ]);
    } else {
      // lista normal, más recientes primero
      [items, total] = await Promise.all([
        Diagnosis.find(baseFilter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Diagnosis.countDocuments(baseFilter)
      ]);
    }

    return res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/diagnoses/:id
export const getDiagnosisById = async (req, res, next) => {
  try {
    const d = await Diagnosis.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!d) return res.status(404).json({ error: "Diagnóstico no encontrado" });

    // defensa: confirmar ownership del paciente
    if (!(await ownsPatient(d.patient, req.user._id))) {
      return res.status(403).json({ error: "No autorizado" });
    }
    return res.json(d);
  } catch (err) {
    next(err);
  }
};

// PUT /api/diagnoses/:id
export const updateDiagnosis = async (req, res, next) => {
  try {
    const d = await Diagnosis.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!d) return res.status(404).json({ error: "Diagnóstico no encontrado" });
    if (!(await ownsPatient(d.patient, req.user._id))) {
      return res.status(403).json({ error: "No autorizado" });
    }

    // Solo permitir campos editables
    if (req.body.title != null) d.title = String(req.body.title).trim();
    if (req.body.description != null) d.description = String(req.body.description).trim();
    if (req.body.medicine != null) {
      if (!Array.isArray(req.body.medicine) || req.body.medicine.length === 0) {
        return res.status(400).json({ error: "medicine debe tener al menos 1 elemento" });
      }
      d.medicine = req.body.medicine;
    }

    await d.save();
    return res.json(d);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/diagnoses/:id
export const deleteDiagnosis = async (req, res, next) => {
  try {
    const d = await Diagnosis.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!d) return res.status(404).json({ error: "Diagnóstico no encontrado" });
    if (!(await ownsPatient(d.patient, req.user._id))) {
      return res.status(403).json({ error: "No autorizado" });
    }

    await d.deleteOne();
    return res.status(204).end();
  } catch (err) {
    next(err);
  }
};
