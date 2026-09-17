import { z } from "zod";
const name = z
  .string()
  .regex(/^[a-z][a-z0-9_]{0,39}$/)
  .refine((v) => !["__proto__", "constructor", "prototype"].includes(v));
export const fieldSchema = z
  .object({
    name,
    label: z.string().trim().min(1).max(100),
    type: z.enum([
      "text",
      "number",
      "boolean",
      "email",
      "date",
      "enum",
      "reference",
      "file",
    ]),
    required: z.boolean().default(false),
    min: z.number().finite().optional(),
    max: z.number().finite().optional(),
    options: z.array(z.string().min(1).max(100)).min(1).max(100).optional(),
    referenceCollectionId: z.string().min(1).max(100).optional(),
    unique: z.boolean().default(false),
    immutable: z.boolean().default(false),
    transitions: z
      .record(z.string(), z.array(z.string().max(100)).max(100))
      .optional(),
  })
  .strict()
  .superRefine((f, c) => {
    const bad = (message) => c.addIssue({ code: "custom", message });
    if (f.type === "enum" && !f.options) bad("Enum fields need options.");
    if (f.type === "reference" && !f.referenceCollectionId)
      bad("References need a target collection.");
    if (f.min !== undefined && f.max !== undefined && f.min > f.max)
      bad("Minimum exceeds maximum.");
    if (
      (f.min !== undefined || f.max !== undefined) &&
      !["text", "number"].includes(f.type)
    )
      bad("Bounds apply to text and number fields.");
    if (
      f.type === "text" &&
      [f.min, f.max].some(
        (v) => v !== undefined && (!Number.isInteger(v) || v < 0 || v > 6000),
      )
    )
      bad("Text bounds must be integers between zero and 6000.");
    if (f.options && f.type !== "enum") bad("Options require an enum field.");
    if (f.referenceCollectionId && f.type !== "reference")
      bad("Reference targets require reference fields.");
    if (
      f.transitions &&
      (f.type !== "enum" ||
        Object.entries(f.transitions).some(
          ([k, vs]) =>
            !f.options?.includes(k) || vs.some((v) => !f.options?.includes(v)),
        ))
    )
      bad("Transitions must use enum options.");
  });
export const collectionSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    fields: z
      .array(fieldSchema)
      .min(1)
      .max(40)
      .refine((fs) => new Set(fs.map((f) => f.name)).size === fs.length),
    publicRead: z.boolean().default(false),
    memberCreate: z.boolean().default(true),
    editorAccess: z.boolean().default(false),
  })
  .strict();
export function recordData(fields, data) {
  return z
    .object(
      Object.fromEntries(
        fields.map((f) => {
          let s;
          if (f.type === "number") {
            s = z.number().finite();
            if (f.min !== undefined) s = s.min(f.min);
            if (f.max !== undefined) s = s.max(f.max);
          } else if (f.type === "boolean") s = z.boolean();
          else if (f.type === "email") s = z.string().email().max(200);
          else if (f.type === "date")
            s = z
              .string()
              .regex(/^\d{4}-\d{2}-\d{2}$/)
              .refine(
                (v) =>
                  !Number.isNaN(Date.parse(v)) &&
                  new Date(v).toISOString().slice(0, 10) === v,
              );
          else if (f.type === "enum") s = z.enum(f.options);
          else if (f.type === "reference" || f.type === "file")
            s = z.string().uuid();
          else {
            s = z
              .string()
              .trim()
              .max(f.max ?? 6000);
            if (f.required || f.min !== undefined)
              s = s.min(Math.max(f.required ? 1 : 0, f.min ?? 0));
          }
          return [f.name, f.required ? s : s.optional()];
        }),
      ),
    )
    .strict()
    .parse(data);
}
