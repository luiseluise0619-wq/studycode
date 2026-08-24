/* 이모지를 쓰지 않는다는 규칙을 검증기들이 함께 쓴다.

   장식용 그림 문자는 46차에 전부 걷어냈다. 문항을 새로 쓸 때 다시 들어오면
   글이 알맹이 대신 아이콘으로 말하게 되므로, 배치 검증기에서 막는다.
   화살표(→ ←)·동그라미 숫자(①)·체크(✓)처럼 뜻을 나르는 기호는 그대로 쓴다. */
const KEEP = new Set([0x2190,0x2191,0x2192,0x2193,0x2194,0x2195,0x21D2,0x21D4,
  0x2713,0x2714,0x2715,0x2717,0x2718,0x230A,0x230B,0x2308,0x2309,
  0x25A0,0x25A1,0x25AA,0x25AB,0x25AE,0x25B2,0x25B6,0x25BC,0x25C0,0x25CB,0x25CF,0x2026,0x2022]);
for (let c = 0x2460; c <= 0x2473; c++) KEEP.add(c);
for (let c = 0x25A0; c <= 0x25FF; c++) KEEP.add(c);   // 도형 — 캐럿·불릿·재생 표시
for (let c = 0x2500; c <= 0x257F; c++) KEEP.add(c);

function isEmoji(cp) {
  if (KEEP.has(cp)) return false;
  if (cp === 0xFE0F || cp === 0xFE0E || cp === 0x200D) return true;
  if (cp >= 0x1F000 && cp <= 0x1FAFF) return true;
  if (cp >= 0x2600 && cp <= 0x27BF) return true;
  if (cp >= 0x2B00 && cp <= 0x2BFF) return true;
  if (cp >= 0x2190 && cp <= 0x21FF) return false;
  if (cp >= 0x2300 && cp <= 0x23FF) return true;
  return false;
}

/* 객체 안의 모든 문자열을 훑어 처음 만난 이모지를 돌려준다(없으면 null) */
module.exports = function findEmoji(o) {
  let hit = null;
  const walk = v => {
    if (hit) return;
    if (typeof v === "string") {
      for (const ch of v) if (isEmoji(ch.codePointAt(0))) { hit = ch; return; }
    } else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(o);
  return hit;
};
module.exports.isEmoji = isEmoji;
