// src/components/patient/PatientCard.jsx
import { Link } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import React, { useCallback } from "react";

  function PatientCard({ patient, onDeleted, isDeleting }) {
    const handleDelete = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDeleting) return;
    if (!window.confirm("Delete this patient? This cannot be undone.")) return;
    // La mutación (React Query) viene del padre vía onDeleted
   onDeleted?.(patient._id);
}, [isDeleting, onDeleted, patient._id]);

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      <h3 className="text-lg font-semibold">
        <Link to={`/patients/${patient._id}`} className="hover:underline">
          {patient.fullname}
        </Link>
      </h3>

      <ul className="mt-2 text-sm text-gray-600 space-y-1">
        {patient?.age != null && <li>Age: {patient.age}</li>}
        {patient?.bloodtype && <li>Blood: {patient.bloodtype}</li>}
        {Array.isArray(patient?.diseases) && patient.diseases.length > 0 && (
          <li>Diseases: {patient.diseases.join(", ")}</li>
        )}
      </ul>

      <div className="mt-4 flex items-center justify-between">
        <Link
          to={`/diagnosis/patient/${patient._id}`}
          className="inline-block rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black"
        >
          View diagnoses
        </Link>

        <div className="flex items-center gap-3 text-gray-500">
          <Link
            to={`/patients/${patient._id}/edit`}
            title="Edit patient"
            className="hover:text-blue-600"
          >
            <button>
            <Pencil className="w-5 h-5" />
            </button>
          </Link>

          <button
            type="button"
            onClick={handleDelete}
            title="Delete patient"
            className="hover:text-red-600 disabled:opacity-50"
            disabled={isDeleting}
            aria-label="Delete patient"
          >
            <Trash2 className="w-5 h-5 pointer-events-none" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default React.memo(PatientCard);