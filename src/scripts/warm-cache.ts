// Warm-cache script — run after build to prefill the SQLite cache
// Usage: node -r module-alias/register dist/scripts/warm-cache.js 235 400 512

process.env.PORT = process.env.PORT || "3000";
process.env.NODE_ENV = process.env.NODE_ENV || "production";

import { logger } from "@/utils";
import { findHymnUrl, parseHymn } from "../modules/v1/hymn/hymn.parser";

function expandParts(raw: string): number[] {
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const nums: number[] = [];
  for (const p of parts) {
    if (p.includes("-")) {
      const [aStr, bStr] = p.split("-").map((x) => x.trim());
      const a = parseInt(aStr, 10);
      const b = parseInt(bStr, 10);
      if (!isNaN(a) && !isNaN(b)) {
        for (let i = Math.min(a, b); i <= Math.max(a, b); i++) nums.push(i);
      }
    } else {
      const n = parseInt(p, 10);
      if (!isNaN(n)) nums.push(n);
    }
  }
  return nums;
}

async function main() {
  const args = process.argv.slice(2);
  const raw = args.length > 0 ? args.join(",") : (process.env.WARMUP_HYMNS ?? "");
  if (!raw) {
    console.error("Specify hymn numbers or set WARMUP_HYMNS env var (e.g. 1,2,10-15)");
    process.exit(1);
  }

  const nums = expandParts(raw);
  if (nums.length === 0) {
    console.error("No valid hymn numbers found.");
    process.exit(1);
  }

  logger.info("Warmup", `Warming ${nums.length} hymns...`);

  for (const n of nums) {
    try {
      logger.info("Warmup", `Warming hymn ${n}...`);
      const url = await findHymnUrl(n);
      if (!url) {
        logger.warn("Warmup", `Could not find hymn ${n}`);
        continue;
      }
      await parseHymn(url);
      logger.info("Warmup", `Warmed hymn ${n}`);
    } catch (err) {
      logger.warn("Warmup", `Failed to warm hymn ${n}: ${err}`);
    }
    // small delay to be polite
    await new Promise((r) => setTimeout(r, 150));
  }

  logger.info("Warmup", "Warm-cache complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
