# VOIDBRAWL

Team deathmatch in space, in the browser. 1v1 · 2v2 · 4v4 ships fly free 6-DOF inside a spherical arena,
respawn at their base, and fight to a kill target.

Built from [SLUR](https://github.com/dineshsalunke/slur): same stack, same art direction —
*Cold Space. Warm Energy.*

## Run it

```sh
git lfs install && git lfs pull   # models, textures, music and art references are LFS
pnpm install
pnpm dev      # shared (tsc-watch) · server (:2567) · client (:5173)
```

## Docs

- [docs/GDD.md](docs/GDD.md) — what we are building
- [docs/DECISIONS.md](docs/DECISIONS.md) — why (ADR log)
- [conventions/](conventions/) — stack idioms, read before touching a subsystem
- [CLAUDE.md](CLAUDE.md) — how we build
- [CREDITS.md](CREDITS.md) — asset licenses
