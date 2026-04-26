import { useAuth } from "@/hooks/use-auth";
import { useTrips } from "@/hooks/use-trips";
import { TripCard } from "@/components/TripCard";
import { CreateTripDialog } from "@/components/CreateTripDialog";
import { Navigation } from "@/components/Navigation";
import { Loader2, Plus } from "lucide-react";

export default function Dashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: trips, isLoading: isTripsLoading } = useTrips();

  if (isAuthLoading || isTripsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Auth redirect handled by App.tsx router protection generally, but safe to check
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Your Trips</h1>
            <p className="text-muted-foreground mt-1">Manage your upcoming adventures and past journeys.</p>
          </div>
          <CreateTripDialog />
        </div>

        {trips && trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div key={trip.id} className="animate-enter" style={{ animationDelay: `${trip.id * 50}ms` }}>
                <TripCard {...trip} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No trips yet</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              You haven't planned any trips yet. Create your first itinerary to get started!
            </p>
            <CreateTripDialog />
          </div>
        )}
      </main>
    </div>
  );
}
