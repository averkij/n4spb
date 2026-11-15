# Character integration: road audit baseline (2026-11-15)

The character/vehicle integration was checked against commit `a725e062` in
`D:/git2/n4spb-characters-baseline`. Both trees ran the same commands for Palace
and Admiralty, with unchanged audit thresholds and allowances:

```powershell
node tools/area.mjs palace tools/roads.mjs
node tools/area.mjs palace tools/streets-markings-audit.mjs --geom --strict
node tools/area.mjs admiralty tools/roads.mjs
node tools/area.mjs admiralty tools/streets-markings-audit.mjs --geom --strict
```

Every metric below matched the baseline exactly. These results establish no
new road-audit regression; they do **not** mean the existing street geometry
passes every strict audit.

| Check | Palace, baseline and integration | Admiralty, baseline and integration |
| --- | --- | --- |
| Furniture audit | **Fail:** 13 disallowed on-road rows | **Fail:** 2 disallowed on-road rows |
| Surface audit | Pass: 80 residual samples / 120 allowed; 256,600 audited | Pass: 70 residual samples / 120 allowed; 298,765 audited |
| Ribbon audit | Pass; identical category counts | Pass; identical category counts |
| Strict markings | **Fail:** 1 missing signalised stop bar | Pass: no missing stop bars |
| Signalised approaches | 214 | 237 |
| Centre/lane/pocket points inside junction boxes | 6 | 0 |
| Solid plan points covered by geometry | 22,517 / 22,518 | 23,208 / 23,209 |
| Paint triangles | 51,874 | 54,572 |

Palace's furniture failures are the existing NorthFull fence/cannon-pier objects
and fence-bay objects. Its missing bar is signal `n1562060894`, approach 2,
lane `Lw142734279:0:f1` at Kuznechny Lane. Admiralty's two furniture failures
are existing fence-bay objects. Neither the integration nor this verification
changes those geometry generators, thresholds, or exemptions.

The integration logs are `shots/integration-palace-roads.log`,
`shots/integration-palace-markings.log`, `shots/integration-admiralty-roads.log`,
and `shots/integration-admiralty-markings.log`. Baseline logs use the same
relative names under `D:/git2/n4spb-characters-baseline`. Logs are local audit
artifacts, outside the committed source closure.
