import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Button from "../../components/forms/Button.jsx";
import { usePatient, useDeletePatient } from "../../features/patients/phooks.js";

const ageToLabel = (age) => {
  if (age == null || Number.isNaN(Number(age))) return null;
  const n = Number(age);
  if (n <= 12) return "Child";
  if (n <= 17) return "Teenager";
  if (n <= 59) return "Adult";
  return "Senior";
};
const backendCategoryToLabel = (cat) => {
  if (!cat) return null;
  switch (cat) {
    case "0-12": return "Child";
    case "13-17": return "Teenager";
    case "18-59": return "Adult";
    case "60+": return "Senior";
    default: return cat;
  }
};

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: patient, isLoading, isError } = usePatient(id);
  const del = useDeletePatient();

  const categoryLabel = useMemo(() => {
    if (!patient) return null;
    return ageToLabel(patient.age) ?? backendCategoryToLabel(patient.ageCategory) ?? null;
  }, [patient]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-gray-600">
          Loading patient…
        </div>
      </main>
    );
  }
  if (isError || !patient) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Patient not found</h1>
          <p className="text-gray-600 mt-1">It may have been deleted or you don’t have access.</p>
          <div className="mt-4">
            <Button full={false} variant="secondary" onClick={() => navigate("/patients")}>
              Back to patients
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const { fullname, email, phone, age, diseases, bloodtype, createdAt, updatedAt } = patient;

  const handleDelete = () => {
   
      if (!window.confirm("Delete this patient? This cannot be undone.")) return;
  del.mutate(id, {
    onSuccess: () => {
      navigate("/patients", { replace: true });
    },
  });
  };

  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="mb-4">
        <Link
          to="/patients"
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
        >
          ← Back to Patients
        </Link>
      </div>

      <header className="mb-4">
        <h1 className="text-3xl font-bold">{fullname}</h1>
        <p className="text-gray-500 mt-1 flex flex-wrap gap-x-2">
          {age != null && (<span>Age: <span className="font-medium text-gray-700">{age}</span></span>)}
          {categoryLabel && (<><span>•</span><span>Category: <span className="font-medium text-gray-700">{categoryLabel}</span></span></>)}
          {bloodtype && (<><span>•</span><span>Blood: <span className="font-medium text-gray-700">{bloodtype}</span></span></>)}
        </p>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <ul className="space-y-2 text-gray-700">
          <li><span className="font-medium">Email:</span> {email || "—"}</li>
          <li><span className="font-medium">Phone:</span> {phone || "—"}</li>
          <li><span className="font-medium">Diseases:</span> {Array.isArray(diseases) && diseases.length ? diseases.join(", ") : "—"}</li>
          <li className="text-sm text-gray-500 mt-2">
            Created: {createdAt ? new Date(createdAt).toLocaleString() : "—"} • Updated: {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}
          </li>
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={`/patients/${id}/edit`} state={{ from: "detail" }}>
            <Button full={false}>Edit</Button>
          </Link>
          <Button full={false} variant="secondary" onClick={() => navigate(`/diagnosis/patient/${id}`)}>
            View diagnoses
          </Button>
          <Button full={false} variant="secondary" onClick={() => navigate("/patients")}>
            Back
          </Button>
          <Button full={false} onClick={handleDelete} loading={del.isPending}>
            Delete
          </Button>
        </div>
      </section>
    </main>
  );
}
