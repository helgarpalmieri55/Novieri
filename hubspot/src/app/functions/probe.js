/**
 * TEMPORARY. Lists what the platform actually packaged, so the two real
 * functions can require their helpers by a path that exists.
 *
 * Both of them fail at load with "Cannot find module './lib/guard.js'" while
 * the entrypoint itself runs as /var/task/file.js — the entrypoint is moved,
 * and it is not documented where (or whether) the files beside it land. This
 * walks the runtime's own filesystem rather than guessing again.
 *
 * Delete this file, its -hsmeta.json, and the endpoint once the answer is in.
 */
const fs = require("fs");
const path = require("path");

function walk(dir, depth = 0) {
  if (depth > 3) return ["…"];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return [`${dir}: ${e.code}`];
  }
  const out = [];
  for (const e of entries) {
    // node_modules is large and not what is in question here.
    if (e.name === "node_modules") {
      out.push(`${path.join(dir, e.name)}/  (skipped)`);
      continue;
    }
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(`${full}/`);
      out.push(...walk(full, depth + 1));
    } else {
      out.push(full);
    }
  }
  return out;
}

exports.main = async (context, sendResponse) => {
  // Only /var/task/file.js and the platform's handler came back the first
  // time: the entrypoint is packaged alone, with neither the files beside it
  // nor node_modules. So what a function may call is whatever the runtime
  // itself provides — which is the next thing to establish.
  const has = (name) => {
    try {
      require(name);
      return "ok";
    } catch (e) {
      return e.code || String(e.message).slice(0, 60);
    }
  };
  const body = {
    cwd: process.cwd(),
    dirname: __dirname,
    filename: __filename,
    task: walk("/var/task"),
    node: process.version,
    globals: {
      fetch: typeof fetch,
      FormData: typeof FormData,
      AbortController: typeof AbortController,
    },
    modules: { axios: has("axios"), https: has("https"), crypto: has("crypto") },
    env: Object.keys(process.env).filter((k) => !/KEY|SECRET|TOKEN|PASS/i.test(k)).sort(),
  };
  const response = { statusCode: 200, headers: { "Content-Type": "application/json" }, body };
  if (typeof sendResponse === "function") return sendResponse(response);
  return response;
};
