# Faster area development

Use the smallest scene that answers the current authoring question, then validate
the integrated city at a checkpoint. The full scene is expensive to construct;
rebuilding it after every cornice, statue or texture edit wastes the edit loop.

## The edit loop

1. Run `node tools/check.mjs <module>` for geometry/API errors without a GPU.
2. Keep one authoring server running:

   ```powershell
   npm run dev:area -- landmarksH
   ```

   Open the printed localhost URL. It uses the production renderer, materials,
   batching, LOD and camera controls, with just the selected module on a reference
   grid. It frames the area automatically and starts in flight mode. Saving a
   JavaScript file reloads the selected builders and restores the camera. **Reload**
   does the same manually; **Frame area** returns to the initial overview.
   A reload creates a fresh scene, so colliders, callbacks and GPU resources do
   not accumulate across edits. The server is local only; Ctrl+C stops it.
3. Pass neighbouring builders explicitly when needed:

   ```powershell
   npm run dev:area -- landmarksH --with landmarksG --port 5178
   npm run dev:area -- landmarksH --cam "-2728,8.5,-458,130,-4"
   ```

   `--q high` selects the normal high tier. `--cam` accepts the engine's camera
   forms; coordinates above are syntax examples, not approved review positions.
   Shared helpers are re-imported on each reload. The original module build order
   and claims contract still apply. A missing service must use its documented
   fallback; add its owner with `--with` if the current change depends on it.
4. Capture several useful views in one browser load with `tools/shot.mjs --only
   <module> --cams "...;...;..."`. Inspect the images. Do not launch a new browser
   for each angle. Run GPU work serially, including across concurrent tasks.

The grid is **not city ground**. This mode omits normal population, navigation,
roof capture and neighbouring builders unless selected. It cannot prove road
clearance, claims, ground seams, skyline integration, walking safety or city FPS.
Adding `environment,streets,city` recreates expensive global generators; reserve
that for context reviews, not every small visual edit.

## Integration checkpoints

Use **Open integrated city** at the current camera for a context review. This is
the ordinary app with no `only` filter. Check ownership, adjacent architecture,
roads, signs, banks, shadows and near/distant camera turns. Validate walking and
the red car, destination preloading and region boundaries in both the old centre
and the changed district (the strip: Vosstaniya Square at one end, the Admiralty at the other). Use `drive-bench.mjs` for FPS; preview FPS is irrelevant.

Every edit of a file in the dependency closure of an area invalidates that area's shipping bake (revisions are per area, docs/BAKE-REVISIONS.md). A full development reload then
falls back to procedural construction. Do not mistake that fallback time for
deployed loading performance, and do not force an old bake after changing world
geometry, claims, field data, navigation or materials. `baked=force` is only a
labelled diagnostic for known-compatible runtime changes.

Batch related source edits into a reviewed checkpoint. Run focused regressions,
the road/marking audits, then `npm run bake` once after the last source edit.
Run `node tools/bake-manifest-check.mjs`, normal-loading integrated benchmarks
and screenshot review against that bake, record results in `PERFORMANCE.md`, and
commit explicit source/docs/tools/generated paths. Any subsequent source fix
requires another bake. Keep a frozen source+bake baseline for performance work;
never compare different quality settings or a tiny preview with the integrated strip.

`node tools/area-dev-test.mjs` exercises isolated boot, manual/save reload,
camera preservation and the integrated-city link with the real renderer.
