# VOIDBRAWL — Game Design Document (GDD)

> Status: **v0 — agreed with the client on 2026-09-25.** Numbers marked *(tune)* are first-pass values.
> The feel-gate of the slice that builds them sets the real value. Decisions and their reasons go to
> `DECISIONS.md`. This file states the current design only.

## 1. Vision

A team deathmatch in space, in the browser. Two teams (or two players) fly free 6-DOF ships inside a
spherical arena and shoot each other. A dead ship respawns at its team base. The first side to reach the
kill target wins.

Model: the **TDM mode of BGMI / PUBG Mobile's World of Wonder (WOW)** — small arena, no loot, fast
respawn, first to N kills — moved into zero-g space with ships.

**Pillars** (every feature serves at least one):

1. **Instant** — link to fighting in seconds. No accounts, no install.
2. **Skill in your hands** — you fly and aim yourself. No auto-aim, no auto-level, no aim assist.
3. **Readable chaos** — 8 ships, bolts and seekers in open space, and you can still tell who is where.

**Platform:** desktop browser only (keyboard + mouse). Mobile is out of scope for v1.

## 2. References

| Game | We take | We leave |
|---|---|---|
| **BGMI / PUBG Mobile — WOW TDM** | Team sizes, first-to-N kills, instant respawn, no loot, spawn bases | Guns, soldiers, maps editor (later) |
| **Descent / Elite** | True 6-DOF flight, free roll, no fixed "up" | Slow pace, simulation depth |
| **SLUR** (our origin) | Netcode, lobby + rooms, weapons (bolt, seeker, mine), ships, sky, audio, art direction | Straight track, racing, strafe-only flight |

## 3. Core loop

```
Room list / invite link ──► lobby: pick team + ship ──► host GO ──► 3·2·1 ──► MATCH
        ▲                                                                       │
        └──── back to lobby ◄── host "Play Again" ◄── RESULTS ◄── kill target / time + sudden death
       (join any time; a player who joins mid-match picks a team and spawns at its base)
```

Inside a match: **spawn → fly → fight → die → 3 s → respawn** until one side reaches the target.

## 4. Modes

| Mode | Players | Kill target | Time limit |
|---|---|:--:|:--:|
| Duel | 1v1 | 10 | 10 min |
| Squad | 2v2 | 20 | 10 min |
| Team | 4v4 | 40 | 10 min |

- A **kill** scores 1 for the killer's team. Collision and self-inflicted deaths give the point to the
  other team.
- At the time limit the higher score wins. On a tie: **sudden death** — the next kill wins.
- The host picks the mode in the lobby.

## 5. Flight — full 6-DOF, no assists (decided)

The ship is a free body in zero-g. **It never rolls, levels or aims for you.**

| Input | Action |
|---|---|
| Mouse X / Y | yaw / pitch (turn the nose), relative to the ship's own axes |
| Q / E | roll left / right |
| W / S | thrust forward / reverse |
| A / D | strafe left / right |
| Space / C | strafe up / down (ship's own up). Not Ctrl: Ctrl+W closes the browser tab |
| Shift | boost (drains a meter; the meter recharges) |
| V | switch aim mode (direct / joystick) |
| Left mouse | primary gun |
| Right mouse hold / release | lock a seeker / fire it |
| F | drop a mine |
| A A / D D | dash (Interceptor only) |
| Tab | scoreboard |
| M | mute |
| Esc | release the mouse / menu |

- **Pointer lock** captures the mouse during a match.
- **Can stop and hover.** Thrust accelerates up to a max speed; with no input, linear drag bleeds speed to
  zero *(tune)*. Rotation stops when the mouse stops, so the ship holds its heading.
- **Two aim modes, picked at the S1 feel-gate** *(both built)*:
  - **Direct** (default): mouse movement turns the nose by an angle, like an FPS. The class turn rate caps
    each tick; a fast flick finishes over a few ticks (carry ≤ 0.15 rad), never drifts further.
  - **Joystick**: the mouse moves a virtual stick; its offset from centre sets the turn rate. The stick
    stays where you leave it.
- No mouse smoothing that delays aim.
- **Camera:** third-person, behind and slightly above the ship, **locked to the ship's roll** (the
  horizon turns with you). A small lag on position only, never on aim. Cockpit view is a later option.

## 6. Arena

- A **sphere**, medium size — two bases can see each other across it. Radius **600u** *(tune)*.
- **Bases:** two spawn zones on opposite poles. Each has several spawn points so squadmates do not stack.
- **Cover (client, 2026-09-26):** 150 asteroids fill the whole space between the bases, the centre too,
  with 22u gaps (every ship fits). There are no built structures — the arena is asteroids only. Rocks are
  solid: ships bounce off them and bolts stop on them.
- **Boundary: a solid wall (client, 2026-09-25).** No ship can leave the sphere. The hull hits the wall and
  bounces back, like hitting an asteroid. The wall *is* the sky: the nebula is painted on the inside of the
  sphere, so the whole environment is inside it and nothing exists beyond it. A soft **steel** glow appears
  on the wall where you get close (never a team colour) (no grid lines). The camera never leaves the sphere. The HUD warns
  within 60u. There is no "outside" zone and no out-of-bounds damage.
- **One map in v1.** The arena is data from a descriptor (seed + map id), built identically on both ends —
  the SLUR contract, now in 3D. More maps later. A WOW-style map editor is a much-later idea.
- **Sky:** the SLUR procedural sky, drawn on the arena wall (see Boundary). Default = the darker **Deep
  Space** preset, so ships stay the brightest thing on screen; the brighter Nebula look is kept for a later
  map.
- **Base rings:** a dim ring in the team colour stands 50u behind each spawn line — it marks home without
  crossing the view at spawn.

## 7. Combat

### 7.1 Health

- **Hull** *(tune: 100)* — does **not** regenerate. Zero hull = death.
- **Shield** *(tune: 50)* — absorbs damage first. **Regenerates** after 4 s without taking damage *(tune)*.
- **Collision** with an asteroid, monolith or ship: a small bounce plus small damage, scaled by impact speed
  *(tune)*.
- **No friendly fire.** Teammates' shots pass through teammates.

### 7.2 Primary gun

- Unlimited ammo, **overheat** meter. Firing builds heat; at max heat the gun locks until it cools.
- Fires fast projectiles (bolts) straight along the nose. **No aim assist, no lock-on** — bolts go exactly
  where the nose points.
- **Lead marker (client, 2026-09-25):** a small circle in the enemy's team colour shows where to shoot a
  moving enemy (Everspace 2 "aim leader", War Thunder arcade "lead marker"). It is a hint only; it never
  moves a bolt.
- **Hit sphere:** each class has an invisible hit sphere that covers the whole model (measured from the
  model files) plus 10 %, so a hit anywhere on the ship counts whatever way it is turned: Fighter 6.1u,
  Interceptor 4.5u, Heavy 10.9u. It is separate from the smaller collision sphere used against rocks.
- Hits are decided by the server.

### 7.3 Utilities — a fixed kit, no pickups

**Pure deathmatch (client, 2026-09-26).** There is nothing to collect in the arena. Every pilot spawns with
the same kit for the class and gets it back **only on respawn**, like the WOW-mode TDM loadout. The side
that dies more refills more often, which pulls a one-sided match back.

| Class | Seekers | Mines |
|---|:--:|:--:|
| Fighter | 3 | 3 |
| Interceptor, Heavy | 2 | 2 |

| Utility | How it works |
|---|---|
| **Seeker** | **Hold right mouse** with an enemy in a **20° cone within 300u**; the ring on the target fills over **0.6 s**. **Release** to fire. Releasing early fires nothing. 170 u/s, 6 s life, **35 damage** (never a kill on a full-health ship alone), **4 s** before the next one. Turns at most 1.6 rad/s, so a late hard turn beats it, and a rock stops it. The target sees **LOCKING ON YOU**, then **MISSILE LOCK**, then **MISSILE INCOMING**. |
| **Mine** | **F** drops one behind you. Arms after **1 s**; max 3 out per pilot (a fourth removes your oldest). Once armed, the first enemy within 18u sets it off early; otherwise it **blows up on its own 6 s after the drop** (client, 2026-09-26). Either way: **40 damage** to every enemy within 26u. A mine is a small dark core in the owner's team colour that **ticks**: a short bright blink, about once a second at the drop, speeding up to ten a second just before the 6 s blast. No trigger-zone sphere is drawn. Mines may be dropped anywhere, the enemy base too (spawn protection covers fresh ships). |

The HUD shows both under the health bars: **RMB SEEKER ■■□** and **F MINE ■■**, with the seeker cooldown as
a fill.

### 7.4 Death and respawn

- Death → explosion → **3 s** wait → spawn at a free point of your team base. During the wait the camera
  stays where you died and **turns to face your killer**; the screen reads "Destroyed by X · guns / seeker /
  mine" or "You crashed" (built in S6).
- **2 s spawn protection:** invulnerable for the full 2 s, **even while you fire** (client, 2026-09-26).
- **Ship class:** pick it in the Esc menu at any time; the new class applies at your **next spawn**, never
  mid-life, so switching can't be used to heal.
- **No self-destruct** (removed at the client's request, 2026-09-26). The only deaths are bolts, seekers,
  mines and crashes.

**First-pass combat numbers** (`ship-classes.ts`, tune at the S3 gate):

| Class | Hull / shield | Damage per bolt | Fire interval |
|---|:--:|:--:|:--:|
| Fighter | 100 / 50 | 9 | 0.09 s |
| Interceptor | 75 / 40 | 7 | 0.075 s |
| Heavy | 150 / 75 | 13 | 0.12 s |

Bolts fly at 420 u/s plus the ship's forward speed for 1.4 s. Continuous fire overheats in about 2.3 s; the gun
unlocks when heat falls to 30 %. The shield starts regenerating 4 s after the last hit, at 20 per second.
Hitting an asteroid or the wall faster than 14 u/s does damage.

## 8. Ships

Three classes to start. Stats are **data** (server-authoritative), so balancing is a config edit.

| Class | Model | Fantasy | Hull / shield | Speed | Turn |
|---|---|---|:--:|:--:|:--:|
| **Fighter** | challenger | all-rounder | mid | mid | mid |
| **Interceptor** | executioner | fast, fragile, twitchy | low | high | high |
| **Heavy** | split-crown | slow tank | high | low | low |

**Class traits (built in S5, client 2026-09-26)** — one thing each class does that the others cannot:

| Class | Trait |
|---|---|
| **Fighter** | Carries **3** seekers and **3** mines (others 2 and 2). |
| **Interceptor** | **Dash**: double-tap A or D for a 55 u/s sideways kick, 2.5 s cooldown. Boost refills 2× faster. |
| **Heavy** | Shield starts to recover after **2 s** without damage (others 4 s) and recovers at **2×** the rate. |

**Picking a class:** cards in the room lobby (applies at once); during a match, Esc opens the menu with the
same cards (applies at the next spawn). The chase camera sits further back for bigger ships.

The other models (bob, comet, dispatcher, imperial) are reserved for later classes or skins.
**Scale and hit area:** ships are drawn at **3× the SLUR size** (`SHIP_SCALE`) so they read at range — a
Fighter is about 8u wide. Two spheres per class: a **collision sphere** (~ship width, used against rocks and
the wall) and a larger **hit sphere** that covers the whole model (§7.2). Rock gaps (22u) always fit the
widest collision sphere.

## 9. Teams, rooms, players

- **Rooms (built in S4):** Play → `/lobby`: call sign, **Create 1v1 / 2v2 / 4v4**, and a live room list
  (mode · host · players / capacity · phase · Join). A room is `/game/:roomId`; **Copy invite link** shares
  it. Room capacity = 2 × team size; a full room refuses joiners.
- **Teams:** players pick a side in the lobby, capped at the team size; the host can move players. The host
  can **Start** when both sides have a pilot and differ by at most one. Ships can fly in the lobby with guns
  off; countdown and results freeze everyone.
- **Join mid-match:** allowed; the joiner goes to the smaller side with room and spawns at its base.
- **Host:** the room creator; if the host leaves, the next pilot becomes host.
- **Leaving (client, 2026-09-26):** a pilot can leave at any time — Esc frees the mouse and shows
  **Leave match**. When the last pilot of a side leaves during countdown or the match, the match ends and
  the other side wins ("Cyan left the match"). If other pilots stay on that side, the match goes on. A
  dropped connection holds its seat for 20 s before it counts as a leave. The mouse is freed when results
  show.
- **Results:** winner, score, kills and deaths per pilot; the host's **Play again** returns everyone to the
  lobby with sides kept.
- **Identity:** a call sign only. No accounts, no saved stats in v1.
- **Practice vs bot (client, 2026-09-26):** the lobby's **Practice 1v1 vs bot** creates a private 1v1
  room. The bot flies Cyan; the player is host on Marigold and starts the match. The bot uses the same
  inputs and the same `simulate()` as a player: it hunts the nearest enemy, aims at the lead point with a
  small random error, avoids rocks and the wall, jinks and fires when on target. No bots in 2v2 / 4v4 yet.
- **Team colours:** **Marigold** (`#F59A24`) vs **Cyan** (`#3BD6FF`).

## 10. Look and sound

- Art direction carried over from SLUR: **"Cold Space. Warm Energy."** Dark graphite and stone, cold
  desaturated space, sparse emissive energy. References in `docs/art-reference/`.
- Team colour is the energy colour on ships, bolts and HUD. **Every ship's edges glow in its team colour**
  (a rim light), the hull carries a little self-light so it reads against dark space, and other ships
  leave an **engine trail** in their team colour (your own trail is hidden — it would point at the camera).
  No 3D rings around ships (client).
- **Readability lesson from research:** Everspace 2 chose a "colorful universe" with bright ships; our dark
  graphite ships on a dark scene were near-invisible at range. Keep the world dark and the ships bright.
- **Audio (built in S6)** — Kenney CC0 SFX, a synth engine hum and two music tracks, on SLUR's Web Audio engine
  (threat › combat › UI › engine › music buses; louder buses duck quieter ones).
  - Other pilots' shots, hits, deaths, seeker launches and blasts, and mine blasts play **in 3D** from where they
    happen, so you hear an enemy behind you. Other pilots' gunfire and hits are heard only **within 500u**;
    deaths and blasts carry further.
  - Your own gun, boost, dash, hits taken and hit confirms play flat. The engine hum rises with speed.
  - Seeker: your lock blips quicken as the ring fills and chime on full lock. The target hears a warning that
    quickens from *locking* to *locked* to *incoming*. Mines tick with their blink within 160u.
  - Countdown blips, GO, respawn, a win or lose sting. Calm music in the lobby and results, synthwave in the match.
  - **M** mutes; a volume slider sits in the room lobby and the Esc menu. Both are saved on the device.

## 11. HUD

Hull + shield bars · boost meter · gun heat · seekers and mines left · team score + target + timer · kill feed ·
off-screen enemy indicators · hit markers · boundary warning.

**Built in S6:** hold **Tab** for a per-team scoreboard (ship, kills, deaths) · a red **damage-direction** arc at
the screen edge points at whoever just hit you · **+1 KILL** under the crosshair · the death screen names your
killer and weapon.

**VFX (S6):** expanding shockwave rings on ship deaths, mine blasts and seeker bursts · seeker smoke trails ·
one neutral white spark for every hit, the same on shield or hull · grey debris when bolts hit rocks · a burst
behind an Interceptor dash · bigger ship explosions.

**Ship markers:** every other ship gets a screen-space bracket in its team colour with its name and class
(teammates smaller and dimmer). Enemies on screen get the lead marker (§7.2). **What you may know about
enemies (client, 2026-09-26):**
- An enemy's marker shows **only when no rock blocks your view** of it; the seeker lock ring follows the
  same rule.
- The off-screen edge arrow shows only for enemies **within 400u**, or one that **hit you in the last 3 s**.
- An enemy's distance shows only within 400u; beyond, the label is the class alone.
- Only your own base ring is drawn.
- **You never see another player's health**: no health bars, and a hit spark looks the same whether it hit
  shield or hull. You see only your own hull and shield.
- Teammates are always marked, with distance.

## 12. Hosting

Web server (the authoritative Colyseus server plus the static client). Works on LAN too.

## 13. Out of scope for v1

Mobile / touch · bots in team modes · accounts and stats · map editor · cockpit view · voice chat · ranked play.

## 14. OPEN QUESTIONS

1. Arena radius, speeds, turn rates, damage numbers — set at the S1 / S3 feel-gates.
2. Utility and trait numbers (seeker, mine, dash, regen) — set at the S5 feel-gate.
3. **Balance watch:** spawn protection now lasts through firing, so a fresh ship can deal up to ~200 damage
   risk-free near its base. If that turns fights near a base one-sided, halve gun damage while protected.
4. **Balance watch:** the Fighter's extra seeker + mine may make it the default pick; check at the S5 gate.

Resolved in S5: seeker cone 20° / range 300u; mines max 3 per pilot, 6 s fuse; boost raises speed only.
