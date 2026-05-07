# Import Connectors

Each connector turns one kind of source into a stream of `NormalizedListing`
records. The engine then validates, attaches make/model from the catalog, and
upserts a `Listing` row.

## Files

- `types.ts` — `Connector`, `ConnectorContext`, `NormalizedListing`.
- `parsers.ts` — small text → number/enum helpers shared across connectors.
- `upsert.ts` — engine-side validation + DB upsert (do not duplicate logic).
- `connectors/generic.ts` — the default, configurable connector. Most websites
  can be supported by editing only its config (CSS selectors), no new code.
- `connectors/index.ts` — connector registry. Add new connectors here.

## When to use the generic connector vs. a custom one

Use **generic** when:

- The source is a normal HTML site.
- One CSS selector picks each card; one selector picks the detail link.
- Detail-page fields (title, price, year, mileage, fuel, transmission, images)
  are reachable with simple selectors.

Write a **custom connector** when the source needs:

- Login/cookie handling, headers, GraphQL or JSON endpoints.
- Pagination logic (next-page detection, infinite scroll APIs).
- Anti-bot countermeasures or token handling.
- Field mapping that goes beyond simple selectors (e.g. JSON-LD parsing).

A custom connector lives in `connectors/<source-key>.ts` and is registered in
`connectors/index.ts`.

## Adding a custom connector — checklist

1. Create `connectors/<source-key>.ts` exporting a `Connector`.
2. Implement `fetch(ctx)` as an `async generator` that yields
   `NormalizedListing` values; respect `ctx.maxPerRun` and
   `ctx.requestDelayMs`.
3. Use parsers from `parsers.ts` for prices/years/fuels/etc.
4. Register it in `connectors/index.ts` with `registerConnector()`.
5. In Admin → Imports, create a source with `connectorKey` set to your key,
   add list URLs, and run.

## Legal / operational rules

- Only collect from sources you own, have permission to scrape, or that
  publish an explicit feed/API.
- Respect `robots.txt` and the site's terms.
- Keep `requestDelayMs` reasonable (>= 1000 ms is a sensible floor).
- Identify your bot in `User-Agent` with a contact email.
- Never scrape gated content using credentials of someone else.
