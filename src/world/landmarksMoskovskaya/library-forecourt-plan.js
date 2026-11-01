// Pure surveyed/current forecourt masks. No renderer/layout/area imports.
export const FORECOURT_PAVED_RING=[-1813,7403,-1745,7399,-1736,7409,-1734,7492,-1742,7508,-1812,7500,-1797.8,7473.5,-1797.8,7439];
export const FORECOURT_POOL=[-1778.8,7450.1,-1778.7,7440.5,-1777.9,7438.9,-1776,7437.5,-1774.9,7437.3,-1773.6,7437.3,-1771.5,7438.5,-1770.3,7440.3,-1769.2,7440.1,-1769.2,7435.7,-1768.2,7434,-1767.5,7433.3,-1766,7432.5,-1765.1,7432.4,-1763.7,7432.5,-1762.4,7433,-1761.6,7433.8,-1760.6,7435.2,-1759.6,7435.1,-1759.6,7431.4,-1759.2,7430.2,-1758,7428.6,-1756.9,7427.9,-1755.5,7427.5,-1753.9,7427.7,-1752.5,7428.4,-1751.6,7429.3,-1750.9,7430.6,-1750.5,7432,-1750,7449.5,-1749.9,7457.3,-1749.3,7475.4,-1750,7477.4,-1750.9,7478.4,-1752.4,7479.2,-1754.1,7479.4,-1755.6,7479.1,-1756.6,7478.4,-1757.8,7476.8,-1758.4,7474.4,-1758.5,7471.9,-1759.6,7472,-1760.1,7473.1,-1761,7474.1,-1762.3,7474.8,-1764.8,7475,-1766.4,7474.4,-1767.4,7473.6,-1768.6,7471.3,-1768.4,7467.5,-1769.6,7467.6,-1770,7468.6,-1770.9,7469.8,-1772.3,7470.6,-1773.8,7470.7,-1775.5,7470.5,-1776.6,7469.8,-1777.4,7468.9,-1778.1,7467.7,-1778.4,7466.7,-1778.4,7458.4];
export const FORECOURT_WATER_BODIES=[{id:'rnb-chasha-znaniy',o:FORECOURT_POOL,h:[]}];
export const FORECOURT_SOURCE_FOUNTAINS=['w31523998','w134429977'];
export const FORECOURT_MONUMENT_IDS=['n14090538301','n14090538201','n12014514686'];
// Local pure containment avoids an area-tables -> landmark -> waterways cycle
// when the area imports the water/paving masks before scene construction.
export const forecourtPointInRing=(x,z,o)=>{let yes=false;for(let i=0,j=o.length-2;i<o.length;j=i,i+=2)if((o[i+1]>z)!==(o[j+1]>z)&&x<(o[j]-o[i])*(z-o[i+1])/(o[j+1]-o[i+1])+o[i])yes=!yes;return yes;};
export const forecourtContains=(x,z)=>forecourtPointInRing(x,z,FORECOURT_PAVED_RING);
