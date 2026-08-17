/**
 * A small JSON Schema (2020-12 subset) validator.
 *
 * Why not ajv: this CLI ships inside a Claude Code plugin directory that is
 * version-pinned and replaced wholesale on update, so an `npm install` step
 * there is a reliability problem rather than a convenience. The subset below
 * covers everything brag's schemas use, and validation errors have to be
 * legible to a model that is about to rewrite the artifact — so the messages
 * are the point, not the spec coverage.
 *
 * Supported: $ref (local, "#/$defs/..."), type, enum, const, required,
 * properties, additionalProperties, patternProperties, items, prefixItems,
 * minItems, maxItems, uniqueItems, minLength, maxLength, pattern, minimum,
 * maximum, exclusiveMinimum, exclusiveMaximum, multipleOf, allOf, anyOf,
 * oneOf, not, nullable via type arrays, and format: date-time|uri|email.
 */

import fs from "node:fs";
import path from "node:path";
import { artifactError } from "./util.mjs";

const TYPES = {
  string: (v) => typeof v === "string",
  number: (v) => typeof v === "number" && Number.isFinite(v),
  integer: (v) => Number.isInteger(v),
  boolean: (v) => typeof v === "boolean",
  object: (v) => v !== null && typeof v === "object" && !Array.isArray(v),
  array: (v) => Array.isArray(v),
  null: (v) => v === null,
};

const FORMATS = {
  "date-time": (v) => !Number.isNaN(Date.parse(v)),
  uri: (v) => /^[a-z][a-z0-9+.-]*:/i.test(v),
  email: (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),
};

const typeOf = (v) =>
  v === null ? "null" : Array.isArray(v) ? "array" : typeof v;

function resolveRef(ref, root) {
  if (!ref.startsWith("#")) {
    throw new Error(`only local $ref is supported, got ${ref}`);
  }
  const parts = ref.slice(1).split("/").filter(Boolean);
  let node = root;
  for (const raw of parts) {
    const key = raw.replace(/~1/g, "/").replace(/~0/g, "~");
    node = node?.[key];
    if (node === undefined) throw new Error(`unresolvable $ref: ${ref}`);
  }
  return node;
}

/**
 * @returns {{ok: boolean, errors: {path: string, message: string}[]}}
 */
export function validate(schema, data, { root = schema } = {}) {
  const errors = [];

  const err = (instancePath, message) =>
    errors.push({ path: instancePath || "(root)", message });

  const check = (sch, value, at) => {
    if (sch === true || sch === undefined) return;
    if (sch === false) return err(at, "no value is permitted here");

    if (sch.$ref) return check(resolveRef(sch.$ref, root), value, at);

    if (sch.const !== undefined && JSON.stringify(value) !== JSON.stringify(sch.const)) {
      return err(at, `must be ${JSON.stringify(sch.const)}`);
    }

    if (sch.enum && !sch.enum.some((e) => JSON.stringify(e) === JSON.stringify(value))) {
      return err(at, `must be one of: ${sch.enum.map((e) => JSON.stringify(e)).join(", ")}`);
    }

    if (sch.type) {
      const allowed = Array.isArray(sch.type) ? sch.type : [sch.type];
      if (!allowed.some((t) => TYPES[t]?.(value))) {
        return err(at, `must be ${allowed.join(" or ")}, got ${typeOf(value)}`);
      }
    }

    for (const key of ["allOf"]) {
      if (sch[key]) for (const sub of sch[key]) check(sub, value, at);
    }

    if (sch.anyOf || sch.oneOf) {
      const branches = sch.anyOf ?? sch.oneOf;
      const passing = branches.filter((sub) => validate(sub, value, { root }).ok);
      if (passing.length === 0) {
        err(at, `does not match any allowed shape (${branches.length} tried)`);
      } else if (sch.oneOf && passing.length > 1) {
        err(at, `is ambiguous: matches ${passing.length} shapes, must match exactly one`);
      }
    }

    if (sch.not && validate(sch.not, value, { root }).ok) {
      err(at, "matches a forbidden shape");
    }

    if (typeof value === "string") {
      if (sch.minLength !== undefined && value.length < sch.minLength)
        err(at, `must be at least ${sch.minLength} characters, got ${value.length}`);
      if (sch.maxLength !== undefined && value.length > sch.maxLength)
        err(at, `must be at most ${sch.maxLength} characters, got ${value.length}`);
      if (sch.pattern && !new RegExp(sch.pattern, "u").test(value))
        err(at, `must match ${sch.pattern}`);
      if (sch.format && FORMATS[sch.format] && !FORMATS[sch.format](value))
        err(at, `must be a valid ${sch.format}`);
    }

    if (typeof value === "number") {
      if (sch.minimum !== undefined && value < sch.minimum)
        err(at, `must be >= ${sch.minimum}, got ${value}`);
      if (sch.maximum !== undefined && value > sch.maximum)
        err(at, `must be <= ${sch.maximum}, got ${value}`);
      if (sch.exclusiveMinimum !== undefined && value <= sch.exclusiveMinimum)
        err(at, `must be > ${sch.exclusiveMinimum}, got ${value}`);
      if (sch.exclusiveMaximum !== undefined && value >= sch.exclusiveMaximum)
        err(at, `must be < ${sch.exclusiveMaximum}, got ${value}`);
      if (sch.multipleOf !== undefined && Math.abs(value / sch.multipleOf % 1) > 1e-9)
        err(at, `must be a multiple of ${sch.multipleOf}`);
    }

    if (Array.isArray(value)) {
      if (sch.minItems !== undefined && value.length < sch.minItems)
        err(at, `needs at least ${sch.minItems} items, got ${value.length}`);
      if (sch.maxItems !== undefined && value.length > sch.maxItems)
        err(at, `allows at most ${sch.maxItems} items, got ${value.length}`);
      if (sch.uniqueItems) {
        const seen = new Set();
        value.forEach((v, i) => {
          const k = JSON.stringify(v);
          if (seen.has(k)) err(`${at}[${i}]`, "is a duplicate; items must be unique");
          seen.add(k);
        });
      }
      (sch.prefixItems ?? []).forEach((sub, i) => {
        if (i < value.length) check(sub, value[i], `${at}[${i}]`);
      });
      if (sch.items) {
        const from = sch.prefixItems?.length ?? 0;
        for (let i = from; i < value.length; i++) check(sch.items, value[i], `${at}[${i}]`);
      }
    }

    if (TYPES.object(value)) {
      for (const key of sch.required ?? []) {
        if (!(key in value)) err(at, `is missing required property "${key}"`);
      }
      const props = sch.properties ?? {};
      for (const [key, sub] of Object.entries(props)) {
        if (key in value) check(sub, value[key], at ? `${at}.${key}` : key);
      }
      const patterns = Object.entries(sch.patternProperties ?? {});
      for (const [key, v] of Object.entries(value)) {
        for (const [pat, sub] of patterns) {
          if (new RegExp(pat, "u").test(key)) check(sub, v, at ? `${at}.${key}` : key);
        }
      }
      if (sch.additionalProperties === false) {
        const known = new Set(Object.keys(props));
        for (const key of Object.keys(value)) {
          if (known.has(key)) continue;
          if (patterns.some(([pat]) => new RegExp(pat, "u").test(key))) continue;
          err(at ? `${at}.${key}` : key, `is not a recognised property`);
        }
      } else if (TYPES.object(sch.additionalProperties)) {
        const known = new Set(Object.keys(props));
        for (const [key, v] of Object.entries(value)) {
          if (!known.has(key)) check(sch.additionalProperties, v, at ? `${at}.${key}` : key);
        }
      }
    }
  };

  check(schema, data, "");
  return { ok: errors.length === 0, errors };
}

/* ------------------------------------------------------------------ registry */

const cache = new Map();

/** Absolute path to the repo's schemas/ directory. */
export function schemaDir(repoRoot) {
  return path.join(repoRoot, "schemas");
}

export function loadSchema(repoRoot, name) {
  const key = `${repoRoot}::${name}`;
  if (cache.has(key)) return cache.get(key);
  const file = path.join(schemaDir(repoRoot), `${name}.schema.json`);
  if (!fs.existsSync(file)) {
    throw artifactError(`no schema named "${name}" (looked in ${file})`);
  }
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  cache.set(key, parsed);
  return parsed;
}

export function listSchemas(repoRoot) {
  const dir = schemaDir(repoRoot);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".schema.json"))
    .map((f) => f.replace(/\.schema\.json$/, ""))
    .sort();
}

/**
 * Validate `data` against a named schema, throwing a BragError whose message
 * is directly actionable by whoever produced the artifact.
 */
export function assertValid(repoRoot, name, data, { source = "artifact" } = {}) {
  const schema = loadSchema(repoRoot, name);
  const { ok, errors } = validate(schema, data);
  if (ok) return data;
  const lines = errors.slice(0, 20).map((e) => `  ${e.path} ${e.message}`);
  if (errors.length > 20) lines.push(`  … and ${errors.length - 20} more`);
  throw artifactError(
    `${source} does not satisfy the "${name}" schema:\n${lines.join("\n")}`,
    { schema: name, errors },
  );
}
