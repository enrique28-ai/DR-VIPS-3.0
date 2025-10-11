import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/forms/Button.jsx";
import { useDiagnosis, useDeleteDiagnosis } from "../../features/diagnostics/dhooks.js";

export default function DiagnosisDetailPage() {
  const { patientId, diagnosisId } = useParams();
  const navigate = useNavigate();

  const { data: diag, isLoading, isError } = useDiagnosis(diagnosisId);
  const del = useDeleteDiagnosis();

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

  const title = diag.title ?? diag.Diagnostic ?? "Untitled";
  const meds  = Array.isArray(diag.medicine) ? diag.medicine : [];

  const handleDelete = () => {
    if (!window.confirm("Delete this diagnosis? This cannot be undone.")) return;
    del.mutate(
      { id: diagnosisId, patientId },
      { onSuccess: () => navigate(`/diagnosis/patient/${patientId}`, { replace: true }) }
    );
  };

  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="mb-4">
        <Link
          to={`/diagnosis/patient/${patientId}`}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
        >
          ← Back to Diagnoses
        </Link>
      </div>

      <header className="mb-4">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Created: {diag.createdAt ? new Date(diag.createdAt).toLocaleString() : "—"} • Updated:{" "}
          {diag.updatedAt ? new Date(diag.updatedAt).toLocaleString() : "—"}
        </p>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="prose max-w-none">
          <h2 className="mb-2 text-xl font-semibold">Description</h2>
          <p className="whitespace-pre-line text-gray-700">{diag.description?.trim() || "—"}</p>
        </div>

        <div className="mt-6">
          <h3 className="mb-2 text-xl font-semibold text-gray-700">Medicines</h3>
          {meds.length ? (
            <div className="flex flex-wrap gap-2">
              {meds.map((m, i) => (
                <span key={i} className="rounded-full bg-blue-50 px-3 py-1 text-l text-blue-700">
                  {m}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">—</p>
          )}
        </div>

        <div className="mt-6 grid w-full max-w-md grid-cols-3 gap-3">
          <Link to={`/diagnosis/patient/${patientId}/${diagnosisId}/edit`}>
            <Button full={false} className="w-full">Edit</Button>
          </Link>
          <Link to={`/diagnosis/patient/${patientId}`}>
            <Button  full={false} variant="secondary" className="w-full">Back</Button>
          </Link>
          <Button full={false} className="w-full" onClick={handleDelete} loading={del.isPending}>
            Delete
          </Button>
        </div>
      </section>
    </main>
  );
}
