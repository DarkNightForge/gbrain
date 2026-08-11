/**
 * Pre-test setup: clear an ambient `GBRAIN_SOURCE` inherited from the
 * developer's shell, so source resolution starts from a known-empty state.
 *
 * Why this exists: `GBRAIN_SOURCE` is the highest-priority *implicit* signal in
 * `resolveSourceWithTier` — above the `.gbrain-source` dotfile, above a
 * registered source's `local_path`, above `sources.default`. Operators who work
 * against a real brain routinely export it (it is the documented way to pin a
 * shell to one source), and that export is inherited by `bun test`.
 *
 * Every test that asserts a LOWER tier then fails, because resolution correctly
 * short-circuits at tier `env` before reaching the tier under test. Observed on
 * a machine with `GBRAIN_SOURCE=default` exported: 8 failures across
 * `test/source-resolver-with-tier.test.ts` and
 * `test/source-resolver-silent-fallback.test.ts`
 * (`Expected: "seed_default" / Received: "env"`, and the dotfile/local_path
 * tiers likewise), plus knock-on failures in
 * `test/fs-walk-extract-non-default-source.test.ts` and the `#2185` registry
 * freshness guard. All 23 of those tests pass with the var unset. The failures
 * are pure environment leakage — nothing in the product is broken, which is the
 * worst kind of red suite: it trains you to ignore it.
 *
 * Same class as `audit-dir-preload.ts` (#2823) and the same fix shape: neutralize
 * the operator's ambient environment once, globally, before any test file loads,
 * rather than expecting ~100 test files to each defend themselves.
 *
 * Tests that deliberately exercise the env tier are unaffected: they set the var
 * through `test/helpers/with-env.ts`'s `withEnv`, which saves and restores around
 * whatever the process-global state is — including "unset", which is exactly what
 * this preload establishes.
 *
 * Deliberately narrow: only the source-selection override is cleared. Other
 * `GBRAIN_*` vars are left alone, since some are legitimate local tuning that no
 * test asserts a default for, and blanket-clearing the namespace would trade one
 * surprise for another.
 *
 * Escape hatch: set `GBRAIN_TEST_KEEP_SOURCE_ENV=1` to keep your export (e.g.
 * to reproduce an env-tier bug locally).
 *
 * Imported by `bunfig.toml` via
 * `preload = [..., "./test/helpers/source-env-preload.ts"]`.
 */

if (process.env.GBRAIN_SOURCE && process.env.GBRAIN_TEST_KEEP_SOURCE_ENV !== '1') {
  const inherited = process.env.GBRAIN_SOURCE;
  delete process.env.GBRAIN_SOURCE;
  if (process.env.GBRAIN_DEBUG_PRELOAD === '1') {
    console.error(`[source-env-preload] cleared inherited GBRAIN_SOURCE=${inherited}`);
  }
}
