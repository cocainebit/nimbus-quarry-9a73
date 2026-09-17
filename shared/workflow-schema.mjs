import { z } from "zod";
const scalar = z.union([
  z.string().max(2000),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);
export const actionSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("notification"),
      message: z.string().trim().min(1).max(1000),
      userId: z.string().min(1).max(100).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("webhook"),
      url: z.string().url().max(2048),
      secretRef: z
        .string()
        .regex(/^[A-Z][A-Z0-9_]{0,60}$/)
        .optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("updateRecord"),
      field: z.string().regex(/^[a-z][a-z0-9_]*$/),
      value: scalar,
    })
    .strict(),
]);
export const conditionSchema = z
  .object({
    field: z.string().min(1).max(100),
    operator: z.enum([
      "equals",
      "notEquals",
      "greaterThan",
      "lessThan",
      "contains",
      "exists",
    ]),
    value: scalar.optional(),
  })
  .strict();
export const workflowSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    collectionId: z.string().min(1).max(100),
    event: z.enum([
      "record.created",
      "record.updated",
      "record.deleted",
      "schedule",
    ]),
    action: actionSchema.optional(),
    actions: z.array(actionSchema).min(1).max(10).optional(),
    conditions: z.array(conditionSchema).max(20).default([]),
    enabled: z.boolean().default(true),
    schedule: z
      .object({
        at: z.string().datetime({ offset: true }),
        intervalMinutes: z.number().int().min(1).max(525600).optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((v, c) => {
    if (!v.action && !v.actions)
      c.addIssue({
        code: "custom",
        message: "At least one action is required.",
      });
    if (v.action && v.actions)
      c.addIssue({
        code: "custom",
        message: "Use action or actions, not both.",
      });
    if ((v.event === "schedule") !== Boolean(v.schedule))
      c.addIssue({
        code: "custom",
        message: "Schedule trigger requires a schedule.",
      });
    if (
      v.event === "schedule" &&
      (v.conditions.length ||
        (v.actions || [v.action]).some(
          (a) =>
            a?.type === "updateRecord" ||
            (a?.type === "notification" && !a.userId),
        ))
    )
      c.addIssue({
        code: "custom",
        message:
          "Schedules require explicit notification recipients and cannot update or filter a triggering record.",
      });
    if (
      v.event === "record.deleted" &&
      (v.actions || [v.action]).some((a) => a?.type === "updateRecord")
    )
      c.addIssue({
        code: "custom",
        message: "Deleted records cannot be updated.",
      });
  });
export function matchesConditions(conditions, data) {
  return conditions.every(({ field, operator, value }) => {
    const actual = data?.[field];
    switch (operator) {
      case "equals":
        return actual === value;
      case "notEquals":
        return actual !== value;
      case "exists":
        return actual !== undefined && actual !== null;
      case "greaterThan":
        return (
          typeof actual === "number" &&
          typeof value === "number" &&
          actual > value
        );
      case "lessThan":
        return (
          typeof actual === "number" &&
          typeof value === "number" &&
          actual < value
        );
      case "contains":
        return (
          typeof actual === "string" &&
          typeof value === "string" &&
          actual.includes(value)
        );
      default:
        return false;
    }
  });
}
