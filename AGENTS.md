# Project guidance

This project is a walkable 3D scene of Saint Petersburg. Read [CLAUDE.md](CLAUDE.md)
for the owner's current rules and [docs/AGENT-BRIEF.md](docs/AGENT-BRIEF.md),
[docs/AREA-DEVELOPMENT.md](docs/AREA-DEVELOPMENT.md), and
[docs/PERFORMANCE-CONTRACT.md](docs/PERFORMANCE-CONTRACT.md) for the relevant
implementation and verification guidance. The agent brief contains historical
context and specialist assignments; check its introductory note and current code
before assuming its old project paths or ownership assignments still apply.

## Planning and porting areas

- [maps/intro-draft.html](maps/intro-draft.html) is the evolving planning map.
  Form and update areas there during planning, then add the planned territories to
  the scene. Consult [docs/AREAS.md](docs/AREAS.md) and the area registry for the
  current implementation, boundaries, overlaps, and transitions; the draft map
  and implemented territories can differ as planning evolves.
- The whole-city Saint Petersburg source used by the existing area tools is
  `D:\git2\agi-fun-tests\102_3d_piter`. The previously supplied
  `104_picnic_3d` path is a different Roadside Picnic scene. Inspect source
  coverage and relevant modules before each port; the full-city data has edges.
- The whole source scene is too large to be usable at the desired performance.
  Port as much relevant territory and detail as practical into the planned,
  separately managed areas, while keeping integrated loading, rendering, and
  simulation performance within the current project's contracts.
- The current project has evolved beyond the source. Adapt imported content to
  current behaviour and rules: preserve water transport, water reachable on foot
  and by car, movable and breakable objects, area transitions, and other existing
  improvements. Do not restore older source restrictions or overwrite newer
  behaviour when copying content. Check integration and the relevant tests and
  performance in both existing and new areas.
