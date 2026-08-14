import { Router } from "express";
import { readState, writeState, sseStream } from "./state.controller";
import { methodNotAllowedHandler } from "@/middlewares";
import { routeRegistry } from "@/docs";

const router = Router();

// ── GET /api/v1/state/events  (SSE — must be registered before the base route) ──

routeRegistry.register({
  method: "GET",
  path: "/api/v1/state/events",
  handler: sseStream,
  docs: {
    tags: ["State"],
    summary: "SSE stream for real-time display updates",
    description:
      "Opens a Server-Sent Events stream. The display page connects once and " +
      "receives instant pushes whenever the dock updates state for this session.",
    parameters: [
      {
        name: "session",
        in: "query",
        required: true,
        schema: { type: "string" },
        description: "Session UUID from the dock.",
      },
    ],
    responses: {
      "200": { description: "text/event-stream — keeps connection open" },
      "400": { description: "Missing session parameter" },
    },
  },
});

router.get("/events", sseStream);

// ── GET /api/v1/state ──────────────────────────────────────────────────────────

routeRegistry.register({
  method: "GET",
  path: "/api/v1/state",
  handler: readState,
  docs: {
    tags: ["State"],
    summary: "Read session display state",
    description: "Returns the current hymn/section/stanza/settings for this session.",
    parameters: [
      {
        name: "session",
        in: "query",
        required: true,
        schema: { type: "string" },
        description: "Session UUID.",
      },
    ],
    responses: {
      "200": {
        description: "Current state",
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
    },
  },
});

// ── POST /api/v1/state ─────────────────────────────────────────────────────────

routeRegistry.register({
  method: "POST",
  path: "/api/v1/state",
  handler: writeState,
  docs: {
    tags: ["State"],
    summary: "Update session display state",
    description:
      "Patches the session state and pushes the update to all connected SSE clients immediately.",
    parameters: [
      {
        name: "session",
        in: "query",
        required: true,
        schema: { type: "string" },
        description: "Session UUID.",
      },
    ],
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
      "200": { description: "Updated state" },
      "400": { description: "Error" },
    },
  },
});

router.use(methodNotAllowedHandler(["GET", "POST"]));
router.get("/", readState);
router.post("/", writeState);

export default router;
