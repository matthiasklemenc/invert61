import os
# Builds level4.html from the sources in this folder.
# Every world is wrapped as a factory (makeMond, makeAurora, makeUnter); controller4.js switches between them.
# common4.js (the platformer engine) and common4_draw.js (HUD, panels, Kai) are built into every world.
D = os.path.dirname(os.path.abspath(__file__)) + '/'
r = lambda f: open(D + f, encoding='utf-8').read()
WORLDS = [
    ('makeMond', ['mond.js', 'common4.js', 'mond_logic.js', 'mond_games.js', 'mond_boss.js', 'mond_draw.js', 'common4_draw.js']),
    ('makeAurora', ['aurora.js', 'common4.js', 'aurora_logic.js', 'aurora_games.js', 'aurora_boss.js', 'aurora_draw.js', 'common4_draw.js']),
    ('makeUnter', ['unter.js', 'common4.js', 'unter_logic.js', 'unter_boss.js', 'unter_draw.js', 'common4_draw.js']),
]
out = [r('head4.html'), r('shared4.js'), r('tr4.js'), r('audio.js'), r('kai.js')]
for name, files in WORLDS:
    if not all(os.path.exists(D + f) for f in files):
        out.append(f"\nfunction {name}(QUERY) {{ return makeMond(QUERY); }}\n")   # not written yet
        continue
    src = ''.join(r(f) for f in files)
    out.append(f"""
// ==================== WORLD: {name} ====================
function {name}(QUERY) {{
const ME = {{}};
{src}
Object.assign(ME, {{ S, update, draw, canBack: () => false, back: () => {{}}, events: null, ctl: CTL, test: TEST, enter, enterFromMenu, sayClick }});
return ME;
}}
""")
out.append(r('controller4.js'))
html = ''.join(out)
assert html.count('</script>') == 1, html.count('</script>')
html += '\n</body>\n</html>\n'
open(D + 'level4.html', 'w', encoding='utf-8').write(html)
print(len(html.encode('utf-8')))
