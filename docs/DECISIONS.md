# VOIDBRAWL — Decision Log (ADRs)

Append-only. Never edit a past record in place — supersede it with a new one and add a `Superseded-by:`
link. Status vocabulary: **Accepted** · **Superseded** · **Proposed**.

---

## ADR-000 — The load-bearing contract

- **Status:** Accepted · **Date:** 2026-09-25 · **Inherited from:** SLUR ADR-000, moved from a track to an arena.

> A room is an **arena descriptor** + **sequence-numbered inputs** + a thin slice of **dynamic state**.
> The server never sends geometry and never sends visuals. Both ends materialize an *identical*
> physics `Arena` (bounds, colliders, spawn points, pickup anchors) from the descriptor, and one shared
> `simulate()` runs over it.

**Four invariants:**

1. **The descriptor is synced; the `Arena` is materialized locally.** Never sync colliders.
2. **The `Arena` is gameplay data only** — colliders, bounds, spawns, anchors. Visuals are client-only.
   Litmus: *"if two clients disagreed on this, would the game desync?"* Yes → `Arena`. No → client.
3. **Motion-affecting → shared `simulate()` + synced state; cosmetic → broadcast.**
4. **Determinism:** identical materialization and identical `simulate()` on both engines — IEEE-754 basic
   ops and `Math.sqrt` only; **no `Math.sin`/`cos`/`atan2`/`random` in the shared path.**

**Where the sim runs:** the server simulates all ships. Each client predicts its own ship and
interpolates remote ships from buffered snapshots.

---

## ADR-001 — Start a new repo; port selected SLUR parts

- **Status:** Accepted (client) · **Date:** 2026-09-25

**Decision.** VOIDBRAWL is a new repo (`github.com/g0dric24/voidbrawl`), not a fork. The owner of SLUR
allows the copy. We port by need, slice by slice, never wholesale.

| Ported now | Ported later, when a slice needs it | Not ported |
|---|---|---|
| Stack + pnpm catalog · conventions · lint scripts · rules | Colyseus room + lobby + phase machine · netcode (prediction, reconcile, interpolation) · weapons (bolt, seeker, mine, pickups) · sky · asteroid / monolith / shatter VFX · audio engine · HUD / Tailwind UI | Track generator · straight-ribbon sim · rails / deck / gaps · strafe-only flight · chase camera · race director |
| Assets: ship models, audio, fonts, textures, art references | | |

**Why a new repo:** about half of SLUR's shared sim is the track generator and 2D-plane maths. A fork
would carry that as dead code and its constraints (straight ribbon, strafe-only) as false rules.

---

## ADR-002 — Full 6-DOF flight with no assists

- **Status:** Accepted (client) · **Date:** 2026-09-25

**Decision.** Mouse = yaw/pitch, Q/E = roll, WASD + Space/Ctrl = thrust on the ship's own three axes.
**No auto-level and no auto-aim** (client, explicit). The ship can stop and hover; linear and angular drag
bring it to rest when input stops. Camera is locked to the ship's roll.

**Orientation is a quaternion** in the sim state. Mouse input arrives as per-tick angular rates, and the
sim integrates them with the small-angle quaternion update `q += ½·ω·q·dt`, then normalizes with
`Math.sqrt`. This uses only basic ops and `sqrt`, so it keeps ADR-000 invariant 4. No Euler angles in the
sim.

**Rejected:**

| Option | Why not |
|---|---|
| Arcade flight with auto-level | Client rejected auto-level. |
| Euler angles (yaw/pitch/roll) | Gimbal lock under free roll; needs `sin`/`cos` to build a matrix. |
| Mouse-to-target steering (ship turns toward a cursor point) | Is a form of aim assist; adds latency between mouse and nose. |
| A physics engine (Rapier, cannon) | Not deterministic across both ends without lock-step; SLUR's kinematic sim already proves the model. |

**Open (S1 feel-gate):** max turn rates, drag values, mouse sensitivity, inverted-Y option.

---

## ADR-003 — The arena edge is a solid wall

- **Status:** Accepted (client) · **Date:** 2026-09-25 · **Replaces:** GDD §6 "outside the sphere a ship takes damage each second"

**Decision.** The sphere's surface is a wall at `arena.radius`. `collideBoundary()` clamps the hull inside
it and bounces the ship with the class restitution, the same response as an asteroid. `Arena.hardRadius`
and `ShipState.outside` are removed. The wall is drawn as a faint grid everywhere and glows near the
ship; the HUD warns within 60u.

**Why.** The client: *"I should see the boundary clearly of sphere, also I should not be able to go beyond
boundary."* A damage zone lets players leave the fight; a wall keeps every ship in play and needs no
new rule for kills out of bounds.

**Rejected:** a damage zone outside the sphere (the previous design); a soft push-back force (still lets
a fast ship drift out, and it fights the player's input); wrapping to the opposite side (disorienting and
breaks line of sight).

---

## ADR-004 — Networked flight: inputs in, prediction for self, interpolation for others

- **Status:** Accepted · **Date:** 2026-09-25 · **Inherited from:** SLUR's netcode (`conventions/netcode.md`)

**Decision.**

- The client sends **sequence-numbered `FlightInput`s** (one per 60 Hz tick, batched at 30 Hz). Mouse turn is
  already an angle per tick, so the server needs nothing but the input to reproduce the move.
- The server **queues** each player's inputs (drops malformed and already-seen seqs, caps the queue at 120)
  and steps a ship **only when it has an input for it**, one input per tick, recording `lastProcessedInput`.
  A client that stops sending (a hidden tab) freezes in place instead of drifting on stale input.
- The local ship is **predicted** with the same `stepShip()` and **reconciled** on every patch: snap to the
  server state, drop acknowledged inputs, replay the rest.
- Remote ships are **interpolated 100 ms in the past** (two patches at 20 Hz): linear position, slerped
  rotation, held at the newest snapshot rather than extrapolated.
- Teams are **auto-balanced on join** (smaller team, ties to Marigold). S4 adds picking in the lobby.

**Rejected:** clients sending positions (no authority, no replay); stepping idle ships with an empty input
(the client cannot predict inputs it never sent, so every hidden-tab gap becomes a correction);
extrapolating remote ships (overshoots on every turn in 6-DOF).

---

## ADR-005 — The sky is the arena wall; ships glow in their team colour

- **Status:** Accepted (client) · **Date:** 2026-09-25 · **Amends:** ADR-003 (how the wall is drawn)

**Decision.**

- The nebula sky is drawn on a sphere of `arena.radius` fixed at the centre, not on a box that follows the
  camera. The environment is literally inside the sphere, and flying toward the wall brings the sky closer.
  The follow camera is clamped 2u inside the wall, so the view never reaches past it.
- ADR-003's lat/long grid is removed. The only wall cue is a soft marigold glow on the wall near the
  camera (`Boundary.near`, `Boundary.glow`), plus the HUD distance warning.
- Remote ships lose their team ring. Every ship (local and remote) gets a fresnel rim light in its team
  colour, patched into its cloned glTF materials (`Ship.rimStrength`, `Ship.rimPower`).

**Why.** The client: *"i dont want to see the ring surrounding the ships make the ships edges glow"* and
*"i dont want the sphere of lines … all should be pitch black whatever env is there its inside the
sphere."*

**Known cost.** At long range a ship is a few pixels, so its rim reads as a coloured glint, not a shape.
If spotting enemies at range proves hard in play, the lever is rim strength or an off-screen indicator
(GDD §11), not the ring.
