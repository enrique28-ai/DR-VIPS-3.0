import { Check, X } from "lucide-react";
import { getScore, passwordRules } from "../../lib/password.js";


const labelFor = (score) =>
  ["Very weak", "Weak", "Fair", "Good", "Strong"][Math.min(score, 4)];


export default function PasswordStrengthMeter({ password = "" }) {
  const score = getScore(password);
  const rules = passwordRules(password);
  return (
    <div className="mt-2">
      {/* Header */}
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-gray-500">Password strength</span>
        <span className="text-xs text-gray-600">{labelFor(score)}</span>
      </div>

      {/* Barras de fuerza (azules/grises) */}
      <div className="flex gap-1 mb-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 w-1/4 rounded-full ${
              i < score ? "bg-blue-600" : "bg-gray-300"
            }`}
          />
        ))}
      </div>

      {/* Criterios (texto gris, check azul) */}
      <ul className="space-y-1">
        {[
          { key: "minLen",     label: "At least 6 characters" },
          { key: "hasCase",    label: "Uppercase & lowercase" },
          { key: "hasNumber",  label: "At least one number" },
          { key: "hasSpecial", label: "Special character" },
        ].map(({ key, label }) => {
          const ok = !!rules[key];
          return (
            <li key={key} className="flex items-center text-xs">
              {ok ? (
                <Check className="h-4 w-4 text-blue-600 mr-2" />
              ) : (
                <X className="h-4 w-4 text-gray-400 mr-2" />
              )}
              <span className={ok ? "text-gray-700" : "text-gray-500"}>{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
