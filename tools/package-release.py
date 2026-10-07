"""Create reproducible deployment and source archives, excluding machine-local files."""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess
import zipfile

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--output-dir', type=Path, default=root / 'dist')
args = parser.parse_args()
output = args.output_dir.resolve()
output.mkdir(parents=True, exist_ok=True)
names = subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], cwd=root).decode('utf-8').split('\0')
names = sorted(set(name for name in names if name and (root / name).is_file() and not any(part in {'.git', 'node_modules', '__pycache__', 'dist'} for part in Path(name).parts)))
for name in names:
    if Path(name).name.startswith('.env') or Path(name).suffix in {'.pem', '.key'}:
        raise ValueError('Unexpected private/generated file: ' + name)

runtime_roots = {'data', 'vendor', 'icons', 'api'}
runtime_files = {'index.html', 'sw.js', 'manifest.webmanifest', 'vercel.json', 'privacy.html', 'VERSION', 'README.md', 'DEPLOY.md'}
deployment = {name: (root / name).read_bytes() for name in names if Path(name).parts[0] in runtime_roots or name in runtime_files}
deployment['serve.cjs'] = (root / 'tools/serve.cjs').read_bytes()
source = {name: (root / name).read_bytes() for name in names}
report = {'version': 'v21-release', 'archives': []}
for label, files in [('web-release', deployment), ('source', source)]:
    archive = output / ('CodeRun-' + label + '-v21.zip')
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
        for name, content in sorted(files.items()):
            entry = zipfile.ZipInfo('CodeRun/' + name, date_time=(2026, 10, 8, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = 0o644 << 16
            bundle.writestr(entry, content, compresslevel=9)
    with zipfile.ZipFile(archive) as bundle:
        assert bundle.testzip() is None
        assert {name.removeprefix('CodeRun/'): hashlib.sha256(bundle.read(name)).hexdigest() for name in bundle.namelist()} == {name: hashlib.sha256(content).hexdigest() for name, content in files.items()}
    report['archives'].append({'file': archive.name, 'files': len(files), 'bytes': archive.stat().st_size, 'sha256': hashlib.sha256(archive.read_bytes()).hexdigest()})
(output / 'CodeRun-release-manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(report, ensure_ascii=False, indent=2))
