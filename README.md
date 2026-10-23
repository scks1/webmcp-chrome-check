# webmcp-chrome-check

One-off execution check, 2026-10-23: do Shopify's storefront WebMCP tools
register in **real Google Chrome**?

Background: five Shopify stores from a 26-store WebMCP sample (Skullcandy,
Ted Baker, Cole Haan, Perry Ellis, Savannah Bee) carry Shopify's WebMCP
adapter code. Probed locally in Microsoft Edge 155 (the only
WebMCP-capable browser that traverses the local VM's egress proxy),
**none of the five registered any tool** in 60–95 s listing windows —
while two BigCommerce controls in the same setup did (Jennifer Taylor
Home: 8 tools, first at 24 s; Cornerstone demo: 2 C2PA tools).
Shopify's server-side MCP endpoints answered fully on all five.

The open variable is the browser. This repo runs the same long-poll
listing (`probe.mjs`, listing only — no store tool is ever called) in
Google Chrome on a GitHub-hosted runner, one matrix leg per store plus
the two controls, triggered manually via `workflow_dispatch`.

Results land as per-store artifacts (`results-<slug>`) on each run.
