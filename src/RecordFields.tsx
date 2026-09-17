import { useEffect, useState, useId } from "react";
import {
  api,
  type Collection,
  type DataRecord,
  type Field,
} from "./backend-api";
function RelationshipField({
  field,
  base,
  initial,
}: {
  field: Field;
  base: string;
  initial: unknown;
}) {
  const id = useId();
  const [search, setSearch] = useState("");
  const [value, setValue] = useState(String(initial ?? ""));
  const [choices, setChoices] = useState<{ id: string; label: string }[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(
      () => {
        void api<{ records: DataRecord[] }>(
          `${base}/collections/${field.referenceCollectionId}/query`,
          { search, limit: 30 },
        )
          .then((result) => {
            if (alive) {
              setChoices(
                result.records.map((r) => ({
                  id: r.id,
                  label: String(
                    r.data.title ??
                      r.data.name ??
                      Object.values(r.data).find(
                        (v) => typeof v === "string",
                      ) ??
                      r.id,
                  ),
                })),
              );
              setError("");
            }
          })
          .catch((e) => alive && setError(e.message));
      },
      search ? 200 : 0,
    );
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [base, field.referenceCollectionId, search]);
  return (
    <div className="relationship-field">
      <label htmlFor={id}>
        {field.label}
        {field.required ? " *" : ""}
      </label>
      <input
        aria-label={`Search ${field.label} records`}
        placeholder="Search linked records…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select
        id={id}
        name={field.name}
        required={field.required}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      >
        <option value="">Choose {field.label.toLowerCase()}</option>
        {value && !choices.some((c) => c.id === value) && (
          <option value={value}>Current linked record</option>
        )}
        {choices.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
export function RecordFields({
  fields,
  base,
  record,
}: {
  fields: Field[];
  base: string;
  record?: DataRecord | null;
}) {
  const [choices, setChoices] = useState<
    Record<string, { id: string; label: string }[]>
  >({});
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    (async () => {
      const all: Record<string, { id: string; label: string }[]> = {};
      for (const f of fields) {
        if (f.type === "file") {
          const files = await api<{ id: string; name: string }[]>(
            `${base}/files`,
          );
          all[f.name] = files.map((f) => ({ id: f.id, label: f.name }));
        }
      }
      if (alive) setChoices(all);
    })().catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [fields, base]);
  return (
    <>
      {error && <p role="alert">{error}</p>}
      {fields.map((f) =>
        f.type === "reference" ? (
          <RelationshipField
            key={f.name}
            field={f}
            base={base}
            initial={record?.data[f.name]}
          />
        ) : (
          <label key={f.name}>
            {f.label}
            {f.required ? " *" : ""}
            {["enum", "reference", "file"].includes(f.type) ? (
              <select
                name={f.name}
                required={f.required}
                defaultValue={String(record?.data[f.name] ?? "")}
              >
                <option value="">Choose {f.label.toLowerCase()}</option>
                {f.type !== "enum" &&
                  Boolean(record?.data[f.name]) &&
                  !choices[f.name]?.some(
                    (c) => c.id === record?.data[f.name],
                  ) && (
                    <option value={String(record?.data[f.name])}>
                      Current linked record
                    </option>
                  )}
                {f.type === "enum"
                  ? f.options?.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))
                  : choices[f.name]?.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
              </select>
            ) : (
              <input
                name={f.name}
                type={f.type === "boolean" ? "checkbox" : f.type}
                required={f.required && f.type !== "boolean"}
                step={f.type === "number" ? "any" : undefined}
                min={f.type === "number" ? f.min : undefined}
                max={f.type === "number" ? f.max : undefined}
                minLength={f.type === "text" ? f.min : undefined}
                maxLength={f.type === "text" ? (f.max ?? 6000) : 6000}
                defaultValue={
                  f.type === "boolean"
                    ? undefined
                    : String(record?.data[f.name] ?? "")
                }
                defaultChecked={
                  f.type === "boolean"
                    ? Boolean(record?.data[f.name])
                    : undefined
                }
              />
            )}
          </label>
        ),
      )}
    </>
  );
}
export function formRecordData(collection: Collection, form: HTMLFormElement) {
  const fd = new FormData(form);
  const data: Record<string, unknown> = {};
  for (const f of collection.fields) {
    const value = fd.get(f.name);
    if (f.type === "boolean") data[f.name] = value === "on";
    else if (value !== null && value !== "")
      data[f.name] = f.type === "number" ? Number(value) : value;
  }
  return data;
}
