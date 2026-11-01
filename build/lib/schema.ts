// Tiny dependency-free schema validation for content files.
// A schema is a function that returns the validated value or throws a
// ContentError naming the exact path of the problem.

export class ContentError extends Error {}

export type Schema<T> = (value: unknown, path: string) => T;

function fail(path: string, message: string): never {
  throw new ContentError(`${path}: ${message}`);
}

export const str =
  (opts: { min?: number; max?: number; pattern?: RegExp } = {}): Schema<string> =>
  (value, path) => {
    if (typeof value !== 'string') fail(path, `expected text, got ${typeof value}`);
    const v = value.trim();
    if (opts.min !== undefined && v.length < opts.min) fail(path, `must be at least ${opts.min} characters`);
    if (opts.max !== undefined && v.length > opts.max) fail(path, `must be at most ${opts.max} characters`);
    if (opts.pattern && !opts.pattern.test(v)) fail(path, `does not match the required format ${opts.pattern}`);
    return v;
  };

export const bool: Schema<boolean> = (value, path) => {
  if (typeof value !== 'boolean') fail(path, 'expected true or false');
  return value;
};

export const oneOf =
  <T extends string>(...allowed: T[]): Schema<T> =>
  (value, path) => {
    if (typeof value !== 'string' || !allowed.includes(value as T)) {
      fail(path, `must be one of: ${allowed.join(', ')}`);
    }
    return value as T;
  };

export const optional =
  <T>(schema: Schema<T>): Schema<T | undefined> =>
  (value, path) =>
    value === undefined || value === null ? undefined : schema(value, path);

export const arr =
  <T>(item: Schema<T>, opts: { min?: number } = {}): Schema<T[]> =>
  (value, path) => {
    if (!Array.isArray(value)) fail(path, 'expected a list');
    if (opts.min !== undefined && value.length < opts.min) fail(path, `needs at least ${opts.min} entries`);
    return value.map((v, i) => item(v, `${path}[${i}]`));
  };

type Shape = Record<string, Schema<unknown>>;
type Infer<S extends Shape> = { [K in keyof S]: ReturnType<S[K]> };

export const obj =
  <S extends Shape>(shape: S): Schema<Infer<S>> =>
  (value, path) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) fail(path, 'expected an object');
    const input = value as Record<string, unknown>;
    for (const key of Object.keys(input)) {
      if (!(key in shape)) fail(`${path}.${key}`, 'unknown field (typo?)');
    }
    const out: Record<string, unknown> = {};
    for (const [key, schema] of Object.entries(shape)) {
      out[key] = schema(input[key], `${path}.${key}`);
    }
    return out as Infer<S>;
  };

/** Internal links must be root-relative; external links must use https. */
export const href: Schema<string> = (value, path) => {
  const v = str({ min: 1 })(value, path);
  if (!/^(\/|https:\/\/|mailto:)/.test(v)) fail(path, 'link must start with "/", "https://" or "mailto:"');
  return v;
};

export const slug = str({ min: 1, max: 80, pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ });
