/**
 * A component that no longer does anything.
 *
 * This was a diagnostic: it walked /var/task and reported what the platform
 * had packaged, which is how the "Cannot find module './lib/guard.js'" behind
 * both endpoints was finally explained — an app function is packaged as
 * exactly one file. The finding is written up in the README and acted on by
 * scripts/build-functions.mjs; nothing here is needed any more.
 *
 * It is emptied rather than deleted because deleting a component fails the
 * whole deploy — "You are about to remove a component", reported against every
 * other component too, with no CLI flag that answers it. Removing it for real
 * is a job for the project's page in HubSpot.
 */
exports.main = async (context, sendResponse) => {
  const response = { statusCode: 404, headers: { "Content-Type": "application/json" }, body: {} };
  if (typeof sendResponse === "function") return sendResponse(response);
  return response;
};
