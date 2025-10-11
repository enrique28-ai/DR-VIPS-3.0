import { Link } from "react-router-dom";

export default function EmptyPatients() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-gray-100 p-6 mb-4">
        <span className="text-3xl">🩺</span>
      </div>
      <h3 className="text-2xl font-bold">No patients yet</h3>
      <p className="mt-2 max-w-md text-gray-600">
        Start by creating your first patient to manage records and diagnoses.
      </p>
      <Link
        to="/patients/new"
        className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Add patient
      </Link>
    </div>
  );
}
