# VOIDBRAWL — Project Guide

**VOIDBRAWL** is a browser **team-deathmatch in space**. 1v1 / 2v2 / 4v4 ships fly free **6-DOF** inside a
**spherical arena**, shoot each other, respawn at their team base, and race to a kill target — the
**TDM mode of BGMI's WOW**, moved into zero-g. Desktop only (keyboard + mouse). Server-authoritative.

It is built from **SLUR** (`/Users/vishnu/SLUR`, `github.com/dineshsalunke/slur`): same stack, same
method, same art direction ("Cold Space. Warm Energy."). Parts are ported **by need, slice by slice**
(ADR-001). When you port a file, read its SLUR original and its SLUR convention first.

**Design lives in `docs/`** (GDD · DECISIONS). **This file is *how we build*.**

## Golden rule — read the conventions before touching a subsystem

| Touching… | Read first |
|-----------|-----------|
| Server / rooms / state sync | `conventions/colyseus.md` |
| Client routing / app shell | `conventions/react-router.md` |
| Rendering / VFX / bloom | `conventions/r3f.md` |
| Entities / systems / sim | `conventions/ecs.md` |
| Networking / prediction | `conventions/netcode.md` |
| Repo / builds / packages | `conventions/monorepo.md` |
| 2D UI styling (HUD/lobby) | `conventions/tailwind.md` |

The conventions were researched for SLUR. Their stack facts hold here. Where one talks about the track,
read "arena". Exact versions live in the **pnpm catalog** (`pnpm-workspace.yaml`) only.

## Stack (decided)

| Layer | Choice |
|-------|--------|
| Server | Colyseus 0.17 (`@colyseus/schema` 4) — `@colyseus/core` + `ws-transport` + express |
| Client routing | React Router 8 (framework mode, SPA `ssr:false`) |
| Rendering | React Three Fiber 9 + drei + postprocessing (three **0.185.x**) |
| 2D UI styling | Tailwind CSS v4 (DOM UI only — never the Canvas) |
| Client entities | koota ECS (client-only; the server runs the plain shared `simulate()`) |
| Repo | pnpm workspace monorepo (plain `pnpm -r`) |
| Build | Vite 8 (client) · tsx/Node ESM (server) · `tsc -b` (shared) |
| Language | TypeScript 7 (strict), ESM everywhere |

## Monorepo layout

```
voidbrawl/
├── apps/client/      @voidbrawl/client — Vite + React 19 + RR8 + R3F 9 + koota
├── apps/server/      @voidbrawl/server — Colyseus 0.17, Node ESM
├── packages/shared/  @voidbrawl/shared — Schema + shared simulate() + arena + ship classes (tsc → dist)
├── conventions/      stack idioms (read before touching)
└── docs/             GDD · DECISIONS · art-reference/
```

## The load-bearing contract (ADR-000)

> A room is an **arena descriptor** + **sequence-numbered inputs** + a thin slice of **dynamic state**.
> The server never sends geometry or visuals. Both ends materialize an identical physics `Arena` from the
> descriptor; the one shared `simulate()` runs over it.

## Non-negotiables

1. **Server is authoritative.** Clients send sequence-numbered **inputs**, never positions or hits.
2. **Arena from a descriptor**, materialized identically on both ends. Never sync colliders.
3. **One shared `simulate()`** at 60 Hz fixed step in `@voidbrawl/shared`, used by client prediction and server.
4. **Deterministic sim:** basic IEEE ops + `Math.sqrt` only. **No `sin`/`cos`/`atan2`/`random`/`Date.now`
   in the shared path.** Orientation is a quaternion (ADR-002).
5. **No assists.** No auto-aim, no aim assist, no auto-level (client decision). The seeker pickup is a
   weapon and is allowed.
6. **No per-frame React re-renders in gameplay.** ECS → R3F via refs/instancing in `useFrame`.
7. **`@voidbrawl/shared` is `tsc`-compiled to `dist`**, never source-consumed (schema decorator footgun).
8. **Ship stats are data** (`ShipClass` in shared), server-authoritative.
9. **`useEffect` is an escape hatch.** Long-lived resources (the Colyseus room, sockets, timers) live on
   module singletons, never tied to a component's mount.
10. **React house style:** `<Fragment>`, never `<>`; one component per file (route modules excepted).
11. **Componentize by subscription boundary** — subscriptions live in leaves; parents hold none.
12. **Verify the installed stack** before writing to it (docs → `.d.ts` → source). Never code from memory.
13. **No reflexive primitive** — for a mechanism choice, list ≥5 options, weigh them, record the winner in
    the PR body.
14. **No comments** except one line on `setTimeout` / `setInterval` / `useEffect`. `pnpm lint` enforces it.
15. **Never edit source with `sed`/`perl`/`awk`/regex.** Use `ast-grep`, ts-morph or a whole-file write.
16. **No Python** for tooling.

## Dev workflow

| Command | Does |
|---------|------|
| `pnpm install` | install all workspaces |
| `pnpm dev` | shared tsc-watch · server `:2567` · client `:5173` |
| `pnpm build` | shared → server → client |
| `pnpm typecheck` · `pnpm test` · `pnpm lint` | the verify gate — all must pass before a push |

Assets are **Git LFS** (`.gitattributes`). Run `git lfs pull` before `pnpm install` on a fresh clone.

## Working method

- **Vertical slices**, one at a time, each ending in a **human feel-gate** by the client:
  S1 flight (local) → S2 networked flight → S3 combat + health + respawn → S4 match flow + teams →
  S5 pickups + ship classes → S6 HUD, audio, VFX, art pass.
- Each slice: **issue → plan → client agrees → build → verify gate → client flies it → reconcile docs.**
- Decisions with a reason go to `docs/DECISIONS.md` as an ADR. The GDD states the current design only.
- **Roadmap = GitHub issues** on `g0dric24/voidbrawl`, grouped by milestone (one per slice).

## How to answer

Plain English, short. Quote the file and the words you rely on, never a bare pointer.
