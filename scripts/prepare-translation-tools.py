"""Download isolated authoring tools; none of these are runtime app dependencies."""
import concurrent.futures
import pathlib
import urllib.request
import zipfile

root = pathlib.Path('.tmp/translation-tools')
root.mkdir(parents=True, exist_ok=True)
jobs = {
    'python.zip': 'https://www.python.org/ftp/python/3.12.10/python-3.12.10-embed-amd64.zip',
    'en-et.argosmodel': 'https://data.argosopentech.com/argospm/v1/translate-en_et-1_9.argosmodel',
    'en-ru.argosmodel': 'https://data.argosopentech.com/argospm/v1/translate-en_ru-1_9.argosmodel',
}

def download(item):
    name, url = item
    target = root / name
    if not target.exists():
        urllib.request.urlretrieve(url, target)
    folder = root / ('python' if name == 'python.zip' else name.split('.')[0])
    if not folder.exists():
        with zipfile.ZipFile(target) as archive:
            archive.extractall(folder)
    print(name, target.stat().st_size, flush=True)

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
    list(executor.map(download, jobs.items()))
pth = root / 'python/python312._pth'
pth.write_text('python312.zip\n.\n../packages\nimport site\n')
