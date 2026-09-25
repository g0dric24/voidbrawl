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

---

## ADR-006 — Combat: predicted heat, launch-only bolts, server-decided damage

- **Status:** Accepted · **Date:** 2026-09-25 · **Issue:** #5

**Decision.**

- **The gun is part of the predicted sim.** `stepPilot()` = `stepShip()` + `stepGun()`. Heat, cooldown and
  the overheat lock depend only on your own input, so the client predicts them and the heat bar reacts at
  once. The cooldown carries its remainder, so the fire rate is exact rather than rounded to whole ticks.
- **Bolts are synced as launch data only** (`x0 y0 z0 vx vy vz t0 owner team`, plus `tEnd` and `struck`).
  A bolt never changes course, so each client computes its position from a server clock estimated off the
  synced `MatchState.time` (minimum observed offset, drifting 0.5 ms per sample). No per-tick bolt
  positions go over the wire. The server keeps a hit bolt for 0.3 s with `tEnd` = impact time so a client
  rendering 100 ms behind still draws it to the impact point.
- **Hits are server-only**: a swept segment against ship hull spheres, asteroids and the wall per tick,
  earliest contact wins, teammates ignored. Damage, kills, deaths and respawns are server decisions. Your
  own shots are drawn from **local cosmetic tracers** (spawned by the predicted gun) so they leave the nose
  instantly; your own server bolts are not drawn.
- **Health is not predicted.** Shield regen, spawn protection and the respawn timer tick on the server every
  tick, whether or not an input arrived. A dead ship's inputs are acknowledged and dropped.
- **Class changes apply at the next spawn** (`nextClassId`); **K self-destructs** so a player can change
  ship now or get unstuck. It counts as a death (S4 decides who scores it).

**Rejected:** syncing bolt positions every patch (≈100 changing entities × 20 Hz for no gain);
client-side hit detection (trivially cheatable, and clients disagree about positions by design);
lag-compensated hitscan (unneeded with projectiles on LAN); instant class switching (a free heal).

---

## ADR-007 — Readable combat: hit spheres, 3× ships, markers, lead hint

- **Status:** Accepted (client) · **Date:** 2026-09-25 · **Issue:** #5

**Context.** The client found hits "difficult" and other ships "impossible" to identify. Measured: the
Fighter's hit sphere (1.4u) did not even cover its wings (the model needs 1.85u); at 200u a ship was about
12 px wide; a bolt takes ~0.5 s to cross 200u, in which a 60 u/s target moves ~30u.

**Decision** (client approved each item; research in the S3 PR):

1. **Hit sphere ≠ collision sphere.** `ShipClass.hitRadius` covers the whole model, measured from the glTF
   bounds, plus 10 %. `tuning.hullRadius` stays near ship width for rocks and the wall. Hitboxes larger than
   the model are standard practice in fast shooters.
2. **Ships 3× bigger** (`SHIP_SCALE`), with the camera pulled back to match (back 26, height 8). Rock gaps
   widened to 22u (a test asserts the widest ship fits), 130 rocks, and a 170u open centre for fighting.
3. **Screen-space markers** on every other ship (team-colour bracket, name, distance), edge arrows for
   enemies off screen. **No health bars on other players** (client).
4. **Lead marker** for enemies on screen: `leadPoint()` solves the intercept for the shooter's bolt speed
   and the target's interpolated velocity. It is a hint; bolts still fly along the nose, so it keeps the
   GDD's "no aim assist" rule.
5. **Brighter ships:** stronger rim, hull self-light, and engine trails on other ships.

**Rejected:** bullet magnetism / auto-aim (client ruled out assists); lock-on guns (same); a lead marker
that moves the reticle (would feel like assist); health bars over enemies (client dropped them).

---

## ADR-008 — Match flow on the server; readability pass on the arena

- **Status:** Accepted (client) · **Date:** 2026-09-26 · **Issue:** #7

**Match flow.** `MatchState` gains `phase` (lobby → countdown → live → results), `mode`, `hostId`, the two
scores, `timeLeft`, `countdown`, `suddenDeath` and `winner`. The rules are pure functions in
`@voidbrawl/shared/match` (team caps, open side, start rule, verdict) so the server and tests share them.
Every death scores for the other side — a bolt kill, a crash or a self-destruct alike. At the time limit the
leader wins; a tie sets `suddenDeath` and the next point wins. The pilot step runs in three modes: `fly`
(lobby — movement, no guns, no damage), `fight` (live) and `frozen` (countdown, results — inputs are
acknowledged and dropped, and the client stops predicting). Rooms are listed through Colyseus
`LobbyRoom` + `enableRealtimeListing()` with `{ hostName, mode, phase, players, capacity }` metadata. The
room is joined from the `/game/:roomId` route loader and left from the `/lobby` loader, never from a
component unmount.

**Readability pass** (from the environment research): the default sky is the darker Deep Space preset;
the wall glow is neutral steel so team colours mean teams only; remote ships carry two fixed-pixel-size
wingtip beacons in their team colour; base rings move 50u behind the spawn line so they no longer cross the
view at spawn. (A centre ring of pillars was built here and removed by ADR-009.)

**Rejected:** client-decided phases or scores (cheatable and racy); a separate lobby room per match (one
room through all phases keeps players, sides and the arena warm).

## ADR-009 — Asteroids only; a server-side practice bot

- **Status:** Accepted (client) · **Date:** 2026-09-26 · **Issue:** #7

**Arena.** The client asked to keep the original asteroid theme. The pillar ring and the open centre are
removed. 150 asteroids fill the whole sphere with the same 22u flyable gap. Ship and bolt collision go back
to spheres only.

**Practice bot.** `JoinOptions.bot = true` makes a private 1v1 room with one bot on Cyan. The bot lives on
the server as a player without a client: `BotRoster` gives it a `bot:` session id and an input queue, and
each fixed step it pushes one `NetInput` from `botInput()` before the pilots step. So the bot obeys the same
flight, heat, damage and respawn rules as a human, and needs no new sync. Its brain: nearest enemy → lead
point with random aim error → steer away from the wall and rocks ahead → throttle by range → jink → fire
inside a small off-axis cone. The host is never a bot.

**Rejected:** a client-side bot (the client is not authoritative, and a tab that closes kills the bot); a
bot that sets positions directly (skips the shared sim, so it would fly by different rules); listing
practice rooms in the lobby (another player joining would find the seat taken).

## ADR-010 — An empty side forfeits; dev pre-bundles every route

- **Status:** Accepted (client) · **Date:** 2026-09-26 · **Issue:** #7

**Forfeit.** When a player is removed (a leave, or a reconnect that timed out) during countdown or live,
the room counts the sides. If one side has no pilots and the other has some, `forfeitWinner()` names the
side that stays, and the match goes to results with `MatchState.forfeit = true`. One leaver on a side that
still has pilots changes nothing. The client frees the pointer lock when `phase` becomes results (a
Colyseus `listen` on the room state), and shows **Leave match** whenever the mouse is free in countdown or
live.

**Dev black screen.** Vite found three, R3F and koota only when the game route first loaded, re-bundled
them, and force-reloaded the page mid-navigation. `optimizeDeps.entries` now lists the root and every route
module, and `@colyseus/schema` is included through `@voidbrawl/shared` (which is excluded, so the scanner
cannot see through it). A cold start makes no reload. The root also has a `HydrateFallback`.

**Rejected:** ending on the first leaver (the user wants 2v2 and 4v4 to go on); a bot that fills the empty
seat (not asked for); forfeit during the lobby (nothing to win yet).

## ADR-011 — Pickups on the server; class traits as data

- **Status:** Accepted (client) · **Date:** 2026-09-26 · **Issue:** #9

**Pads are geometry, pickups are state.** Pad positions come from the arena descriptor (a second seeded
stream after the rocks, so the rock field does not move), in mirrored pairs so neither base is favoured.
Only each pad's current kind is synced (`MatchState.pads`, one `uint8`). The server rolls kinds and runs the
respawn timers.

**Slots and use.** Held pickups are three `uint8` fields on `PlayerState`. Keys 1/2/3 send
`USE_PICKUP_MESSAGE` with the slot index; the server checks the slot exists for the class and applies the
effect at once. Using is a discrete event, so it is a message and not a field in the per-tick input.

**Seekers and mines run only on the server** and are synced as positions (`missiles`, `mines` maps). Unlike
bolts, a seeker's path depends on a moving target, so clients cannot derive it from launch data; the client
extrapolates from the last patch for up to 120 ms. Seeker hits reuse `sweepBolt` over the tick's segment with
the hit spheres grown by a 2u fuse. One `damageShip()` now serves bolts, seekers and mines, so kill credit and
the hit message are the same for all three.

**Traits are class data.** `ShipClass` gains `slots`, `regenDelay`, `regenRate`, and flight tuning gains
`dashSpeed` and `dashCooldown` (zero for classes without a dash). Dash is part of `FlightInput` and runs inside
`stepShip`, so the local ship predicts it and the server reconciles it like any other input. Every class
already regenerated shield, so the Heavy trait is a shorter delay and a faster rate rather than regen itself.

**Class picker.** In the lobby a class change applies at once; in a match it applies at the next spawn. Keys
1/2/3 moved from class switching to pickups; class choice moved to the lobby cards and the Esc menu.

**Rejected:** syncing pad positions (breaks the descriptor contract); select-then-fire slots (slower in a
fight than one key per slot); client-side seekers (a client could steer them); line-of-sight lock breaking
(rocks already stop seekers physically, and a LOS test every tick costs a rock sweep per missile).
