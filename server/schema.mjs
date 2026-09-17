import { z } from "zod";
import { sectionSchema, pageSchema } from "../shared/schema.mjs";
export const briefSchema = z.object({
  brief: z.string().trim().min(10).max(6000),
  name: z.string().trim().min(1).max(100),
});
export const generatedSectionSchema = sectionSchema
  .omit({ id: true })
  .extend({ id: z.string().max(100).optional() });
export const generatedSchema = z.object({
  pages: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        slug: z
          .string()
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
          .max(80)
          .optional(),
        seoTitle: z.string().max(200).default(""),
        description: z.string().max(400).default(""),
        sections: z.array(generatedSectionSchema).min(1).max(20),
      }),
    )
    .min(1)
    .max(8),
});
export const refinementInput = briefSchema.extend({
  instruction: z.string().trim().min(5).max(4000),
  pages: z.array(z.object({ id: z.string(), name: z.string() })).max(40),
  page: pageSchema,
  sectionId: z.string().optional(),
});
export const refinementOutput = z.object({
  sections: z.array(generatedSectionSchema).min(1).max(40),
});
