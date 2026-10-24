"""Download isolated authoring tools; none of these are runtime app dependencies."""
import concurrent.futures
import pathlib
import json
import sys
import urllib.request
import zipfile

root = pathlib.Path('.tmp/translation-tools')
root.mkdir(parents=True, exist_ok=True)
languages = sys.argv[1:] or ['et', 'ru']
index = json.load(urllib.request.urlopen('https://raw.githubusercontent.com/argosopentech/argospm-index/main/index.json', timeout=30))
jobs = {'python.zip': 'https://www.python.org/ftp/python/3.12.10/python-3.12.10-embed-amd64.zip'}
for language in languages:
    code = 'pt' if language == 'pt-BR' else language
    package = next(p for p in reversed(index) if p['from_code'] == 'en' and p['to_code'] == code)
    jobs[f'en-{language}.argosmodel'] = package['links'][0].replace('https://argos-net.com/v1/', 'https://data.argosopentech.com/argospm/v1/')

def download(item):
    name, url = item
    target = root / name
    if not target.exists():
        temporary = target.with_suffix('.download')
        urllib.request.urlretrieve(url, temporary)
        temporary.replace(target)
    folder = root / ('python' if name == 'python.zip' else name.split('.')[0])
    if not folder.exists():
        with zipfile.ZipFile(target) as archive:
            archive.extractall(folder)
    print(name, target.stat().st_size, flush=True)

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
    list(executor.map(download, jobs.items()))
pth = root / 'python/python312._pth'
pth.write_text('python312.zip\n.\n../packages\nimport site\n')
