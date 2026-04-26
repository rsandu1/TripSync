import { db } from "./db";
import {
  trips, tripMembers, itineraryItems, comments, users, tripFiles,
  type InsertTrip, type InsertTripMember, type InsertItineraryItem, type InsertComment, type InsertTripFile,
  type Trip, type TripMember, type ItineraryItem, type Comment, type User, type TripFile,
} from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;

  createTrip(userId: string, trip: InsertTrip): Promise<Trip>;
  getTripsForUser(userId: string): Promise<(Trip & { role: string })[]>;
  getTrip(tripId: number): Promise<Trip | undefined>;
  updateTrip(tripId: number, updates: Partial<InsertTrip>): Promise<Trip>;

  getTripMembers(tripId: number): Promise<(TripMember & { user: User })[]>;
  addTripMember(member: InsertTripMember): Promise<TripMember>;
  getMemberRole(tripId: number, userId: string): Promise<string | undefined>;

  getItineraryItems(tripId: number): Promise<ItineraryItem[]>;
  createItineraryItem(item: InsertItineraryItem): Promise<ItineraryItem>;
  updateItineraryItem(itemId: number, updates: Partial<InsertItineraryItem>): Promise<ItineraryItem>;
  deleteItineraryItem(itemId: number): Promise<void>;

  getTripComments(tripId: number): Promise<(Comment & { user: User })[]>;
  createComment(comment: InsertComment & { userId: string }): Promise<Comment>;

  getTripFiles(tripId: number): Promise<(Omit<TripFile, "fileData"> & { user: User })[]>;
  getTripFileData(fileId: number): Promise<TripFile | undefined>;
  createTripFile(file: InsertTripFile): Promise<TripFile>;
  deleteTripFile(fileId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createTrip(userId: string, trip: InsertTrip): Promise<Trip> {
    const [newTrip] = await db.insert(trips).values({ ...trip, createdBy: userId }).returning();
    await this.addTripMember({ tripId: newTrip.id, userId, role: "owner" });
    return newTrip;
  }

  async getTripsForUser(userId: string): Promise<(Trip & { role: string })[]> {
    const members = await db
      .select({ trip: trips, role: tripMembers.role })
      .from(tripMembers)
      .innerJoin(trips, eq(tripMembers.tripId, trips.id))
      .where(eq(tripMembers.userId, userId));
    return members.map((m) => ({ ...m.trip, role: m.role }));
  }

  async getTrip(tripId: number): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, tripId));
    return trip;
  }

  async updateTrip(tripId: number, updates: Partial<InsertTrip>): Promise<Trip> {
    const [updated] = await db.update(trips).set(updates).where(eq(trips.id, tripId)).returning();
    return updated;
  }

  async getTripMembers(tripId: number): Promise<(TripMember & { user: User })[]> {
    const members = await db
      .select({ member: tripMembers, user: users })
      .from(tripMembers)
      .innerJoin(users, eq(tripMembers.userId, users.id))
      .where(eq(tripMembers.tripId, tripId));
    return members.map((m) => ({ ...m.member, user: m.user }));
  }

  async addTripMember(member: InsertTripMember): Promise<TripMember> {
    const [newMember] = await db.insert(tripMembers).values(member).returning();
    return newMember;
  }

  async getMemberRole(tripId: number, userId: string): Promise<string | undefined> {
    const [member] = await db
      .select()
      .from(tripMembers)
      .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId)));
    return member?.role;
  }

  async getItineraryItems(tripId: number): Promise<ItineraryItem[]> {
    return await db
      .select()
      .from(itineraryItems)
      .where(eq(itineraryItems.tripId, tripId))
      .orderBy(itineraryItems.startTime);
  }

  async createItineraryItem(item: InsertItineraryItem): Promise<ItineraryItem> {
    const [newItem] = await db.insert(itineraryItems).values(item).returning();
    return newItem;
  }

  async updateItineraryItem(itemId: number, updates: Partial<InsertItineraryItem>): Promise<ItineraryItem> {
    const [updated] = await db.update(itineraryItems).set(updates).where(eq(itineraryItems.id, itemId)).returning();
    return updated;
  }

  async deleteItineraryItem(itemId: number): Promise<void> {
    await db.delete(itineraryItems).where(eq(itineraryItems.id, itemId));
  }

  async getTripComments(tripId: number): Promise<(Comment & { user: User })[]> {
    const results = await db
      .select({ comment: comments, user: users })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.tripId, tripId))
      .orderBy(asc(comments.createdAt));
    return results.map((r) => ({ ...r.comment, user: r.user }));
  }

  async createComment(comment: InsertComment & { userId: string }): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async getTripFiles(tripId: number): Promise<(Omit<TripFile, "fileData"> & { user: User })[]> {
    const results = await db
      .select({
        id: tripFiles.id,
        tripId: tripFiles.tripId,
        userId: tripFiles.userId,
        fileName: tripFiles.fileName,
        mimeType: tripFiles.mimeType,
        fileSize: tripFiles.fileSize,
        createdAt: tripFiles.createdAt,
        user: users,
      })
      .from(tripFiles)
      .innerJoin(users, eq(tripFiles.userId, users.id))
      .where(eq(tripFiles.tripId, tripId))
      .orderBy(desc(tripFiles.createdAt));
    return results;
  }

  async getTripFileData(fileId: number): Promise<TripFile | undefined> {
    const [file] = await db.select().from(tripFiles).where(eq(tripFiles.id, fileId));
    return file;
  }

  async createTripFile(file: InsertTripFile): Promise<TripFile> {
    const [newFile] = await db.insert(tripFiles).values(file).returning();
    return newFile;
  }

  async deleteTripFile(fileId: number): Promise<void> {
    await db.delete(tripFiles).where(eq(tripFiles.id, fileId));
  }
}

export const storage = new DatabaseStorage();
