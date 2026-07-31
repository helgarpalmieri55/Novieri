/**
 * Pre-flight for the HubSpot theme.
 *
 * Every rule below is one we learned from a failed build: HubSpot only tells
 * you about the first broken thing, one upload at a time, so a run that takes
 * three minutes to fail on a reserved field name costs an afternoon. This
 * checks all of them at once, locally, in under a second.
 *
 * Run: node scripts/check-hubspot-theme.mjs
 */
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, basename } from "node:path";

const THEME = "hubspot/src/theme/novieri";
const MODULES = join(THEME, "modules");
const TEMPLATES = join(THEME, "templates");

/** HubSpot refuses these outright — they collide with its own module context. */
const RESERVED = new Set(["label", "name", "body"]);
/** meta.json rejects anything it doesn't document. */
const META_KEYS = new Set([
  "label",
  "is_available_for_new_content",
  "global",
  "host_template_types",
  "icon",
  "categories",
  "content_types",
  "master_language",
  "placeholder",
]);
/** Referenced in HubL but not declared as fields — HubSpot provides them. */
const BUILTIN_MODULE_KEYS = new Set(["styles", "id", "css_class", "hubl"]);

const errors = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    fail(path, `invalid JSON — ${e.message}`);
    return null;
  }
}

/** Field names must be unique across the whole module, not per group. */
function collectNames(fields, path, into, where) {
  for (const field of fields) {
    if (!field || typeof field !== "object") {
      fail(where, `${path}: field is not an object`);
      continue;
    }
    const { name, type } = field;
    if (typeof name !== "string" || !name) {
      fail(where, `${path}: a field has no name`);
      continue;
    }
    if (RESERVED.has(name)) fail(where, `field name "${name}" is reserved by HubSpot`);
    if (!/^[a-z][a-z0-9_]*$/.test(name)) fail(where, `field name "${name}" must be lower_snake_case`);
    if (into.has(name)) fail(where, `field name "${name}" is used twice (names are module-wide, not per group)`);
    into.add(name);
    if (type === "textarea") fail(where, `field "${name}": textarea is not a field type — use text with allow_new_line`);
    if (Array.isArray(field.children)) collectNames(field.children, `${path}.${name}`, into, where);
  }
}

const moduleNames = new Set();
const moduleTopLevel = new Map();

for (const entry of readdirSync(MODULES)) {
  const dir = join(MODULES, entry);
  if (!statSync(dir).isDirectory()) continue;
  if (!entry.endsWith(".module")) {
    fail(dir, "module directories must end in .module");
    continue;
  }
  const short = basename(entry, ".module");
  moduleNames.add(short);

  for (const required of ["meta.json", "fields.json", "module.hubl.htm"]) {
    if (!existsSync(join(dir, required))) fail(dir, `missing ${required}`);
  }
  for (const wrong of ["module.html", "module.js", "module.css", "fields.js"]) {
    if (existsSync(join(dir, wrong))) fail(dir, `${wrong} — project modules use module.hubl.* names`);
  }

  const meta = readJson(join(dir, "meta.json"));
  if (meta) {
    for (const key of Object.keys(meta)) {
      if (!META_KEYS.has(key)) fail(join(dir, "meta.json"), `unsupported key "${key}"`);
    }
    if (typeof meta.label !== "string") fail(join(dir, "meta.json"), "label is required");
  }

  const fields = readJson(join(dir, "fields.json"));
  if (!Array.isArray(fields)) {
    if (fields !== null) fail(join(dir, "fields.json"), "must be an array");
    continue;
  }
  const names = new Set();
  collectNames(fields, "", names, join(dir, "fields.json"));
  moduleTopLevel.set(short, names);

  // Every module.<something> in the markup has to be a field that exists.
  const htmlPath = join(dir, "module.hubl.htm");
  if (existsSync(htmlPath)) {
    const html = readFileSync(htmlPath, "utf8");
    for (const [, key] of html.matchAll(/\bmodule\.([a-z_][a-z0-9_]*)/g)) {
      if (!names.has(key) && !BUILTIN_MODULE_KEYS.has(key)) {
        fail(htmlPath, `module.${key} is not a field in fields.json`);
      }
    }
  }
}

// Templates: the annotation block, and every module path they point at.
for (const entry of readdirSync(TEMPLATES, { recursive: true })) {
  if (!entry.endsWith(".html")) continue;
  const path = join(TEMPLATES, entry);
  const html = readFileSync(path, "utf8");

  if (!/templateType:\s*\S+/.test(html)) fail(path, "no templateType in the annotation comment");
  if (!/label:\s*\S+/.test(html)) fail(path, "no label in the annotation comment");

  for (const [, ref] of html.matchAll(/path=["']\.\.\/(?:\.\.\/)?modules\/([a-z0-9-]+)["']/g)) {
    if (!moduleNames.has(ref)) fail(path, `points at ../modules/${ref}, which does not exist`);
  }
}

// The stylesheet is generated from the markup — a stale @source glob silently
// drops half the design, with no error anywhere.
const entryCss = readFileSync("hubspot/build/theme.css", "utf8");
for (const glob of ["modules/**/*.htm", "modules/**/*.js", "templates/**/*.html"]) {
  if (!entryCss.includes(glob)) fail("hubspot/build/theme.css", `@source no longer covers ${glob}`);
}

if (errors.length) {
  console.error(`\n${errors.length} problem${errors.length === 1 ? "" : "s"} in the HubSpot theme:\n`);
  for (const e of errors) console.error(`  · ${e}`);
  process.exit(1);
}
console.log(`HubSpot theme OK — ${moduleNames.size} modules, all references resolve.`);
