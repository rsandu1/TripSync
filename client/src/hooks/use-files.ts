import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const FILES_KEY = "/api/trips/files";

export function useTripFiles(tripId: number) {
  return useQuery({
    queryKey: [FILES_KEY, tripId],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/files`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch files");
      return res.json() as Promise<Array<{
        id: number;
        tripId: number;
        userId: string;
        fileName: string;
        mimeType: string;
        fileSize: number;
        createdAt: string | null;
        user: { id: string; firstName: string | null; lastName: string | null; email: string | null };
      }>>;
    },
    enabled: !isNaN(tripId),
  });
}

export function useUploadFile(tripId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/trips/${tripId}/files`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FILES_KEY, tripId] });
      toast({ title: "Uploaded", description: "File added to trip." });
    },
    onError: (err: Error) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteFile(tripId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (fileId: number) => {
      const res = await fetch(`/api/trips/${tripId}/files/${fileId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FILES_KEY, tripId] });
      toast({ title: "Deleted", description: "File removed." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}
