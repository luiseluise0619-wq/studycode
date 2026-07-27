/* Git 시뮬레이터 엔진 테스트 — 브라우저 없이 실행되는 빠른 검증.
   index.html 에 실제로 들어 있는 코드를 뽑아서 돌린다(별도 사본이 아니라 배포본을 검사). */
const fs=require("fs");
const path=require("path");

const HTML=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
function section(startMark, endMark){
  const a=HTML.indexOf(startMark);
  if(a<0) throw new Error("index.html 에서 찾지 못함: "+startMark);
  const b=HTML.indexOf(endMark, a);
  if(b<0) throw new Error("index.html 에서 찾지 못함: "+endMark);
  return HTML.slice(a,b);
}
const ENGINE  = section("/* ===== Git 시뮬레이터 엔진 (PRD §25) ===== */", "/* ===== Git 시뮬레이터 미션");
const MISSION = section("/* ===== Git 시뮬레이터 미션 (PRD §25) ===== */", "/* ===== Git 시뮬레이터 UI");
const sandbox={};
new Function("ctx", "with(ctx){ "+ENGINE+"\n"+MISSION+"\n"+
  "ctx.api={gitNew,gitRun,gInit,gStatus,gHeadId,gHeadTree,gTree,gResolve,gIsAnc,gLogList,gFiles,GIT_MISSIONS}; }")(sandbox);
const {gitRun,gInit,gStatus,gHeadTree,gHeadId,gResolve,gTree,gLogList,GIT_MISSIONS}=sandbox.api;

let pass=0, fail=0;
function t(name,fn){ try{ fn(); pass++; }catch(e){ fail++; console.log("FAIL  "+name+"\n      "+e.message); } }
function eq(a,b,m){ if(JSON.stringify(a)!==JSON.stringify(b)) throw new Error((m?m+": ":"")+"expected "+JSON.stringify(b)+" got "+JSON.stringify(a)); }
function ok(c,m){ if(!c) throw new Error(m||"expected truthy"); }
function out(r){ return r.out.join("\n"); }
function seq(g,...c){ let r; c.forEach(x=>{ r=gitRun(g,x); }); return r; }

/* ---------- 3단 구조 ---------- */
t("새 파일 → add → commit", ()=>{
  const g=gInit({}); g.wd["a.txt"]="hello";
  ok(/Untracked/.test(out(gitRun(g,"git status"))));
  gitRun(g,"git add a.txt");
  ok(gitRun(g,'git commit -m "first"').ok);
  eq(gHeadTree(g),{"a.txt":"hello"});
  ok(gStatus(g).clean);
});
t("스테이지 없이 커밋 거부", ()=>{
  const g=gInit({commits:[{m:"i",f:{a:"1"}}]});
  ok(!gitRun(g,'git commit -m "x"').ok);
});
t("git add . 는 추가·수정·삭제를 모두 스테이지", ()=>{
  const g=gInit({commits:[{m:"i",f:{a:"1",b:"2"}}]});
  g.wd.a="1x"; g.wd.c="3"; delete g.wd.b;
  gitRun(g,"git add .");
  eq(g.idx,{a:"1x",c:"3"});
});

/* ---------- 브랜치 ---------- */
t("checkout -b 후 커밋은 새 브랜치만 전진", ()=>{
  const g=gInit({commits:[{m:"i",f:{a:"1"}}]});
  const at=g.b.main;
  gitRun(g,"git checkout -b feat");
  g.wd.a="2"; seq(g,"git add a",'git commit -m "x"');
  ok(g.b.main===at && g.b.feat!==at);
});
t("더러운 작업트리에서 전환 거부", ()=>{
  const g=gInit({commits:[{m:"i",f:{a:"1"}}], branches:{feat:{}}});
  g.wd.a="dirty";
  ok(!gitRun(g,"git checkout feat").ok);
});

/* ---------- 병합 ---------- */
t("fast-forward", ()=>{
  const g=gInit({commits:[{m:"i",f:{a:"1"}}], branches:{feat:{commits:[{m:"f",f:{a:"2"}}]}}});
  ok(/Fast-forward/.test(out(gitRun(g,"git merge feat"))));
  eq(g.b.main,g.b.feat);
});
t("서로 다른 파일 → 자동 3-way 병합", ()=>{
  const g=gInit({commits:[{m:"i",f:{a:"1",b:"1"}}], branches:{feat:{commits:[{m:"f",f:{b:"2"}}]}}});
  g.wd.a="9"; seq(g,"git add a",'git commit -m "m"');
  ok(gitRun(g,"git merge feat").ok);
  eq(gHeadTree(g),{a:"9",b:"2"});
  eq(gLogList(g,gHeadId(g))[0].par.length,2);
});
t("같은 파일 충돌 → 실패로 알리고, 해결해야 커밋됨", ()=>{
  const g=gInit({commits:[{m:"i",f:{a:"base"}}], branches:{feat:{commits:[{m:"f",f:{a:"theirs"}}]}}});
  g.wd.a="ours"; seq(g,"git add a",'git commit -m "o"');
  const r=gitRun(g,"git merge feat");
  ok(!r.ok && /CONFLICT/.test(out(r)), "충돌은 실패로 보고돼야 한다");
  ok(/<<<<<<</.test(g.wd.a));
  ok(!gitRun(g,'git commit -m "x"').ok, "미해결 상태 커밋 거부");
  g.wd.a="resolved"; gitRun(g,"git add a");
  ok(gitRun(g,'git commit -m "merged"').ok);
  eq(gHeadTree(g),{a:"resolved"});
});
t("merge --abort 복구", ()=>{
  const g=gInit({commits:[{m:"i",f:{a:"base"}}], branches:{feat:{commits:[{m:"f",f:{a:"t"}}]}}});
  g.wd.a="ours"; seq(g,"git add a",'git commit -m "o"');
  gitRun(g,"git merge feat");
  ok(gitRun(g,"git merge --abort").ok);
  eq(g.wd,{a:"ours"});
});

/* ---------- 리베이스 ---------- */
t("리베이스는 선형 히스토리를 만든다", ()=>{
  const g=gInit({commits:[{m:"i",f:{a:"1"}}], branches:{feat:{commits:[{m:"f1",f:{b:"1"}},{m:"f2",f:{b:"2"}}]}}});
  g.wd.a="2"; seq(g,"git add a",'git commit -m "m1"');
  gitRun(g,"git checkout feat");
  ok(gitRun(g,"git rebase main").ok);
  eq(gLogList(g,gHeadId(g)).map(c=>c.msg),["f2","f1","m1","i"]);
  ok(gLogList(g,gHeadId(g)).every(c=>c.par.length<=1));
});
t("리베이스 충돌 → add → --continue", ()=>{
  const g=gInit({commits:[{m:"i",f:{a:"base"}}], branches:{feat:{commits:[{m:"f1",f:{a:"feat"}}]}}});
  g.wd.a="main"; seq(g,"git add a",'git commit -m "m"');
  gitRun(g,"git checkout feat");
  ok(!gitRun(g,"git rebase main").ok);
  ok(!gitRun(g,"git rebase --continue").ok, "미해결 continue 거부");
  g.wd.a="both"; gitRun(g,"git add a");
  ok(gitRun(g,"git rebase --continue").ok);
  eq(gHeadTree(g),{a:"both"});
});
t("rebase --abort 복구", ()=>{
  const g=gInit({commits:[{m:"i",f:{a:"base"}}], branches:{feat:{commits:[{m:"f",f:{a:"feat"}}]}}});
  g.wd.a="main"; seq(g,"git add a",'git commit -m "m"');
  gitRun(g,"git checkout feat");
  const before=g.b.feat;
  gitRun(g,"git rebase main");
  gitRun(g,"git rebase --abort");
  eq(g.b.feat,before);
});

/* ---------- 되돌리기 ---------- */
t("reset --soft / --mixed / --hard 가 각각 다르다", ()=>{
  const mk=()=>gInit({commits:[{m:"i",f:{a:"1"}},{m:"j",f:{a:"2"}}]});
  const s=mk(); gitRun(s,"git reset --soft HEAD~1"); eq(s.idx,{a:"2"}); eq(s.wd,{a:"2"});
  const m=mk(); gitRun(m,"git reset HEAD~1");        eq(m.idx,{a:"1"}); eq(m.wd,{a:"2"});
  const hd=mk(); gitRun(hd,"git reset --hard HEAD~1"); eq(hd.idx,{a:"1"}); eq(hd.wd,{a:"1"});
});
t("revert 는 히스토리를 남기고 되돌린다", ()=>{
  const g=gInit({commits:[{m:"i",f:{a:"1"}},{m:"bad",f:{a:"broken"}}]});
  ok(gitRun(g,"git revert HEAD").ok);
  eq(gHeadTree(g),{a:"1"});
  eq(gLogList(g,gHeadId(g)).length,3);
});
t("cherry-pick 은 해당 커밋만 가져온다", ()=>{
  const g=gInit({commits:[{m:"i",f:{a:"1"}}],
    branches:{hf:{commits:[{m:"other",f:{z:"z"}},{m:"fix",f:{b:"fixed"}}]}}});
  ok(gitRun(g,"git cherry-pick "+g.b.hf).ok);
  eq(gHeadTree(g),{a:"1",b:"fixed"});
});

/* ---------- stash / 원격 ---------- */
t("stash → 전환 가능 → pop 복구", ()=>{
  const g=gInit({commits:[{m:"i",f:{a:"1"}}], branches:{other:{}}});
  g.wd.a="wip";
  ok(gitRun(g,"git stash").ok);
  ok(gStatus(g).clean);
  seq(g,"git checkout other","git checkout main");
  ok(gitRun(g,"git stash pop").ok);
  eq(g.wd,{a:"wip"});
});
t("원격이 앞서면 push 거절", ()=>{
  const g=gInit({commits:[{m:"i",f:{a:"1"}},{m:"r",f:{a:"r"}}], remote:{main:1}});
  gitRun(g,"git reset --hard HEAD~1");
  g.wd.a="mine"; seq(g,"git add a",'git commit -m "mine"');
  ok(/non-fast-forward/.test(out(gitRun(g,"git push"))));
});
t("pull 은 fetch + merge", ()=>{
  const g=gInit({commits:[{m:"i",f:{a:"1"}},{m:"r",f:{b:"new"}}], remote:{main:1}});
  gitRun(g,"git reset --hard HEAD~1"); g.rb={};
  ok(gitRun(g,"git pull").ok);
  eq(gHeadTree(g),{a:"1",b:"new"});
});

/* ---------- 참조 · 파서 ---------- */
t("HEAD~n · HEAD^ · 짧은 해시", ()=>{
  const g=gInit({commits:[{m:"a",f:{x:"1"}},{m:"b",f:{x:"2"}},{m:"c",f:{x:"3"}}]});
  eq(gTree(g,gResolve(g,"HEAD~2")),{x:"1"});
  eq(gTree(g,gResolve(g,"HEAD^")),{x:"2"});
  eq(gResolve(g,g.b.main.slice(0,4)),g.b.main);
});
t("따옴표 포함 커밋 메시지", ()=>{
  const g=gInit({}); g.wd.a="1"; gitRun(g,"git add a");
  gitRun(g,'git commit -m "fix: 결제 오류 수정"');
  eq(gLogList(g,gHeadId(g))[0].msg,"fix: 결제 오류 수정");
});
t("detached HEAD 제약 · 미지원 명령 안내", ()=>{
  const g=gInit({commits:[{m:"a",f:{x:"1"}},{m:"b",f:{x:"2"}}]});
  gitRun(g,"git checkout HEAD~1");
  ok(!gitRun(g,"git rebase main").ok);
  ok(!gitRun(g,"git push").ok);
  ok(!gitRun(g,"git bisect").ok);
  ok(!gitRun(g,"ls").ok);
});

/* ---------- 미션 ---------- */
const SOL={
 m1:["git add README.md",'git commit -m "docs"'],
 m2:["git checkout -b feature/login",["w","auth.js","login(){}"],"git add auth.js",'git commit -m "feat"'],
 m3:["git checkout main","git merge feature/login"],
 m4:["git add README.md",'git commit -m "docs"',"git merge feature/api"],
 m5:["git add config.js",'git commit -m "up"',"git merge feature/price",
     ["w","config.js","price = 900\ndiscount = true\ncurrency = KRW"],"git add config.js",'git commit -m "merge"'],
 m6:["git rebase main"],
 m7:["git revert HEAD","git push"],
 m8:["git reset --soft HEAD~3",'git commit -m "feat: 검색"'],
 m9:["git cherry-pick @H@"],
 m10:["git stash","git checkout -b hotfix",["w","urgent.js","fixed"],"git add urgent.js",'git commit -m "fix"',
      "git checkout main","git stash pop"],
 m11:["git reset --hard HEAD~1",["w","mine.js","mine"],"git add mine.js",'git commit -m "mine"',
      "git push","git pull","git push"],
 m12:["git tag v1.0.0","git push"]
};
t("미션 12개가 모두 존재하고 필수 필드를 갖춘다", ()=>{
  eq(GIT_MISSIONS.length,12);
  GIT_MISSIONS.forEach(m=>{
    ["id","em","title","brief","teach","hint","goalTxt"].forEach(f=>ok(m[f],m.id+"."+f+" 누락"));
    ok(typeof m.goal==="function", m.id+".goal");
  });
});
GIT_MISSIONS.forEach(m=>{
  t("미션 "+m.id+" — 시작 상태에서는 목표가 거짓", ()=>{
    ok(!m.goal(gInit(m.setup||{})), "시작하자마자 통과되면 미션이 성립하지 않는다");
  });
  t("미션 "+m.id+" — 조회 명령만으로는 통과되지 않음", ()=>{
    const g=gInit(m.setup||{});
    ["git status","git log","git branch","git diff","git tag"].forEach(c=>gitRun(g,c));
    ok(!m.goal(g));
  });
  t("미션 "+m.id+" — 정답 경로로 목표 달성", ()=>{
    const g=gInit(m.setup||{});
    (SOL[m.id]||[]).forEach(s=>{
      if(Array.isArray(s)){ g.wd[s[1]]=s[2]; return; }
      let c=s;
      if(c.indexOf("@H@")>=0){ const f=gLogList(g,g.b.hotfix).find(x=>/보안/.test(x.msg)); c=c.replace("@H@",f?f.id:"?"); }
      gitRun(g,c);
    });
    ok(m.goal(g), "해답을 실행했는데 목표 미달성");
  });
});

/* ---------- 빌드 프로젝트 ----------
   각 Day 가 미션으로 성립하는지를 두 방향으로 확인한다:
   시작 상태로는 통과하지 못하고, 참조 해답으로는 전부 통과해야 한다. */
const vm=require("vm");
/* 빌드 랩 데이터는 셸이 아니라 청크에 있다 (data/build.js) */
const BUILDJS = fs.readFileSync(path.join(__dirname,"..","data","build.js"),"utf8");
/* 채점 엔진은 복사하지 않고 index.html 에서 그대로 꺼내 쓴다 — 복사본은 반드시 원본과 어긋난다 */
const BLENGINE = (()=>{ const a=HTML.indexOf("const BL_HELP ="); const m="\n   +'</scr'+'ipt></body>';\n}"; const b=HTML.indexOf(m,a); return HTML.slice(a,b+m.length); })();
const bsand={};
new Function("ctx","with(ctx){ var __got={}; function __CR(k,v){ ctx.data=v; }\n"+BUILDJS+"\n"+BLENGINE+"\nctx.api={buildDoc}; }")(bsand);
const BUILD_PROJECTS=bsand.data.projects, BUILD_SOL=bsand.data.sol;
const {buildDoc}=bsand.api;

/* buildDoc 이 만든 문서에서 스크립트만 꺼내 vm 에서 돌린다. 브라우저와 같은 코드다. */
function runBuildDay(files, day){
  const doc=buildDoc(files, day.tests, day);
  const src=doc.slice(doc.indexOf(">", doc.indexOf("<script"))+1, doc.lastIndexOf("</script>"));
  let res=null;
  const sand={ JSON, Math, Date, Number, String, Array, Object, Set, Map, Proxy, RegExp, Error, isNaN,
    decodeURIComponent, encodeURIComponent,
    performance:{ now:()=>Number(process.hrtime.bigint()/1000n)/1000 },
    parent:{ postMessage:d=>{ res=d.res; } } };
  sand.window=sand; sand.self=sand;
  vm.createContext(sand);
  vm.runInContext(src, sand, {timeout:60000});
  return res||[];
}

t("빌드 프로젝트가 존재하고 필수 필드를 갖춘다", ()=>{
  ok(BUILD_PROJECTS.length>=2, "프로젝트 2개 이상");
  BUILD_PROJECTS.forEach(p=>{
    ["id","em","title","sub","brief","contract","seed","days"].forEach(f=>ok(p[f],p.id+"."+f+" 누락"));
    ok(p.seed["app.js"]||p.days.some(d=>d.addFiles&&d.addFiles["app.js"]),
      p.id+": 진입점 app.js 를 시드나 어느 Day 의 addFiles 로 줘야 한다");
    ok(Array.isArray(p.days)&&p.days.length>=3, p.id+": Day 3개 이상");
    ok(BUILD_SOL[p.id]&&BUILD_SOL[p.id].length===p.days.length, p.id+": Day 수만큼 참조 해답 필요");
    p.days.forEach(d=>{
      ok(d.title&&Array.isArray(d.req)&&d.req.length&&d.hint, p.id+" Day"+d.n+": 요구사항·힌트 필요");
      ok(Array.isArray(d.tests)&&d.tests.length>=4, p.id+" Day"+d.n+": 수용 기준 4개 이상");
    });
  });
});

BUILD_PROJECTS.forEach(p=>{
  let files=JSON.parse(JSON.stringify(p.seed));
  p.days.forEach((d,i)=>{
    /* 앱의 blApplyDayFiles 와 같은 규칙: 아직 없거나 시드 그대로일 때만 넣는다 */
    if(d.addFiles) Object.keys(d.addFiles).forEach(f=>{
      if(files[f]===undefined || files[f]===p.seed[f]) files[f]=d.addFiles[f];
    });
    const start=runBuildDay(files, d);
    const startOk=start.filter(x=>x.ok).length;
    t("빌드 "+p.id+" Day"+d.n+" — 시작 상태로는 통과하지 못한다", ()=>{
      ok(startOk<d.tests.length, "아무것도 안 해도 "+startOk+"/"+d.tests.length+" 통과 — 미션이 성립하지 않는다");
    });
    const solFiles=Object.assign({}, files, BUILD_SOL[p.id][i]);
    const done=runBuildDay(solFiles, d);
    const doneOk=done.filter(x=>x.ok).length;
    t("빌드 "+p.id+" Day"+d.n+" — 참조 해답으로 전부 통과한다", ()=>{
      if(doneOk!==d.tests.length){
        throw new Error(doneOk+"/"+d.tests.length+" — 실패: "+
          done.filter(x=>!x.ok).map(x=>x.n+"("+x.err+")").join(" | "));
      }
    });
    files=solFiles;      // 다음 Day 는 이 날의 해답 위에서 이어진다
  });
});

console.log((fail?"":"\n")+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
