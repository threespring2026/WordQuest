#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 IELTS Word List.txt 解析并生成 dictionary.js"""
import re
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SCRIPT_DIR)
INPUT = os.path.join(ROOT, 'data/wordbooks/IELTS Word List.txt')
OUTPUT = os.path.join(ROOT, 'src/config/dictionary.js')

def escape(s):
    if s is None:
        return ''
    return str(s).replace('\\', '\\\\').replace('"', '\\"').replace('\n', ' ')

def parse_line(line):
    line = line.strip()
    if not line or line.startswith('Word List') or line.startswith('README') or line.startswith('《'):
        return None
    if line.startswith('以 ') or line.startswith('范洪滔') or re.match(r'^\d{4}-\d{2}-\d{2}$', line):
        return None
    word = ''
    phonetic = ''
    pos = 'n.'
    definition = ''
    # 找音标开始 / 或 [ 或 {
    m = re.search(r'\s+(/[^/]+/|\[[^\]]+\]|\{[^}]+\})\s+', line)
    if m:
        word = line[:m.start()].strip().rstrip('*')
        phonetic = m.group(1)
        rest = line[m.end():].strip()
        pos_m = re.match(r'^([nva\./]+\.?)\s+(.+)$', rest, re.I)
        if pos_m and len(pos_m.group(1)) <= 12:
            pos = pos_m.group(1).strip()
            definition = pos_m.group(2).strip()
        else:
            definition = rest
    else:
        parts = re.split(r'\s{2,}', line, maxsplit=1)
        if len(parts) >= 2:
            word = parts[0].strip().rstrip('*')
            rest = parts[1].strip()
            pos_m = re.match(r'^([nva\./]+\.?)\s+(.+)$', rest, re.I)
            if pos_m and len(pos_m.group(1)) <= 12:
                pos = pos_m.group(1).strip()
                definition = pos_m.group(2).strip()
            else:
                definition = rest
    if not word or len(word) < 2:
        return None
    key = word.lower().replace(' ', ' ')
    if not re.match(r"^[a-z\-'\s]+$", key, re.I) or len(key) > 40:
        return None
    return (key, [phonetic, pos or 'n.', definition or '（暂无释义）'])

def main():
    with open(INPUT, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    dict_ = {}
    for line in lines:
        entry = parse_line(line)
        if entry:
            k, v = entry
            dict_[k] = v
    keys = sorted(dict_.keys())
    out = []
    out.append('/**')
    out.append(' * WordQuest 内置词典（含雅思词汇）')
    out.append(' * 词条数: ' + str(len(keys)))
    out.append(' * 格式：word → [phonetic, partOfSpeech, definition]')
    out.append(' */')
    out.append('')
    out.append('const DICTIONARY = {')
    for k in keys:
        v = dict_[k]
        out.append('  "' + escape(k) + '": ["' + escape(v[0]) + '", "' + escape(v[1]) + '", "' + escape(v[2]) + '"],')
    out.append('};')
    out.append('')
    out.append('function dictLookup(word) {')
    out.append('  if (!word) return null;')
    out.append('  const key = word.toLowerCase().trim();')
    out.append('  const entry = DICTIONARY[key];')
    out.append('  if (!entry) return null;')
    out.append('  return { word: key, phonetic: entry[0], partOfSpeech: entry[1], definition: entry[2] };')
    out.append('}')
    out.append('')
    out.append('function dictRandomWords(count) {')
    out.append('  const keys = Object.keys(DICTIONARY);')
    out.append('  const shuffled = keys.sort(() => Math.random() - 0.5);')
    out.append('  return shuffled.slice(0, count).map(w => ({')
    out.append('    word: w, phonetic: DICTIONARY[w][0], partOfSpeech: DICTIONARY[w][1], definition: DICTIONARY[w][2]')
    out.append('  }));')
    out.append('}')
    out.append('')
    out.append('if (typeof module !== \'undefined\' && module.exports) {')
    out.append('  module.exports = { DICTIONARY, dictLookup, dictRandomWords };')
    out.append('}')
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(out))
    print('Wrote', len(keys), 'entries to', OUTPUT)

if __name__ == '__main__':
    main()
