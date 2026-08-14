import { Router } from "express";
import { getHymn } from "./hymn.controller";
import { methodNotAllowedHandler } from "@/middlewares";
import { routeRegistry } from "@/docs";

const router = Router();

routeRegistry.register({
  method: "GET",
  path: "/api/hymn",
  handler: getHymn,
  docs: {
    tags: ["Hymn"],
    summary: "Fetch and parse a hymn from Treasure Hymns",
    description:
      "Fetches a hymn by number or direct URL from treasurehymns.com, " +
      "parses its lyrics into sections and stanzas, and returns structured JSON.",
    parameters: [
      {
        name: "number",
        in: "query",
        required: false,
        schema: { type: "integer", example: 235 },
        description: "Hymn number to search for on Treasure Hymns.",
      },
      {
        name: "url",
        in: "query",
        required: false,
        schema: {
          type: "string",
          example: "https://treasurehymns.com/yor/hymn-235-...",
        },
        description: "Direct URL of the hymn page on treasurehymns.com.",
      },
    ],
    responses: {
      "200": {
        description: "Successfully parsed hymn data",
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

router.use(methodNotAllowedHandler(["GET"]));
router.get("/", getHymn);

export default router;
