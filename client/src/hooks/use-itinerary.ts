import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateItineraryItemRequest, type UpdateItineraryItemRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useItineraryItems(tripId: number) {
  return useQuery({
    queryKey: [api.itinerary.list.path, tripId],
    queryFn: async () => {
      const url = buildUrl(api.itinerary.list.path, { id: tripId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch itinerary");
      return api.itinerary.list.responses[200].parse(await res.json());
    },
    enabled: !isNaN(tripId),
  });
}

export function useCreateItineraryItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ tripId, ...data }: { tripId: number } & CreateItineraryItemRequest) => {
      const url = buildUrl(api.itinerary.create.path, { id: tripId });
      const res = await fetch(url, {
        method: api.itinerary.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add item");
      }
      return api.itinerary.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.itinerary.list.path, variables.tripId] });
      toast({ title: "Added", description: "Itinerary item added successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteItineraryItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ tripId, itemId }: { tripId: number, itemId: number }) => {
      const url = buildUrl(api.itinerary.delete.path, { tripId, itemId });
      const res = await fetch(url, {
        method: api.itinerary.delete.method,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to delete item");
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.itinerary.list.path, variables.tripId] });
      toast({ title: "Deleted", description: "Item removed from itinerary." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
