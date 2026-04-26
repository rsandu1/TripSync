import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Calendar, Globe, Map, Share2 } from "lucide-react";
import { Redirect, useLocation } from "wouter";

export default function Landing() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return null;
  if (user) return <Redirect to="/dashboard" />;

  const handleLogin = () => {
    setLocation("/auth");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/20">
      {/* Navbar */}
      <header className="px-6 h-20 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <Map className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">TripSync</span>
        </div>
        <Button onClick={handleLogin} variant="outline" className="font-semibold rounded-full px-6">
          Sign In
        </Button>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-12 pb-24 lg:pt-32 lg:pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-8 animate-enter">
              <h1 className="font-display font-extrabold text-5xl lg:text-7xl leading-[1.1] tracking-tight text-foreground">
                Plan trips <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  together.
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                The collaborative itinerary planner that keeps everyone on the same page. 
                Flights, hotels, and adventures—all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleLogin} 
                  size="lg" 
                  className="rounded-full text-lg h-14 px-8 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-1"
                >
                  Start Planning
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
              <div className="pt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-gray-200" />
                  ))}
                </div>
                <p>Join a growing community of travelers</p>
              </div>
            </div>

            <div className="relative lg:h-[600px] hidden lg:block">
              {/* Abstract decorative elements */}
              <div className="absolute top-0 right-0 w-3/4 h-3/4 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-10 w-2/3 h-2/3 bg-secondary/10 rounded-full blur-3xl" />
              
              {/* Floating Cards UI Mockup */}
              <div className="relative z-10 p-4">
                {/* Hero Image - Scenic */}
                <div className="absolute top-10 right-10 w-80 h-96 rounded-2xl overflow-hidden shadow-2xl rotate-3 border-4 border-white transition-transform hover:rotate-0 hover:scale-105 duration-500">
                  {/* Unsplash image: Scenic Amalfi Coast */}
                  <img 
                    src="https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=600&auto=format&fit=crop" 
                    alt="Travel destination" 
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Itinerary Card */}
                <div className="absolute bottom-20 left-10 bg-white/90 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/50 w-80 -rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Summer in Italy</h3>
                      <p className="text-xs text-slate-500">Aug 15 - Aug 25</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Colosseum Tour
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      Dinner at Roscioli
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background p-8 rounded-2xl shadow-sm border hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl mb-3">Centralized Itinerary</h3>
                <p className="text-muted-foreground">Keep all your flights, bookings, and activity ideas in one organized timeline.</p>
              </div>
              <div className="bg-background p-8 rounded-2xl shadow-sm border hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6">
                  <Share2 className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl mb-3">Real-time Collab</h3>
                <p className="text-muted-foreground">Invite friends to edit together. See changes instantly as you plan your dream trip.</p>
              </div>
              <div className="bg-background p-8 rounded-2xl shadow-sm border hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                  <Map className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl mb-3">Share &amp; Message</h3>
                <p className="text-muted-foreground">Chat with your travel group, share photos and videos, and keep everyone in the loop — all inside your trip.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t text-center text-sm text-muted-foreground">
        <p>TripSync</p>
      </footer>
    </div>
  );
}
