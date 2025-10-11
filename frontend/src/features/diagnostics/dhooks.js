import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios.js";
import { toast } from "react-hot-toast";

// === READ ONE (detalle) ===
export function useDiagnosis(diagnosisId) {
  return useQuery({
    queryKey: ["diagnosis", diagnosisId],
    queryFn: async () => (await api.get(`/diagnoses/${diagnosisId}`)).data,
    enabled: !!diagnosisId,
    retry: false,
     onError: (e) => {
      if (e?.response?.status !== 404) toast.error("Failed to load diagnosis");
    },
    // no placeholder para evitar mostrar otro detalle por error
  });
}

// === LIST by PATIENT ===
export function useDiagnosesByPatient(patientId) {
  return useQuery({
    queryKey: ["diagnoses", patientId],
    queryFn: async () => {
      const { data } = await api.get(`/diagnoses/patient/${patientId}`);
      const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      return { items };
    },
    enabled: !!patientId,
    keepPreviousData: true,
    placeholderData: (prev) => prev,
    notifyOnChangeProps: ["data", "isFetching", "isLoading"],
    retry: 1,
    onError: () => toast.error("Failed to load diagnoses"),
  });
}

// === CREATE ===
export function useCreateDiagnosis(patientId) {
  const qc = useQueryClient();
  return useMutation({
    // tu backend crea en POST /diagnoses y espera { patient }
    mutationFn: (payload) =>
      api.post(`/diagnoses`, { ...payload, patient: patientId }).then(r => r.data),

    onSuccess: (created) => {
       toast.success("Diagnosis created");
      // 1) Sembramos optimista el nuevo diagnóstico en la lista del paciente
      qc.setQueryData(["diagnoses", patientId], (prev) => {
        if (!prev?.items) return { items: [created] };
        // evita duplicados si el refetch llega muy rápido
        if (prev.items.some(d => d._id === created._id)) return prev;
        return { ...prev, items: [created, ...prev.items] };
      });

      // 2) (Opcional) sincroniza en background
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["diagnoses", patientId] });
        }, 100);
      },
      onError: () => toast.error("Failed to create diagnosis"),
    });
  }

// === UPDATE ===
export function useUpdateDiagnosis(diagnosisId, patientId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.put(`/diagnoses/${diagnosisId}`, payload).then(r => r.data),
    onSuccess: () => {
      toast.success("Diagnosis updated");
      qc.invalidateQueries({ queryKey: ["diagnosis", diagnosisId] });
      qc.invalidateQueries({ queryKey: ["diagnoses", patientId] });
    },
    onError: () => toast.error("Failed to update diagnosis"),
  });
}

// === DELETE (idéntico al patrón de patients) ===
export function useDeleteDiagnosis() {
  const qc = useQueryClient();

  return useMutation({
    // Recibe { id, patientId } desde DiagnosisDetailPage
    mutationFn: async ({ id }) => {
      await api.delete(`/diagnoses/${id}`); // 204
      return id;
    },

    onMutate: async ({ id, patientId }) => {
      // 1) Detén cualquier refetch del detalle y de listas
      await qc.cancelQueries({ queryKey: ["diagnosis", id] });
      await qc.cancelQueries({ queryKey: ["diagnoses"] });

      // 2) Guarda y elimina el detalle del caché (para que no se vuelva a pintar)
      const prevDetail = qc.getQueryData(["diagnosis", id]);
      qc.removeQueries({ queryKey: ["diagnosis", id] });

      // 3) Optimista: quita el diagnóstico de TODAS las listas del mismo patientId
      const rollbacks = [];
      const snaps = qc.getQueriesData({ queryKey: ["diagnoses"] });
      snaps.forEach(([key, data]) => {
        const k1 = key?.[1];
        const keyPid = typeof k1 === "object" && k1 ? k1.patientId : k1;
        if (keyPid !== patientId) return;
        if (!data?.items) return;

        const prev = data;
        const next = { ...data, items: data.items.filter(d => d._id !== id) };
        qc.setQueryData(key, next);
        rollbacks.push(() => qc.setQueryData(key, prev));
      });

      // rollback por si falla la mutación
      return () => {
        if (prevDetail) qc.setQueryData(["diagnosis", id], prevDetail);
        rollbacks.forEach(rb => rb());
      };
    },

    onError: (_e, _vars, rollback) => {
      rollback?.();
      toast.error("Failed to delete diagnosis");
    },

    onSuccess: (_res, { patientId }) => {
      toast.success("Diagnosis deleted");
      // 4) Confirma con el server las listas de ese paciente
      qc.invalidateQueries({ queryKey: ["diagnoses", patientId] });
    },
  });
}
