import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export * from "./models/auth";
import { users } from "./models/auth";

// === TABLE DEFINITIONS ===

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  destination: text("destination").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false).notNull(),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tripMembers = pgTable("trip_members", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: text("role", { enum: ["owner", "editor", "viewer"] }).default("viewer").notNull(),
});

export const itineraryItems = pgTable("itinerary_items", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  location: text("location"),
  type: text("type", { enum: ["flight", "hotel", "activity", "transport", "dining", "other"] }).default("activity").notNull(),
  cost: integer("cost"),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  itemId: integer("item_id"),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tripFiles = pgTable("trip_files", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  userId: varchar("user_id").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  fileData: text("file_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const tripsRelations = relations(trips, ({ one, many }) => ({
  members: many(tripMembers),
  items: many(itineraryItems),
  comments: many(comments),
  files: many(tripFiles),
  creator: one(users, { fields: [trips.createdBy], references: [users.id] }),
}));

export const tripMembersRelations = relations(tripMembers, ({ one }) => ({
  trip: one(trips, { fields: [tripMembers.tripId], references: [trips.id] }),
  user: one(users, { fields: [tripMembers.userId], references: [users.id] }),
}));

export const itineraryItemsRelations = relations(itineraryItems, ({ one, many }) => ({
  trip: one(trips, { fields: [itineraryItems.tripId], references: [trips.id] }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  trip: one(trips, { fields: [comments.tripId], references: [trips.id] }),
  item: one(itineraryItems, { fields: [comments.itemId], references: [itineraryItems.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}));

export const tripFilesRelations = relations(tripFiles, ({ one }) => ({
  trip: one(trips, { fields: [tripFiles.tripId], references: [trips.id] }),
  user: one(users, { fields: [tripFiles.userId], references: [users.id] }),
}));

// === BASE SCHEMAS ===

export const insertTripSchema = createInsertSchema(trips).omit({ id: true, createdAt: true, createdBy: true });
export const insertTripMemberSchema = createInsertSchema(tripMembers).omit({ id: true });
export const insertItineraryItemSchema = createInsertSchema(itineraryItems).omit({ id: true }).extend({
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional(),
});
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true, userId: true });
export const insertTripFileSchema = createInsertSchema(tripFiles).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type CreateTripRequest = InsertTrip;
export type UpdateTripRequest = Partial<InsertTrip>;

export type TripMember = typeof tripMembers.$inferSelect;
export type InsertTripMember = z.infer<typeof insertTripMemberSchema>;

export type ItineraryItem = typeof itineraryItems.$inferSelect;
export type InsertItineraryItem = z.infer<typeof insertItineraryItemSchema>;
export type CreateItineraryItemRequest = InsertItineraryItem;
export type UpdateItineraryItemRequest = Partial<InsertItineraryItem>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type TripFile = typeof tripFiles.$inferSelect;
export type InsertTripFile = z.infer<typeof insertTripFileSchema>;

export type TripWithMembers = Trip & { members: TripMember[] };

export interface TripDetail extends Trip {
  role: "owner" | "editor" | "viewer";
}
