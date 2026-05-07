# Social Networks Ingestion Plan

This document covers Facebook Marketplace, Facebook posts, and Instagram posts.
We deliberately **do not** ship login-based scrapers for these sources. Meta's
Terms of Service explicitly prohibit automated collection without permission,
and accounts/IPs are routinely flagged or banned.

The path we will use: **official APIs first, manual entry second**.

## Source types and recommended path

| Source | Recommended path | Why |
| --- | --- | --- |
| Facebook Marketplace | Meta Content Library API (research access) **or** manual entry | Public scraping is prohibited; the Content Library API is the only ToS-compliant programmatic path. |
| Facebook Posts (your Page) | Facebook Graph API (`/me/posts`) | Authenticated access to your own Page is allowed. |
| Facebook Posts (others') | Manual entry | No general Graph access to other people's posts. |
| Instagram Posts (your Business/Creator account) | Instagram Graph API (`media`, `business_discovery`) | Authenticated access to your own account is allowed. |
| Instagram Posts (others') | Manual entry only | Public scraping violates ToS and triggers anti-scraping defenses. |

## Built-in support today

- A `manual` connector ships in `[lib/imports/connectors/manual.ts](lib/imports/connectors/manual.ts)`.
  Admin can paste already-normalized vehicle records into the source's
  `config.records` array; the engine validates and upserts them.

This already covers the safe path: copy text/images from a social post you are
allowed to repost, fill out the structured fields, save, and run.

## Future API connectors

When you decide to invest in official API integrations, each Meta connector
should:

1. Use OAuth tokens issued to the platform's Meta app.
2. Read media from `/me/media` (Instagram) or `/me/posts` (Facebook Page).
3. Map captions / image URLs / location into `NormalizedListing`.
4. Respect rate limits documented by Meta (Instagram: ~240 calls/hour at
   floor rate; lower if your token's usage grows).
5. Store the access token outside the database (env var or secret store)
   and never expose it to the client.

These connectors should live next to the others in
`[lib/imports/connectors/](lib/imports/connectors)`. Suggested keys:

- `meta-instagram-business`
- `meta-facebook-page`
- `meta-marketplace-content-library`

## What to avoid

- Scraping Marketplace search pages with cookies or headless browsers.
- Hitting Instagram's GraphQL endpoints from server jobs.
- Reusing user account cookies for collection.
- Bulk-creating listings without verifying we have rights to the photos.

If a future business need forces collection that is not API-friendly, treat it
as a separate vendor decision and document the legal review before building.
