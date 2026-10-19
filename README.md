# Gadgetopedia

Gadgetopedia is the Gadgetopedia lifestyle website, built with Lovable and maintained in this GitHub repository.

- **Live app:** https://gadgetopediabd.lovable.app
- **Production domain:** https://gadgetopedia.shop
- **Default branch:** `main`

## Development

Use Bun for dependency installation and builds because this repository tracks `bun.lock`.

Requirements: [Bun](https://bun.sh/) and Git.

```sh
git clone https://github.com/syedsrr/gadgetopediabd.git
cd gadgetopediabd
bun install --frozen-lockfile
bun run dev
```

## Validation

Run the same build used by GitHub Actions before merging or deploying:

```sh
bun install --frozen-lockfile
bun run build
```

GitHub Actions runs the production build on pushes and pull requests targeting `main`. A green CI build confirms the build step passed; it does not by itself confirm the live website or external services are healthy.

## Environment variables and secrets

- Do not commit `.env` files, API keys, database passwords, or service-role keys.
- Configure deployment secrets in the relevant hosting provider's environment settings.
- Client-side variables prefixed with `VITE_` are exposed to browser code. Never put private keys in them.
- Keep production credentials and database changes separate from staging/test work.

## Changes and deployment safety

- Treat `main` as the production source branch.
- Review changes before merging and confirm CI is green.
- Do not change DNS, production environment variables, or database schemas as part of an unrelated code fix.
- After deployment, verify the live site separately from the build result.

## Lovable

This project was built with [Lovable](https://lovable.dev). Changes made in the Lovable editor may sync to this repository.
