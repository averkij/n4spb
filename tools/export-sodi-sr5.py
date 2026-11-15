"""Re-export the editable SR5 body for the game.

blender --background assets/models/sodi-sr5.blend --python tools/export-sodi-sr5.py
"""
from pathlib import Path
import sys

import bpy

root = Path(__file__).resolve().parents[1]
destination = Path(sys.argv[sys.argv.index('--') + 1]) if '--' in sys.argv else root / 'src/world/karting/sr5-body.js'
roles = ('bumper', 'chassis', 'painted', 'trim', 'metal')

with destination.open('w') as output:
    output.write('// Meshes exported from assets/models/sodi-sr5.blend in game coordinates.\n')
    output.write('export const sr5Body = {\n')
    for role in roles:
        vertices, triangles = [], []
        for obj in bpy.data.collections[role].objects:
            if obj.type != 'MESH':
                continue
            offset = len(vertices) // 3
            obj.data.calc_loop_triangles()
            for vertex in obj.data.vertices:
                x, y, z = obj.matrix_world @ vertex.co
                vertices.extend(round(value, 4) for value in (x, z, -y))
            for face in obj.data.loop_triangles:
                triangles.extend(offset + index for index in face.vertices)
        output.write(f'  {role}: {{\n')
        for field, values in [('vertices', vertices), ('triangles', triangles)]:
            output.write(f'    {field}: [\n')
            for start in range(0, len(values), 18):
                output.write('      ' + ', '.join(map(str, values[start:start + 18])) + ',\n')
            output.write('    ],\n')
        output.write('  },\n')
    output.write('};\n')
