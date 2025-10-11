import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { usePatient, useUpdatePatient } from "../../features/patients/phooks.js";
import Input from "../../components/forms/Input.jsx";
import Button from "../../components/forms/Button.jsx";

export default function PatientEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: patient, isLoading, isError } = usePatient(id);
  const updatePatient = useUpdatePatient(id);

  const [form, setForm] = useState({
    fullname: "", email: "", phone: "", age: "", diseases: "", bloodtype: "O+",
  });

  useEffect(() => {
    if (!patient) return;
    setForm({
      fullname: patient.fullname || "",
      email: patient.email || "",
      phone: patient.phone || "",
      age: patient.age ?? "",
      diseases: Array.isArray(patient.diseases) ? patient.diseases.join(", ") : "",
      bloodtype: patient.bloodtype || "O+",
    });
  }, [patient]);

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else if (location.state?.from === "detail") navigate(`/patients/${id}`);
    else navigate("/patients");
  };

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    const diseasesArr = form.diseases.split(",").map(s=>s.trim()).filter(Boolean);
    updatePatient.mutate(
      {
        fullname: form.fullname.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        age: Number(form.age),
        diseases: diseasesArr,
        bloodtype: form.bloodtype,
      },
      {
        onSuccess: () => {
          if (location.state?.from === "detail") navigate(`/patients/${id}`, { replace: true });
          else navigate("/patients", { replace: true });
        },
      }
    );
  };

  if (isLoading) return null; // si prefieres, muestra un spinner aquí
  if (isError || !patient) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Patient not found</h1>
          <div className="mt-4">
            <Button full={false} variant="secondary" onClick={() => navigate("/patients")}>
              Back to patients
            </Button>
          </div>
        </div>
      </main>
    );
  }

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
        <h1 className="text-2xl font-semibold mb-4">Edit Patient</h1>

        <form onSubmit={onSubmit} className="space-y-4" aria-busy={updatePatient.isPending}>
          <Input label="Full name" name="fullname" value={form.fullname} onChange={onChange} required />
          <Input label="Email" type="email" name="email" value={form.email} onChange={onChange} required />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone" name="phone" value={form.phone} onChange={onChange} />
            <Input label="Age" type="number" min={0} name="age" value={form.age} onChange={onChange} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Blood type</label>
            <select
              name="bloodtype"
              value={form.bloodtype}
              onChange={onChange}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {["O+","O-","A+","A-","B+","B-","AB+","AB-"].map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <Input label="Diseases (comma-separated)" name="diseases" value={form.diseases} onChange={onChange} />

          <div className="flex flex-wrap gap-3 justify-end">
            <Button variant="secondary" type="button" onClick={handleBack}>Cancel</Button>
            <Button type="submit" loading={updatePatient.isPending}>
              {updatePatient.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
