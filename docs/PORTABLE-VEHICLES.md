# Vehicles and area transitions

Vehicle definitions and local parking are separate responsibilities. A page
must be able to recreate an incoming vehicle even if its local garage does
not normally contain that vehicle. Existing garage cars, boats and taken
traffic vehicles keep their respective creation paths.

For karts, `world/karting/karts.js` provides `createKart(ctx, id, parked,
course)`. The stable vehicle ID selects the rental/club livery, fleet number
and individual handling values. Geometry is created lazily and shared within
one world context. The factory does not import the venue, its course or its
parking coordinates. Without a venue surface service it samples the current
area's surface for roughness. `karting/surfaces.js` gives road ribbons and
rendered asphalt junction fillets priority over the environment ground paint.
Pedestrian-only ways, tram reservations and actual verges retain their ground
roughness. Local course asphalt/lawn rules still take precedence. The same
tyre model runs in every area.

`world/karting/fleet.js` alone owns the twenty Narvskaya parking positions.
The venue registers that fleet and its authored asphalt/kerb services.
On arrival, `drive.js` creates the incoming kart at the arrival pose. If the
venue already has that ID, the incoming vehicle replaces its parked definition;
otherwise only that one kart is added. Other areas do not gain twenty parked
karts or a copy of the course. Exiting parks the carried kart with its normal
collider and boarding prompt.

The additive handoff field `car.kind: "kart"` is preserved by the existing
v1 codec. Its ID is restricted to `narvskaya-(rental|club)-(1..10)`. Existing
car, traffic and boat payloads remain valid. Old kart URLs without `kind`
are also restored from their recognised ID. Unsupported kart identities are
rejected rather than silently replaced with a city car. Camera mode is restored;
velocity follows the existing car transition behaviour and starts at rest.

Validation: `node tools/each-live-area.mjs tools/handoff-kart-test.mjs`
exercises the real destination drive module on every live page, including
both fleets, legacy URLs, departure, reboarding, local fleet deduplication
and preservation of handling parameters. The existing Narvsky/Kolomna
regressions verify the circuit, twenty individual karts and speed targets.
`node tools/handoff-kart-browser-test.mjs` checks a full-page journey from
Narvsky through Admiralty and Palace and back, including the selected player
character and E-key exit/reboarding. It uses normal loading and current bakes.
Each destination uses a fresh browser process with the same persistent profile;
the outgoing vehicle payload is taken from the preceding live page.

This separation does not change bake invalidation: vehicle source is still
part of the scene dependency closure. Shared transport changes require fresh
area bakes under the current project contract.
