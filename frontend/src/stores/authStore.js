// src/stores/authStore.js
import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";
import { queryClient } from "../lib/queryClient";
import { persist, createJSONStorage } from "zustand/middleware";


const API = import.meta.env.MODE === "development" ? "http://localhost:5001/api/auth" : "/api/auth";
axios.defaults.withCredentials = true;

const extract = (err, fallback) =>
  err?.response?.data?.error || err?.message || fallback;

export const useAuthStore = create(persist((set) => ({
  user: null,
  isAuthenticated: false,
  isCheckingAuth: true,
  isLoading: false,
  // puedes eliminar 'error' si ya no lo usas en el UI
  error: null,

  checkAuth: async () => {
    set({ isCheckingAuth: true, error: null });
    try {
      const { data } = await axios.get(`${API}/me`);
      set({ user: data.user, isAuthenticated: true, isCheckingAuth: false });
    } catch {
      set({ user: null, isAuthenticated: false, isCheckingAuth: false });
    }
  },

  login: async (email, password, recaptchaToken) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(`${API}/login`, { email, password, recaptchaToken });
      const { data } = await axios.get(`${API}/me`);
      queryClient.clear();         
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      toast.success("Welcome back");
      return data.user;
    } catch (err) {
      set({ isLoading: false, error: null });
      if (err?.response?.status === 403) {
       toast.error("Access restricted to healthcare domains/emails.");
       window.location.href = "/eligibility?need=domain";
     } else {
       toast.error(extract(err, "Login failed"));
     }
      throw err;
    }
  },

  signup: async (name, email, password, recaptchaToken) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(`${API}/register`, { name, email, password, recaptchaToken });
      const { data } = await axios.get(`${API}/me`);
      queryClient.clear();         
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      toast.success("Account created. Check your email");
      return data.user;
    } catch (err) {
      set({ isLoading: false, error: null });
      if (err?.response?.status === 403) {
       toast.error("Access restricted to healthcare domains/emails.");
       window.location.href = "/eligibility?need=domain";
     } else if (err?.response?.status === 409) {
       toast.error("User already exists");
     } else {
       toast.error(extract(err, "Signup failed"));
     }
      throw err;
    }
  },

  logout: async () => {
    try { await axios.post(`${API}/logout`); } catch {}
    queryClient.clear();         
    set({ user: null, isAuthenticated: false });
    toast.success("Logged out");
  },

  verifyEmail: async (code) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(`${API}/verify-email`, { code });
      const { data } = await axios.get(`${API}/me`);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      toast.success("Email verified");
      return true;
    } catch (err) {
      set({ isLoading: false, error: null });
      toast.error(extract(err, "Verification failed"));
      throw err;
    }
  },

  resendCode: async () => {
    try {
      await axios.post(`${API}/resend-code`);
      toast.success("Verification code resent");
      return true;
    } catch (err) {
      toast.error(extract(err, "Could not resend code"));
      throw err;
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axios.post(`${API}/forgot-password`, { email });
      set({ isLoading: false });
      toast.success("If the email exists, we sent a reset link");
      return data;
    } catch (err) {
      set({ isLoading: false, error: null });
      toast.error(extract(err, "Error sending email"));
      throw err;
    }
  },

  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axios.post(`${API}/reset-password/${token}`, { password });
      set({ isLoading: false });
      toast.success("Password updated");
      return data;
    } catch (err) {
      set({ isLoading: false, error: null });
      toast.error(extract(err, "Reset failed"));
      throw err;
    }
  },
  // Nueva: valida captcha -> deja cookie -> redirige a Google
  googleStartWithToken: async (recaptchaToken) => {
    await axios.post(`${API}/google/recaptcha`, { recaptchaToken });
    window.location.href = `${API}/google/init`;
  },
   updateProfile: async (payload) => {
    try {
      const { data } = await axios.put(`${API}/profile`, payload);
      // Actualiza el store con lo devuelto por el backend
      set({ user: data.user });
      toast.success("Profile updated");
      return data.user;
    } catch (err) {
      toast.error(err?.response?.data?.error || "Update failed");
      throw err;
    }
  },

  deleteMe: async () => {
    try {
      await axios.delete(`${API}/me`);
      // Limpia estado local
      set({ user: null, isAuthenticated: false });
      toast.success("Account deleted");
      // Opcional: navigate home
      window.location.href = "/login";
    } catch (err) {
      toast.error(err?.response?.data?.error || "Delete failed");
      throw err;
    }
  },

  uploadAvatar: async (file) => {
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      const { data } = await axios.put(`${API}/profile/avatar`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set({ user: data.user });
      toast.success("Photo updated");
      return data.user;
    } catch (err) {
      toast.error(err?.response?.data?.error || "Upload failed");
      throw err;
    }
  },

  importAvatarByUrl: async (url) => {
    try {
      const { data } = await axios.post(`${API}/profile/avatar-url`, { url });
      set({ user: data.user });
      toast.success("Photo updated");
      return data.user;
    } catch (err) {
      toast.error(err?.response?.data?.error || "Import failed");
      throw err;
    }
  }
}),

{
  name: "drvips-auth",
  storage: createJSONStorage(() => localStorage),
  // guarda solo lo que importa para hidratar rápido
  partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
}
));
