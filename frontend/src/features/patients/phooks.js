import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios.js";
import { toast } from "react-hot-toast";

// Build a stable params object (omit "All"/empty so cache keys are clean)
export const buildPatientParams = ({ q = "", category = "All", bloodtype = "All", page = 1 }) => ({
  q: q?.trim() || undefined,
  category: category !== "All" ? category : undefined,
  bloodtype: bloodtype !== "All" ? bloodtype : undefined,
  page,
});

// Query: list
export function usePatients(params) {
  return useQuery({
    queryKey: ["patients", params],
    queryFn: async () => (await api.get("/patients", { params })).data, // { items,total,page,pages }
    keepPreviousData: true,
    placeholderData: (prev) => prev,         // conserva la data anterior mientras llega la nueva
    notifyOnChangeProps: ["data", "isFetching"],
    onError: () => toast.error("Failed to load patients"),
  });
}

// Query: one
export function usePatient(id) {
  return useQuery({
    queryKey: ["patient", id],
    queryFn: async () => (await api.get(`/patients/${id}`)).data,
    enabled: !!id,
    retry: false,
    onError: (e) => {
      const status = e?.response?.status;
      if (status !== 404) toast.error("Failed to load patient");
    },
  });
}

// Mutations
export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post("/patients", payload).then(r => r.data),
    onSuccess: (created) => {
      toast.success("Patient created");
     // opcional: cachea el detalle
     qc.setQueryData(["patient", created._id], created);

     // siembra el nuevo paciente en las listas relevantes (sin filtros, page 1)
     const snaps = qc.getQueriesData({ queryKey: ["patients"] });
     snaps.forEach(([key, data]) => {
       const params = key?.[1] || {};
       const isDefault =
         !params.q && !params.category && !params.bloodtype && (params.page ?? 1) === 1;
       if (!isDefault) return;

       const prevItems = data?.items ?? [];
       if (prevItems.some(p => p._id === created._id)) return;
       const next = { ...(data || {}), items: [created, ...prevItems] };
       qc.setQueryData(key, next);
     });

     // revalida en background (suave, sin parpadeo)
     setTimeout(() => {
       qc.invalidateQueries({ queryKey: ["patients"] });
     }, 100);
   },
   onError: () => toast.error("Failed to create patient"),
  });
}

export function useUpdatePatient(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.put(`/patients/${id}`, payload).then(r => r.data),
    onSuccess: () => {
      toast.success("Patient updated");
      qc.invalidateQueries({ queryKey: ["patient", id] });
      qc.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: () => toast.error("Failed to update patient"),
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/patients/${id}`), // 204
    // optimistic remove from any cached list
    onMutate: async (id) => {
      const snaps = qc.getQueriesData({ queryKey: ["patients"] });
      const rollbacks = snaps.map(([key, data]) => {
        if (!data?.items) return () => {};
        const prev = data;
        const next = { ...data, items: data.items.filter(x => x._id !== id) };
        qc.setQueryData(key, next);
        return () => qc.setQueryData(key, prev);
      });
      return () => rollbacks.forEach(rb => rb());
    },
    onError: (_e, _id, rollback) =>{
      rollback?.();
      toast.error("Failed to delete patient");
    },
    onSuccess: (_res, id) => {
      toast.success("Patient deleted");
     // limpia el detalle si estaba en caché; la lista ya quedó sin el item (optimista)
     qc.removeQueries({ queryKey: ["patient", id] });
     // ✅ Revalida listas para confirmar con el servidor
     qc.invalidateQueries({ queryKey: ["patients"] });
     //setTimeout(() => qc.invalidateQueries({ queryKey: ["patients"] }), 300);
   },
  });
}
