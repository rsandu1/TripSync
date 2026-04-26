import { z } from 'zod';
import { 
  insertTripSchema, 
  insertItineraryItemSchema, 
  insertCommentSchema,
  trips,
  tripMembers,
  itineraryItems,
  comments
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
};

export const api = {
  trips: {
    list: {
      method: 'GET' as const,
      path: '/api/trips',
      responses: {
        200: z.array(z.custom<typeof trips.$inferSelect & { role: string }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/trips',
      input: insertTripSchema,
      responses: {
        201: z.custom<typeof trips.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/trips/:id',
      responses: {
        200: z.custom<typeof trips.$inferSelect & { 
          members: (typeof tripMembers.$inferSelect & { user: { id: string, username: string | null, email: string | null } })[],
          role: string 
        }>(),
        404: errorSchemas.notFound,
        403: errorSchemas.forbidden,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/trips/:id',
      input: insertTripSchema.partial(),
      responses: {
        200: z.custom<typeof trips.$inferSelect>(),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
  },
  members: {
    invite: {
      method: 'POST' as const,
      path: '/api/trips/:id/members',
      input: z.object({
        email: z.string().email(),
        role: z.enum(["editor", "viewer"]).default("viewer"),
      }),
      responses: {
        201: z.custom<typeof tripMembers.$inferSelect>(),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
  },
  itinerary: {
    list: {
      method: 'GET' as const,
      path: '/api/trips/:id/items',
      responses: {
        200: z.array(z.custom<typeof itineraryItems.$inferSelect>()),
        403: errorSchemas.forbidden,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/trips/:id/items',
      input: insertItineraryItemSchema.omit({ tripId: true }),
      responses: {
        201: z.custom<typeof itineraryItems.$inferSelect>(),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/trips/:tripId/items/:itemId',
      input: insertItineraryItemSchema.omit({ tripId: true }).partial(),
      responses: {
        200: z.custom<typeof itineraryItems.$inferSelect>(),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/trips/:tripId/items/:itemId',
      responses: {
        204: z.void(),
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
  },
  comments: {
    list: {
      method: 'GET' as const,
      path: '/api/trips/:id/comments',
      responses: {
        200: z.array(z.custom<typeof comments.$inferSelect & { user: { id: string, username: string | null } }>()),
        403: errorSchemas.forbidden,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/trips/:id/comments',
      input: z.object({
        content: z.string(),
        itemId: z.number().optional(),
      }),
      responses: {
        201: z.custom<typeof comments.$inferSelect>(),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
