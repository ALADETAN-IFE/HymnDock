/**
 * hymn.controller.ts
 *
 * GET    /api/v1/hymn?number=<n>   — fetch by number (SQLite-cached)
 * GET    /api/v1/hymn?url=<url>    — fetch by direct URL (SQLite-cached)
 * DELETE /api/v1/hymn/cache?url=<url> — bust cache for one hymn (Refresh button)
 */

import { Request, Response } from "express";
import { findHymnUrl, searchHymns, parseHymn, bustHymnCache } from "./hymn.parser";
import { logger } from "@/utils";

const BASE = "https://treasurehymns.com";

// ── GET /api/v1/hymn ─────────────────────────────────────────────────────────

export const getHymn = async (req: Request, res: Response): Promise<void> => {
  const { url: urlParam, number: numberParam, query: queryParam, lang: langParam, direct: directParam } = req.query as Record<
    string,
    string | undefined
  >;

  try {
    let url: string;

    if (urlParam) {
      if (!urlParam.startsWith(BASE + "/")) {
        res.status(400).json({ ok: false, error: "Only Treasure Hymns URLs are supported." });
        return;
      }
      url = urlParam;
    } else if (numberParam || queryParam) {
      const searchTerm = (numberParam || queryParam)!.trim();
      const lang = langParam || "all";
      if (!searchTerm) {
        res.status(400).json({ ok: false, error: "Provide a valid search term or hymn number." });
        return;
      }

      logger.info("Hymn", `Searching: "${searchTerm}" (lang: ${lang})…`);
      const results = await searchHymns(searchTerm, lang);

      if (results.length === 0) {
        res.status(400).json({
          ok: false,
          error: `Could not find "${searchTerm}" on Treasure Hymns.`,
        });
        return;
      }

      // If multiple results found and user didn't request direct load, return search results
      if (results.length > 1 && directParam !== "true") {
        res.status(200).json({ ok: true, multiple: true, results });
        return;
      }

      url = results[0].url;
    } else {
      res.status(400).json({ ok: false, error: "Provide a hymn number, title search query, or Treasure Hymns URL." });
      return;
    }

    logger.info("Hymn", `Fetching: ${url}`);
    const hymn = await parseHymn(url);

    res.status(200).json({ ok: true, hymn });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Hymn", "Hymn request failed", err as Error);
    res.status(400).json({ ok: false, error: message });
  }
};

// ── DELETE /api/v1/hymn/cache — bust one hymn from the permanent cache ───────

export const refreshHymn = async (req: Request, res: Response): Promise<void> => {
  const { url: urlParam } = req.query as Record<string, string | undefined>;

  if (!urlParam) {
    res.status(400).json({ ok: false, error: "Provide ?url= of the hymn to refresh." });
    return;
  }

  if (!urlParam.startsWith(BASE + "/")) {
    res.status(400).json({ ok: false, error: "Only Treasure Hymns URLs are supported." });
    return;
  }

  try {
    // Remove from cache
    bustHymnCache(urlParam);
    logger.info("Hymn", `Cache busted for ${urlParam}`);

    // Re-fetch immediately so the next GET is already warm
    const hymn = await parseHymn(urlParam);
    res.status(200).json({ ok: true, hymn });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Hymn", "Refresh failed", err as Error);
    res.status(400).json({ ok: false, error: message });
  }
};
