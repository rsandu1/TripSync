import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useInviteMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ tripId, email, role }: { tripId: number, email: string, role: "editor" | "viewer" }) => {
      const url = buildUrl(api.members.invite.path, { id: tripId });
      const res = await fetch(url, {
        method: api.members.invite.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to invite member");
      }
      return api.members.invite.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.trips.get.path, variables.tripId] });
      toast({ title: "Invited", description: `${variables.email} has been invited.` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
