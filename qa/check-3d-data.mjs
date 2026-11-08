#!/usr/bin/env node
/**
 * 2D 앱(index.html)과 3D 화면(3d.html)의 운지 데이터와 키보드 단축키 표(NOTE_SHORTCUTS)가 같은지 검사합니다.
 * 의존성 없음 · Node 18+ · 실행: node qa/check-3d-data.mjs
 *
 * index.html은 "단일 파일·외부 의존성 0" 규약 때문에 데이터를 외부 파일로 뺄 수 없어서
 * 3d.html에 같은 선언을 복사해 두고, 이 스크립트(+ GitHub Actions QA)로 어긋남을 막습니다.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";
import { isDeepStrictEqual } from "node:util";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const NAMES = ["KEY_IDS", "NOTES", "ARIA_FINGER", "KEY_GROUP"];

/** `const NAME = <식>;` 의 <식>을 괄호 짝·문자열·주석을 고려해 잘라 평가한다. */
function readDecl(file, name){
  const text = readFileSync(join(ROOT, file), "utf8");
  const match = new RegExp(`^(?:const|let|var)\\s+${name}\\s*=`, "m").exec(text);
  if (!match) throw new Error(`${file}: ${name} 선언을 찾지 못했어요`);
  let i = match.index + match[0].length, depth = 0;
  const begin = i;
  for (; i < text.length; i++){
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === "`"){
      for (i++; text[i] !== ch; i++) if (text[i] === "\\") i++;
    } else if (text.startsWith("//", i)){
      i = text.indexOf("\n", i);
    } else if (text.startsWith("/*", i)){
      i = text.indexOf("*/", i) + 1;
    } else if ("([{".includes(ch)) depth++;
    else if (")]}".includes(ch)) depth--;
    else if (ch === ";" && depth === 0) break;
  }
  const value = vm.runInNewContext(`(${text.slice(begin, i)})`, {}, { timeout:1000 });
  return JSON.parse(JSON.stringify(value)); // 다른 realm 객체 → 일반 객체
}

const problems = [];
const two = Object.fromEntries(NAMES.map(name => [name, readDecl("index.html", name)]));
const three = Object.fromEntries(NAMES.map(name => [name, readDecl("3d.html", name)]));

for (const name of NAMES){
  if (isDeepStrictEqual(two[name], three[name])) continue;
  if (name === "NOTES"){
    const ids = new Set([...two.NOTES, ...three.NOTES].map(n => n.id));
    for (const id of ids){
      const a = two.NOTES.find(n => n.id === id), b = three.NOTES.find(n => n.id === id);
      if (!isDeepStrictEqual(a, b)) problems.push(`NOTES.${id}: index.html=${JSON.stringify(a)}\n           3d.html=${JSON.stringify(b)}`);
    }
    if (two.NOTES.map(n => n.id).join() !== three.NOTES.map(n => n.id).join()) problems.push("NOTES 순서가 달라요");
  } else {
    problems.push(`${name}: index.html=${JSON.stringify(two[name])}\n           3d.html=${JSON.stringify(three[name])}`);
  }
}

/* 기본 무결성 (index.html validateData()의 핵심 규칙) */
const { KEY_IDS, NOTES, ARIA_FINGER, KEY_GROUP } = two;
if (NOTES.length !== 37) problems.push(`NOTES 개수 ${NOTES.length} (37이어야 함)`);
NOTES.forEach((note, index) => {
  if (note.midi !== 60 + index) problems.push(`${note.id}: midi ${note.midi} (기대값 ${60 + index})`);
  [note.keys, ...note.alt.map(alt => alt.keys)].flat().forEach(key => {
    if (!KEY_IDS.includes(key)) problems.push(`${note.id}: 알 수 없는 키 "${key}"`);
  });
});
KEY_IDS.forEach(key => {
  if (!ARIA_FINGER[key]) problems.push(`ARIA_FINGER에 ${key}가 없어요`);
  if (!KEY_GROUP[key]) problems.push(`KEY_GROUP에 ${key}가 없어요`);
});

/* 키보드 단축키 표: 2D·3D가 같고, 위쪽 줄 숫자 1~7과 실제 음만 쓴다 */
const shortcuts = readDecl("index.html", "NOTE_SHORTCUTS");
const shortcuts3d = readDecl("3d.html", "NOTE_SHORTCUTS");
if (!isDeepStrictEqual(shortcuts, shortcuts3d)){
  problems.push(`NOTE_SHORTCUTS: index.html=${JSON.stringify(shortcuts)}\n           3d.html=${JSON.stringify(shortcuts3d)}`);
}
let shortcutCount = 0;
for (const [modifier, map] of Object.entries(shortcuts)){
  for (const [code, id] of Object.entries(map)){
    shortcutCount++;
    if (!/^Digit[1-7]$/.test(code)) problems.push(`NOTE_SHORTCUTS.${modifier}.${code}: 위쪽 줄 숫자 1~7만 써요`);
    if (!NOTES.some(note => note.id === id)) problems.push(`NOTE_SHORTCUTS.${modifier}.${code}: 없는 음 "${id}"`);
  }
}

if (problems.length){
  console.error("❌ 2D·3D 데이터가 어긋났어요\n" + problems.map(p => "  - " + p).join("\n"));
  process.exit(1);
}
console.log(`✅ 2D·3D 운지 데이터 일치 (KEY_IDS ${KEY_IDS.length} · NOTES ${NOTES.length} · ARIA_FINGER ${Object.keys(ARIA_FINGER).length} · KEY_GROUP ${Object.keys(KEY_GROUP).length} · 단축키 ${shortcutCount})`);
