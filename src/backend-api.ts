export async function api<T = any>(
  path: string,
  body?: unknown,
  method = body === undefined ? "GET" : "POST",
): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.error?.message || data.error || data.message || "Request failed.",
    );
  return data;
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
