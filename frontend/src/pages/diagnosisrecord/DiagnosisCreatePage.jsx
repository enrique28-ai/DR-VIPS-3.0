import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCreateDiagnosis } from "../../features/diagnostics/dhooks.js";
import Input from "../../components/forms/Input.jsx";
import Button from "../../components/forms/Button.jsx";
import { toast } from "react-hot-toast";


export default function DiagnosisCreatePage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const createDiagnosis = useCreateDiagnosis(patientId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [medicineText, setMedicineText] = useState("");

  const parseMedicines = (txt) =>
    txt.split(",").map(s => s.trim()).filter(Boolean);

  const onSubmit = (e) => {
    e.preventDefault();
    const meds = parseMedicines(medicineText);

    if (!title.trim()) { toast.error("Diagnosis title is required"); return; }
    if (meds.length === 0) { toast.error("Add at least one medicine"); return; }

    createDiagnosis.mutate(
      { title: title.trim(), description: description.trim(), medicine: meds },
      {
        onSuccess: () => navigate(`/diagnosis/patient/${patientId}`, { replace: true }),
      }
    );
  };

  return (
    <main className="mx-auto max-w-2xl p-4">
      <div className="mb-4">
        <Link
          to={`/diagnosis/patient/${patientId}`}
          className="rounded-md border border-gray-300 px-3 py-2 hover:bg-gray-100"
        >
          ← Back to Diagnoses
        </Link>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-semibold">Create Diagnosis</h1>

        <form onSubmit={onSubmit} className="space-y-4" aria-busy={createDiagnosis.isPending}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
            <Input
              placeholder="e.g., Hypertension"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notes…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Medicines <span className="text-gray-500">(comma separated)</span>
            </label>
            <Input
              placeholder="e.g., Lisinopril, Amlodipine"
              value={medicineText}
              onChange={(e) => setMedicineText(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={createDiagnosis.isPending} loading={createDiagnosis.isPending}>
              {createDiagnosis.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
