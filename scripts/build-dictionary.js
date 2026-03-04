/**
 * 从 data/wordbooks/IELTS Word List.txt 解析并生成 src/config/dictionary.js
 * 运行: node scripts/build-dictionary.js
 */
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../data/wordbooks/IELTS Word List.txt');
const outputPath = path.join(__dirname, '../src/config/dictionary.js');

const raw = fs.readFileSync(inputPath, 'utf-8');
const lines = raw.split(/\r?\n/);
const dict = {};
let skipped = 0;

// 匹配音标：/.../ 或 [...] 或 {...}
const phoneticMatch = /^(\s*)(\/[^/]+\/|\[[^\]]+\]|\{[^}]+\})(\s+)(.+)$/;
// 词性缩写
const posMatch = /^(n\.|v\.|a\.|ad\.|adv\.|vt\.|vi\.|conj\.|prep\.|pron\.|excl\.|art\.|aux\.|int\.|pl\.)(\s+)(.*)$/i;

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('Word List') || trimmed.startsWith('README') || trimmed.startsWith('《') || trimmed.startsWith('以 ') || trimmed.startsWith('范洪滔') || /^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    skipped++;
    continue;
  }
  const firstChar = trimmed.charAt(0);
  if (firstChar === '' || firstChar === '─' || trimmed === '根据对最后' || trimmed.startsWith('本人不对')) continue;

  let word = '';
  let phonetic = '';
  let partOfSpeech = 'n.';
  let definition = '';

  const phonStart = trimmed.search(/\s*(\/|\{|\[)/);
  if (phonStart > 0) {
    word = trimmed.slice(0, phonStart).trim().replace(/\*$/, '');
    const afterWord = trimmed.slice(phonStart).trim();
    const bracket = afterWord[0];
    const bracketEnd = bracket === '/' ? '/' : (bracket === '[' ? ']' : '}');
    const endIdx = afterWord.indexOf(bracketEnd, 1);
    if (endIdx > 0) {
      phonetic = afterWord.slice(0, endIdx + 1);
      let rest = afterWord.slice(endIdx + 1).trim();
      const posMatch = rest.match(/^([n\.v\.a\.ad\.vt\.vi\.conj\.prep\.pron\.excl\.aux\.int\.pl\.]+(?:\/[n\.v\.a\.]+\.?)*)\s+(.+)$/i) || rest.match(/^([nva]\.?)\s+(.+)$/i);
      if (posMatch && posMatch[1].length <= 15) {
        partOfSpeech = posMatch[1].trim();
        definition = posMatch[2].trim();
      } else {
        definition = rest;
      }
    } else {
      definition = afterWord;
    }
  } else {
    const twoSpaces = trimmed.indexOf('  ');
    if (twoSpaces > 0) {
      word = trimmed.slice(0, twoSpaces).trim().replace(/\*$/, '');
      let rest = trimmed.slice(twoSpaces).trim();
      const posMatch = rest.match(/^([n\.v\.a\.]+(?:\/[n\.v\.]+\.?)*)\s+(.+)$/i);
      if (posMatch && posMatch[1].length <= 10) {
        partOfSpeech = posMatch[1].trim();
        definition = posMatch[2].trim();
      } else {
        definition = rest;
      }
    }
  }

  if (!word || word.length < 2) continue;
  const key = word.toLowerCase().replace(/\s+/g, ' ');
  if (/^[a-z\-'\s]+$/i.test(key) && key.length <= 40) {
    dict[key] = [phonetic || '', partOfSpeech || 'n.', definition || '（暂无释义）'];
  }
}

// 读取现有 dictionary 并合并（IELTS 覆盖同键，其余保留）
let existing = {};
try {
  const existingContent = fs.readFileSync(outputPath, 'utf-8');
  const existingMatch = existingContent.match(/const DICTIONARY = \{([\s\S]*?)\};/);
  if (existingMatch) {
    const existingStr = '{' + existingMatch[1] + '}';
    existing = Function('return ' + existingStr)();
  }
} catch (_) {}
const merged = { ...existing, ...dict };

const keys = Object.keys(merged).sort();
const linesOut = [];
linesOut.push('/**');
linesOut.push(' * WordQuest 内置词典（含雅思词汇）');
linesOut.push(' * 词条数: ' + keys.length);
linesOut.push(' * 格式：word → [phonetic, partOfSpeech, definition]');
linesOut.push(' */');
linesOut.push('');
linesOut.push('const DICTIONARY = {');
function esc(s) {
  return (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
}
keys.forEach(k => {
  const v = merged[k];
  linesOut.push('  "' + esc(k) + '": ["' + esc(v[0]) + '", "' + esc(v[1]) + '", "' + esc(v[2]) + '"],');
});
linesOut.push('};');
linesOut.push('');
linesOut.push('function dictLookup(word) {');
linesOut.push('  if (!word) return null;');
linesOut.push('  const key = word.toLowerCase().trim();');
linesOut.push('  const entry = DICTIONARY[key];');
linesOut.push('  if (!entry) return null;');
linesOut.push('  return { word: key, phonetic: entry[0], partOfSpeech: entry[1], definition: entry[2] };');
linesOut.push('}');
linesOut.push('');
linesOut.push('function dictRandomWords(count) {');
linesOut.push('  const keys = Object.keys(DICTIONARY);');
linesOut.push('  const shuffled = keys.sort(() => Math.random() - 0.5);');
linesOut.push('  return shuffled.slice(0, count).map(w => ({');
linesOut.push('    word: w, phonetic: DICTIONARY[w][0], partOfSpeech: DICTIONARY[w][1], definition: DICTIONARY[w][2]');
linesOut.push('  }));');
linesOut.push('}');
linesOut.push('');
linesOut.push('if (typeof module !== \'undefined\' && module.exports) {');
linesOut.push('  module.exports = { DICTIONARY, dictLookup, dictRandomWords };');
linesOut.push('}');

fs.writeFileSync(outputPath, linesOut.join('\n'), 'utf-8');
console.log('Wrote', keys.length, 'entries to', outputPath);
