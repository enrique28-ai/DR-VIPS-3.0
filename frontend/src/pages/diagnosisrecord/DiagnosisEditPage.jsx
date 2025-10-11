import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { useDiagnosis, useUpdateDiagnosis } from "../../features/diagnostics/dhooks.js";
import Input from "../../components/forms/Input.jsx";
import Button from "../../components/forms/Button.jsx";
import { toast } from "react-hot-toast";


export default function DiagnosisEditPage() {
  const { patientId, diagnosisId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: diag, isLoading, isError } = useDiagnosis(diagnosisId);
  const updateDiagnosis = useUpdateDiagnosis(diagnosisId, patientId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [medicineText, setMedicineText] = useState("");

  useEffect(() => {
    if (!diag) return;
    setTitle(diag.title ?? diag.Diagnostic ?? "");
    setDescription(diag.description ?? "");
    setMedicineText(Array.isArray(diag.medicine) ? diag.medicine.join(", ") : "");
  }, [diag]);

  // Evita flash en primer fetch
  if (isLoading && !diag) return null;
  if (isError || !diag) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Diagnosis not found</h1>
          <div className="mt-4">
            <Button full={false} variant="secondary" onClick={() => navigate(`/diagnosis/patient/${patientId}`)}>
              Back to diagnoses
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const parse = (txt) => txt.split(",").map((s) => s.trim()).filter(Boolean);
  const handleBack = () => {
   const fromDetail = location.state?.from === "detail";
   const fallback = fromDetail
     ? `/diagnosis/patient/${patientId}/${diagnosisId}`
    : `/diagnosis/patient/${patientId}`;
   if (window.history.state && window.history.length > 1) navigate(-1);
   else navigate(fallback, { replace: true });
 };

  const onSubmit = (e) => {
    e.preventDefault();
    const meds = parse(medicineText);

    if (!title.trim()) { toast.error("Diagnosis title is required"); return; }
    if (!meds.length)   { toast.error("Add at least one medicine"); return; }

    updateDiagnosis.mutate(
      { title: title.trim(), description: description.trim(), medicine: meds },
      {
        onSuccess: () => handleBack(),
      }
    );
  };

  return (
    <main className="mx-auto max-w-2xl p-4">
      <div className="mb-4">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
        >
          ← Back
        </button>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-semibold">Edit Diagnosis</h1>

        <form onSubmit={onSubmit} className="space-y-4" aria-busy={updateDiagnosis.isPending}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
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

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button variant="secondary" className="w-full" onClick={handleBack}>Cancel</Button>
            <Button type="submit" className="w-full" disabled={updateDiagnosis.isPending} loading={updateDiagnosis.isPending}>
              {updateDiagnosis.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
