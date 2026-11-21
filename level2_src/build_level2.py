import re, os
D=os.path.dirname(os.path.abspath(__file__))+'/'
r=lambda f: open(D+f).read()
def strip_loop(src):
    i=src.index('let last = performance.now();')
    tail=src[i:]
    m=re.search(r"window\.__test = (\{.*\});", tail)
    keep=''
    # keep statements between loop and requestAnimationFrame that are not loop related (sky checkpoint line)
    for line in tail.splitlines():
        if line.startswith('if (QUERY.get('): keep+=line+'\n'
    return src[:i]+keep, m.group(1)
def listenify(src):
    src=src.replace('canvas.addEventListener(','listen(canvas, ').replace('window.addEventListener(','listen(window, ')
    return src
WORLDS=[
 ('makeCity', ['city.js','pinata.js','city_draw.js'], "beginWorld();", "if (S.mode === 'main') useCheckpoint('city'); else setCheckpoint('city2'); S.phase = 'play'; S.kai.y = FLOOR; S.kai.vy = 0; S.kai.ground = true; if (allBossesDone()) goToWorld('tiefsee.html', 'final=1');"),
 ('makeSky',  ['himmel.js','himmel_draw.js'], "S.phase = 'play'; SAVE.started = true; writeSave();", "S.phase = 'play'; S.kai.x = 250; S.kai.y = 200; S.kai.vy = -3; S.lowWarned = false;"),
 ('makeSea',  ['core.js','draw_part.js','extra.js','extra2.js'], "beginWorld();", "beginWorld(); S.kai.x = 250; S.kai.y = 210; S.kai.vy = 0;"),
]
head=r('head_city.html').replace('INVERT – Level 2 · Die Stadt','INVERT – Level 2')
out=[head, r('shared.js'), r('dale_mp3.js'), r('audio.js'), r('kai.js')]
for name, files, fromMenu, enter in WORLDS:
    src=''.join(r(f) for f in files)
    if files[-1] in ('city_draw.js','himmel_draw.js','extra2.js'):
        pass
    src, test = strip_loop(src)
    src=listenify(src)
    out.append(f"""
// ==================== WORLD: {name} ====================
function {name}(QUERY) {{
const ME = {{}};
const listen = (t, ev, fn, opt) => t.addEventListener(ev, e => {{ if (CUR === ME && !TRANS && ((!INV.open && !PAUSE.on && !MENU.open && !CONFIRM.open) || ev === 'pointerdown')) fn(e); }}, opt);
{src}
Object.assign(ME, {{ S, update, draw, canBack: () => typeof worldCanBack === 'function' && worldCanBack(), back: () => worldBack(), events: typeof EVENTS !== 'undefined' ? EVENTS : null, ctl: typeof CTL !== 'undefined' ? CTL : null, test: {test}, enter() {{ {enter} }}, enterFromMenu() {{ if (S.phase === 'start') {{ {fromMenu} }} }} }});
return ME;
}}
""")
out.append(r('controller.js'))
html=''.join(out)
assert html.count('</script>')==1, html.count('</script>')
html+='\n</body>\n</html>\n'
open(D+'level2.html','w').write(html)
print(len(html))
