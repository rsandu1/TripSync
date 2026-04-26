import { useRoute } from "wouter";
import { useTrip } from "@/hooks/use-trips";
import { useItineraryItems, useDeleteItineraryItem } from "@/hooks/use-itinerary";
import { useComments, useCreateComment } from "@/hooks/use-comments";
import { useTripFiles, useUploadFile, useDeleteFile } from "@/hooks/use-files";
import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/Navigation";
import { AddItineraryItemDialog } from "@/components/AddItineraryItemDialog";
import { InviteMemberDialog } from "@/components/InviteMemberDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2, MapPin, Calendar as CalendarIcon, Clock, Trash2, MessageCircle,
  Plane, Bed, Utensils, Bus, Image, Upload, X, Play,
} from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type UserLike = { firstName?: string | null; lastName?: string | null; email?: string | null; username?: string | null };

function getUserDisplayName(user: UserLike): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return name || user.email || user.username || "Unknown";
}

function getInitials(user: UserLike): string {
  if (user.firstName && user.lastName) return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  if (user.firstName) return user.firstName.slice(0, 2).toUpperCase();
  if (user.email) return user.email.slice(0, 2).toUpperCase();
  return "?";
}

const ItineraryIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "flight": return <Plane className="w-4 h-4" />;
    case "hotel": return <Bed className="w-4 h-4" />;
    case "dining": return <Utensils className="w-4 h-4" />;
    case "transport": return <Bus className="w-4 h-4" />;
    default: return <MapPin className="w-4 h-4" />;
  }
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TripDetail() {
  const [, params] = useRoute("/trips/:id");
  const tripId = parseInt(params?.id || "0");
  const { user: currentUser } = useAuth();

  const { data: trip, isLoading: isTripLoading } = useTrip(tripId);
  const { data: items, isLoading: isItemsLoading } = useItineraryItems(tripId);
  const { data: comments } = useComments(tripId);
  const { data: files, isLoading: isFilesLoading } = useTripFiles(tripId);
  const createComment = useCreateComment();
  const deleteItem = useDeleteItineraryItem();
  const uploadFile = useUploadFile(tripId);
  const deleteFile = useDeleteFile(tripId);

  const [commentText, setCommentText] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isTripLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (!trip) return <div>Trip not found</div>;

  const canEdit = trip.role === "owner" || trip.role === "editor";

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    createComment.mutate({ tripId, content: commentText }, { onSuccess: () => setCommentText("") });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile.mutate(file);
    e.target.value = "";
  };

  const itemsByDate = items?.reduce((acc, item) => {
    const dateKey = format(new Date(item.startTime), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, typeof items>) || {};

  const sortedDates = Object.keys(itemsByDate).sort();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-display font-bold text-foreground">{trip.name}</h1>
                <Badge variant="secondary" className="uppercase text-xs tracking-wider">{trip.role}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {trip.destination}</span>
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  {format(new Date(trip.startDate), "MMM d")} – {format(new Date(trip.endDate), "MMM d, yyyy")}
                </span>
              </div>
            </div>
            {canEdit && <InviteMemberDialog tripId={tripId} />}
          </div>

          <div className="flex items-center gap-2 mt-6">
            <div className="flex -space-x-2">
              {trip.members.map((m) => (
                <Avatar key={m.id} className="border-2 border-background w-8 h-8" title={getUserDisplayName(m.user)}>
                  <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                    {getInitials(m.user)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-sm text-muted-foreground ml-2">
              {trip.members.length} member{trip.members.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="itinerary" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
            <TabsTrigger value="discussion">Discussion</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>

          {/* ── ITINERARY ── */}
          <TabsContent value="itinerary" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Trip Timeline</h2>
              {canEdit && <AddItineraryItemDialog tripId={tripId} />}
            </div>

            {isItemsLoading ? (
              <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-xl" />)}</div>
            ) : sortedDates.length > 0 ? (
              <div className="space-y-8 relative before:absolute before:left-4 md:before:left-1/2 before:top-0 before:h-full before:w-px before:bg-border/50 before:-z-10">
                {sortedDates.map((date) => (
                  <div key={date} className="relative">
                    <div className="sticky top-20 z-10 flex justify-center mb-6">
                      <div className="bg-background border shadow-sm px-4 py-1 rounded-full text-sm font-semibold">
                        {format(new Date(date), "EEEE, MMMM do")}
                      </div>
                    </div>
                    <div className="space-y-4">
                      {itemsByDate[date]
                        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                        .map((item, idx) => (
                          <div key={item.id} className="group flex flex-col md:flex-row gap-4 items-center">
                            <div className={`md:w-1/2 flex md:justify-end ${idx % 2 === 0 ? "md:order-1" : "md:order-3"}`}>
                              <div className={`hidden md:block text-sm text-muted-foreground ${idx % 2 === 0 ? "pr-8 text-right" : "pl-8 text-left"}`}>
                                <div className="font-mono font-medium text-primary">{format(new Date(item.startTime), "HH:mm")}</div>
                                <div className="text-xs opacity-70">{item.endTime && `– ${format(new Date(item.endTime), "HH:mm")}`}</div>
                              </div>
                            </div>
                            <div className="relative flex items-center justify-center w-8 h-8 rounded-full border-4 border-background bg-muted text-muted-foreground z-10 shrink-0 md:order-2 shadow-sm">
                              <ItineraryIcon type={item.type} />
                            </div>
                            <div className={`w-full md:w-1/2 ${idx % 2 === 0 ? "md:order-3 pl-0 md:pl-8" : "md:order-1 pl-0 md:pr-8"}`}>
                              <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-primary/50">
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h3 className="font-semibold text-lg">{item.title}</h3>
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                        <Clock className="w-3 h-3 md:hidden" />
                                        <span className="md:hidden">{format(new Date(item.startTime), "h:mm a")}</span>
                                        {item.location && (<><span className="md:hidden">•</span><MapPin className="w-3 h-3" />{item.location}</>)}
                                      </div>
                                      {item.description && (
                                        <p className="text-sm mt-3 text-muted-foreground leading-relaxed bg-muted/30 p-2 rounded-md">{item.description}</p>
                                      )}
                                    </div>
                                    {canEdit && (
                                      <Button
                                        variant="ghost" size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => deleteItem.mutate({ tripId, itemId: item.id })}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/10 rounded-xl border border-dashed">
                <p className="text-muted-foreground">No itinerary items yet. Start planning!</p>
              </div>
            )}
          </TabsContent>

          {/* ── DISCUSSION ── */}
          <TabsContent value="discussion">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
              {/* Chat */}
              <div className="md:col-span-2 flex flex-col h-full bg-card rounded-xl border shadow-sm overflow-hidden">
                <CardHeader className="border-b py-3 shrink-0">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" /> Trip Chat
                  </CardTitle>
                </CardHeader>

                <ScrollArea className="flex-1 px-4 py-2">
                  <div className="flex flex-col gap-3 py-2">
                    {comments?.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Start the conversation!</p>
                    )}
                    {comments?.map((comment) => {
                      const isMe = comment.userId === currentUser?.id;
                      const name = getUserDisplayName(comment.user);
                      return (
                        <div key={comment.id} className={`flex gap-2 items-end ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                          {!isMe && (
                            <Avatar className="w-7 h-7 shrink-0 mb-1">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {getInitials(comment.user)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                            {!isMe && <span className="text-xs font-medium text-muted-foreground px-1">{name}</span>}
                            <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${isMe
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted text-foreground rounded-bl-sm"}`}>
                              {comment.content}
                            </div>
                            <span className="text-[11px] text-muted-foreground px-1">
                              {comment.createdAt ? format(new Date(comment.createdAt), "MMM d, h:mm a") : ""}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                <div className="p-4 border-t bg-muted/10 shrink-0">
                  <form onSubmit={handlePostComment} className="flex gap-2">
                    <Input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Type a message..."
                      className="bg-background"
                      data-testid="input-chat-message"
                    />
                    <Button type="submit" disabled={!commentText.trim() || createComment.isPending} data-testid="button-send-message">
                      Send
                    </Button>
                  </form>
                </div>
              </div>

              {/* Members sidebar */}
              <div className="bg-card rounded-xl border shadow-sm p-6 h-fit">
                <h3 className="font-semibold mb-4">Members</h3>
                <div className="space-y-3">
                  {trip.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-secondary/20 text-secondary-foreground text-xs">
                            {getInitials(member.user)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none">{getUserDisplayName(member.user)}</p>
                          <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {canEdit && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex justify-center">
                      <InviteMemberDialog tripId={tripId} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── FILES ── */}
          <TabsContent value="files" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Trip Photos &amp; Videos</h2>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  data-testid="input-file-upload"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadFile.isPending}
                  className="gap-2"
                  data-testid="button-upload-file"
                >
                  {uploadFile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground -mt-4">Photos and videos up to 10 MB each</p>

            {isFilesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="aspect-square bg-muted/20 animate-pulse rounded-lg" />)}
              </div>
            ) : files && files.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {files.map((file) => {
                  const isVideo = file.mimeType.startsWith("video/");
                  const src = `/api/trips/${tripId}/files/${file.id}/data`;
                  return (
                    <div
                      key={file.id}
                      className="group relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => !isVideo && setLightboxUrl(src)}
                      data-testid={`file-item-${file.id}`}
                    >
                      {isVideo ? (
                        <video
                          src={src}
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={src}
                          alt={file.fileName}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      )}

                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center">
                            <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                          </div>
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex flex-col justify-end opacity-0 group-hover:opacity-100">
                        <div className="p-2 text-white">
                          <p className="text-xs font-medium truncate">{getUserDisplayName(file.user)}</p>
                          <p className="text-[10px] opacity-75">{formatFileSize(file.fileSize)}</p>
                        </div>
                        <button
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-red-500 transition-colors"
                          onClick={(e) => { e.stopPropagation(); deleteFile.mutate(file.id); }}
                          data-testid={`button-delete-file-${file.id}`}
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/10 rounded-xl border border-dashed flex flex-col items-center gap-4">
                <Image className="w-12 h-12 text-muted-foreground/40" />
                <div>
                  <p className="font-medium text-muted-foreground">No photos or videos yet</p>
                  <p className="text-sm text-muted-foreground/70">Upload memories from your trip</p>
                </div>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                  <Upload className="w-4 h-4" /> Upload First File
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
