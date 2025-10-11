import { useState } from "react";
import { Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore.js";
import AuthShell from "../../components/forms/AuthShell.jsx";
import Input from "../../components/forms/Input.jsx";
import Button from "../../components/forms/Button.jsx";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { isLoading, forgotPassword } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await forgotPassword(email);
    setSent(true);
  };

  return (
    <AuthShell title="Forgot password">
      {!sent ? (
        <form onSubmit={handleSubmit}>
          <p className="text-gray-600 mb-6 text-center">
            Enter your email address and we'll send you a reset link.
          </p>

          <Input
            label="Email"
            icon={Mail}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button type="submit" className="cursor-pointer" loading={isLoading}>Send reset link</Button>

          <p className="mt-4 text-center text-sm text-gray-600">
            Remembered it?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">Back to login</Link>
          </p>
        </form>
      ) : (
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
            <Mail className="text-white" />
          </div>
          <p className="text-gray-700">
            If an account exists for <span className="font-medium">{email}</span>, you’ll receive a reset link shortly.
          </p>
          <p className="mt-4 text-sm text-gray-600">
            Didn’t get it?{" "}
            <button
              onClick={() => forgotPassword(email)}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              Resend email
            </button>
          </p>
        </div>
      )}
    </AuthShell>
  );
}
