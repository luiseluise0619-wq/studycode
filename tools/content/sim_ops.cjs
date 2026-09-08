/* 시뮬레이션 8문항 — 시뮬이 하나도 없던 네 트랙(git·linux·test·cloud)에 2개씩.
   전부 결정적이다(난수·타이머·비동기 없음). 프레임을 되감아 '왜 그렇게 되는지' 를 본다. */

module.exports=[

/* ══ git ══ */
{ k:"세 갈래 병합이 갈리는 자리",
  cat:"internals",
  q:"두 갈래가 같은 파일을 고쳤을 때 <b>줄마다</b> 어떻게 판정되는지 보여 주세요. 기준(base)·내 것(ours)·저쪽(theirs) 세 줄을 견주어 줄마다 <code>snap(\"줄 \" + i + \" \" + 판정, 지금까지의 결과, {base: b, ours: o, theirs: t})</code> 를 기록하고, 최종 병합 결과 배열을 돌려주세요. 충돌한 줄은 <code>\"&lt;&lt;충돌&gt;&gt;\"</code> 로 둡니다. 판정은 <code>그대로</code>·<code>내 것</code>·<code>저쪽</code>·<code>충돌</code> 넷입니다.",
  src:`function merge3(base, ours, theirs) {
  const out = [];
  // 여기에 구현하세요 — 줄마다 네 갈래로 판정하고 snap 을 부르세요
  return out;
}

RESULT = merge3(
  ["a", "b", "c", "d"],
  ["a", "B", "c", "D1"],
  ["a", "b", "C", "D2"]);`,
  ref:`function merge3(base, ours, theirs) {
  const out = [];
  for (let i = 0; i < base.length; i++) {
    const b = base[i], o = ours[i], t = theirs[i];
    let verdict, line;
    if (o === b && t === b) { verdict = "그대로"; line = b; }
    else if (t === b) { verdict = "내 것"; line = o; }        // 저쪽은 안 건드렸다
    else if (o === b) { verdict = "저쪽"; line = t; }          // 나는 안 건드렸다
    else if (o === t) { verdict = "그대로"; line = o; }        // 둘이 같게 고쳤다
    else { verdict = "충돌"; line = "<<충돌>>"; }
    out.push(line);
    snap("줄 " + i + " " + verdict, [...out], {base: b, ours: o, theirs: t});
  }
  return out;
}

RESULT = merge3(
  ["a", "b", "c", "d"],
  ["a", "B", "c", "D1"],
  ["a", "b", "C", "D2"]);`,
  tests:[
    { d:"결과가 네 줄이다", js:"Array.isArray(RESULT) && RESULT.length===4" },
    { d:"한쪽만 고친 줄은 그 값이 살아남는다", js:"RESULT[1]==='B' && RESULT[2]==='C'" },
    { d:"둘 다 고친 줄만 충돌이다", js:"RESULT[3]==='<<충돌>>' && RESULT[0]==='a'" },
    { d:"줄마다 장면이 남았다", js:"FRAMES.length===4" },
    { d:"판정 이름이 장면에 적혀 있다", js:"FRAMES.filter(f=>/충돌/.test(f.label)).length===1 && FRAMES.filter(f=>/그대로/.test(f.label)).length===1" },
    { d:"장면마다 세 갈래의 값이 함께 있다", js:"FRAMES.every(f=>'base' in f.opt && 'ours' in f.opt && 'theirs' in f.opt)" }],
  ex:"병합이 <b>세 갈래</b>인 이유가 여기 있습니다. 내 것과 저쪽만 견주면 'b 와 B 중 어느 쪽이 바뀐 것인지' 알 수 없지만, <b>기준</b>과 함께 보면 누가 손댔는지가 정해집니다.\n네 판정 중 셋은 자동으로 풀립니다 — 아무도 안 건드렸거나, 한쪽만 건드렸거나, 둘이 <b>같게</b> 건드린 경우입니다. 충돌은 마지막 하나, <b>둘 다 다르게 건드린</b> 줄뿐입니다.\n되감아 보면 3번 줄에서만 충돌이 나는 것이 보입니다. 실무에서 충돌이 많다고 느껴지는 것은 이 판정이 까다로워서가 아니라 <b>갈라져 있던 시간이 길어</b> 서로 건드린 줄이 많아졌기 때문입니다.\n실제 Git 은 줄 번호가 아니라 <b>덩어리(hunk)</b> 단위로 맞춥니다. 그래서 줄이 추가·삭제되어 밀려도 따라가지만, 원리는 여기서 본 것과 같습니다." },

{ k:"reflog 가 되살리는 길",
  cat:"debug",
  q:"브랜치가 지나온 자리를 기록해 두었다가 <b>되돌아가는</b> 과정을 보여 주세요. 명령을 하나 처리할 때마다 <code>snap(명령, 지금 HEAD, {reflog: 지금까지의 기록})</code> 을 남기고, 마지막에 <code>\"reset --hard HEAD@{n}\"</code> 을 만나면 기록의 그 자리로 돌아갑니다. 반환값은 최종 HEAD 입니다. 기록은 <b>새 것이 앞</b>입니다.",
  src:`function replay(cmds) {
  let head = "c0";
  const reflog = [head];
  // 여기에 구현하세요 — 명령마다 HEAD 를 옮기고 기록을 남기세요
  return head;
}

RESULT = replay(["commit c1", "commit c2", "reset --hard c0", "reset --hard HEAD@{1}"]);`,
  ref:`function replay(cmds) {
  let head = "c0";
  const reflog = [head];
  snap("시작", head, {reflog: [...reflog]});
  for (const cmd of cmds) {
    const m = cmd.match(/^reset --hard HEAD@\\{(\\d+)\\}$/);
    if (m) head = reflog[Number(m[1])];              // 기록에서 되돌아간다
    else if (cmd.indexOf("commit ") === 0) head = cmd.slice(7);
    else if (cmd.indexOf("reset --hard ") === 0) head = cmd.slice(13);
    reflog.unshift(head);                            // 새 것이 앞
    snap(cmd, head, {reflog: [...reflog]});
  }
  return head;
}

RESULT = replay(["commit c1", "commit c2", "reset --hard c0", "reset --hard HEAD@{1}"]);`,
  tests:[
    { d:"reset 으로 잃은 줄 알았던 c2 로 돌아온다", js:"RESULT==='c2'" },
    { d:"명령마다 장면이 남았다(시작 포함)", js:"FRAMES.length===5" },
    { d:"c2 를 거쳐 갔다", js:"FRAMES.some(f=>f.value==='c2')" },
    { d:"기록이 명령마다 하나씩 늘어난다", js:"FRAMES.every((f,i)=>f.opt.reflog.length===i+1)" },
    { d:"기록은 새 것이 앞이다", js:"FRAMES[FRAMES.length-1].opt.reflog[0]===RESULT" },
    { d:"reset 뒤에도 옛 커밋이 기록에 남아 있다", js:"FRAMES[FRAMES.length-1].opt.reflog.indexOf('c2')>=0" }],
  ex:"reset 이 '<b>지운다</b>' 고 느껴지지만 실제로는 <b>HEAD 를 옮길 뿐</b>입니다. 옛 커밋은 그대로 있고 아무도 가리키지 않게 될 뿐이라, 가리키기만 하면 되살아납니다.\nreflog 는 그 '가리키는 법' 을 적어 둔 기록입니다. HEAD 가 지나온 자리를 시간순으로 남기므로 <code>HEAD@{1}</code> 은 '한 번 전의 자리' 를 뜻합니다. 되감아 보면 <code>reset --hard c0</code> 뒤에도 기록 맨 앞이 <code>c0</code>, 그 다음이 <code>c2</code> 인 것이 보입니다. 그래서 <code>HEAD@{1}</code> 로 <b>reset 직전의 자리</b>인 <code>c2</code> 가 그대로 돌아옵니다.\n이것이 '잘못 reset 했다' 가 거의 언제나 복구되는 이유입니다. 다만 <b>기한이 있습니다</b> — 아무도 안 가리키는 커밋은 정리 작업에서 결국 지워지므로, 알아챈 즉시 되살리는 것이 안전합니다.\nreflog 는 <b>내 저장소에만</b> 있습니다. 남의 컴퓨터에는 그 기록이 없으므로, 강제 푸시로 남의 이력을 덮어쓴 것은 이 방법으로 못 되돌립니다." },

/* ══ linux ══ */
{ k:"파이프가 흘러가는 모양",
  cat:"internals",
  q:"셸 파이프라인이 <b>한 줄씩 흘러가는</b> 모습을 보여 주세요. 각 단계를 지날 때마다 <code>snap(단계이름, 그 단계를 통과한 줄들, {들어옴: n, 나감: m})</code> 을 기록하고, 최종 줄 배열을 돌려주세요. 단계는 <code>grep</code>(포함하는 줄만)·<code>cut</code>(공백으로 나눈 n번째 칸, 1부터)·<code>sort</code>·<code>uniq</code>(붙어 있는 중복 접기) 넷입니다.",
  src:`function pipeline(lines, stages) {
  let cur = lines;
  // 여기에 구현하세요 — 단계마다 cur 를 바꾸고 snap 을 부르세요
  return cur;
}

RESULT = pipeline(
  ["GET /a 200", "GET /b 404", "GET /a 200", "POST /c 200", "GET /b 404"],
  [["grep", "GET"], ["cut", 2], ["sort"], ["uniq"]]);`,
  ref:`function pipeline(lines, stages) {
  let cur = lines;
  snap("시작", [...cur], {들어옴: lines.length, 나감: cur.length});
  for (const st of stages) {
    const before = cur.length;
    if (st[0] === "grep") cur = cur.filter((l) => l.indexOf(st[1]) >= 0);
    else if (st[0] === "cut") cur = cur.map((l) => l.split(" ")[st[1] - 1]);
    else if (st[0] === "sort") cur = [...cur].sort();
    else if (st[0] === "uniq") cur = cur.filter((l, i) => i === 0 || l !== cur[i - 1]);
    snap(st.join(" "), [...cur], {들어옴: before, 나감: cur.length});
  }
  return cur;
}

RESULT = pipeline(
  ["GET /a 200", "GET /b 404", "GET /a 200", "POST /c 200", "GET /b 404"],
  [["grep", "GET"], ["cut", 2], ["sort"], ["uniq"]]);`,
  tests:[
    { d:"최종 결과가 /a 와 /b 두 줄이다", js:"JSON.stringify(RESULT)===JSON.stringify(['/a','/b'])" },
    { d:"단계마다 장면이 남았다(시작 포함)", js:"FRAMES.length===5" },
    { d:"grep 이 POST 를 걸러 낸다", js:"FRAMES[1].opt.들어옴===5 && FRAMES[1].opt.나감===4" },
    { d:"cut 은 줄 수를 바꾸지 않는다", js:"FRAMES[2].opt.들어옴===FRAMES[2].opt.나감" },
    { d:"sort 뒤에야 uniq 가 접을 수 있다", js:"FRAMES[3].opt.나감===4 && FRAMES[4].opt.나감===2" },
    { d:"장면 이름에 단계가 적혀 있다", js:"FRAMES.map(f=>f.label).join('|').indexOf('uniq')>=0" }],
  ex:"파이프라인은 <b>줄의 흐름</b>입니다. 각 단계는 앞에서 온 줄을 받아 고치거나 걸러 다음으로 넘길 뿐이고, 그래서 순서를 바꾸면 결과가 달라집니다.\n되감아 보면 <code>sort</code> 없이 <code>uniq</code> 를 놓으면 안 되는 이유가 보입니다 — <code>uniq</code> 는 <b>붙어 있는</b> 같은 줄만 접습니다. 정렬 전에는 <code>/a /b /a /b</code> 라 아무것도 안 접히고, 정렬 뒤에야 <code>/a /a /b /b</code> 가 되어 둘로 줄어듭니다.\n단계마다 '들어온 줄 수'와 '나간 줄 수'를 함께 보는 것이 실무의 습관입니다. 어느 단계에서 갑자기 0이 되면 거기서 조건이 잘못된 것이고, 줄 수가 안 줄면 그 단계가 아무 일도 안 한 것입니다.\n실제 셸에서는 단계들이 <b>동시에</b> 돕니다. 첫 줄이 끝까지 흘러가는 동안 두 번째 줄이 이미 첫 단계에 들어와 있어, 큰 파일도 통째로 메모리에 올리지 않고 처리됩니다." },

{ k:"권한 비트가 판정되는 순서",
  cat:"security",
  q:"파일 접근이 <b>어느 단계에서 갈리는지</b> 보여 주세요. 소유자 → 그룹 → 나머지 순으로 확인하며 단계마다 <code>snap(단계, 판정, {bits: 그 자리 비트, 원하는것: want})</code> 를 남기고, 최종 판정(<code>\"허용\"</code> 또는 <code>\"거부\"</code>)을 돌려주세요. <b>맞는 부류를 찾으면 거기서 끝</b>이고 뒤는 보지 않습니다.",
  src:`function access(mode, owner, group, user, userGroups, want) {
  // 여기에 구현하세요 — 소유자·그룹·나머지 순으로 보고 맞는 자리에서 멈추세요
  return "거부";
}

RESULT = access("640", "alice", "devs", "bob", ["devs"], "w");`,
  ref:`function access(mode, owner, group, user, userGroups, want) {
  const digits = String(mode).split("").map(Number);
  const need = {r: 4, w: 2, x: 1}[want];
  const classes = [
    ["소유자", user === owner, digits[0]],
    ["그룹", userGroups.indexOf(group) >= 0, digits[1]],
    ["나머지", true, digits[2]]
  ];
  for (const [name, matches, bits] of classes) {
    if (!matches) { snap(name + " 아님", "계속", {bits: bits, 원하는것: want}); continue; }
    const ok = (bits & need) !== 0;
    snap(name + " 로 판정", ok ? "허용" : "거부", {bits: bits, 원하는것: want});
    return ok ? "허용" : "거부";
  }
  return "거부";
}

RESULT = access("640", "alice", "devs", "bob", ["devs"], "w");`,
  tests:[
    { d:"그룹 자리에서 거부된다", js:"RESULT==='거부'" },
    { d:"소유자가 아님을 먼저 확인한다", js:"FRAMES[0].label.indexOf('소유자')>=0" },
    { d:"그룹에서 판정하고 멈춘다", js:"FRAMES.length===2 && FRAMES[1].label.indexOf('그룹')>=0" },
    { d:"나머지 자리는 보지 않는다", js:"FRAMES.every(f=>f.label.indexOf('나머지')<0)" },
    { d:"장면에 그 자리의 비트가 남는다", js:"FRAMES[1].opt.bits===4" },
    { d:"원하는 권한이 장면에 적혀 있다", js:"FRAMES.every(f=>f.opt.원하는것==='w')" }],
  ex:"권한 판정에서 가장 자주 오해하는 것이 <b>맞는 부류에서 끝난다</b>는 점입니다. 소유자면 소유자 비트만 보고, 그룹이면 그룹 비트만 봅니다. 나머지에 권한이 있어도 <b>보지 않습니다</b>.\n그래서 이상한 일이 생깁니다 — <code>604</code> 인 파일은 소유자가 읽고 쓸 수 있고 남들도 읽을 수 있지만, <b>그룹에 속한 사람은 아무것도 못 합니다.</b> 그룹 자리가 0이고 거기서 판정이 끝나기 때문입니다.\n되감아 보면 bob 이 소유자가 아니라 넘어가고, 그룹 <code>devs</code> 에 속하므로 두 번째 자리(4 = 읽기만)로 판정되어 쓰기가 거부되는 것이 보입니다.\n디렉터리에서는 뜻이 달라집니다 — <code>x</code> 는 실행이 아니라 <b>들어가기</b>이고, <code>r</code> 은 <b>목록 보기</b>입니다. 그래서 <code>x</code> 만 있으면 이름을 아는 파일에는 닿지만 목록은 못 봅니다." },

/* ══ test ══ */
{ k:"테스트가 서로를 밟는 자리",
  cat:"debug",
  q:"테스트들이 <b>공유 상태를 남기며</b> 도는 모습을 보여 주세요. 테스트를 하나 돌 때마다 <code>snap(이름 + \" \" + 결과, 지금 공유 상태, {정리: cleanUp})</code> 을 남기고, 통과한 테스트 수를 돌려주세요. 각 테스트는 상태에 값을 넣고, <code>정리</code>가 참이면 자기가 넣은 것을 지웁니다. 테스트는 <b>상태가 비어 있을 때만</b> 통과합니다.",
  src:`function runSuite(tests, cleanUp) {
  const shared = [];
  let passed = 0;
  // 여기에 구현하세요 — 테스트마다 상태를 보고 판정한 뒤 snap 을 부르세요
  return passed;
}

RESULT = runSuite(["A", "B", "C"], false);`,
  ref:`function runSuite(tests, cleanUp) {
  const shared = [];
  let passed = 0;
  for (const name of tests) {
    const ok = shared.length === 0;                 // 남이 남긴 것이 없어야 통과
    if (ok) passed++;
    shared.push(name + "-row");
    if (cleanUp) shared.pop();
    snap(name + " " + (ok ? "통과" : "실패"), [...shared], {정리: cleanUp});
  }
  return passed;
}

RESULT = runSuite(["A", "B", "C"], false);`,
  tests:[
    { d:"정리를 안 하면 첫 테스트만 통과한다", js:"RESULT===1" },
    { d:"테스트마다 장면이 남았다", js:"FRAMES.length===3" },
    { d:"첫 테스트는 통과로 적힌다", js:"FRAMES[0].label.indexOf('통과')>=0" },
    { d:"뒤의 두 테스트는 실패로 적힌다", js:"FRAMES.filter(f=>/실패/.test(f.label)).length===2" },
    { d:"공유 상태가 테스트마다 늘어난다", js:"FRAMES.every((f,i)=>f.value.length===i+1)" },
    { d:"정리 여부가 장면에 남는다", js:"FRAMES.every(f=>f.opt.정리===false)" }],
  ex:"'혼자 돌리면 되는데 같이 돌리면 실패한다' 의 정체가 이것입니다. 앞 테스트가 남긴 것이 뒤 테스트의 전제를 깨뜨립니다.\n되감아 보면 <b>첫 테스트만</b> 깨끗한 상태에서 돈다는 것이 보입니다. 그 뒤로는 앞선 것들이 쌓여 있고, 테스트 수가 늘수록 상황이 나빠집니다.\n무서운 점은 <b>순서가 바뀌면 결과도 바뀐다</b>는 것입니다. 무작위 순서로 돌리는 도구를 쓰면 어제 통과한 것이 오늘 실패하고, 원인을 찾기가 아주 어렵습니다. 그래서 순서를 뒤집어 돌려 보는 것이 오염을 찾는 가장 싼 방법입니다.\n정리를 <code>true</code> 로 바꿔 보면 셋 다 통과합니다. 다만 정리를 <b>기억해서 하는 일</b>로 두면 언젠가 빠지므로, 준비와 정리를 한 자리에 묶어 두는 것이 실무의 답입니다." },

{ k:"이분 탐색으로 범인을 좁힌다",
  cat:"debug",
  q:"어느 커밋이 깨뜨렸는지 <b>반씩 잘라</b> 찾는 과정을 보여 주세요. 확인할 때마다 <code>snap(\"확인 \" + mid + \" \" + 결과, [lo, hi], {남은후보: hi - lo + 1})</code> 를 남기고, 처음 깨진 커밋의 번호를 돌려주세요. <code>broken</code> 번 이상이 깨진 것입니다.",
  src:`function bisect(n, broken) {
  let lo = 0, hi = n - 1;
  // 여기에 구현하세요 — 가운데를 확인하고 범위를 반으로 줄이며 snap 을 부르세요
  return lo;
}

RESULT = bisect(100, 73);`,
  ref:`function bisect(n, broken) {
  let lo = 0, hi = n - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const bad = mid >= broken;
    snap("확인 " + mid + " " + (bad ? "깨짐" : "멀쩡"), [lo, hi], {남은후보: hi - lo + 1});
    if (bad) hi = mid; else lo = mid + 1;
  }
  snap("찾음 " + lo, [lo, hi], {남은후보: 1});
  return lo;
}

RESULT = bisect(100, 73);`,
  tests:[
    { d:"처음 깨진 커밋을 찾는다", js:"RESULT===73" },
    { d:"확인 횟수가 열 번 안팎이다", js:"FRAMES.length<=9 && FRAMES.length>=6" },
    { d:"후보가 매번 줄어든다", js:"FRAMES.every((f,i)=>i===0||f.opt.남은후보<=FRAMES[i-1].opt.남은후보)" },
    { d:"범위가 한 점으로 모인다", js:"FRAMES[FRAMES.length-1].value[0]===FRAMES[FRAMES.length-1].value[1]" },
    { d:"마지막 장면이 찾음이다", js:"FRAMES[FRAMES.length-1].label.indexOf('찾음')>=0" },
    { d:"깨짐과 멀쩡을 모두 만난다", js:"FRAMES.some(f=>/깨짐/.test(f.label)) && FRAMES.some(f=>/멀쩡/.test(f.label))" }],
  ex:"커밋 100개에서 범인을 찾는 데 <b>일곱 번</b>이면 됩니다. 하나씩 보면 최악에 100번이니 열네 배 빠릅니다.\n되감아 보면 후보 수가 100 → 50 → 25 … 로 반씩 주는 것이 보입니다. 이것이 '반씩 자르기' 가 강한 이유이고, 커밋이 천 개여도 열 번 남짓이면 끝납니다.\n전제가 하나 있습니다 — <b>한 번 깨지면 계속 깨져 있어야</b> 합니다. 중간에 고쳐졌다 다시 깨지면 이 방법이 엉뚱한 답을 냅니다. 그래서 확인이 흔들리는 테스트라면 먼저 그것을 고쳐야 합니다.\n같은 방법이 여러 곳에 쓰입니다 — 어느 설정이 문제인지, 어느 테스트가 오염시키는지, 어느 데이터 줄이 파이프라인을 깨뜨리는지. <b>확인만 자동으로 만들 수 있으면</b> 나머지는 기계가 합니다." },

/* ══ cloud ══ */
{ k:"오토스케일이 따라가는 모습",
  cat:"ops",
  q:"부하가 오르내릴 때 대수가 <b>어떻게 따라가는지</b> 보여 주세요. 1분마다 <code>snap(\"분 \" + t, 지금 대수, {부하: load, 목표: want, 준비중: warming})</code> 을 남기고, 마지막 대수를 돌려주세요. 필요한 대수는 <code>올림(부하 / 대당처리량)</code> 이고 <b>새 인스턴스는 다음 분에야</b> 일을 시작합니다. 최소 2대, 최대 10대입니다.",
  src:`function autoscale(loads, perNode) {
  let running = 2, warming = 0;
  // 여기에 구현하세요 — 분마다 목표를 구하고 늘리거나 줄이며 snap 을 부르세요
  return running;
}

RESULT = autoscale([100, 100, 400, 400, 400, 100, 100], 100);`,
  ref:`function autoscale(loads, perNode) {
  let running = 2, warming = 0;
  for (let t = 0; t < loads.length; t++) {
    running += warming;                                  // 지난 분에 띄운 것이 이제 일한다
    warming = 0;
    const load = loads[t];
    const want = Math.min(Math.max(Math.ceil(load / perNode), 2), 10);
    if (want > running) warming = want - running;        // 늘리는 것은 다음 분에
    else running = want;                                 // 줄이는 것은 즉시
    snap("분 " + t, running, {부하: load, 목표: want, 준비중: warming});
  }
  return running;
}

RESULT = autoscale([100, 100, 400, 400, 400, 100, 100], 100);`,
  tests:[
    { d:"부하가 내려간 뒤 최소 대수로 돌아온다", js:"RESULT===2" },
    { d:"분마다 장면이 남았다", js:"FRAMES.length===7" },
    { d:"부하가 뛴 분에는 아직 못 따라간다", js:"FRAMES[2].value===2 && FRAMES[2].opt.목표===4" },
    { d:"다음 분에야 따라잡는다", js:"FRAMES[3].value===4" },
    { d:"대수가 최소·최대 안에 있다", js:"FRAMES.every(f=>f.value>=2 && f.value<=10)" },
    { d:"줄이는 것은 즉시 반영된다", js:"FRAMES[5].value===2 && FRAMES[5].opt.준비중===0" }],
  ex:"오토스케일의 계산 자체는 나눗셈 하나입니다. 어려움은 <b>반응이 늦다</b>는 데 있습니다.\n되감아 보면 부하가 100 → 400 으로 뛴 분에 대수는 아직 2대이고, <b>한 분 뒤에야</b> 4대가 되는 것이 보입니다. 그 한 분 동안 요청은 실패하거나 밀립니다. 준비 시간이 3분이면 3분 동안 그렇습니다.\n그래서 예상되는 부하는 <b>일정으로 미리</b> 늘려 둡니다. 아침 9시에 몰리는 것을 안다면 8시 55분에 늘리는 것이, 9시에 지표를 보고 늘리는 것보다 낫습니다.\n늘리는 것과 줄이는 것을 다르게 다루는 것도 중요합니다. 늘릴 때는 빠르게, 줄일 때는 <b>천천히</b> — 잠깐 내려간 부하에 대수를 줄였다가 다시 늘리면, 준비 시간이 또 들어 오히려 나빠집니다." },

{ k:"토큰 버킷이 통과시키는 규칙",
  cat:"design",
  q:"요청이 <b>언제 통과하고 언제 막히는지</b> 보여 주세요. 요청 하나를 처리할 때마다 <code>snap(\"t=\" + t + \" \" + 판정, 남은 토큰, {채워짐: added})</code> 를 남기고, 통과한 요청 수를 돌려주세요. 버킷은 최대 <code>cap</code> 개를 담고 <b>초당 rate 개</b>씩 채워지며, 요청 하나가 토큰 하나를 씁니다. 처음에는 가득 차 있습니다.",
  src:`function bucket(times, cap, rate) {
  let tokens = cap, last = 0, passed = 0;
  // 여기에 구현하세요 — 지난 시간만큼 채우고, 토큰이 있으면 통과시키며 snap 을 부르세요
  return passed;
}

RESULT = bucket([0, 0, 0, 1, 1, 5], 3, 1);`,
  ref:`function bucket(times, cap, rate) {
  let tokens = cap, last = 0, passed = 0;
  for (const t of times) {
    const added = Math.min((t - last) * rate, cap - tokens);
    tokens = Math.min(tokens + Math.max(added, 0), cap);
    last = t;
    const ok = tokens >= 1;
    if (ok) { tokens -= 1; passed++; }
    snap("t=" + t + " " + (ok ? "통과" : "막힘"), tokens, {채워짐: Math.max(added, 0)});
  }
  return passed;
}

RESULT = bucket([0, 0, 0, 1, 1, 5], 3, 1);`,
  tests:[
    { d:"여섯 요청 중 다섯이 통과한다", js:"RESULT===5" },
    { d:"요청마다 장면이 남았다", js:"FRAMES.length===6" },
    { d:"처음 세 개는 쌓아 둔 토큰으로 통과한다", js:"FRAMES.slice(0,3).every(f=>/통과/.test(f.label))" },
    { d:"토큰이 떨어진 요청이 막힌다", js:"FRAMES.filter(f=>/막힘/.test(f.label)).length===1" },
    { d:"토큰이 상한을 넘지 않는다", js:"FRAMES.every(f=>f.value<=3)" },
    { d:"오래 쉰 뒤에는 다시 통과한다", js:"/통과/.test(FRAMES[5].label)" }],
  ex:"토큰 버킷이 널리 쓰이는 이유는 <b>평소의 몰림을 허용하면서 평균은 지키기</b> 때문입니다. 쌓아 둔 토큰만큼은 한꺼번에 통과시키고, 그 뒤로는 채워지는 속도로만 통과합니다.\n되감아 보면 <code>t=0</code> 에 세 요청이 연달아 통과하는 것이 보입니다. 버킷이 가득 차 있었기 때문입니다. 네 번째부터는 토큰이 없어 <b>채워지기를 기다려야</b> 합니다.\n<code>cap</code> 과 <code>rate</code> 가 각각 다른 것을 정합니다 — <b>cap 은 한꺼번에 얼마나</b>, <b>rate 는 길게 보아 얼마나</b>입니다. cap 이 크면 순간의 몰림에 너그럽고, rate 는 평균 처리량을 정합니다.\n<code>t=5</code> 에 다시 통과하는 것도 보입니다. 4초를 쉬는 동안 채워졌기 때문인데, <b>상한이 있어</b> 아무리 오래 쉬어도 cap 을 넘지는 않습니다. 상한이 없으면 하루 쉰 뒤 하루치를 한꺼번에 쏟아붓게 됩니다." }

];
