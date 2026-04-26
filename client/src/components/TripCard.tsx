import { Link } from "wouter";
import { Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TripCardProps {
  id: number;
  name: string;
  destination: string;
  startDate: string | Date;
  endDate: string | Date;
  role: string;
}

export function TripCard({ id, name, destination, startDate, endDate, role }: TripCardProps) {
  // Simple random gradient based on ID to make cards look distinct
  const gradients = [
    "from-blue-500 to-cyan-400",
    "from-purple-500 to-pink-500",
    "from-orange-400 to-red-500",
    "from-emerald-400 to-teal-500",
  ];
  const gradient = gradients[id % gradients.length];

  return (
    <Link href={`/trips/${id}`} className="block h-full group">
      <Card className="h-full flex flex-col overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 bg-card">
        <div className={`h-32 w-full bg-gradient-to-r ${gradient} relative`}>
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
          <Badge className="absolute top-4 right-4 bg-white/90 text-black hover:bg-white shadow-sm backdrop-blur-sm">
            {role}
          </Badge>
        </div>
        
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-display line-clamp-1 group-hover:text-primary transition-colors">
            {name}
          </CardTitle>
          <div className="flex items-center text-muted-foreground text-sm gap-1">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{destination}</span>
          </div>
        </CardHeader>

        <CardContent className="flex-grow">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-lg">
            <Calendar className="w-4 h-4 text-primary" />
            <span>
              {format(new Date(startDate), "MMM d")} - {format(new Date(endDate), "MMM d, yyyy")}
            </span>
          </div>
        </CardContent>

        <CardFooter className="pt-0 text-xs text-muted-foreground flex justify-between items-center border-t p-4 bg-muted/10">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            Collaborative
          </span>
          <span className="font-medium text-primary group-hover:underline">View Itinerary →</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
