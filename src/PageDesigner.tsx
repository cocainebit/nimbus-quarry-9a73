import { useRef } from "react";
import { Puck, type Config, type Data } from "@puckeditor/core";
import { ArrowLeft } from "lucide-react";
import {
  kinds,
  makeSection,
  type Section,
  type Page,
  type Project,
} from "./model";
import { sectionSchema } from "../shared/schema.mjs";
import { Block } from "./blocks";
import { ImageField, LinkField } from "./SectionFields";
export default function PageDesigner({
  project,
  page,
  onSave,
  onClose,
  onChooseDesign,
}: {
  project: Project;
  page: Page;
  onSave: (sections: Section[]) => void;
  onClose: () => void;
  onChooseDesign?: () => void;
}) {
  const dirty = useRef(false);
  const config: Config<{ Section: Omit<Section, "id"> }> = {
    components: {
      Section: {
        label: "Website section",
        fields: {
          kind: {
            type: "select",
            options: kinds.map((value) => ({ label: value, value })),
          },
          title: { type: "text" },
          body: { type: "textarea" },
          eyebrow: { type: "text" },
          variant: {
            type: "select",
            options: ["split", "centered", "reverse"].map((value) => ({
              label: value,
              value,
            })),
          },
          tone: {
            type: "select",
            options: ["default", "accent", "dark"].map((value) => ({
              label: value,
              value,
            })),
          },
          spacing: {
            type: "select",
            options: ["compact", "normal", "spacious"].map((value) => ({
              label: value,
              value,
            })),
          },
          image: {
            type: "custom",
            render: ({ value, onChange }) => (
              <ImageField value={value || ""} alt="" onChange={onChange} />
            ),
          },
          imageAlt: { type: "text", label: "Image description" },
          buttonLabel: { type: "text" },
          buttonHref: {
            type: "custom",
            render: ({ value, onChange }) => (
              <LinkField
                value={value || ""}
                onChange={onChange}
                project={project}
              />
            ),
          },
          items: {
            type: "array",
            getItemSummary: (item) => item.title || "Item",
            defaultItemProps: {
              title: "New item",
              body: "",
              image: "",
              alt: "",
              price: "",
              label: "",
              href: "",
            },
            arrayFields: {
              title: { type: "text" },
              body: { type: "textarea" },
              price: { type: "text" },
              label: { type: "text" },
              href: {
                type: "custom",
                render: ({ value, onChange }) => (
                  <LinkField
                    value={value || ""}
                    onChange={onChange}
                    project={project}
                  />
                ),
              },
              image: {
                type: "custom",
                render: ({ value, onChange }) => (
                  <ImageField value={value || ""} alt="" onChange={onChange} />
                ),
              },
              alt: { type: "text" },
            },
          },
        },
        defaultProps: makeSection("story"),
        render: (props) => (
          <div
            className="site-page"
            style={
              {
                "--site-accent": project.theme.accent,
                "--site-bg": project.theme.background,
                "--site-radius": `${project.theme.radius}px`,
                fontFamily: project.theme.font,
              } as React.CSSProperties
            }
          >
            <Block section={{ ...props, id: "preview" }} project={project} />
          </div>
        ),
      },
    },
  };
  const initial: Data<{ Section: Omit<Section, "id"> }> = {
    content: page.sections.map((s) => ({ type: "Section", props: s })),
    root: {},
  };
  function save(data: Data<{ Section: Omit<Section, "id"> }>) {
    try {
      onSave(data.content.map((c) => sectionSchema.parse(c.props)));
      dirty.current = false;
      onClose();
    } catch {
      window.alert(
        "Some links or images are invalid. Fix their addresses before saving.",
      );
    }
  }
  return (
    <div className="puck-screen">
      <div className="puck-top">
        <button
          className="secondary"
          onClick={() => {
            if (
              !dirty.current ||
              window.confirm("Discard unsaved visual-editor changes?")
            )
              onClose();
          }}
        >
          <ArrowLeft size={15} />
          Back to canvas
        </button>
        <strong>{page.name} · Website page editor</strong>
        {onChooseDesign && (
          <button
            className="secondary"
            onClick={() => {
              if (
                !dirty.current ||
                window.confirm(
                  "Discard unsaved visual-editor changes before choosing a design?",
                )
              )
                onChooseDesign();
            }}
          >
            Choose starting design
          </button>
        )}
        <span>
          Drag sections to reorder · Save changes applies edits to this project
        </span>
      </div>
      <Puck
        config={config}
        data={initial}
        headerTitle={page.name}
        onChange={() => {
          dirty.current = true;
        }}
        renderHeaderActions={({ state }) => (
          <button className="dark-button" onClick={() => save(state.data)}>
            Save changes
          </button>
        )}
        onPublish={save}
      />
    </div>
  );
}
