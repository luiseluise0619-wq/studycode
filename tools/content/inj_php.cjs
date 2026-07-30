/* PHP 트랙 신설. track_php1.cjs + track_php2.cjs 를 data/t-php.js 로 만들고
   셸(index.html)에 COURSES·TRACK_INTRO·CATS·RUN_LANGS 항목을 붙인다.
   검증 전용 필드(_p)는 주입하지 않는다 — 정답 판정과 무관한 데이터를 앱에 싣지 않는다.
   전부 성공해야 쓴다(all-or-nothing). */
const fs=require("fs");
const ROOT="/home/user/studycode";
const UNITS=[].concat(require("./track_php1.cjs"), require("./track_php2.cjs"));

const EXPECT_UNITS=12;
if(UNITS.length!==EXPECT_UNITS) throw new Error(EXPECT_UNITS+"유닛 기대, 실제 "+UNITS.length);
const total=UNITS.reduce((s,u)=>s+u.l.reduce((t,L)=>t+L.q.length,0),0);
if(total<150) throw new Error("문항이 너무 적다: "+total);

/* ── 트랙 청크: 검증용 _p 를 떼고 그대로 옮긴다 ── */
const chunk=UNITS.map(u=>({ t:u.t, l:u.l.map(L=>{
  if(!L.th||!L.th.sum||L.th.body.length!==2||!L.th.code||!L.th.key) throw new Error(L.t+": 이론 형식");
  return { t:L.t, xp:L.xp, th:L.th, q:L.q.map(q=>{ const c=Object.assign({},q); delete c._p; return c; }) };
}) }));
const path=ROOT+"/data/t-php.js";
if(fs.existsSync(path)) throw new Error("data/t-php.js 가 이미 있다");
fs.writeFileSync(path, "__CR('t:php',"+JSON.stringify(chunk)+");\n");

/* ── 셸 ── */
const ih=ROOT+"/index.html";
let html=fs.readFileSync(ih,"utf8");

function grab(mark){
  const s=html.indexOf(mark+"{")+mark.length;
  if(s<mark.length) throw new Error("표식을 찾지 못했다: "+mark);
  let d=0, e=s;
  for(let i=s;i<html.length;i++){
    if(html[i]==="{")d++;
    else if(html[i]==="}"){ d--; if(!d){ e=i; break; } }
  }
  return {start:s, end:e, obj:JSON.parse(html.slice(s,e+1))};
}
function put(g, obj){ html=html.slice(0,g.start)+JSON.stringify(obj)+html.slice(g.end+1); }

/* COURSES */
const gc=grab("COURSES = ");
if(gc.obj.php) throw new Error("COURSES 에 php 가 이미 있다");
gc.obj.php={ name:"PHP", em:"🐘", color:"#6b7ab8", g:"linear-gradient(135deg,#6b7ab8,#8892bf)",
  units:UNITS.map(u=>({ title:u.t, guide:"🐘",
    lessons:u.l.map(L=>({ title:L.t, xp:L.xp, n:L.q.length })) })) };
put(gc, gc.obj);

/* TRACK_INTRO */
const gi=grab("const TRACK_INTRO=");
if(gi.obj.php) throw new Error("TRACK_INTRO 에 php 가 이미 있다");
gi.obj.php={
  tag:"웹의 절반을 떠받치는, 요청 하나에 최적화된 언어",
  what:"HTML 안에 코드를 끼워 넣는 형태로 시작한 서버 언어. 요청마다 프로그램이 새로 시작하고 끝나는 'shared-nothing' 모델을 쓰며, PHP 8 에서 JIT·타입 시스템·enum 을 갖춘 현대적 언어로 다시 정비되었다.",
  why:"1994년 라스무스 러도프가 자기 홈페이지의 방문자 수를 세려고 만든 CGI 도구가 출발점이다. 목표가 '웹 페이지에 값을 끼워 넣는 것' 이었기 때문에, 배우기 쉽고 배포가 파일 복사로 끝나는 성질을 얻었다 — 그 대가로 초기 문법의 일관성을 잃었고, PHP 7·8 이 그 빚을 갚아 왔다.",
  where:["워드프레스·드루팔 등 CMS 생태계","Laravel·Symfony 기반 백엔드 API","전자상거래(Magento·WooCommerce)","사내 관리 도구와 어드민","레거시 시스템 유지보수"],
  services:["Facebook 초기 전체(이후 HHVM/Hack 으로 분기)","위키백과(MediaWiki)","Slack 백엔드 상당 부분","Etsy·Tumblr","전 세계 웹사이트의 상당수(워드프레스)"],
  companies:["Automattic(워드프레스)","Slack","Etsy","Wikimedia","국내 다수의 커머스·에이전시"],
  pros:["요청마다 초기화되는 모델이라 메모리 누수가 서비스를 죽이지 않는다","배포가 단순하고 공유 호스팅부터 대규모까지 같은 방식이 통한다","웹에 필요한 것(세션·폼·파일 업로드·DB)이 표준 라이브러리에 들어 있다"],
  cons:["초기 설계의 비일관성이 함수 이름·인자 순서에 남아 있다","느슨한 타입 변환이 조용한 버그를 만든다(PHP 8 이 상당 부분 개선)","요청마다 부트스트랩을 반복하므로 OPcache 없이는 느리다"],
  vs:[{n:"Python",t:"둘 다 동적 타입 스크립트지만, PHP 는 웹 요청 하나를 처리하는 데 특화되었고 Python 은 데이터·범용까지 넓다."},
      {n:"Node.js",t:"Node 는 하나의 프로세스가 계속 살아 이벤트 루프로 동시성을 내고, PHP 는 프로세스 풀로 낸다 — 그래서 PHP 는 상태가 새지 않고 Node 는 메모리 효율이 좋다."},
      {n:"Java",t:"Java 는 정적 타입·장수 프로세스로 대규모 도메인에 강하고, PHP 는 요청당 격리와 배포 단순함에 강하다."}],
  jobs:["백엔드 개발자","워드프레스·CMS 개발자","커머스 플랫폼 개발자","레거시 현대화 엔지니어"],
  diff:1,
  hours:"기초 30~50시간 · 실무 수준 150시간+",
  after:["요청 수명·슈퍼글로벌·세션을 이해하고 폼 처리를 안전하게 만든다","PDO 준비된 구문으로 SQL 인젝션 없는 데이터 접근 계층을 쓴다","Composer·PSR-4·정적 분석을 붙여 현대적인 PHP 프로젝트 구조를 세운다"]
};
put(gi, gi.obj);

/* CATS — php 를 언어 그룹에 넣는다. rust 가 어떤 그룹에도 없어 UI 에서 닿을 수 없었으므로 함께 넣는다. */
const catMark='{id:"lang",name:"💻 언어",tracks:["python","c","cpp","java","go","arduino"]}';
if(html.indexOf(catMark)<0) throw new Error("CATS 언어 그룹을 찾지 못했다");
html=html.replace(catMark,'{id:"lang",name:"💻 언어",tracks:["python","c","cpp","java","go","rust","php","arduino"]}');

/* 러너 언어 목록 — '직접 실행' 패널과 러너 상태 라벨에 쓰인다 */
const rl='const RUN_LANGS={java:"java", c:"c", cpp:"cpp", go:"go", rust:"rust", python:"python"};';
const rb='const RUN_LABEL={java:"Java", c:"C", cpp:"C++", go:"Go", rust:"Rust", python:"Python"};';
if(html.indexOf(rl)<0||html.indexOf(rb)<0) throw new Error("RUN_LANGS/RUN_LABEL 을 찾지 못했다");
html=html.replace(rl,'const RUN_LANGS={java:"java", c:"c", cpp:"cpp", go:"go", rust:"rust", python:"python", php:"php"};');
html=html.replace(rb,'const RUN_LABEL={java:"Java", c:"C", cpp:"C++", go:"Go", rust:"Rust", python:"Python", php:"PHP"};');

fs.writeFileSync(ih, html);

/* 트랙이 하나 늘었으니 청크 수 단정도 함께 올린다 */
const tp=ROOT+"/tests/app.test.cjs";
let t=fs.readFileSync(tp,"utf8");
const a1='check("트랙 청크가 33개 있다", files.filter(f=>/^t-.+\\.js$/.test(f)).length===33,';
if(t.indexOf(a1)<0) throw new Error("청크 수 단정을 찾지 못했다");
t=t.replace(a1, a1.replace(/33/g,"34"));
t=t.replace("early.nodes>0 && early.tracks===33","early.nodes>0 && early.tracks===34");
fs.writeFileSync(tp,t);

console.log("주입 완료: php 트랙 신설 — 유닛 "+UNITS.length+" · 레슨 "+
  UNITS.reduce((s,u)=>s+u.l.length,0)+" · 문항 "+total);
