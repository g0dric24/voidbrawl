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
| Right mouse or F | use the held pickup |
| 1 / 2 / 3 | ship class for your next spawn |
| K | self-destruct (counts as a death) |
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
- **Cover:** asteroids and monoliths fill the space between the bases. They are solid: collision.
- **Boundary: a solid wall (client, 2026-09-25).** No ship can leave the sphere. The hull hits the wall and
  bounces back, like hitting an asteroid. The wall *is* the sky: the nebula is painted on the inside of the
  sphere, so the whole environment is inside it and nothing exists beyond it. A soft marigold glow appears
  on the wall where you get close (no grid lines). The camera never leaves the sphere. The HUD warns
  within 60u. There is no "outside" zone and no out-of-bounds damage.
- **One map in v1.** The arena is data from a descriptor (seed + map id), built identically on both ends —
  the SLUR contract, now in 3D. More maps later. A WOW-style map editor is a much-later idea.
- **Sky:** the SLUR procedural nebula / deep-space sky, drawn on the arena wall (see Boundary).

## 7. Combat

### 7.1 Health

- **Hull** *(tune: 100)* — does **not** regenerate. Zero hull = death.
- **Shield** *(tune: 50)* — absorbs damage first. **Regenerates** after 4 s without taking damage *(tune)*.
- **Collision** with an asteroid, monolith or ship: a small bounce plus small damage, scaled by impact speed
  *(tune)*.
- **No friendly fire.** Teammates' shots pass through teammates.

### 7.2 Primary gun

- Unlimited ammo, **overheat** meter. Firing builds heat; at max heat the gun locks until it cools.
- Fires fast projectiles (bolts) straight along the nose. **No aim assist, no lock-on.**
- Hits are decided by the server.

### 7.3 Pickups

Pickups float at fixed points in the arena and respawn after a delay *(tune)*. A ship holds up to
**3** in slots (SLUR model: 1/2/3 select, the use key fires the selected one).

| Pickup | Effect |
|---|---|
| **Seeker** | Homing missile. Locks the nearest enemy in a forward cone at launch; dodge it late or break line of sight. A weapon, not an aim assist — the client approved it. |
| **Mine** | Laid in space; arms after a short delay; the first enemy that comes near triggers it. |
| **Shield** | Instantly refills the shield. |
| **Health** | Restores hull. |
| **Boost** | Refills the boost meter. |

### 7.4 Death and respawn

- Death → explosion → **3 s** wait (the camera holds where you died; spectating your killer is an S6 polish
  item) → spawn at a free point of your team base.
- **2 s spawn protection:** invulnerable; ends early if you fire.
- **Ship class:** press 1 / 2 / 3 at any time; the new class applies at your **next spawn**, never mid-life,
  so switching can't be used to heal.
- **K = self-destruct** (to get unstuck or change ship now); it counts as a death.

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

The other models (bob, comet, dispatcher, imperial) are reserved for later classes or skins.
**Hitbox:** a box that matches the model's measured bounds (SLUR's WYSIWYG rule), rotated with the ship.

## 9. Teams, rooms, players

- **Rooms:** live room list (host name · mode · players · phase) plus a shareable **invite link**.
- **Teams:** players pick a team in the lobby; the host can move players. Teams must be within one player
  of each other to start.
- **Join mid-match:** allowed; the joiner picks the smaller team and spawns at its base.
- **Identity:** a call sign only. No accounts, no saved stats in v1.
- **Bots:** not in v1.
- **Team colours:** **Marigold** (`#F59A24`) vs **Cyan** (`#3BD6FF`).

## 10. Look and sound

- Art direction carried over from SLUR: **"Cold Space. Warm Energy."** Dark graphite and stone, cold
  desaturated space, sparse emissive energy. References in `docs/art-reference/`.
- Team colour is the energy colour on ships, bolts and HUD. **Every ship's edges glow in its team colour**
  (a rim light), which is how you tell friend from foe. No rings or markers around ships (client).
- Audio carried over: Kenney CC0 SFX, synth engine hum, synthwave music.

## 11. HUD

Hull + shield bars · boost meter · gun heat · held pickups · team score + target + timer · kill feed ·
off-screen enemy indicators · hit markers · boundary warning · damage direction indicator.

## 12. Hosting

Web server (the authoritative Colyseus server plus the static client). Works on LAN too.

## 13. Out of scope for v1

Mobile / touch · bots · accounts and stats · map editor · cockpit view · voice chat · ranked play.

## 14. OPEN QUESTIONS

1. Arena radius, speeds, turn rates, damage numbers — set at the S1 / S3 feel-gates.
2. Seeker cone angle and lock range.
3. Does boost also raise turn rate, or only speed?
4. Mine count per player and lifetime in open space.
