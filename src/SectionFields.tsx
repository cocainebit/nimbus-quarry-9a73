import { useState } from "react";
import {
  makeSection,
  sectionLabels,
  kinds,
  type Project,
  type Section,
} from "./model";
import { safeLink, safeImage } from "../shared/schema.mjs";
export function ImageField({
  value,
  alt = "",
  onChange,
  onAlt,
}: {
  value: string;
  alt?: string;
  onChange: (v: string) => void;
  onAlt?: (v: string) => void;
}) {
  const [error, setError] = useState("");
  async function upload(file?: File) {
    if (!file) return;
    setError("");
    if (
      !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
        file.type,
      ) ||
      file.size > 2_000_000
    ) {
      setError("Choose a PNG, JPEG, WebP or GIF under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.onerror = () => setError("Image could not be read.");
    reader.readAsDataURL(file);
  }
  return (
    <div className="image-field">
      <label>
        Image URL
        <input
          value={value.startsWith("data:") ? "" : value}
          placeholder={
            value.startsWith("data:")
              ? "Uploaded image — replace with a URL"
              : "https://…"
          }
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      {value && !safeImage(value) && (
        <small className="error">
          Enter an HTTPS image URL or upload an image.
        </small>
      )}
      <label className="upload-label">
        Upload image
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => void upload(e.target.files?.[0])}
        />
      </label>
      {value && safeImage(value) && (
        <div className="uploaded-image">
          <img src={safeImage(value)} alt={alt} />
          <button
            className="text-btn danger"
            type="button"
            onClick={() => onChange("")}
          >
            Remove image
          </button>
        </div>
      )}
      {onAlt && (
        <label>
          Image description
          <input
            value={alt}
            onChange={(e) => onAlt(e.target.value)}
            placeholder="Describe this image for screen readers"
          />
        </label>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function LinkField({
  value,
  onChange,
  project,
  label = "Button destination",
}: {
  value: string;
  onChange: (v: string) => void;
  project: Project;
  label?: string;
}) {
  const internal = value.startsWith("page:");
  return (
    <>
      <label>
        {label}
        <select
          value={internal ? value : "custom"}
          onChange={(e) =>
            onChange(e.target.value === "custom" ? "" : e.target.value)
          }
        >
          <option value="custom">URL, email, phone or section anchor</option>
          {internal && !project.pages.some((p) => `page:${p.id}` === value) && (
            <option value={value}>Deleted page — choose another</option>
          )}
          {project.pages.map((p) => (
            <option key={p.id} value={`page:${p.id}`}>
              Page: {p.name}
            </option>
          ))}
        </select>
      </label>
      {!internal && (
        <label>
          Link address
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://… or mailto:… or #site-contact"
          />
        </label>
      )}
      {value && !safeLink(value) && (
        <p className="error">This address is not supported.</p>
      )}
    </>
  );
}
export function SectionFields({
  section: s,
  project,
  onChange,
}: {
  section: Section;
  project: Project;
  onChange: (s: Section) => void;
}) {
  const set = (patch: Partial<Section>) => onChange({ ...s, ...patch });
  const list = [
    "features",
    "pricing",
    "faq",
    "gallery",
    "team",
    "stats",
    "logos",
    "testimonials",
  ].includes(s.kind);
  return (
    <div className="rich-fields">
      <label>
        Eyebrow
        <input
          value={s.eyebrow}
          onChange={(e) => set({ eyebrow: e.target.value })}
        />
      </label>
      <div className="field-columns">
        <label>
          Layout
          <select
            value={s.variant}
            onChange={(e) =>
              set({ variant: e.target.value as Section["variant"] })
            }
          >
            <option value="split">Split</option>
            <option value="centered">Centered</option>
            <option value="reverse">Image first</option>
          </select>
        </label>
        <label>
          Background
          <select
            value={s.tone}
            onChange={(e) => set({ tone: e.target.value as Section["tone"] })}
          >
            <option value="default">Default</option>
            <option value="accent">Accent</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </div>
      <label>
        Spacing
        <select
          value={s.spacing}
          onChange={(e) =>
            set({ spacing: e.target.value as Section["spacing"] })
          }
        >
          <option value="compact">Compact</option>
          <option value="normal">Normal</option>
          <option value="spacious">Spacious</option>
        </select>
      </label>
      {["hero", "story"].includes(s.kind) && (
        <ImageField
          value={s.image}
          alt={s.imageAlt}
          onChange={(image) => set({ image })}
          onAlt={(imageAlt) => set({ imageAlt })}
        />
      )}
      <label>
        Button label
        <input
          value={s.buttonLabel}
          onChange={(e) => set({ buttonLabel: e.target.value })}
          placeholder="Leave empty to hide"
        />
      </label>
      {s.buttonLabel && (
        <LinkField
          project={project}
          value={s.buttonHref}
          onChange={(buttonHref) => set({ buttonHref })}
        />
      )}
      {list && (
        <div className="items-editor">
          <h4>
            {s.kind === "faq" ? "Questions" : "Items"} ({s.items.length})
          </h4>
          {s.items.map((item, i) => (
            <details key={i}>
              <summary>{item.title || `Item ${i + 1}`}</summary>
              <label>
                Item title
                <input
                  value={item.title}
                  onChange={(e) =>
                    set({
                      items: s.items.map((x, j) =>
                        j === i ? { ...x, title: e.target.value } : x,
                      ),
                    })
                  }
                />
              </label>
              <label>
                {s.kind === "faq" ? "Answer" : "Item description"}
                <textarea
                  value={item.body}
                  onChange={(e) =>
                    set({
                      items: s.items.map((x, j) =>
                        j === i ? { ...x, body: e.target.value } : x,
                      ),
                    })
                  }
                />
              </label>
              {s.kind === "pricing" && (
                <label>
                  Price
                  <input
                    value={item.price}
                    onChange={(e) =>
                      set({
                        items: s.items.map((x, j) =>
                          j === i ? { ...x, price: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </label>
              )}
              {["gallery", "team", "logos", "features"].includes(s.kind) && (
                <ImageField
                  value={item.image}
                  alt={item.alt}
                  onChange={(image) =>
                    set({
                      items: s.items.map((x, j) =>
                        j === i ? { ...x, image } : x,
                      ),
                    })
                  }
                  onAlt={(alt) =>
                    set({
                      items: s.items.map((x, j) =>
                        j === i ? { ...x, alt } : x,
                      ),
                    })
                  }
                />
              )}
              {s.kind !== "faq" && (
                <>
                  <label>
                    Item button label
                    <input
                      value={item.label}
                      onChange={(e) =>
                        set({
                          items: s.items.map((x, j) =>
                            j === i ? { ...x, label: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </label>
                  {item.label && (
                    <LinkField
                      project={project}
                      value={item.href}
                      onChange={(href) =>
                        set({
                          items: s.items.map((x, j) =>
                            j === i ? { ...x, href } : x,
                          ),
                        })
                      }
                    />
                  )}
                </>
              )}
              <div className="item-actions">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => {
                    const items = [...s.items];
                    [items[i - 1], items[i]] = [items[i], items[i - 1]];
                    set({ items });
                  }}
                >
                  Move up
                </button>
                <button
                  type="button"
                  onClick={() =>
                    set({ items: s.items.filter((_, j) => j !== i) })
                  }
                >
                  Remove
                </button>
              </div>
            </details>
          ))}
          <button
            className="secondary full"
            type="button"
            disabled={s.items.length >= 30}
            onClick={() =>
              set({
                items: [
                  ...s.items,
                  {
                    title: "New item",
                    body: "",
                    image: "",
                    alt: "",
                    label: "",
                    href: "",
                    price: "",
                  },
                ],
              })
            }
          >
            Add item
          </button>
        </div>
      )}
      {s.kind === "contact" && (
        <p className="field-help">
          The exported Node server collects messages in a private file.
          Static-only hosting needs a form backend. Preview never submits
          messages.
        </p>
      )}
      <small className="field-help">Section link: #section-{s.id}</small>
    </div>
  );
}
export function SectionLibrary({
  onAdd,
  onClose,
}: {
  onAdd: (section: Section) => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal library-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Section library"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close section library"
        >
          ✕
        </button>
        <h2>Build the next part of your site.</h2>
        <p>Each section includes editable content, layout and styling.</p>
        <div className="library-grid">
          {kinds.map((kind) => (
            <button key={kind} onClick={() => onAdd(makeSection(kind))}>
              <div className={`library-sketch sketch-${kind}`}>
                <i />
                <i />
                <i />
              </div>
              <strong>{sectionLabels[kind]}</strong>
              <small>Add section →</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
