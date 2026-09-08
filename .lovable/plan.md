# Show the gadgetOpedia logo in Google search results

## Why the logo is missing

Google decides which icon to show next to your site in search results from two signals, and your site currently only provides one:

1. **Favicon** — you already have a valid `/favicon.ico` (256×256, good size). Google picks this up on its own schedule after it re-crawls the site.
2. **Organization logo (structured data)** — your site has none. Adding this explicitly tells Google "this is our official logo" and greatly improves the chance of it appearing.

Also, any changes only reach Google after the site is **published** and then **re-crawled** — that last step is on Google's schedule (days to a couple of weeks), though we can nudge it in Search Console.

## What I'll change

1. **Add an Organization logo markup** to the site's shared head (`src/routes/__root.tsx`) — a small invisible JSON-LD block that declares `gadgetOpedia n' Lifestyle`, the site URL, and an absolute logo URL at `https://www.gadgetopedia.shop/`.
2. **Create a proper logo image file** for that URL (`public/logo.png`, 512×512 on a clean background, generated to match your green brand) — Google prefers a crisp square PNG over the .ico for this purpose.
3. **Add an apple-touch-icon link** pointing at a 180×180 icon — improves how the icon appears when saved to phones and is another hint for search engines.

## What you'll need to do after (Google's side, I can't do it for you)

1. **Publish** the site so the changes go live (I'll include the publish button).
2. In **Google Search Console**, use URL Inspection on your homepage and click **Request indexing** — this nudges Google to re-crawl and pick up the favicon + logo.
3. Wait — Google's favicon/logo cache updates on its own schedule, typically a few days to ~2 weeks after re-crawl.

## Technical details

- `__root.tsx` head gains: a `scripts` entry with `application/ld+json` (`@type: "Organization"`, `name`, `url`, `logo`), plus `<link rel="apple-touch-icon">`.
- New static assets in `public/`: `logo.png` (512×512) and `apple-touch-icon.png` (180×180), both generated in your Forest & Moss brand style.
- Existing favicon.ico stays as-is; nothing else changes.
