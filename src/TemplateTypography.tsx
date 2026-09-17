import { useEffect, useState } from "react";
import {
  templateFonts,
  editableStyleProperties,
  validElementStyle,
} from "./template-typography";
export default function TemplateTypography({
  elementId,
  values,
  onApply,
}: {
  elementId: string;
  values: Record<string, string>;
  onApply: (values: Record<string, string>) => void;
}) {
  const [draft, setDraft] = useState(values),
    [error, setError] = useState("");
  const valueKey = JSON.stringify(values);
  useEffect(() => {
    setDraft(values);
    setError("");
  }, [elementId, valueKey]);
  const update = (key: string, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));
  return (
    <details className="native-type-controls">
      <summary>Typography & color</summary>
      <p>
        Style the selected text. Fonts are bundled locally and included in the
        export. Large type scales down on smaller screens.
      </p>
      <label>
        Typeface
        <select
          value={draft["font-family"] || ""}
          onChange={(e) => update("font-family", e.target.value)}
        >
          <option value="">Template default</option>
          {templateFonts.map((f) => (
            <option key={f.id} value={`"${f.family}"`}>
              {f.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Text size (px)
        <input
          type="number"
          min={10}
          max={160}
          placeholder="Template default"
          value={draft["font-size"]?.match(/(\d+)px(?:\))?$/)?.[1] || ""}
          onChange={(e) =>
            update(
              "font-size",
              e.target.value
                ? Number(e.target.value) > 32
                  ? `clamp(24px, 8vw, ${e.target.value}px)`
                  : e.target.value + "px"
                : "",
            )
          }
        />
      </label>
      <label>
        Weight
        <select
          value={draft["font-weight"] || ""}
          onChange={(e) => update("font-weight", e.target.value)}
        >
          <option value="">Template default</option>
          {["300", "400", "500", "600", "700", "800"].map((w) => (
            <option key={w}>{w}</option>
          ))}
        </select>
      </label>
      <label>
        Line height
        <input
          type="number"
          min={1}
          max={2}
          step={0.05}
          placeholder="Template default"
          value={draft["line-height"] || ""}
          onChange={(e) => update("line-height", e.target.value)}
        />
      </label>
      <label>
        Letter spacing (em)
        <input
          type="number"
          min={-0.2}
          max={0.2}
          step={0.01}
          placeholder="Template default"
          value={draft["letter-spacing"]?.replace("em", "") || ""}
          onChange={(e) =>
            update(
              "letter-spacing",
              e.target.value ? e.target.value + "em" : "",
            )
          }
        />
      </label>
      <label>
        Text alignment
        <select
          value={draft["text-align"] || ""}
          onChange={(e) => update("text-align", e.target.value)}
        >
          <option value="">Template default</option>
          {["left", "center", "right"].map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </label>
      <label>
        Text color
        <input
          placeholder="#202020"
          value={draft.color || ""}
          maxLength={7}
          onChange={(e) => update("color", e.target.value)}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button
        type="button"
        onClick={() => {
          if (
            editableStyleProperties.some(
              (k) => draft[k] && !validElementStyle(k, draft[k]),
            )
          ) {
            setError("Use a valid text size, spacing, or six-digit hex color.");
            return;
          }
          setError("");
          onApply(draft);
        }}
      >
        Apply typography
      </button>
      <button
        type="button"
        onClick={() => {
          setDraft({});
          setError("");
          onApply({});
        }}
      >
        Reset typography
      </button>
    </details>
  );
}
