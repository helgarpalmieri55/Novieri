/**
 * Seeds the theme's repeating field groups from the site's own copy.
 *
 * A repeating group in HubSpot takes a `default` **array** — one object per
 * row. Without it, `occurrence.default: 4` renders the single child default
 * four times, which is how a freshly created page came up reading "AI &
 * automation" in all four pillar cards and "1000+ users assisted as cto"
 * three times across the stat strip.
 *
 * This is a seeding tool, not a build step: run it once, review the diff,
 * commit the fields.json files. Once the copy lives in HubSpot pages, HubSpot
 * is the source of truth and this only matters for the next page created from
 * a template.
 *
 *   node scripts/seed-hubspot-defaults.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const en = JSON.parse(readFileSync("messages/en.json", "utf8"));
const MODULES = "hubspot/src/theme/novieri/modules";

/** Accent colours, in the order the home page cycles them. */
const ACCENTS = ["text-plum", "text-teal", "text-gold-deep", "text-ink-muted"];
const PILLARS = [
  ["ai", "/services/ai-automation"],
  ["managedIt", "/services/managed-it"],
  ["security", "/services/cybersecurity-compliance"],
  ["software", "/services/custom-software"],
];

const link = (href) => ({ url: { type: "CONTENT", href } });

/** A chat row in the editor's shape: one `row_kind`, everything else optional. */
function chatRow(entry) {
  return {
    row_kind: entry.kind || entry.from,
    message: entry.text || "",
    caption: entry.label || "",
    duration: entry.duration || "",
    sent_at: entry.t || "",
  };
}

const seeds = {
  "hero.module": {
    ticker: [
      { word: en.pillars.ai.name, colour: "text-plum" },
      { word: en.pillars.managedIt.name, colour: "text-teal" },
      { word: en.pillars.security.name, colour: "text-gold-deep" },
      { word: en.pillars.software.name, colour: "text-ink-muted" },
    ],
  },
  "stat-strip.module": {
    stats: en.home.proof.items.map((item, i) => ({
      value: item.value,
      stat_label: item.label,
      colour: ACCENTS[i % 3],
    })),
  },
  "pillar-cards.module": {
    cards: PILLARS.map(([key, href], i) => ({
      card_name: en.pillars[key].name,
      card_tagline: en.pillars[key].tagline,
      card_tags: en.pillars[key].tags.join(", "),
      card_colour: ACCENTS[i],
      card_link: link(href),
    })),
  },
  "chat-demo.module": {
    entries: en.home.liveChat.entries.map(chatRow),
    capabilities: en.home.liveChat.foot.map((c) => ({ capability: c })),
  },
  "why-points.module": {
    points: en.home.why.points.map((p) => ({ point_title: p.title, point_body: p.body })),
  },
  "how-steps.module": {
    steps: en.home.how.steps.map((s) => ({ step_title: s.title, step_body: s.body })),
  },
  "diagnostic-quiz.module": {
    questions: en.diagnostic.questions.map((q) => ({
      question_text: q.q,
      options: q.options.map((o) => ({ option_text: o.v, option_weight: o.w })),
    })),
    levels: ["initial", "developing", "solid", "advanced"].map((k) => ({
      level_name: en.diagnostic.levels[k],
    })),
  },
};

let changed = 0;
for (const [moduleDir, groups] of Object.entries(seeds)) {
  const path = `${MODULES}/${moduleDir}/fields.json`;
  const fields = JSON.parse(readFileSync(path, "utf8"));

  for (const [groupName, rows] of Object.entries(groups)) {
    const field = fields.find((f) => f.name === groupName);
    if (!field) throw new Error(`${moduleDir}: no field named "${groupName}"`);
    if (field.type !== "group") throw new Error(`${moduleDir}.${groupName} is not a group`);

    // Every key in a seeded row must be a real child of the group, or the
    // editor silently drops it and the module renders a blank row.
    const children = new Set(field.children.map((c) => c.name));
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        if (!children.has(key)) throw new Error(`${moduleDir}.${groupName}: "${key}" is not a child field`);
      }
    }

    field.default = rows;
    field.occurrence = { ...field.occurrence, default: rows.length };
    changed += 1;
  }
  writeFileSync(path, `${JSON.stringify(fields, null, 2)}\n`);
}
console.log(`seeded ${changed} repeating groups across ${Object.keys(seeds).length} modules`);
