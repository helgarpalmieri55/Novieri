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
const create = args.includes("--create");
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

/**
 * Tries to create the Insights blog through the API. HubSpot's docs treat
 * blog creation as a Settings-UI act, but the endpoints exist in the OpenAPI
 * spec — so this attempts v3 and falls back to v2, logging exactly what the
 * portal said. If both refuse, the two-minute path in Settings > Content >
 * Blog remains, and every other mode here works the same either way.
 */
if (create) {
  const TEMPLATES = "@projects/Novieri website/novieri_theme/templates";
  // The v3 settings endpoint refuses POST (405); the legacy v2 one is the
  // path that actually created this portal's blog. Idempotent by language:
  // whichever half of the pair exists is left alone.
  const makeBlog = async (body) => {
    const made = await api("/content/api/v2/blogs", { method: "POST", body: JSON.stringify(body) });
    console.log(`created blog ${made.id} (${made.name}) — ${made.absolute_url || ""}`);
    return { id: String(made.id), url: made.absolute_url || "" };
  };
  const all = await blogs();
  let enBlog = all.find((b) => !b.language || b.language.startsWith("en"));
  let esBlog = all.find((b) => b.language && b.language.startsWith("es"));

  if (enBlog) {
    console.log(`en blog exists: ${enBlog.id}  ${enBlog.url}`);
  } else {
    enBlog = await makeBlog({
      name: "Insights",
      slug: "insights",
      language: "en",
      item_template_path: `${TEMPLATES}/blog-post.hubl.html`,
      listing_template_path: `${TEMPLATES}/blog-listing.hubl.html`,
    });
  }
  if (esBlog) {
    console.log(`es blog exists: ${esBlog.id}  ${esBlog.url}`);
  } else {
    // Declared a translation of the English blog, which is what lets posts
    // join language groups — the missing piece the first sync tripped on.
    esBlog = await makeBlog({
      name: "Insights (ES)",
      slug: "es/insights",
      language: "es",
      translated_from_id: Number(enBlog.id),
      item_template_path: `${TEMPLATES}/blog-post.hubl.html`,
      listing_template_path: `${TEMPLATES}/blog-listing.hubl.html`,
    });
  }
  process.exit(0);
}

if (!sync) {
  console.log("Nothing to do — pass --list, --create or --sync.");
  process.exit(0);
}

const files = readdirSync("content/insights").filter((f) => f.endsWith(".json")).sort();
const topics = files.map((f) => ({ file: f, ...JSON.parse(readFileSync(`content/insights/${f}`, "utf8")) }));
console.log(`${topics.length} topic(s) in content/insights\n`);

const all = await blogs();
if (!all.length) {
  console.error("No blogs in the portal — run --create first.");
  process.exit(1);
}
// One blog per language: English posts to the English blog, Spanish to the
// Spanish one, which is what gives each language its own listing page.
const enBlog = blogIdArg ? all.find((b) => b.id === blogIdArg) : all.find((b) => !b.language || b.language.startsWith("en"));
const esBlog = all.find((b) => b.language && b.language.startsWith("es"));
if (!enBlog) {
  console.error("No English blog found. --list shows what exists.");
  process.exit(1);
}
console.log(`en -> blog ${enBlog.id} (${enBlog.url})`);
console.log(esBlog ? `es -> blog ${esBlog.id} (${esBlog.url})\n` : "es -> NO SPANISH BLOG — run --create first; Spanish posts will land in the English blog\n");

if (dryRun) {
  for (const t of topics) {
    console.log(`  ${t.file}`);
    console.log(`    en  /${t.en.slug}  ${t.en.title}`);
    console.log(`    es  /${t.es.slug}  ${t.es.title}`);
  }
  process.exit(0);
}

/** slug -> post, per blog. A post's slug includes the blog's own prefix. */
async function postsOf(b) {
  const map = new Map();
  if (!b) return map;
  for (const p of (await api(`/cms/v3/blogs/posts?${new URLSearchParams({ limit: "100", contentGroupId: b.id })}`)).results || []) {
    map.set(p.slug, p);
  }
  return map;
}
const existingEn = await postsOf(enBlog);
const existingEs = await postsOf(esBlog);

// A published post must carry an author. The byline is the company — same
// decision the post template made by not rendering an author card.
let authorId;
{
  const authors = await api(`/cms/v3/blogs/authors?${new URLSearchParams({ limit: "100" })}`);
  const found = (authors.results || []).find((a) => a.displayName === "Novieri" || a.name === "Novieri");
  if (found) {
    authorId = found.id;
  } else {
    const made = await api("/cms/v3/blogs/authors", {
      method: "POST",
      body: JSON.stringify({ displayName: "Novieri", fullName: "Novieri", email: "sales@novieri.com" }),
    });
    authorId = made.id;
    console.log(`author  Novieri — id ${authorId}`);
  }
}

/** Creates or updates one language's post in its language's blog; returns its id. */
async function upsert(v, language) {
  const blog = language === "es" && esBlog ? esBlog : enBlog;
  const existing = language === "es" && esBlog ? existingEs : existingEn;
  const body = {
    name: v.title,
    slug: v.slug,
    contentGroupId: blog.id,
    postBody: v.body,
    metaDescription: v.metaDescription,
    htmlTitle: `${v.title} — Novieri`,
    blogAuthorId: authorId,
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
  // The first sync ran before the Spanish blog existed, so its Spanish posts
  // landed in the English blog; they move by cleanup, not by leaving both.
  if (esBlog && existingEn.has(t.es.slug)) {
    const stray = existingEn.get(t.es.slug);
    await api(`/cms/v3/blogs/posts/${stray.id}`, { method: "DELETE" });
    existingEn.delete(t.es.slug);
    console.log(`clean   /${t.es.slug} — removed from the English blog`);
  }
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
