import { useState, useEffect, useRef } from "react";
import { User, Mail, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore.js";
import AuthShell from "../../components/forms/AuthShell.jsx";
import Input from "../../components/forms/Input.jsx";
import PasswordStrengthMeter from "../../components/forms/PasswordStrengthMeter.jsx";
import { toast } from "react-hot-toast";
import Button from "../../components/forms/Button.jsx";
import { isStrongPassword } from "../../lib/password.js";
import ReCAPTCHA from "react-google-recaptcha";

const GoogleIcon = (props) => (
  <svg viewBox="0 0 533.5 544.3" aria-hidden="true" {...props}>
    <path fill="#4285F4" d="M533.5 278.4c0-18.5-1.6-37-5-54.9H272.1v104h147c-6.1 33-25 60.8-53.2 79.4l86.1 66.8c50.2-46.3 81.5-114.6 81.5-195.3z"/>
    <path fill="#34A853" d="M272.1 544.3c72.7 0 133.8-24 178.4-65.3l-86.1-66.8c-23.9 16.1-54.6 25.5-92.3 25.5-70.8 0-130.8-47.7-152.4-111.9l-90 69.6c41 81.9 125.2 148.9 242.4 148.9z"/>
    <path fill="#FBBC05" d="M119.7 325.8c-10.1-30-10.1-62.4 0-92.4l-90-69.6C6.3 204.1 0 236.7 0 272.2s6.3 68.1 29.7 108.4l90-54.8z"/>
    <path fill="#EA4335" d="M272.1 107.7c39.5-.6 77.2 15.1 105.8 42.9l79.1-79.1C408.4 23.2 343.6 0 272.1 0 154.9 0 70.7 67 29.7 148.9l90 69.6c21.6-64.2 81.6-110.8 152.4-110.8z"/>
  </svg>
);



export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signup, isLoading, googleStart } = useAuthStore();
  const strong = isStrongPassword(password);
  const navigate = useNavigate();
  const RECAPTCHA_SITE_KEY = "6LeuCt4rAAAAAMmxLbdnWGKp8XpfVJRMWSdjU4k_"; // pega aquí la site key
  const recaptchaRef = useRef(null);
  const [captcha, setCaptcha] = useState("");


  useEffect(() => {
  // Evita que el navegador restaure el scroll cuando vuelves con la flecha (bfcache)
  const prev = window.history.scrollRestoration;
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }

  const toTop = () => {
    // reflow -> sube; así el card vuelve a quedar centrado
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
  };

  // al entrar a la pantalla
  toTop();

  // si regresas desde Google con la flecha (bfcache)
  const onShow = (e) => { if (e.persisted) toTop(); };
  window.addEventListener("pageshow", onShow);

  // si el tab vuelve a estar visible
  const onVisible = () => { if (document.visibilityState === "visible") toTop(); };
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    window.removeEventListener("pageshow", onShow);
    document.removeEventListener("visibilitychange", onVisible);
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = prev;
    }
  };
}, []);
 

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!strong) return toast.error("Password must meet all requirements.");
    if (!captcha) return toast.error("Please complete the reCAPTCHA.");
    try {
      await signup(name, email, password, captcha)
      navigate("/verify-email");
    } catch {
      try { recaptchaRef.current?.reset(); setCaptcha(""); } catch {}
    }
  };

  return (
    <AuthShell title="Create account">
      <form onSubmit={handleSignUp}>
        <Input label="Username" icon={User} type="text" placeholder="yourname"
               value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Email" icon={Mail} type="email" placeholder="you@example.com"
               value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Password" icon={Lock} type="password" placeholder="••••••••"
               value={password} onChange={(e) => setPassword(e.target.value)} required />

        <p className="text-xs text-gray-500 -mt-3 mb-2">Minimum 6 characters.</p>
        <PasswordStrengthMeter password={password} />

        <div className="mt-3 flex justify-center">
          <div className="inline-block">
         <ReCAPTCHA
           ref={recaptchaRef}
           sitekey={RECAPTCHA_SITE_KEY}
           onChange={(token) => setCaptcha(token || "")}
         />
          </div>
       </div>

        <Button className="mt-4 cursor-pointer" type="submit" loading={isLoading} disabled={!strong || !captcha || isLoading}>Register</Button>

      {/* —— OR —— */}
        <div className="my-4 flex items-center gap-3">
          <span className="h-px w-full bg-gray-200" />
          <span className="text-xs uppercase tracking-widest text-gray-500">or</span>
          <span className="h-px w-full bg-gray-200" />
        </div>

        {/* Google button estilo ejemplo */}
        <button
          type="button"
          onClick={async () => {
            if (!captcha) { toast.error("Complete the reCAPTCHA."); return; }
            await useAuthStore.getState().googleStartWithToken(captcha);
          }}
          aria-label="Sign up with Google"
          className="cursor-pointer w-full inline-flex items-center justify-center gap-3 rounded-md border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
        >
          <GoogleIcon className="h-5 w-5" />
          <span>Sign up with Google</span>
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">Log in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
