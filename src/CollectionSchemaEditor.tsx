import { useEffect, useState } from "react";
import { api, type Collection, type Field } from "./backend-api";
type Extended = Field & {
  min?: number;
  max?: number;
  options?: string[];
  referenceCollectionId?: string;
  unique?: boolean;
  immutable?: boolean;
  transitions?: Record<string, string[]>;
};
type Preview = {
  safe: boolean;
  issues: string[];
  schemaVersion: number;
  recordCount: number;
};
export default function CollectionSchemaEditor({
  projectId,
  collection,
  collections,
  onApplied,
}: {
  projectId: string;
  collection: Collection;
  collections: Collection[];
  onApplied: () => void;
}) {
  const [name, setName] = useState(collection.name),
    [fields, setFields] = useState<Extended[]>(
      structuredClone(collection.fields),
    );
  const [publicRead, setPublicRead] = useState(collection.public_read),
    [memberCreate, setMemberCreate] = useState(collection.member_create),
    [editorAccess, setEditorAccess] = useState(
      Boolean(
        (collection as Collection & { editor_access?: boolean }).editor_access,
      ),
    );
  const [preview, setPreview] = useState<Preview | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  useEffect(() => {
    setName(collection.name);
    setFields(structuredClone(collection.fields));
    setPublicRead(collection.public_read);
    setMemberCreate(collection.member_create);
    setEditorAccess(
      Boolean(
        (collection as Collection & { editor_access?: boolean }).editor_access,
      ),
    );
    setPreview(null);
  }, [collection]);
  const change = (index: number, patch: Partial<Extended>) => {
    setFields((fs) => fs.map((f, i) => (i === index ? { ...f, ...patch } : f)));
    setPreview(null);
    setSuccess("");
  };
  const definition = { name, fields, publicRead, memberCreate, editorAccess };
  const perform = async (apply = false) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const base = `/api/projects/${projectId}/collections/${collection.id}/schema`;
      if (apply && preview) {
        await api(
          base,
          { ...definition, schemaVersion: preview.schemaVersion },
          "PUT",
        );
        setPreview(null);
        setSuccess("Schema saved. Existing records were preserved.");
        onApplied();
      } else setPreview(await api<Preview>(`${base}/preview`, definition));
    } catch (e) {
      setError((e as Error).message);
      setPreview(null);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section aria-label={`Schema for ${collection.name}`}>
      <h4>Edit {collection.name} schema</h4>
      <p>
        Preview validates every existing record. Removing fields, changing
        types, and changes that invalidate saved data are blocked.
      </p>
      <label>
        Collection name
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setPreview(null);
          }}
        />
      </label>
      {fields.map((f, i) => (
        <fieldset key={i}>
          <legend>Field {i + 1}</legend>
          <label>
            Field name
            <input
              value={f.name}
              onChange={(e) => change(i, { name: e.target.value })}
            />
          </label>
          <label>
            Label
            <input
              value={f.label}
              onChange={(e) => change(i, { label: e.target.value })}
            />
          </label>
          <label>
            Type
            <select
              value={f.type}
              onChange={(e) => {
                const type = e.target.value as Field["type"];
                change(i, {
                  type,
                  options: type === "enum" ? ["option"] : undefined,
                  referenceCollectionId:
                    type === "reference"
                      ? collections.find((c) => c.id !== collection.id)?.id
                      : undefined,
                  min: undefined,
                  max: undefined,
                  transitions: undefined,
                });
              }}
            >
              {[
                "text",
                "number",
                "boolean",
                "email",
                "date",
                "enum",
                "reference",
                "file",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={f.required}
              onChange={(e) => change(i, { required: e.target.checked })}
            />{" "}
            Required
          </label>
          <label>
            <input
              type="checkbox"
              checked={!!f.unique}
              onChange={(e) => change(i, { unique: e.target.checked })}
            />{" "}
            Unique across this collection
          </label>
          <label>
            <input
              type="checkbox"
              checked={!!f.immutable}
              onChange={(e) => change(i, { immutable: e.target.checked })}
            />{" "}
            Cannot change after creation
          </label>
          {["text", "number"].includes(f.type) && (
            <div>
              <label>
                {f.type === "text" ? "Minimum length" : "Minimum value"}
                <input
                  type="number"
                  value={f.min ?? ""}
                  onChange={(e) =>
                    change(i, {
                      min:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                {f.type === "text" ? "Maximum length" : "Maximum value"}
                <input
                  type="number"
                  value={f.max ?? ""}
                  onChange={(e) =>
                    change(i, {
                      max:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>
          )}
          {f.type === "enum" && (
            <>
              <label>
                Options, separated by commas
                <input
                  value={f.options?.join(",") || ""}
                  onChange={(e) =>
                    change(i, { options: e.target.value.split(",") })
                  }
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={!!f.transitions}
                  onChange={(e) =>
                    change(i, {
                      transitions: e.target.checked
                        ? Object.fromEntries(
                            (f.options || []).map((o) => [o, []]),
                          )
                        : undefined,
                    })
                  }
                />{" "}
                Restrict status changes
              </label>
              {f.transitions && (
                <p>
                  Select allowed next values for each status. No selections
                  means a final status.
                </p>
              )}
              {f.transitions &&
                f.options?.map((option) => (
                  <fieldset key={option}>
                    <legend>From {option}</legend>
                    {f.options
                      ?.filter((o) => o !== option)
                      .map((next) => (
                        <label key={next}>
                          <input
                            type="checkbox"
                            checked={!!f.transitions?.[option]?.includes(next)}
                            onChange={(e) =>
                              change(i, {
                                transitions: {
                                  ...f.transitions,
                                  [option]: e.target.checked
                                    ? [...(f.transitions?.[option] || []), next]
                                    : (f.transitions?.[option] || []).filter(
                                        (o) => o !== next,
                                      ),
                                },
                              })
                            }
                          />
                          {next}
                        </label>
                      ))}
                  </fieldset>
                ))}
            </>
          )}
          {f.type === "reference" && (
            <label>
              Related collection
              <select
                value={f.referenceCollectionId || ""}
                onChange={(e) =>
                  change(i, { referenceCollectionId: e.target.value })
                }
              >
                <option value="">Choose collection</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {f.type === "file" && (
            <p>Stores the ID of a file uploaded by this app member.</p>
          )}
          <button
            onClick={() => {
              setFields((fs) => fs.filter((_, index) => index !== i));
              setPreview(null);
            }}
          >
            Remove field
          </button>
        </fieldset>
      ))}
      <button
        onClick={() => {
          setFields((fs) => [
            ...fs,
            {
              name: `field_${fs.length + 1}`,
              label: "New field",
              type: "text",
              required: false,
            },
          ]);
          setPreview(null);
        }}
      >
        Add field
      </button>
      <label>
        <input
          type="checkbox"
          checked={publicRead}
          onChange={(e) => {
            setPublicRead(e.target.checked);
            setPreview(null);
          }}
        />{" "}
        Anyone can read records
      </label>
      <label>
        <input
          type="checkbox"
          checked={memberCreate}
          onChange={(e) => {
            setMemberCreate(e.target.checked);
            setPreview(null);
          }}
        />{" "}
        Members can create records
      </label>
      <label>
        <input
          type="checkbox"
          checked={editorAccess}
          onChange={(e) => {
            setEditorAccess(e.target.checked);
            setPreview(null);
          }}
        />{" "}
        Editors and admins can read and edit all records
      </label>
      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}
      {preview && (
        <div role="status">
          <p>
            {preview.safe ? "Safe to apply" : "Changes blocked"} ·{" "}
            {preview.recordCount} records checked · schema version{" "}
            {preview.schemaVersion}
          </p>
          {preview.issues.map((issue, i) => (
            <p key={i}>{issue}</p>
          ))}
        </div>
      )}
      <div className="backend-actions">
        <button disabled={busy} onClick={() => void perform()}>
          Preview schema changes
        </button>
        <button
          disabled={busy || !preview?.safe}
          onClick={() => void perform(true)}
        >
          Apply verified changes
        </button>
      </div>
    </section>
  );
}
