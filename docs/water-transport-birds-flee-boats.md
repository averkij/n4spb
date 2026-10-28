# Water birds fly away from the driven boat (and car)

Owner request (2026-10-28): "water birds should fly away when water transport going on them (like the pigeons now during walking)".

## What was there

- **Pigeons / sparrows / crows / gulls** react to the player (`W.player` = `ctx.player.position`). While a vehicle is driven `drive.js syncPlayer()` puts `player.pos` on the car / boat every frame, so
  a car or a boat already counts as "the player" for them: the radius is `scare * (1 + 0.45 * clamp(speed / 4, 0, 1.4))`, with the speed taken from the position delta and clamped to 12 m/s
  (pigeon 4.5 m -> at most 7.3 m, gull on a post or a boat roof 8 m -> at most 13 m). There is no heading, so a boat at 12-17 m/s was past a bird before the bird moved.
- **Ducks** (`wildlife/ducks.js`, groups of mallards on lanes along the quay walls; the Tauride ponds use the same code with `pond` lanes) had **no fear at all**: their pose was a pure function of `t` on
  a lane, a boat drove straight through them. Swans do not exist in the module; the gulls of the water are the post gulls, the boat-roof gulls (moored and tourist boats) and the sky / escort gulls
  (11-24 m and 4-8 m up, not touched).

## What changed

### `wildlife/threat.js` (new): the vehicle as the water birds see it
`makeThreat(ctx)` reads `ctx.drive` once a frame (`wildlife.js` calls `threat.update()` before the parts update; `ctx.drive` is built after wildlife, so it is read lazily) and answers
`threat.scares(x, z, y, near)`:

| test | rule |
|---|---|
| near ring | `d < near + hull + 0.35 v` (hull = the spec's `front`, 3 m for the boat): a boat lying still scares a bird 8 m off, not 14 m; at 17 m/s the ring is 16 m |
| heading cone | the bird is ahead of the hull: `0 < along <= min(70, hull + near + look * v)` (look 3 s for a boat, 1.5 s for a car) and `lat < wide + 0.2 along` (wide 6 m boat, 3 m car) |
| height | `|vehicle.y - bird.y| <= 6` (a car on a bridge deck does not flush the ducks under it) |

So a boat at 17 m/s straight at a bird scares it from ~55-60 m, a boat passing 30 m abeam does not, a boat drifting at 3 m/s scares from ~20 m ahead only, a boat running away scares nothing beyond the near ring.
A **car is the same code** (kind `car`, shorter look-ahead and narrower cone), so a car driven at the ducks flushes them; it falls out of the generalisation and is covered by the same test
(a faked `ctx.drive` of the car shape). The walker is not part of it: ducks never feared the walker (also not when he wades) and still do not; the pigeon / sparrow / crow code is untouched
(its numbers are the old ones: `tools/wildlife-test.mjs` output is the same).
Tourist boats are **not** scarers (optional in the brief; they sail through the duck lanes on purpose: lanes are validated 3.6 m clear of every hull of every lap, and a duck that flew up at each
passing tourist boat would be in the air most of the time).

### Gulls (`birds.js`)
`vScare(b)` = a gull (post, lion, boat roof, ground) that `threat.scares(..., near 4)`. It is OR-ed into the three existing scare tests (`updGround`, `updPerch`, `updBoat`), so the gull goes through the
existing `flee()` (a post / roof 14-70 m away from the vehicle, reachable without crossing a building) and returns through the existing `boatReturn` / perch logic. Birds on moored boats' roofs
therefore take off when a boat comes at the moorage.

### Ducks (`ducks.js`): the flush state machine
Per group `g.st`: `swim` (the old pure function of `t` on the lane, bit-for-bit) -> `fly` -> `away` -> `fly` (home) -> `swim`.

1. **Take-off.** Every frame, while a vehicle is driven, the group centre is asked `threat.scares(x, z, water level, 7)`. If true, `refuge()` scores the lane points (every 3rd sample of every lane that is
   free) 14-130 m from the group: `|d - 48| * 0.5`, minus 30 for being away from the vehicle, +70 when the vehicle (at its present velocity) will be within 24 m of the point when the group lands, +90
   when the point is in the vehicle's present cone. The best of the first 24 whose straight flight crosses no building footprint (`W.flightClear`), no bridge deck, pier or stair (the lane obstacle hash
   `blocked`) is taken. `g.home = { lane, u }` remembers the place left.
2. **Flight.** `takeOff()` stores, for every member, its swim pose now and its swim pose on the destination lane frame at the landing time (`frameAt()` re-phases the lane's cosine so that the swim at the
   landing time is at the chosen `u`): the flight is an ease between the two (speed 10 m/s, `max(2.2, d / 10 + 1.4)` s, a `0.09 d + 1.2` m arc (2-4.5 m), nose up on climb and flare, wings open and flapping at
   7.5 Hz, the wake decal hidden), so nothing teleports and the landing is continuous with the swim. Ducklings skitter over the surface instead (0.06 m arc, 14 Hz beats). `wings` and `duck` sounds when
   the group is within 90 m. Members start 0-0.35 s apart.
3. **Away.** The group lands (`land()`), swims the destination lane and stays `away` for 14-26 s (`g.tBack`). Another threat in that time flushes it again (the home place is kept).
4. **Home.** At `tBack`, if no vehicle is driven or `threat.scares(home point, 18)` is false, `goHome()` flies it back to `g.home` (the same lane, the same `u`); if the way home is blocked it settles
   where it is (`home = null`, the director may move it later). The lane it left stays reserved to the group meanwhile.
5. The density director (`direct()`) skips groups that are not `swim`. No rng is drawn unless a flush happens, so the no-vehicle behaviour and its determinism are the old ones.

`laneAt()` now writes into a shared scratch instead of returning a new object per member and frame (the per-frame allocation of the old code goes away); the per-frame cost of the new logic is one
`groupPose` per group while a vehicle is driven. `?wl=nofear` disables the flush too.

## Test

`tools/wildlife-boat-test.mjs` (`npm run wildlifeboat`, `node tools/area.mjs palace tools/wildlife-boat-test.mjs`, ~35 s): the real palace modules + wildlife + the real drive module and boat; the page's
updates stepped at 30 fps with the boat driven by a pilot at the group.
It proves (15 checks): the threat geometry (above); the walker 2 m from the ducks and a boat drifting at 3 m/s from 36 m do not flush them; a boat at 12-14 m/s straight at a family and a pair takes them
off with the hull 46-47 m away, every adult is drawn in the air before the hull is 12 m off (it was 42-43 m), nobody swims under the hull, no flight crosses a building, the flight is under 6 m,
ducklings stay under 0.4 m, nothing hangs in the air, the group lands on water and stays `away` while the boat lies 4 m from its old place, and flies home to the same lane once the boat is
gone (5-8 s after tBack); a gull on a moored boat's roof and a gull on a quay post leave with the hull 42 m away (was 9-10 m); a car (faked `ctx.drive`) flushes the group the same way; the pigeon flock
keeps its radius (4.5 m) and lifts for a walker 3 m away. Before the change 11 of 13 checks failed (the boat drove through the ducks: a duck 2.7 m inside the hull; the gulls left at 9-10 m);
`tools/wildlife-test.mjs` (palace and the other areas) is unchanged.

## Not done / open

- Walkers (also wading ones) still do not scare ducks. Easy to add: make the walker a `threat` too (`near` ring only); the brief asked for water transport only.
- Tourist boats and the escort gulls are not scarers (see above).
- A group whose lane has no flight-clear destination (all candidates cross a building or a bridge) stays and is overrun as before; the palace Fontanka / Moika lanes always found one in the test.
- Changelog line: "Water birds fly away from a driven boat or car that heads for them: duck groups take off, land 14-130 m away and come home, gulls on posts and boat roofs go from much further."
