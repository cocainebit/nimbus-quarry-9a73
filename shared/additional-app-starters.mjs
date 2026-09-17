import { appDesignSchema, designPresets } from "./app-design.mjs";
const field = (name, label, type = "text", extra = {}) => ({
  name,
  label,
  type,
  required: true,
  ...extra,
});
const optional = (name, label, type = "text", extra = {}) =>
  field(name, label, type, { required: false, ...extra });
const reference = (name, label, key) =>
  field(name, label, "reference", { referenceCollectionId: key });
const number = (name, label) => field(name, label, "number", { min: 0 });
const choice = (name, label, options) =>
  field(name, label, "enum", { options });
const progress = (options) => choice("status", "Status", options);
// Ordinary stages move one step at a time. Review stages permit a direct
// approval or a revision request, and approved work may reopen for review.
const workflow = (options) => {
  const transitions = Object.fromEntries(
    options.map((option, i) => [
      option,
      options.filter((_, j) => Math.abs(i - j) <= 1),
    ]),
  );
  const revise = options.indexOf("changes_requested");
  if (revise > 0 && options.includes("approved")) {
    const review = options[revise - 1];
    transitions[review] = [review, "changes_requested", "approved"];
    transitions.changes_requested = ["changes_requested", review];
    transitions.approved = ["approved", review];
  }
  return { ...progress(options), transitions };
};
const collection = (key, name, fields, view = "table") => ({
  key,
  definition: {
    name,
    fields,
    publicRead: false,
    memberCreate: true,
    editorAccess: true,
  },
  view,
  ...(fields.some((f) => f.name === "status") ? { statusField: "status" } : {}),
});
const count = (key, title) => ({
  id: `${key}-count`,
  title,
  type: "count",
  collectionId: key,
  limit: 5,
});
const group = (key, title) => ({
  id: `${key}-status`,
  title,
  type: "group",
  collectionId: key,
  field: "status",
  limit: 5,
});
const sum = (key, title, field) => ({
  id: `${key}-sum`,
  title,
  type: "sum",
  collectionId: key,
  field,
  limit: 5,
});
const recent = (key, title) => ({
  id: `${key}-recent`,
  title,
  type: "recent",
  collectionId: key,
  limit: 4,
});
const accessLimit =
  "Members see their own records. Assign the editor role explicitly for staff access across members; this is not organization-wide sharing.";
function starter(config) {
  const { theme, layout, heading, font, headingFont, widgets, ...rest } =
    config;
  const preset = designPresets.find((p) => p.id === theme);
  if (!preset) throw new Error(`Missing starter theme: ${theme}`);
  const design = appDesignSchema.parse({
    ...preset,
    font: font || preset.font,
    headingFont,
    layout,
    navigation: rest.navigation || "sidebar",
    heading,
    widgets,
  });
  return {
    ...rest,
    accent: design.palette.primary,
    background: design.palette.background,
    font: "sans-serif",
    radius: design.radius,
    design,
    designSource: {
      id: preset.id,
      name: preset.name,
      source: preset.source,
      sourceUrl: preset.sourceUrl,
    },
    limitations: [...rest.limitations, accessLimit],
  };
}
export const additionalAppStarters = [
  starter({
    id: "creative-agency",
    runtime: "portal",
    name: "Studio room",
    category: "Client portal",
    tagline: "A shared direction for every creative brief.",
    description:
      "Collect client briefs, connect deliverables to engagements, and keep review notes beside the work.",
    theme: "tweakcn-vintage-paper-light",
    layout: "client-home",
    font: "dm-sans",
    headingFont: "playfair",
    heading: "Make space for the next good idea.",
    features: [
      "Creative briefs",
      "Deliverable review board",
      "Linked feedback & files",
    ],
    widgets: [
      count("engagements", "Active engagements"),
      group("deliverables", "Deliverable stages"),
      recent("feedback", "Latest client feedback"),
    ],
    collections: [
      collection(
        "engagements",
        "Engagements",
        [
          field("name", "Engagement name"),
          field("brand", "Client brand"),
          field("brief", "Creative brief"),
          optional("target_date", "Target delivery", "date"),
          progress(["discovery", "production", "review", "delivered"]),
        ],
        "cards",
      ),
      collection(
        "deliverables",
        "Deliverables",
        [
          field("title", "Deliverable"),
          reference("engagement", "Engagement", "engagements"),
          choice("format", "Format", [
            "brand_identity",
            "website",
            "campaign",
            "print",
          ]),
          optional("attachment", "Work file", "file"),
          workflow(["draft", "internal_review", "client_review", "approved"]),
          optional("due_date", "Due date", "date"),
        ],
        "board",
      ),
      collection("feedback", "Feedback", [
        field("title", "Feedback summary"),
        reference("deliverable", "Deliverable", "deliverables"),
        field("notes", "Review notes"),
        choice("decision", "Review decision", [
          "comment",
          "changes_requested",
          "approved",
        ]),
        optional("reference_file", "Reference file", "file"),
      ]),
    ],
    limitations: [
      "Approval states are recorded decisions, not legal signatures. No design-tool or email synchronization.",
    ],
  }),
  starter({
    id: "consulting-engagements",
    runtime: "portal",
    name: "Advisory desk",
    category: "Professional services",
    tagline: "A clear thread from discovery to delivery.",
    description:
      "Track consulting engagements, session preparation, recommendations and the decisions they produce.",
    theme: "daisyui-corporate",
    layout: "executive",
    font: "inter",
    headingFont: "inter",
    heading: "Progress you can put into practice.",
    features: [
      "Engagement records",
      "Session preparation",
      "Action recommendations",
    ],
    widgets: [
      count("engagements", "Engagements"),
      group("recommendations", "Recommendation progress"),
      sum("sessions", "Planned session hours", "planned_hours"),
    ],
    collections: [
      collection(
        "engagements",
        "Engagements",
        [
          field("name", "Engagement"),
          field("organization", "Client organization"),
          field("objective", "Primary objective"),
          optional("start_date", "Start date", "date"),
          workflow(["discovery", "analysis", "delivery", "closed"]),
        ],
        "cards",
      ),
      collection("sessions", "Sessions", [
        field("title", "Session topic"),
        reference("engagement", "Engagement", "engagements"),
        field("session_date", "Session date", "date"),
        number("planned_hours", "Planned hours"),
        field("agenda", "Agenda"),
        optional("notes", "Session notes"),
      ]),
      collection(
        "recommendations",
        "Recommendations",
        [
          field("title", "Recommendation"),
          reference("engagement", "Engagement", "engagements"),
          field("rationale", "Rationale"),
          choice("impact", "Expected impact", ["low", "medium", "high"]),
          workflow(["proposed", "accepted", "in_progress", "complete"]),
          optional("due_date", "Target date", "date"),
        ],
        "board",
      ),
    ],
    limitations: [
      "Dates and planned hours are records only; no calendar availability, video meetings or time billing.",
    ],
  }),
  starter({
    id: "content-approvals",
    runtime: "tracker",
    name: "Proof desk",
    category: "Content operations",
    tagline: "From the first draft to a confident sign-off.",
    description:
      "Organize campaigns, move content through review, and keep revision notes attached to each piece.",
    theme: "tweakcn-amber-minimal-light",
    layout: "review",
    font: "manrope",
    headingFont: "manrope",
    heading: "Good content deserves a clear review.",
    features: [
      "Campaign briefs",
      "Content approval board",
      "Revision history records",
    ],
    widgets: [
      count("campaigns", "Campaigns"),
      group("content", "Review queue"),
      recent("reviews", "Recent review notes"),
    ],
    collections: [
      collection(
        "campaigns",
        "Campaigns",
        [
          field("name", "Campaign"),
          field("audience", "Target audience"),
          field("objective", "Campaign objective"),
          optional("launch_date", "Target launch", "date"),
          progress(["planned", "active", "complete"]),
        ],
        "cards",
      ),
      collection(
        "content",
        "Content pieces",
        [
          field("title", "Content title"),
          reference("campaign", "Campaign", "campaigns"),
          choice("channel", "Channel", ["website", "email", "social", "print"]),
          field("draft", "Draft copy"),
          optional("attachment", "Creative attachment", "file"),
          workflow(["draft", "in_review", "changes_requested", "approved"]),
          optional("publish_date", "Planned publication", "date"),
        ],
        "board",
      ),
      collection("reviews", "Review notes", [
        field("title", "Review summary"),
        reference("content", "Content piece", "content"),
        field("revision", "Revision number", "number", { min: 1 }),
        field("feedback", "Feedback"),
        choice("decision", "Decision", ["comment", "revise", "approve"]),
      ]),
    ],
    limitations: [
      "Publication dates are planning records; nothing is posted to external channels. Review records do not automatically change a content status.",
    ],
  }),
  starter({
    id: "software-helpdesk",
    runtime: "tracker",
    name: "Resolve",
    category: "Customer support",
    tagline: "Keep the context. Move the issue forward.",
    description:
      "Connect product environments, support tickets and troubleshooting notes in a private customer workspace.",
    theme: "tweakcn-supabase-light",
    layout: "queue",
    font: "inter",
    headingFont: "inter",
    heading: "A clearer path to resolution.",
    features: [
      "Customer environments",
      "Ticket triage board",
      "Linked troubleshooting notes",
    ],
    widgets: [
      count("environments", "Environments"),
      group("tickets", "Ticket status"),
      recent("updates", "Latest troubleshooting"),
    ],
    collections: [
      collection(
        "environments",
        "Environments",
        [
          field("name", "Environment name"),
          field("product", "Product"),
          field("version", "Product version"),
          choice("tier", "Environment type", [
            "production",
            "staging",
            "development",
          ]),
          optional("context", "Environment context"),
        ],
        "cards",
      ),
      collection(
        "tickets",
        "Tickets",
        [
          field("title", "Issue summary"),
          reference("environment", "Environment", "environments"),
          choice("severity", "Severity", ["low", "medium", "high", "critical"]),
          field("steps", "Steps to reproduce"),
          field("expected", "Expected behavior"),
          workflow(["open", "triaged", "investigating", "resolved", "closed"]),
          optional("attachment", "Screenshot or log", "file"),
        ],
        "board",
      ),
      collection("updates", "Troubleshooting notes", [
        field("title", "Update summary"),
        reference("ticket", "Ticket", "tickets"),
        field("details", "Technical findings"),
        choice("kind", "Update type", [
          "investigation",
          "workaround",
          "resolution",
        ]),
        optional("attachment", "Supporting file", "file"),
      ]),
    ],
    limitations: [
      "No automatic email ingestion, SLA timers, escalation, or issue-tracker synchronization. Avoid storing secrets in logs or descriptions.",
    ],
  }),
  starter({
    id: "event-planning",
    runtime: "portal",
    name: "Gather",
    category: "Event planning",
    tagline: "Every detail, with room to breathe.",
    description:
      "Plan event details, compare supplier proposals and organize milestones with a private planning workspace.",
    theme: "daisyui-pastel",
    layout: "concierge",
    font: "dm-sans",
    headingFont: "playfair",
    heading: "Bring the next gathering together.",
    features: [
      "Event briefs",
      "Supplier proposal records",
      "Planning checklist",
    ],
    widgets: [
      count("events", "Events"),
      sum("proposals", "Quoted supplier costs", "quoted_amount"),
      group("checklist", "Planning progress"),
    ],
    collections: [
      collection(
        "events",
        "Events",
        [
          field("name", "Event name"),
          field("event_date", "Event date", "date"),
          field("location", "Venue or location"),
          field("guest_count", "Estimated guests", "number", { min: 1 }),
          field("brief", "Event brief"),
          progress(["planning", "confirmed", "complete"]),
        ],
        "cards",
      ),
      collection("proposals", "Supplier proposals", [
        field("title", "Proposal title"),
        reference("event", "Event", "events"),
        field("supplier", "Supplier name"),
        field("email", "Contact email", "email"),
        number("quoted_amount", "Quoted amount"),
        field("currency", "Currency code", "text", { min: 3, max: 3 }),
        progress(["requested", "received", "selected", "declined"]),
      ]),
      collection(
        "checklist",
        "Planning tasks",
        [
          field("title", "Task"),
          reference("event", "Event", "events"),
          field("due_date", "Due date", "date"),
          workflow(["todo", "in_progress", "ready", "done"]),
          optional("notes", "Planning notes"),
        ],
        "board",
      ),
    ],
    limitations: [
      "No venue booking, payments, ticketing or availability checks. Quoted amounts are stored as entered; use one currency before reading a total.",
    ],
  }),
  starter({
    id: "asset-review",
    runtime: "portal",
    name: "Asset shelf",
    category: "Creative operations",
    tagline: "The right file. The right context.",
    description:
      "Group creative assets into collections, retain version records and connect review requests to uploaded files.",
    theme: "tweakcn-graphite-light",
    layout: "magazine",
    font: "manrope",
    headingFont: "manrope",
    heading: "A considered home for finished work.",
    features: [
      "Asset collections",
      "Private file versions",
      "Review request board",
    ],
    widgets: [
      count("libraries", "Libraries"),
      count("assets", "Asset versions"),
      group("reviews", "Review requests"),
    ],
    collections: [
      collection(
        "libraries",
        "Libraries",
        [
          field("name", "Library name"),
          field("purpose", "Library purpose"),
          optional("guidelines", "Usage guidelines"),
        ],
        "cards",
      ),
      collection(
        "assets",
        "Asset versions",
        [
          field("title", "Asset title"),
          reference("library", "Library", "libraries"),
          field("version", "Version number", "number", { min: 1 }),
          field("attachment", "Asset file", "file"),
          choice("format", "Asset type", [
            "image",
            "document",
            "video",
            "archive",
            "other",
          ]),
          optional("notes", "Version notes"),
        ],
        "cards",
      ),
      collection(
        "reviews",
        "Review requests",
        [
          field("title", "Review request"),
          reference("asset", "Asset version", "assets"),
          field("instructions", "Review instructions"),
          workflow(["requested", "reviewing", "changes_requested", "approved"]),
          optional("due_date", "Review due date", "date"),
        ],
        "board",
      ),
    ],
    limitations: [
      "Assets are private downloads, not an image-processing CDN or collaborative annotation tool. Version numbers are entered by members.",
    ],
  }),
  starter({
    id: "freelance-client-desk",
    runtime: "portal",
    name: "Solo desk",
    category: "Professional services",
    tagline: "Less chasing. More making.",
    description:
      "Keep client job scopes, work milestones and delivery handoffs in one focused freelance workspace.",
    theme: "tweakcn-caffeine-light",
    layout: "project-hub",
    font: "dm-sans",
    headingFont: "playfair",
    heading: "Make good work. Keep the details close.",
    features: ["Job scopes", "Milestone board", "Private delivery handoffs"],
    widgets: [
      count("jobs", "Client jobs"),
      sum("milestones", "Estimated work hours", "estimated_hours"),
      recent("handoffs", "Latest handoffs"),
    ],
    collections: [
      collection(
        "jobs",
        "Jobs",
        [
          field("name", "Job name"),
          field("client", "Client name"),
          field("scope", "Agreed scope"),
          optional("due_date", "Target completion", "date"),
          workflow(["scoping", "active", "review", "complete"]),
        ],
        "cards",
      ),
      collection(
        "milestones",
        "Milestones",
        [
          field("title", "Milestone"),
          reference("job", "Job", "jobs"),
          number("estimated_hours", "Estimated hours"),
          field("due_date", "Due date", "date"),
          workflow(["planned", "working", "review", "delivered"]),
        ],
        "board",
      ),
      collection("handoffs", "Handoffs", [
        field("title", "Handoff title"),
        reference("milestone", "Milestone", "milestones"),
        field("attachment", "Delivery file", "file"),
        field("instructions", "Delivery instructions"),
        optional("acknowledged", "Acknowledged", "boolean"),
      ]),
    ],
    limitations: [
      "No contracts, invoices, payment collection or time tracking. Acknowledgments are editable records, not electronic signatures.",
    ],
  }),
  starter({
    id: "customer-onboarding",
    runtime: "portal",
    name: "First steps",
    category: "Customer success",
    tagline: "A thoughtful start to a lasting relationship.",
    description:
      "Capture customer goals, coordinate implementation steps and keep launch resources connected to each account.",
    theme: "tweakcn-ocean-breeze-light",
    layout: "welcome",
    font: "inter",
    headingFont: "manrope",
    heading: "A good beginning makes all the difference.",
    features: [
      "Customer goals",
      "Implementation checklist",
      "Launch resource library",
    ],
    widgets: [
      count("accounts", "Customer accounts"),
      group("steps", "Implementation progress"),
      recent("resources", "Latest launch resources"),
    ],
    collections: [
      collection(
        "accounts",
        "Customer accounts",
        [
          field("name", "Customer organization"),
          field("contact_email", "Primary contact email", "email"),
          field("goals", "Success goals"),
          field("target_launch", "Target launch date", "date"),
          progress(["discovery", "implementation", "live"]),
        ],
        "cards",
      ),
      collection(
        "steps",
        "Implementation steps",
        [
          field("title", "Implementation step"),
          reference("account", "Customer account", "accounts"),
          choice("phase", "Phase", [
            "discovery",
            "configuration",
            "training",
            "launch",
          ]),
          field("due_date", "Target date", "date"),
          workflow(["pending", "working", "validation", "complete"]),
          optional("notes", "Implementation notes"),
        ],
        "board",
      ),
      collection("resources", "Launch resources", [
        field("title", "Resource title"),
        reference("account", "Customer account", "accounts"),
        field("attachment", "Resource file", "file"),
        field("instructions", "How to use this resource"),
        choice("kind", "Resource type", [
          "guide",
          "configuration",
          "training",
          "handover",
        ]),
      ]),
    ],
    limitations: [
      "This portal tracks onboarding; it does not provision external accounts, send invitations, or configure third-party products.",
    ],
  }),
];
