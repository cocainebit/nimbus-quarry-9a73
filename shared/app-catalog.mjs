import { additionalAppStarters } from "./additional-app-starters.mjs";
import { getAppDesign } from "./app-design.mjs";
const text = (name, label, extra = {}) => ({
  name,
  label,
  type: "text",
  required: true,
  ...extra,
});
const status = (options) => ({
  name: "status",
  label: "Status",
  type: "enum",
  options,
  required: true,
});
const reference = (name, label, key) => ({
  name,
  label,
  type: "reference",
  referenceCollectionId: key,
  required: true,
});
const privateCollection = (name, fields) => ({
  name,
  fields,
  publicRead: false,
  memberCreate: true,
  editorAccess: true,
});
export const appCatalog = [
  {
    id: "portal",
    name: "Client space",
    category: "Client portal",
    tagline: "A calmer way to work together.",
    description:
      "Give clients a private place to submit requests, share files, and track progress.",
    accent: "#927551",
    background: "#f6f3ee",
    font: "Georgia, serif",
    radius: 12,
    features: ["Private requests", "Document uploads", "Client updates"],
    collections: [
      {
        key: "projects",
        definition: privateCollection("Projects", [
          text("name", "Project name", { unique: true }),
          text("description", "Description", { required: false }),
          status(["active", "review", "complete"]),
        ]),
        view: "cards",
        statusField: "status",
      },
      {
        key: "requests",
        definition: privateCollection("Requests", [
          text("title", "Request title"),
          reference("project", "Project", "projects"),
          text("details", "Details"),
          status(["submitted", "in_progress", "review", "complete"]),
          {
            name: "due_date",
            label: "Due date",
            type: "date",
            required: false,
          },
        ]),
        view: "board",
        statusField: "status",
      },
      {
        key: "documents",
        definition: privateCollection("Documents", [
          text("title", "Document name"),
          reference("request", "Related request", "requests"),
          {
            name: "attachment",
            label: "Document",
            type: "file",
            required: true,
          },
          text("notes", "Notes", { required: false }),
        ]),
        view: "table",
      },
    ],
    limitations: [
      "No invoicing or payment collection.",
      "Clients see their own records; designated editors can manage all records.",
    ],
  },
  {
    id: "crm",
    name: "Pipeline",
    category: "Sales CRM",
    tagline: "Every conversation. One clear view.",
    description:
      "Keep contacts organized and move real opportunities through your sales process.",
    accent: "#4b61d1",
    background: "#f4f5fb",
    font: "sans-serif",
    radius: 10,
    features: ["Contact database", "Deal pipeline", "Linked opportunities"],
    collections: [
      {
        key: "contacts",
        definition: privateCollection("Contacts", [
          text("name", "Full name"),
          {
            name: "email",
            label: "Email",
            type: "email",
            required: true,
            unique: true,
          },
          text("company", "Company", { required: false }),
          text("notes", "Notes", { required: false }),
        ]),
        view: "table",
      },
      {
        key: "deals",
        definition: privateCollection("Opportunities", [
          text("title", "Opportunity"),
          reference("contact", "Contact", "contacts"),
          {
            name: "value",
            label: "Value",
            type: "number",
            min: 0,
            required: true,
          },
          status(["new", "qualified", "proposal", "won", "lost"]),
          {
            name: "close_date",
            label: "Expected close date",
            type: "date",
            required: false,
          },
        ]),
        view: "board",
        statusField: "status",
      },
    ],
    limitations: [
      "No automatic email sync or billing.",
      "Amounts are stored values; currency conversion and revenue recognition are not provided.",
    ],
  },
  {
    id: "tracker",
    name: "Momentum",
    category: "Project workspace",
    tagline: "Make room for your best work.",
    description:
      "Organize projects and related tasks with a focused, practical team workspace.",
    accent: "#22846c",
    background: "#eef5f1",
    font: "sans-serif",
    radius: 16,
    features: ["Project collections", "Task board", "Priority & due dates"],
    collections: [
      {
        key: "projects",
        definition: privateCollection("Projects", [
          text("name", "Project name", { unique: true }),
          text("description", "Description", { required: false }),
          status(["active", "paused", "complete"]),
        ]),
        view: "cards",
        statusField: "status",
      },
      {
        key: "tasks",
        definition: privateCollection("Tasks", [
          text("title", "Task"),
          reference("project", "Project", "projects"),
          status(["todo", "in_progress", "review", "done"]),
          {
            name: "priority",
            label: "Priority",
            type: "enum",
            options: ["low", "medium", "high"],
            required: true,
          },
          {
            name: "due_date",
            label: "Due date",
            type: "date",
            required: false,
          },
          text("description", "Details", { required: false }),
        ]),
        view: "board",
        statusField: "status",
      },
    ],
    limitations: [
      "No automatic scheduling or dependency solver.",
      "Team-wide access requires assigning the editor role in App backend.",
    ],
  },
  ...additionalAppStarters,
];
export function catalogMetadata() {
  return appCatalog.map(({ collections, ...rest }) => ({
    ...rest,
    runtime: rest.runtime || rest.id,
    design:
      rest.design ||
      getAppDesign({ template: rest.runtime || rest.id, title: rest.name }),
    screens: collections.map((c) => ({
      key: c.key,
      label: c.definition.name,
      view: c.view,
      ...(c.statusField ? { statusField: c.statusField } : {}),
    })),
    collectionCount: collections.length,
  }));
}
