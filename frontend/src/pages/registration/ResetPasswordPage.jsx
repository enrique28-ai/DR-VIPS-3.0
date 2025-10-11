import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Lock } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../stores/authStore.js";
import AuthShell from "../../components/forms/AuthShell.jsx";
import Input from "../../components/forms/Input.jsx";
import Button from "../../components/forms/Button.jsx";
import { isStrongPassword } from "../../lib/password.js";
import PasswordStrengthMeter from "../../components/forms/PasswordStrengthMeter.jsx";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { resetPassword, isLoading } = useAuthStore();
  const { token } = useParams();
  const strong = isStrongPassword(password);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStrongPassword(password)) {
  toast.error("Password must meet all requirements.");
  return;
}
    if (password !== confirm) return toast.error("Passwords do not match");
    try {
      await resetPassword(token, password);
      navigate("/login");
    } catch {}
  };

  return (
    <AuthShell title="Reset password">
      <form onSubmit={handleSubmit}>
        <Input
          label="New password"
          icon={Lock}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          label="Confirm new password"
          icon={Lock}
          type="password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      <div className="mt-2 mb-5">
        <PasswordStrengthMeter password={password} />
      </div>

        <Button type="submit" loading={isLoading} disabled={!strong || isLoading}>
          Set new password
        </Button>
      </form>
    </AuthShell>
  );
}
