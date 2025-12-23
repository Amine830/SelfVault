import { z } from 'zod';

/**
 * Schémas de validation Zod pour les endpoints
 */

export const uploadFileSchema = z.object({
  filename: z.string().min(1).max(255),
  mimetype: z.string().optional(),
  categoryId: z.number().int().positive().optional(),
  visibility: z.enum(['private', 'public', 'shared']).default('private'),
});

export const updateFileSchema = z.object({
  filename: z.string().min(1).max(255).optional(),
  visibility: z.enum(['private', 'public', 'shared']).optional(),
  categoryId: z.number().int().positive().nullable().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export const updateSettingsSchema = z.object({
  storageLimit: z.number().int().positive().optional(),
  preferences: z.record(z.unknown()).optional(),
});

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type UpdateFileInput = z.infer<typeof updateFileSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
