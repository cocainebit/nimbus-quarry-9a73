import { readJson } from "./read-json";

/**
 * A stable id for one action. The same id travels with every retry of the same
 * request, so a paid action finds the payment already made for it instead of
 * asking for a second one.
 */
const newRequestId = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export async function api<T = any>(
  path: string,
  body?: unknown,
  method = body === undefined ? "GET" : "POST",
  requestId = newRequestId(),
): Promise<T> {
  // A paid action answers 402 with its own charge. The payment prompt opens the
  // payment sheet, waits for that charge to be paid, and the request runs again
  // with the same request id, which continues on the payment just made.
  let paid = false;
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: {
        "x-plotform-request-id": requestId,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await readJson(response);
    if (response.ok) return data;
    if (
      response.status === 402 &&
      data?.code === "payment_required" &&
      data?.payUrl &&
      attempt < 3
    ) {
      if (paid)
        throw new Error(
          "The payment went through, but this action still asks to be paid for. Try again in a moment.",
        );
      const { payForAction } = await import("./PaymentPrompt");
      const outcome = await payForAction(data);
      if (outcome === "paid") {
        paid = true;
        continue;
      }
      // Trying again asks the platform for a new charge for the same action.
      if (outcome === "again") continue;
      throw new Error("This action was not paid for, so it did not run.");
    }
    throw new Error(
      data.error?.message || data.error || data.message || "Request failed.",
    );
  }
}
export type Field = {
  name: string;
  label: string;
  type:
    | "text"
    | "number"
    | "boolean"
    | "email"
    | "date"
    | "enum"
    | "reference"
    | "file";
  required: boolean;
  min?: number;
  max?: number;
  options?: string[];
  referenceCollectionId?: string;
  unique?: boolean;
  immutable?: boolean;
  transitions?: Record<string, string[]>;
};
export type Collection = {
  id: string;
  name: string;
  fields: Field[];
  public_read: boolean;
  member_create: boolean;
  editor_access?: boolean;
  schema_version?: number;
};
export type DataRecord = {
  id: string;
  data: Record<string, unknown>;
  version: number;
  canEdit?: boolean;
};
