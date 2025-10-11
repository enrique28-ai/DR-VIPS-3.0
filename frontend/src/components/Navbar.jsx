// src/components/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Stethoscope } from "lucide-react";        // 👈 ícono
import { useAuthStore } from "../stores/authStore.js";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isCheckingAuth, logout } = useAuthStore();

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const initial = (user?.name?.[0] || user?.email?.[0] || "U").toUpperCase();
   const firstName =
    (user?.name || user?.email || "User").split(/[ @]/)[0];
  const avatar = user?.avatar || "";

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg
                       bg-blue-600 text-white shadow-sm"
            aria-label="DR-VIPS Home"
          >
            <Stethoscope className="h-5 w-5" />    {/* 👈 estetoscopio */}
          </span>
          <span className="text-lg font-semibold tracking-tight text-gray-900">
            DR-VIPS
          </span>
        </Link>

        {/* Right side */}
        {isCheckingAuth ? (
          // placeholder para evitar parpadeo
          <div className="h-9 w-[160px] rounded-full bg-gray-100 animate-pulse" />
        ) : !isAuthenticated ? (
          
          <div className="flex items-center gap-3">
            <Link
              to="/eligibility"
              className="hidden sm:inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Who can access?
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 rounded-full border border-gray-300 text-gray-800 hover:bg-gray-100"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
            >
              Register
            </Link>
          </div>
        ) : (
          <div className="relative flex items-center gap-3" ref={menuRef}>
            {user?.isVerified && (
              <span className="hidden sm:block text-sm text-gray-700">
                Hi, <span className="font-semibold">{firstName}</span>
              </span>
            )}
            <button
              onClick={() => setOpen((v) => !v)}
              className="h-9 w-9 rounded-full overflow-hidden border border-gray-300 bg-white flex items-center justify-center"
              aria-haspopup="menu"
              aria-expanded={open}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="avatar"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-sm font-semibold text-gray-900">{initial}</span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-44 rounded-md border border-gray-200 bg-white shadow-lg py-1" role="menu">
                {!user?.isVerified && (
                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate("/verify-email");
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Verify email
                  </button>
                )}

                {user?.isVerified && (
                  <>
                    <Link
                      to="/patients"
                      onClick={() => setOpen(false)}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Patients
                    </Link>
                    
                    <Link
                      to="/profile"
                      onClick={() => setOpen(false)}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Profile
                    </Link>
                  </>
                )}

                <button
                  onClick={async () => {
                    setOpen(false);
                    await logout();
                    navigate("/login", { replace: true });
                  }}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
