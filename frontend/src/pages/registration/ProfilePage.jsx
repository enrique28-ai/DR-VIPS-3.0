// src/pages/ProfilePage.jsx
// src/pages/ProfilePage.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore.js";
import Input from "../../components/forms/Input.jsx";
import Button from "../../components/forms/Button.jsx";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, updateProfile, deleteMe, uploadAvatar,  importAvatarByUrl, isLoading } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [confirmText, setConfirmText] = useState("");
  const [pendingFile, setPendingFile] = useState(null);     // ⬅️ archivo en espera
  const [pendingRemove, setPendingRemove] = useState(false); // ⬅️ remove en espera
  const [useUrl, setUseUrl] = useState(false); // ⬅️ nuevo: modo URL
  const [isDeleting, setIsDeleting] = useState(false);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();
  const fileRef = useRef(null);


   // preview local para archivo pendiente
  useEffect(() => {
    if (!pendingFile) { setPreview(null); return; }
  const url = URL.createObjectURL(pendingFile);
  setPreview(url);
  return () => URL.revokeObjectURL(url);
}, [pendingFile]);


  if (!user) return null;


  // Resolver URL del avatar sin env:
  const resolveAvatar = (u) => {
    if (preview) return preview;  
    if (!u) return "/default-avatar.png";
    if (/^https?:\/\//i.test(u)) return u;                // ya es absoluta
    if (u.startsWith("/uploads/")) return `${window.location.origin}${u}`; // mismo host
    return u; // por si mandas otra ruta absoluta o data URL
  };

  const onSave = async (e) => {
    e.preventDefault();
    try {
       if (pendingFile) {
        await uploadAvatar(pendingFile);           // sube archivo
        setPendingFile(null);
      } else if (useUrl && avatar) {
        await importAvatarByUrl(avatar);           // importa por URL
      } else if (pendingRemove) {
        await updateProfile({ avatar: "" });       // elimina avatar
        setPendingRemove(false);
      }
      // actualiza nombre (si cambió)
      if (name !== user.name) {
        await updateProfile({ name });
      }
      navigate("/", { replace: true }); // ➜ Home con sesión activa
    } catch {}
  };

  const onDelete = async () => {
    if (confirmText !== "DELETE") {
      toast.error('Type "DELETE" to confirm');
      return;
    }
    setIsDeleting(true);
    try {
      await deleteMe();
      navigate("/login", { replace: true }); // ➜ Login (cuenta ya eliminada)
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-4">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">Profile</h1>

        <form onSubmit={onSave} className="space-y-4" aria-busy={isLoading}>
          <Input label="Email (read-only)" value={user.email} disabled />
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
         <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Profile photo</label>
            <div className="flex items-center gap-4">
              <img
                src={resolveAvatar(avatar)}
                alt="avatar preview"
                className="h-16 w-16 rounded-full object-cover ring-1 ring-gray-200"
              />
              <div className="flex gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) return toast.error("Max 2MB");
                    setUseUrl(false);
                    setPendingRemove(false);
                    setPendingFile(file);           // ⬅️ solo guardar en estado
                  }}
                />

                {!useUrl && (
                  <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
                    Change photo
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setUseUrl((v) => !v)}
                >
                  {useUrl ? "Use file" : "Use link"}
                </Button>

                {avatar && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setPendingFile(null);
                      setPreview(null);
                      setAvatar("");
                      setPendingRemove(true);       // ⬅️ marcar remove y esperar Save
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>

            {useUrl && (
              <div className="mt-3">
                <Input
                  label="Avatar URL"
                  placeholder="https://..."
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                />
              </div>
            )}

          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={isLoading}>
              Save
            </Button>
          </div>
        </form>
      </section>

      <section className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-600">Danger zone</h2>
        <p className="mt-1 text-sm text-gray-700">
          Deleting your account will permanently remove your profile, all your patients, and all diagnoses.
        </p>
        <div className="mt-3">
          <Input
            placeholder='Type "DELETE" to confirm'
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </div>
        <Button
          className="mt-2"
          onClick={onDelete}
          loading={isDeleting}
          disabled={isDeleting}
          variant="danger"
        >
          Delete my account
        </Button>
      </section>
    </main>
  );
}
