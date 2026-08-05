/**
 * Puts the Insights posts into HubSpot's blog.
 *
 * Pages have create-hubspot-pages.mjs; posts are a different API with
 * different rules — a post belongs to a blog (content group), carries a
 * language, and its URL is the blog root plus the slug, none of which this
 * repo controls. So this script discovers before it writes:
 *
 *   node scripts/manage-hubspot-blog.mjs --list          # blogs + their posts
 *   node scripts/manage-hubspot-blog.mjs --sync --dry-run
 *   node scripts/manage-hubspot-blog.mjs --sync          # upsert + publish
 *   node scripts/manage-hubspot-blog.mjs --sync --blog-id=123   # not the first blog
 *
 * Posts come from content/insights/*.json, one file per topic with an `en`
 * and an `es` version. Upsert is by slug: an existing slug is updated in
 * place, so editing a post's JSON and re-running is the whole workflow.
 * After both languages exist the pair is joined into a language group, which
 * is what makes hreflang and the language switcher work for posts.
 */
import { readFileSync, readdirSync } from "node:fs";

const TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
const args = process.argv.slice(2);
const list = args.includes("--list");
const sync = args.includes("--sync");
const dryRun = args.includes("--dry-run");
const blogIdArg = (args.find((a) => a.startsWith("--blog-id=")) || "").split("=")[1];

async function api(path, options = {}) {
  const res = await fetch(`https://api.hubapi.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text.slice(0, 400) };
  }
  if (!res.ok) {
    const err = new Error(`${res.status} ${body.message || body.raw || res.statusText}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

if (!TOKEN) {
  console.error("HUBSPOT_PRIVATE_APP_TOKEN is not set.");
  process.exit(1);
}

/** Every blog in the portal. Settings v3 first; the v2 shape as fallback. */
async function blogs() {
  try {
    const res = await api("/cms/v3/blogs/settings?limit=100");
    return (res.results || []).map((b) => ({
      id: String(b.id),
      name: b.name,
      url: b.absoluteUrl || b.rootUrl || "",
      language: b.language || "",
    }));
  } catch (e) {
    console.log(`(v3 settings unavailable: ${String(e.message).slice(0, 80)} — trying v2)`);
    const res = await api("/content/api/v2/blogs?limit=100");
    return (res.objects || []).map((b) => ({
      id: String(b.id),
      name: b.name,
      url: b.absolute_url || "",
      language: b.language || "",
    }));
  }
}

if (list) {
  const all = await blogs();
  if (!all.length) {
    console.log("No blogs in the portal. Create one in Settings > Website > Blog first.");
    process.exit(0);
  }
  for (const b of all) {
    console.log(`blog  ${b.id}  ${b.name}  ${b.url}  ${b.language || "(no language)"}`);
    const posts = await api(
      `/cms/v3/blogs/posts?${new URLSearchParams({ limit: "100", contentGroupId: b.id })}`,
    );
    for (const p of posts.results || []) {
      console.log(`  post  ${p.id}  [${p.currentState || p.state}]  ${p.language || "?"}  /${p.slug}  ${p.name}`);
    }
  }
  process.exit(0);
}

if (!sync) {
  console.log("Nothing to do — pass --list or --sync.");
  process.exit(0);
}

const files = readdirSync("content/insights").filter((f) => f.endsWith(".json")).sort();
const topics = files.map((f) => ({ file: f, ...JSON.parse(readFileSync(`content/insights/${f}`, "utf8")) }));
console.log(`${topics.length} topic(s) in content/insights\n`);

const all = await blogs();
if (!all.length) {
  console.error("No blogs in the portal. Create one in Settings > Website > Blog, then re-run.");
  process.exit(1);
}
const blog = blogIdArg ? all.find((b) => b.id === blogIdArg) : all[0];
if (!blog) {
  console.error(`No blog with id ${blogIdArg}. --list shows what exists.`);
  process.exit(1);
}
console.log(`Writing into blog ${blog.id} (${blog.name}, ${blog.url})\n`);

if (dryRun) {
  for (const t of topics) {
    console.log(`  ${t.file}`);
    console.log(`    en  /${t.en.slug}  ${t.en.title}`);
    console.log(`    es  /${t.es.slug}  ${t.es.title}`);
  }
  process.exit(0);
}

const existing = new Map();
for (const p of (await api(`/cms/v3/blogs/posts?${new URLSearchParams({ limit: "100", contentGroupId: blog.id })}`)).results || []) {
  existing.set(p.slug, p);
}

/** Creates or updates one language's post; returns its id. */
async function upsert(v, language) {
  const body = {
    name: v.title,
    slug: v.slug,
    contentGroupId: blog.id,
    postBody: v.body,
    metaDescription: v.metaDescription,
    htmlTitle: `${v.title} — Novieri`,
    language,
    useFeaturedImage: false,
    publishDate: new Date().toISOString(),
    state: "PUBLISHED",
  };
  const found = existing.get(v.slug);
  if (found) {
    await api(`/cms/v3/blogs/posts/${found.id}`, { method: "PATCH", body: JSON.stringify(body) });
    console.log(`update  ${language}  /${v.slug}`);
    return found.id;
  }
  const made = await api("/cms/v3/blogs/posts", { method: "POST", body: JSON.stringify(body) });
  console.log(`create  ${language}  /${v.slug} — id ${made.id} [${made.currentState || made.state}]`);
  // A post born DRAFT still needs its first push live; PATCHing state covers
  // the portals where POST ignores it.
  if ((made.currentState || made.state) !== "PUBLISHED") {
    try {
      await api(`/cms/v3/blogs/posts/${made.id}`, {
        method: "PATCH",
        body: JSON.stringify({ publishDate: new Date().toISOString(), state: "PUBLISHED" }),
      });
      console.log(`publish ${language}  /${v.slug}`);
    } catch (e) {
      console.log(`publish? ${v.slug} — ${String(e.message).slice(0, 120)} (publish it in the editor)`);
    }
  }
  return made.id;
}

for (const t of topics) {
  const enId = await upsert(t.en, "en");
  const esId = await upsert(t.es, "es");
  // Same story as the pages: the pair has to be declared a language group or
  // the switcher and hreflang treat them as strangers.
  try {
    await api("/cms/v3/blogs/posts/multi-language/attach-to-lang-group", {
      method: "POST",
      body: JSON.stringify({ id: esId, language: "es", primaryId: enId, primaryLanguage: "en" }),
    });
    console.log(`group   ${t.en.slug} <-> ${t.es.slug}`);
  } catch (e) {
    console.log(`group?  ${t.en.slug} — ${String(e.message).slice(0, 120)}`);
  }
}

console.log("\nDone. --list shows the result; the blog's URL above is where the menu should point.");
