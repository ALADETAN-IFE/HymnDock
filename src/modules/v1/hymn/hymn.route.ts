import { Router } from "express";
import { getHymn, refreshHymn } from "./hymn.controller";
import { methodNotAllowedHandler } from "@/middlewares";
import { routeRegistry } from "@/docs";

const router = Router();

// ── GET /api/v1/hymn ─────────────────────────────────────────────────────────

routeRegistry.register({
  method: "GET",
  path: "/api/v1/hymn",
  handler: getHymn,
  docs: {
    tags: ["Hymn"],
    summary: "Fetch and parse a hymn (SQLite-cached)",
    description:
      "Returns parsed hymn lyrics. First call scrapes treasurehymns.com and caches " +
      "the result permanently in SQLite. All subsequent calls are near-instant.",
    parameters: [
      {
        name: "number",
        in: "query",
        required: false,
        schema: { type: "integer", example: 235 },
        description: "Hymn number to look up.",
      },
      {
        name: "url",
        in: "query",
        required: false,
        schema: { type: "string", example: "https://treasurehymns.com/yor/hymn-235-..." },
        description: "Direct URL of the hymn page.",
      },
    ],
    responses: {
      "200": {
        description: "Parsed hymn data",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                ok: { type: "boolean", example: true },
                hymn: {
                  type: "object",
                  properties: {
                    number: { type: "integer" },
                    title: { type: "string" },
                    url: { type: "string" },
                    sections: { type: "object" },
                    previous: { type: "string", nullable: true },
                    next: { type: "string", nullable: true },
                  },
                },
              },
            },
          },
        },
      },
      "400": {
        description: "Bad request or hymn not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                ok: { type: "boolean", example: false },
                error: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
});

// ── DELETE /api/v1/hymn/cache ─────────────────────────────────────────────────

routeRegistry.register({
  method: "DELETE",
  path: "/api/v1/hymn/cache",
  handler: refreshHymn,
  docs: {
    tags: ["Hymn"],
    summary: "Bust cache and re-fetch a hymn",
    description:
      "Removes the hymn from the SQLite cache and immediately re-scrapes it. " +
      "Use this if hymn lyrics have changed on Treasure Hymns.",
    parameters: [
      {
        name: "url",
        in: "query",
        required: true,
        schema: { type: "string" },
        description: "The Treasure Hymns page URL to invalidate.",
      },
    ],
    responses: {
      "200": { description: "Re-fetched hymn data" },
      "400": { description: "Error" },
    },
  },
});

router.get("/", getHymn);
router.delete("/cache", refreshHymn);

// Catch wrong methods on base route
router.use("/", methodNotAllowedHandler(["GET"]));

export default router;
