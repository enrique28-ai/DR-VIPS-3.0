import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCreatePatient } from "../../features/patients/phooks.js";
import Input from "../../components/forms/Input.jsx";
import Button from "../../components/forms/Button.jsx";

export default function PatientCreatePage() {
  const navigate = useNavigate();
  const createPatient = useCreatePatient();

  const [form, setForm] = useState({
    fullname: "", email: "", phone: "", age: "", diseases: "", bloodtype: "O+",
  });

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    const diseasesArr = form.diseases.split(",").map(s=>s.trim()).filter(Boolean);
    createPatient.mutate(
      {
        fullname: form.fullname.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        age: Number(form.age),
        diseases: diseasesArr,
        bloodtype: form.bloodtype,
      },
      { onSuccess: () => navigate("/patients") }
    );
  };

  return (
    <main className="mx-auto max-w-2xl p-4">
      <div className="mb-4">
        <Link to="/patients" className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100">
          Back to Patients
        </Link>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">Create Patient</h1>

        <form onSubmit={onSubmit} className="space-y-4" aria-busy={createPatient.isPending}>
          <Input label="Full name" name="fullname" value={form.fullname} onChange={onChange} required placeholder="John Doe" />
          <Input label="Email" type="email" name="email" value={form.email} onChange={onChange} required placeholder="john@example.com" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone" name="phone" value={form.phone} onChange={onChange} placeholder="5551234567" />
            <Input label="Age" type="number" min={0} name="age" value={form.age} onChange={onChange} required placeholder="45" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Blood type</label>
            <select
              name="bloodtype"
              value={form.bloodtype}
              onChange={onChange}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              disabled={createPatient.isPending}
            >
              {["O+","O-","A+","A-","B+","B-","AB+","AB-"].map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <Input
            label="Diseases (comma-separated)"
            name="diseases"
            value={form.diseases}
            onChange={onChange}
            placeholder="Hypertension, Diabetes"
          />

          <div className="flex justify-end">
            <Button type="submit" loading={createPatient.isPending}>Create</Button>
          </div>
        </form>
      </section>
    </main>
  );
}
