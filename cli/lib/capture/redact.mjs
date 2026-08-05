/**
 * Redaction, applied before anything touches disk.
 *
 * A capture records whatever the product printed, and products print tokens,
 * home directories and hostnames. Redacting at write time rather than at
 * render time matters: the raw stream is kept as ground truth, so a secret
 * that reaches the artifact is a secret on disk in the user's repo.
 *
 * The patterns are deliberately broad. A false positive costs a blanked string
 * in a demo; a false negative costs a leaked credential in a published video.
 */

const HOME = (process.env.HOME ?? process.env.USERPROFILE ?? "").replace(/\\/g, "/");

const PATTERNS = [
  /* Provider-shaped keys first, because they are unambiguous. */
  { kind: "github_token", re: /\bgh[pousr]_[A-Za-z0-9]{16,}\b/g },
  { kind: "openai_key", re: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { kind: "anthropic_key", re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g },
  { kind: "aws_key", re: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g },
  { kind: "slack_token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { kind: "google_key", re: /\bAIza[A-Za-z0-9_-]{30,}\b/g },
  { kind: "private_key", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g },
  { kind: "jwt", re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },

  /* Named secrets in assignments or headers. */
  { kind: "assigned_secret", re: /\b((?:api[_-]?key|secret|token|password|passwd|pwd|auth)\s*[:=]\s*)(["']?)([^\s"',;]{6,})\2/gi, replace: (m, p1, q) => `${p1}${q}[redacted]${q}` },
  { kind: "bearer", re: /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{12,}/g, replace: (m, scheme) => `${scheme} [redacted]` },

  /* Connection strings carry credentials in the authority. */
  { kind: "connection_string", re: /\b([a-z][a-z0-9+.-]*:\/\/)([^:@\s/]+):([^@\s/]+)@/gi, replace: (m, proto, user) => `${proto}${user}:[redacted]@` },

  { kind: "email", re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
];

/**
 * @param {string} text
 * @returns {{text: string, hits: [string, number][]}}
 */
export function redact(text) {
  if (!text) return { text: "", hits: [] };
  const counts = new Map();
  let out = text;

  for (const { kind, re, replace } of PATTERNS) {
    out = out.replace(re, (...args) => {
      counts.set(kind, (counts.get(kind) ?? 0) + 1);
      return replace ? replace(...args) : "[redacted]";
    });
  }

  /* The operator's home directory is not a secret, but it is their name on
     screen in a published video. Replaced with the conventional shorthand
     rather than blanked, so the path still reads as a path. */
  if (HOME.length > 3) {
    const escaped = HOME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const homeRe = new RegExp(`${escaped}|${escaped.replace(/\//g, "\\\\\\\\")}`, "gi");
    out = out.replace(homeRe, () => {
      counts.set("home_path", (counts.get("home_path") ?? 0) + 1);
      return "~";
    });
  }

  return { text: out, hits: [...counts] };
}

/** Would this string survive redaction unchanged? */
export const isClean = (text) => redact(text).text === text;
