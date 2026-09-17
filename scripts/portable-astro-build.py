"""Run after an upstream Astro build: python3 portable-astro-build.py [dist].
Make existing root-relative assets/pages portable without rewriting JS regexes.
"""
import pathlib, re, os, sys
root=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'dist').resolve()
for p in root.rglob('*'):
    if p.suffix not in ['.html','.css','.js']: continue
    content=p.read_text()
    def relative(target):
        if not target.startswith('/') or target.startswith('//'): return target
        raw=target.split('#')[0].split('?')[0]
        candidate=root/raw.lstrip('/')
        if candidate.is_dir(): candidate=candidate/'index.html'
        if not candidate.exists(): return target
        return os.path.relpath(candidate,p.parent)+target[len(raw):]
    if p.suffix=='.html':
        content=re.sub(r'(\b(?:src|href|poster)=["\'])(/[^"\']*)(["\'])',lambda m:m[1]+relative(m[2])+m[3],content)
        content=re.sub(r'(\bsrcset=["\'])([^"\']*)(["\'])',lambda m:m[1]+', '.join(' '.join([relative(part.strip().split()[0]),*part.strip().split()[1:]]) for part in m[2].split(',') if part.strip())+m[3],content)
    if p.suffix=='.css':
        content=re.sub(r'(url\(["\']?)(/[^\s\)"\']+)',lambda m:m[1]+relative(m[2]),content)
    p.write_text(content)
