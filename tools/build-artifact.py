"""Membuat versi pratinjau untuk Claude Artifact dari index.html.
Artifact membungkus halaman dengan kerangka HTML-nya sendiri dan memakai CSP-nya
sendiri, jadi tag <html>/<head>/<body> dan meta CSP dibuang. Berkas lain dipakai apa adanya.
Pemakaian: python3 tools/build-artifact.py <folder-keluaran>"""
import re, sys, shutil, pathlib
src = pathlib.Path(__file__).resolve().parent.parent
out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
html = (src / 'index.html').read_text(encoding='utf-8')
html = re.sub(r'<!doctype html>\s*', '', html, flags=re.I)
html = re.sub(r'</?html[^>]*>\s*|</?head>\s*|</?body>\s*', '', html)
html = re.sub(r'<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*|<meta http-equiv="Content-Security-Policy"[^>]*>\s*', '', html)
(out / 'index.html').write_text(html, encoding='utf-8')
for d in ('css', 'js'):
    shutil.copytree(src / d, out / d, dirs_exist_ok=True)
print('ok', out)
