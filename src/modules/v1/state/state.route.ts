import { Router } from "express";
import { readState, writeState } from "./state.controller";
import { methodNotAllowedHandler } from "@/middlewares";
import { routeRegistry } from "@/docs";

const router = Router();

// ── GET /api/state ─────────────────────────────────────────────────────────

routeRegistry.register({
  method: "GET",
  path: "/api/state",
  handler: readState,
  docs: {
    tags: ["State"],
    summary: "Read current display state",
    description:
      "Returns the in-memory state that the OBS Browser Source polls to update the lyrics display.",
    responses: {
      "200": {
        description: "Current application state",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                ok: { type: "boolean", example: true },
                state: {
                  type: "object",
                  properties: {
                    hymn: { type: "object", nullable: true },
                    section: { type: "string", nullable: true },
                    stanza: { type: "integer", nullable: true },
                    settings: { type: "object" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

// ── POST /api/state ────────────────────────────────────────────────────────

routeRegistry.register({
  method: "POST",
  path: "/api/state",
  handler: writeState,
  docs: {
    tags: ["State"],
    summary: "Update display state",
    description:
      "Partially updates the in-memory state. " +
      "The OBS Dock uses this to push the currently selected hymn / stanza " +
      "so the Browser Source can display it live.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              hymn: { type: "object", nullable: true },
              section: { type: "string", nullable: true },
              stanza: { type: "integer", nullable: true },
              settings: { type: "object" },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Updated state",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                ok: { type: "boolean", example: true },
                state: { type: "object" },
              },
            },
          },
        },
      },
      "400": {
        description: "Parse error",
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

router.use(methodNotAllowedHandler(["GET", "POST"]));
router.get("/", readState);
router.post("/", writeState);

export default router;
