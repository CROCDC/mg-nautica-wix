/**
 * Stub for the `server-only` marker package, aliased in for the test run via the
 * `paths` in tsconfig.tests.json (which playwright.config.ts points at).
 *
 * `server-only` only exists inside Next's bundler, so importing lib/wix.ts from a
 * plain Node test would fail to resolve it. The package is a build-time marker with
 * no runtime behaviour, so an empty module is a faithful stand-in — and the alias
 * lives in the test tsconfig, leaving the app's own resolution untouched.
 */

export {};
