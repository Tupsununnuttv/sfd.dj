"""Author static ET/RU catalogs with local Argos/CTranslate2 models; no runtime service."""
import json
import pathlib
import re
import sys
import ctranslate2
import sentencepiece

language = sys.argv[1]
root = pathlib.Path('.tmp/translation-tools')
package = next((root / ('en-' + language)).glob('*'))
sp = sentencepiece.SentencePieceProcessor(model_file=str(package / 'sentencepiece.model'))
model = ctranslate2.Translator(str(package / 'model'), device='cpu', compute_type='int8', inter_threads=2, intra_threads=4)
messages = json.loads(pathlib.Path('tmp/ui-messages.json').read_text(encoding='utf-8'))
extra = pathlib.Path('tmp/server-messages.json')
if extra.exists(): messages.update({value: [] for value in json.loads(extra.read_text(encoding='utf-8-sig'))})
skip = re.compile(r'[<>\\]|(?:^| )(?:bg|text|border|px|py|mt|mb|gap|rounded|flex|grid|min|max|z|shadow|hover|focus|disabled|opacity|items|justify|space|lg|md|sm|xl|w|h)-|^(?:M |m |rgba|var\(|linear-gradient|translate|data-|\./|\.\./|@/)|\b(?:const |function |return |import |export )')
keys = [key for key in messages if not skip.search(key) and len(key) < 1200 and re.search(r'[a-zA-Z]{2}', key)]
output = pathlib.Path(f'resources/js/lib/locales/{language}.json')
output.parent.mkdir(parents=True, exist_ok=True)
catalog = json.loads(output.read_text(encoding='utf-8')) if output.exists() else {}
keys = sorted(set(keys) - set(catalog), key=lambda key: (len(key.split()), key))
brands = re.compile(r'\{\d+\}|https?://\S+|\b(?:SFD-DJ\.EU|SFD Coins|YouTube|SoundCloud|Spotify|Discord|TikTok|Twitch|Stripe|Woot|Grab|Meh|API|XP)\b')

def protect(text):
    originals = []
    def sub(match):
        originals.append(match.group())
        return str(9876500 + len(originals) - 1)
    return brands.sub(sub, text), originals

def restore(text, originals, source):
    for index, original in enumerate(originals):
        number = str(9876500 + index)
        pattern = r'[\s,.]*'.join(number)
        text, count = re.subn(pattern, lambda _: original, text)
        if not count:
            # Keep dynamic values intact even if the MT model drops a token.
            return None
    return text

failed = []
for offset in range(0, len(keys), 24):
    batch = keys[offset:offset + 24]
    protected = [protect(text) for text in batch]
    results = model.translate_batch([sp.encode(text, out_type=str) for text, _ in protected], beam_size=2, max_decoding_length=512, max_input_length=512)
    for source, (_, originals), result in zip(batch, protected, results):
        translated = restore(sp.decode(result.hypotheses[0]), originals, source)
        if translated is None:
            chunks = re.split(r'(\{\d+\})', source)
            literals = [chunk for chunk in chunks if chunk and not re.fullmatch(r'\{\d+\}', chunk)]
            decoded = model.translate_batch([sp.encode(chunk, out_type=str) for chunk in literals], beam_size=2)
            lookup = iter([sp.decode(item.hypotheses[0]) for item in decoded])
            translated = ''.join(chunk if re.fullmatch(r'\{\d+\}', chunk or '') else next(lookup) if chunk else '' for chunk in chunks)
            failed.append(source)
        catalog[source] = translated
    if offset % 120 == 0:
        output.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding='utf-8')
        print(language, offset + len(batch), '/', len(keys), flush=True)
output.write_text(json.dumps(dict(sorted(catalog.items())), ensure_ascii=False, indent=2), encoding='utf-8')
(root / (language + '-review.json')).write_text(json.dumps(failed, ensure_ascii=False, indent=2), encoding='utf-8')
print(language, 'complete', len(catalog), 'messages;', len(failed), 'placeholder fallbacks', flush=True)
