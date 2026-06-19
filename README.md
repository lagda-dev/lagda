# lagda

Open-source application — [lagda.dev](https://lagda.dev)

## Tech Stack

TypeScript · Node.js · [Turborepo](https://turbo.build) · [pnpm](https://pnpm.io) · [oxlint + oxfmt](https://oxc.rs)

## Prerequisites

- **Node.js:** 18+ (`node --version`)
- **pnpm:** 9+ (`npm install -g pnpm`)

## Setup

```bash
pnpm install
cp .env.example .env   # fill in any required values
```

## Commands

```bash
pnpm dev          # run the app
pnpm test         # run tests
pnpm type-check   # type check
pnpm lint         # lint with oxlint
pnpm format       # format with oxfmt
pnpm check        # full verification: type-check + lint + build + test
```

## Project Structure

```
lagda/
├── packages/   # reusable libraries (one domain per package, DDD layout)
└── apps/       # deployable applications
```

See [CLAUDE.md](./CLAUDE.md) for the full coding standards, architecture, and contribution conventions.

## License

[MIT](./LICENSE)
