import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Input from "../../components/forms/Input.jsx";
import DiagnosisCard from "../../components/diagnostic/DiagnosisCard.jsx";
import EmptyDiagnoses from "../../components/diagnostic/EmptyDiagnoses.jsx";
import { useDiagnosesByPatient, useDeleteDiagnosis } from "../../features/diagnostics/dhooks.js";

// utils
const pad = (n) => String(n).padStart(2, "0");
const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const norm = (s = "") => String(s).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function DiagnosesByPatientPage() {
  const { patientId } = useParams();

  // filtros UI: texto + día (como pediste)
  const [q, setQ] = useState("");
  const [onDate, setOnDate] = useState(todayLocal());

  // data (React Query)
  const { data, isLoading, isFetching } = useDiagnosesByPatient(patientId);
  const items = data?.items ?? [];
  const hasAny = items.length > 0;
  const filtersApplied = !!q.trim() || !!onDate;

  // “sticky no-match” para evitar parpadeos mientras refetch
 
  // lista filtrada (para render)
  const display = useMemo(() => {
  const raw = q.trim();
  const qn = norm(raw);

  return items.filter((d) => {
    // Campo principal (título / nombre del diagnóstico)
    const title = d.title ?? d.name ?? d.Diagnostic ?? d.diagnosis ?? "";
    const titleTokens = norm(title).split(/[\s,._-]+/).filter(Boolean);

    // ¿la query parece “de nombre”? (solo letras/espacios, sin @ ni dígitos)
    const isNameQuery = /^[a-zñáéíóúü\s]+$/i.test(raw) && !raw.includes("@") && !/\d/.test(raw);

    // 1) Prefijo por palabra en el título (como en Patients)
    const titleMatch = !qn || titleTokens.some(t => t.startsWith(qn));

    // 2) Si NO es búsqueda de nombre (p.ej. query con @ o números),
    //    permite match permisivo en otros campos (descripción, etc.)
    let extraMatch = false;
    if (!isNameQuery && qn) {
      const extra = norm(d.description ?? "");
      extraMatch = extra.includes(qn);
    }

    // Filtro de fecha (si hay)
    let dateOk = true;
    if (onDate) {
      const ts = d.updatedAt || d.createdAt;
      if (!ts) return false;
      const t = new Date(ts);
      const key = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
      dateOk = key === onDate;
    }

    return (titleMatch || extraMatch) && dateOk;
  });
}, [items, q, onDate]);

// filtersApplied ya existe arriba:  const filtersApplied = !!q.trim() || !!onDate;
const noMatch = hasAny && filtersApplied && display.length === 0;

const subtitle = useMemo(() => {
   if (!filtersApplied) return `Showing ${items.length} diagnoses`;
   const parts = [];
   if (q.trim()) parts.push(`“${q.trim()}”`);
   if (onDate) parts.push(onDate);
   return `${parts.join(" · ")} — ${display.length} found`;
 }, [filtersApplied, items.length, q, onDate, display.length]);

  const clearFilters = () => {
    setQ("");
    setOnDate("");
  };

  const del = useDeleteDiagnosis();
  const handleDelete = (id) => del.mutate({ id, patientId });
  const deletingId = del.variables?.id;

  // Evita flash en primer fetch
  if (isLoading && !data) return null;

  // Empty absoluto: paciente sin diagnósticos (después del primer fetch)
  if (!isLoading && !hasAny) {
    return (
      <main className="mx-auto max-w-6xl p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Diagnoses</h1>
            <p className="text-sm text-gray-600">No diagnoses yet</p>
          </div>
          <Link
            to={`/patients/${patientId}`}
            className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-100"
          >
            ← Back to Patient
          </Link>
        </div>
        <EmptyDiagnoses patientId={patientId} />
      </main>
    );
  }

  
  return (
    <main className="mx-auto max-w-6xl p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Diagnoses</h1>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/patients/${patientId}`}
            className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-100"
          >
            ← Back to Patient
          </Link>
          <Link
            to={`/diagnosis/patient/${patientId}/new`}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Create Diagnosis
          </Link>
        </div>
      </div>

      {/* Controles */}
      <section className="mb-6 flex flex-col items-center">
        <form onSubmit={(e) => e.preventDefault()} className="w-full max-w-4xl">
          <div className="w-full">
          <Input
            className="w-full"
            placeholder="Search by diagnosis name..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
          />
          </div>
        </form>
      
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <label className="text-sm text-gray-700">On date</label>
        <input
          type="date"
          value={onDate}
          onChange={(e) => setOnDate(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2"
        />
        <button
          type="button"
          onClick={() => setOnDate(todayLocal())}
          className="rounded-md bg-gray-200 px-3 py-2 hover:bg-gray-300 cursor-pointer"
          title="Today"
        >
          Today
        </button>
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-md bg-gray-900 px-3 py-2 text-white hover:bg-black cursor-pointer"
        >
          Clear
        </button>
      </div>
    </section>

      {/* Contenido */}
      {noMatch ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="rounded-full bg-gray-100 p-6 mb-4">
            <span className="text-3xl">🔎</span>
          </div>
          <h3 className="text-2xl font-bold">No matching diagnoses</h3>
          <p className="mt-2 max-w-md text-gray-600">
            Try adjusting your search or date filter.
          </p>
          <button
            onClick={clearFilters}
            className="mt-6 inline-block rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-black cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {display.map((d) => (
            <DiagnosisCard
              key={d._id}
              diagnosis={d}
              patientId={patientId}
              onDeleted={handleDelete}
              isDeleting={del.isPending && deletingId === d._id}
            />
          ))}
        </div>
      )}
    </main>
  );
}
