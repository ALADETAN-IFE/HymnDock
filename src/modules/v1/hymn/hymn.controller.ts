/**
 * hymn.controller.ts
 *
 * Handles GET /api/v1/hymn requests.
 * Mirrors Python's Handler.do_GET() branch for /api/v1/hymn.
 */

import { Request, Response } from "express";
import { findHymnUrl, parseHymn } from "./hymn.parser";
import { logger } from "@/utils";

const BASE = "https://treasurehymns.com";

export const getHymn = async (req: Request, res: Response): Promise<void> => {
  const { url: urlParam, number: numberParam } = req.query as Record<
    string,
    string | undefined
  >;

  try {
    let url: string;

    if (urlParam) {
      if (!urlParam.startsWith(BASE + "/")) {
        res.status(400).json({
          ok: false,
          error: "Only Treasure Hymns URLs are supported.",
        });
        return;
      }
      url = urlParam;
    } else if (numberParam) {
      const number = parseInt(numberParam, 10);
      if (isNaN(number)) {
        res.status(400).json({ ok: false, error: "Invalid hymn number." });
        return;
      }

      logger.info("Hymn", `Searching for hymn ${number}…`);
      const found = await findHymnUrl(number);

      if (!found) {
        res.status(400).json({
          ok: false,
          error: `Could not find Hymn ${number} on Treasure Hymns.`,
        });
        return;
      }

      url = found;
    } else {
      res.status(400).json({
        ok: false,
        error: "Provide a hymn number or Treasure Hymns URL.",
      });
      return;
    }

    logger.info("Hymn", `Parsing: ${url}`);
    const hymn = await parseHymn(url);

    res.status(200).json({ ok: true, hymn });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Hymn", "Hymn request failed", err as Error);
    res.status(400).json({ ok: false, error: message });
  }
};
