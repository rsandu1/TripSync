import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useComments(tripId: number) {
  return useQuery({
    queryKey: [api.comments.list.path, tripId],
    queryFn: async () => {
      const url = buildUrl(api.comments.list.path, { id: tripId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch comments");
      return api.comments.list.responses[200].parse(await res.json());
    },
    enabled: !isNaN(tripId),
    refetchInterval: 5000, // Poll every 5s for chat-like experience
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ tripId, content }: { tripId: number, content: string }) => {
      const url = buildUrl(api.comments.create.path, { id: tripId });
      const res = await fetch(url, {
        method: api.comments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to post comment");
      }
      return api.comments.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.comments.list.path, variables.tripId] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Could not post comment", variant: "destructive" });
    },
  });
}
