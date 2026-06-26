/**
 * Drop-in replacement for fetch() in admin client components.
 * Automatically reads the csrf_token cookie and injects it as the
 * X-CSRF-Token header on every state-changing request.
 */

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function getCsrfToken() {
  const match = document.cookie
    .split(/;\s*/)
    .find((c) => c.startsWith("csrf_token="));
  return match ? match.slice("csrf_token=".length) : "";
}

export function csrfFetch(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  if (SAFE_METHODS.has(method)) {
    return fetch(url, options);
  }
  const token = getCsrfToken();
  if (!token) {
    console.warn("[csrfFetch] csrf_token cookie not found — request will be rejected. Cookies:", document.cookie);
  }
  const headers = new Headers(options.headers);
  headers.set("x-csrf-token", token);
  return fetch(url, { ...options, headers });
}
