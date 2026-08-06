import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

/**
 * Two servers, two projects.
 *
 * The default `mocked` run serves the app with the Wix HTTP boundary replayed from
 * the committed cassette: deterministic, offline, and — crucially for the screenshot
 * baseline — unaffected by the owner editing the catalog in the Wix dashboard.
 *
 * `live` is a small smoke suite against the real Wix API, so a breaking change in
 * their contract still surfaces. It needs credentials, so its server is only started
 * when explicitly asked for (`npm run test:live`).
 */

const MOCK_PORT = 3100;
const LIVE_PORT = 3101;
const LIVE = process.env.LIVE === "1";

const mockPreload = `--import ${resolve(__dirname, "tests/mock/wix-http-mock.mjs")}`;

// The build runs once in the npm script, not here: with LIVE=1 both servers start in
// parallel and two concurrent `next build` runs would race on the same .next directory.
//
// middleware.ts rejects empty/scripted user agents, so the readiness probe points at
// robots.txt — the matcher excludes it, so it answers regardless of who is asking.
const server = (port: number, env: Record<string, string>) => ({
  command: `npx next start -p ${port}`,
  url: `http://127.0.0.1:${port}/robots.txt`,
  reuseExistingServer: !process.env.CI,
  timeout: 240_000,
  stdout: "pipe" as const,
  env,
});

export default defineConfig({
  testDir: "./tests",
  // Resolve test imports through the test tsconfig — it aliases `server-only`, which
  // only exists inside Next's bundler, so unit tests can import lib/wix.ts directly.
  tsconfig: "./tsconfig.tests.json",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],

  use: {
    trace: "on-first-retry",
    // A screenshot on failure is worth far more than a stack trace for layout work.
    screenshot: "only-on-failure",
    // The site reveals content with an IntersectionObserver, so in a full-page
    // screenshot everything below the fold would still be at opacity 0. It already
    // honours prefers-reduced-motion by forcing those elements visible, so asking for
    // it here is not a test-only hack — it is a supported user setting that happens to
    // make the baseline show all the content and stop animations from racing.
    contextOptions: { reducedMotion: "reduce" },
  },

  projects: [
    {
      name: "mocked",
      testIgnore: "live/**",
      use: { ...devices["Desktop Chrome"], baseURL: `http://127.0.0.1:${MOCK_PORT}` },
    },
    {
      name: "live",
      testDir: "./tests/live",
      use: { ...devices["Desktop Chrome"], baseURL: `http://127.0.0.1:${LIVE_PORT}` },
    },
  ],

  webServer: [
    server(MOCK_PORT, { WIX_MOCK: "replay", NODE_OPTIONS: mockPreload }),
    ...(LIVE ? [server(LIVE_PORT, {})] : []),
  ],
});
