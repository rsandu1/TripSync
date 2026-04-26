import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import { setupAuth, isAuthenticated } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos are allowed"));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  const requireAuth = isAuthenticated;

  const requireMember = async (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const tripId = Number(req.params.id || req.params.tripId);
    const userId = (req.user as any).id;
    const role = await storage.getMemberRole(tripId, userId);
    if (!role) return res.status(403).json({ message: "Not a member of this trip" });
    req.tripRole = role;
    next();
  };

  const requireEditor = (req: any, res: any, next: any) => {
    if (["owner", "editor"].includes(req.tripRole)) {
      next();
    } else {
      res.status(403).json({ message: "Requires editor permissions" });
    }
  };

  // Trips
  app.get(api.trips.list.path, requireAuth, async (req: any, res) => {
    const userId = req.user.id;
    const trips = await storage.getTripsForUser(userId);
    res.json(trips);
  });

  app.post(api.trips.create.path, requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const input = api.trips.create.input.parse(req.body);
      const trip = await storage.createTrip(userId, input);
      res.status(201).json(trip);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.get(api.trips.get.path, requireMember, async (req: any, res) => {
    const tripId = Number(req.params.id);
    const trip = await storage.getTrip(tripId);
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    const members = await storage.getTripMembers(tripId);
    res.json({ ...trip, members, role: req.tripRole });
  });

  app.put(api.trips.update.path, requireMember, requireEditor, async (req: any, res) => {
    try {
      const tripId = Number(req.params.id);
      const input = api.trips.update.input.parse(req.body);
      const trip = await storage.updateTrip(tripId, input);
      res.json(trip);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  // Members
  app.post(api.members.invite.path, requireMember, requireEditor, async (req: any, res) => {
    try {
      const tripId = Number(req.params.id);
      const { email, role } = api.members.invite.input.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(404).json({ message: "User not found. They must register first." });
      const existingRole = await storage.getMemberRole(tripId, user.id);
      if (existingRole) return res.status(400).json({ message: "User is already a member" });
      const member = await storage.addTripMember({ tripId, userId: user.id, role });
      res.status(201).json(member);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  // Itinerary
  app.get(api.itinerary.list.path, requireMember, async (req, res) => {
    const tripId = Number(req.params.id);
    const items = await storage.getItineraryItems(tripId);
    res.json(items);
  });

  app.post(api.itinerary.create.path, requireMember, requireEditor, async (req: any, res) => {
    try {
      const tripId = Number(req.params.id);
      const input = api.itinerary.create.input.parse(req.body);
      const item = await storage.createItineraryItem({
        ...input,
        tripId,
        startTime: new Date(input.startTime),
        endTime: input.endTime ? new Date(input.endTime) : undefined,
      });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.put(api.itinerary.update.path, requireMember, requireEditor, async (req: any, res) => {
    try {
      const itemId = Number(req.params.itemId);
      const input = api.itinerary.update.input.parse(req.body);
      const updates: any = { ...input };
      if (input.startTime) updates.startTime = new Date(input.startTime as any);
      if (input.endTime) updates.endTime = new Date(input.endTime as any);
      const item = await storage.updateItineraryItem(itemId, updates);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.delete(api.itinerary.delete.path, requireMember, requireEditor, async (req, res) => {
    const itemId = Number(req.params.itemId);
    await storage.deleteItineraryItem(itemId);
    res.status(204).send();
  });

  // Comments
  app.get(api.comments.list.path, requireMember, async (req, res) => {
    const tripId = Number(req.params.id);
    const comments = await storage.getTripComments(tripId);
    res.json(comments);
  });

  app.post(api.comments.create.path, requireMember, async (req: any, res) => {
    try {
      const tripId = Number(req.params.id);
      const userId = req.user.id;
      const input = api.comments.create.input.parse(req.body);
      const comment = await storage.createComment({ ...input, tripId, userId });
      res.status(201).json(comment);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  // Files
  app.get("/api/trips/:id/files", requireMember, async (req, res) => {
    const tripId = Number(req.params.id);
    const files = await storage.getTripFiles(tripId);
    res.json(files);
  });

  app.post("/api/trips/:id/files", requireMember, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const tripId = Number(req.params.id);
      const userId = req.user.id;
      const fileData = req.file.buffer.toString("base64");
      const file = await storage.createTripFile({
        tripId,
        userId,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        fileData,
      });
      const { fileData: _, ...fileMeta } = file;
      res.status(201).json(fileMeta);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Upload failed" });
    }
  });

  app.get("/api/trips/:id/files/:fileId/data", requireMember, async (req, res) => {
    const fileId = Number(req.params.fileId);
    const file = await storage.getTripFileData(fileId);
    if (!file) return res.status(404).json({ message: "File not found" });
    const buffer = Buffer.from(file.fileData, "base64");
    res.set("Content-Type", file.mimeType);
    res.set("Content-Disposition", `inline; filename="${file.fileName}"`);
    res.set("Cache-Control", "public, max-age=31536000");
    res.send(buffer);
  });

  app.delete("/api/trips/:id/files/:fileId", requireMember, async (req: any, res) => {
    const fileId = Number(req.params.fileId);
    const file = await storage.getTripFileData(fileId);
    if (!file) return res.status(404).json({ message: "File not found" });
    if (file.userId !== req.user.id && req.tripRole !== "owner") {
      return res.status(403).json({ message: "Cannot delete others' files" });
    }
    await storage.deleteTripFile(fileId);
    res.status(204).send();
  });

  return httpServer;
}
