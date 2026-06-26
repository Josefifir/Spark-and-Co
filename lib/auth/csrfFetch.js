/**
 * Drop-in replacement for fetch() in admin client components.
 * Automatically reads the csrf_token cookie and injects it as the
 * X-CSRF-Token header on every state-changing request.
 */

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function getCsrfToken() {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith("csrf_token="))
    ?.split("=")[1] ?? "";
}

export function csrfFetch(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  if (SAFE_METHODS.has(method)) {
    return fetch(url, options);
  }
  const headers = new Headers(options.headers);
  headers.set("x-csrf-token", getCsrfToken());
  return fetch(url, { ...options, headers });
}
