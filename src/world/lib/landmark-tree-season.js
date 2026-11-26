// Keep the local species' proportions and summer artwork in authored gardens.
// A winter broadleaf crown includes its trunk; the spruce keeps its needle tiers.
import { winterTreeGeometry } from '../environment/treegeo.js';

export function landmarkTreeSeason(ctx, fam, species, summerPalette, summerMaterial, canopyGeometry) {
  const winter = ctx.season === 'winter';
  const bare = winter && species.sp !== 'spruce';
  return {
    bare,
    palette: winter ? [bare ? '#74665c' : '#86a59e'] : summerPalette,
    material: bare ? ctx.mat.toon('#ffffff', { name: 'dormant-branches' }) : summerMaterial,
    geometry: lod => bare ? winterTreeGeometry(fam, lod, species) : canopyGeometry(fam, lod),
  };
}
