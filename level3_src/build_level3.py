import os
# Builds level3.html from the sources in this folder.
# Every world is wrapped as a factory (makeTal, later makeHoehe / makeLava); controller3.js switches between them.
D = os.path.dirname(os.path.abspath(__file__)) + '/'
r = lambda f: open(D + f, encoding='utf-8').read()
WORLDS = [
    ('makeTal', ['tal.js', 'tal_boss.js', 'tal_games.js', 'tal_draw.js']),
    ('makeHoehe', ['hoehe.js', 'hoehe_boss.js', 'hoehe_games.js', 'hoehe_draw.js']),
]
out = [r('head3.html'), r('shared3.js'), r('audio.js'), r('kai.js')]
for name, files in WORLDS:
    src = ''.join(r(f) for f in files)
    out.append(f"""
// ==================== WORLD: {name} ====================
function {name}(QUERY) {{
const ME = {{}};
{src}
Object.assign(ME, {{ S, update, draw, canBack: () => false, back: () => {{}}, events: null, ctl: CTL, test: TEST, enter, enterFromMenu }});
return ME;
}}
""")
out.append(r('controller3.js'))
html = ''.join(out)
assert html.count('</script>') == 1, html.count('</script>')
html += '\n</body>\n</html>\n'
open(D + 'level3.html', 'w', encoding='utf-8').write(html)
print(len(html.encode('utf-8')))
