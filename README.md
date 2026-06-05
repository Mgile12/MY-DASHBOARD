# The Standard

Private, single-user personal chief-of-staff app. Pain-first morning brief, guided nightly journal, weekday sales scoreboard, Saturday mode, Sunday OODA review, Telegram delivery at 4am AEST.

Not a productivity app. Not a War Room OS. Not a CRM. The wedge is the morning brief + nightly journal + Sunday correction loop. Everything else is v2.

## Status

Pre-build. Spec locked. Implementation has not started yet.

## Authoritative documents

- **[PRD.md](PRD.md)** — v1 source of truth. Scope, screens, data model, acceptance criteria, success metrics. **Read this first.**
- **[DESIGN.md](DESIGN.md)** — historical /office-hours design conversation that led to the PRD. Useful for understanding how the product took shape; not the current spec.
- **[docs/codex/](docs/codex/)** — War Room Codex reference material (Tenets, Sigils, Iron Mind, etc.). Used for system prompt refinement, not loaded at runtime. See `docs/codex/README.md` for usage rules.

## Stack (per PRD §19)

- Next.js App Router
- Vercel + Vercel Cron
- Postgres / Neon
- Google sign-in (allowlisted to one user)
- Anthropic API
- Telegram Bot API

## Build order (per PRD §19.3)

1. Auth + Settings
2. Nightly Journal
3. Brief generation + Today screen
4. Task actions (done/skipped/deferred)
5. Standards + streaks
6. Telegram delivery
7. Sunday OODA
8. Should-have items only if the loop is already working

## The rule

> If a feature does not strengthen the morning brief, nightly truth, or Sunday correction loop, it does not belong in v1.
