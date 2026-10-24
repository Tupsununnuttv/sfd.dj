"""Clean model token markers, preserve SVG data, and apply Brazilian terminology."""
import json
import pathlib
import re
import sys

languages = sys.argv[1:] or ['pt-BR', 'es', 'de', 'fr', 'fi', 'uk', 'lv', 'lt', 'pl']
brazilian = {
    'utilizadores': 'usuários', 'utilizador': 'usuário',
    'ficheiros': 'arquivos', 'ficheiro': 'arquivo',
    'palavras-passe': 'senhas', 'palavra-passe': 'senha',
    'subscrições': 'assinaturas', 'subscrição': 'assinatura',
    'equipas': 'equipes', 'equipa': 'equipe',
    'partilhar': 'compartilhar', 'partilhado': 'compartilhado', 'partilhada': 'compartilhada',
}
def replace_term(match):
    word = match.group()
    target = brazilian[word.lower()]
    return target.upper() if word.isupper() else target[0].upper() + target[1:] if word[0].isupper() else target

for code in languages:
    path = pathlib.Path(f'resources/js/lib/locales/{code}.json')
    catalog = json.loads(path.read_text(encoding='utf-8'))
    changed = 0
    invalid = []
    for source, value in list(catalog.items()):
        value = value.replace('\u2581', ' ').strip()
        # These entries are diagram path data, not human interface messages.
        if re.match(r'^[Mm](?:\d|\{0\})', source): value = source
        if code == 'pt-BR': value = re.sub(r'\b(?:' + '|'.join(map(re.escape, brazilian)) + r')\b', replace_term, value, flags=re.I)
        if sorted(re.findall(r'\{\d+\}', source)) != sorted(re.findall(r'\{\d+\}', value)): invalid.append(source)
        if value != catalog[source]: changed += 1
        catalog[source] = value
    if invalid: raise ValueError(f'{code}: damaged placeholders: {invalid}')
    path.write_text(json.dumps(dict(sorted(catalog.items())), ensure_ascii=False, indent=2), encoding='utf-8')
    print(code, len(catalog), 'messages;', changed, 'normalized')
