/* Git 트랙 문항 검증.
   ① 구조: 보기 4개·정답 인덱스·해설 길이·중복 보기·이론 형식
   ② 사실: _p 가 붙은 문항은 임시 저장소에서 실제 git 을 돌려 결과를 비교한다.
      "git 이 이렇게 동작한다" 는 주장을 손으로 쓰지 않고 기계가 확인하게 한다.

   사용: node tools/content/ver_track_git.cjs ./tools/content/track_git1.cjs */
const {execSync}=require("child_process");
const fs=require("fs");
const os=require("os");
const path=require("path");

/* 파일을 여러 개 주면 한 트랙으로 합쳐서 잰다 — 길이 쏠림은 트랙 단위로 봐야
   의미가 있다. 배치 파일 하나는 표본이 84문항뿐이라 숫자가 심하게 흔들린다.
     node tools/content/ver_track_git.cjs ./tools/content/track_git1.cjs ./tools/content/track_git2.cjs */
const FILES=process.argv.slice(2).filter(x=>x[0]!=="-");
const UNITS=(FILES.length?FILES:["./track_git1.cjs"])
  .reduce((a,f)=>a.concat(require(path.resolve(f))),[]);

const NOEMOJI=require("./noemoji.cjs");

function gitProbe(script){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"cr_git_"));
  try{
    execSync("git init -q && git config user.email t@t && git config user.name t "+
             "&& git config commit.gpgsign false",{cwd:dir,stdio:"pipe"});
    const out=execSync(script,{cwd:dir,encoding:"utf8",stdio:"pipe",timeout:20000,
      env:Object.assign({},process.env,{GIT_TERMINAL_PROMPT:"0",GIT_PAGER:"cat"})});
    const lines=out.split("\n").filter(x=>x.trim());
    return lines.length?lines[lines.length-1].trim():"";
  }catch(e){
    return "ERROR: "+String((e.stdout||"")+(e.stderr||"")).trim().split("\n").slice(-1)[0];
  }finally{ fs.rmSync(dir,{recursive:true,force:true}); }
}

let bad=0, nq=0, probes=0;
const seen=new Set(), keys=new Set();
UNITS.forEach(u=>{
  if(!u.t||!Array.isArray(u.l)){ console.log("✗ 유닛 형식: "+u.t); bad++; return; }
  u.l.forEach(L=>{
    const th=L.th, probsL=[];
    if(!th||!th.sum||!Array.isArray(th.body)||th.body.length!==2||!th.code||!th.code.c||!Array.isArray(th.key)||th.key.length<3)
      probsL.push("이론 형식(sum·body2·code·key3+)");
    if(!Array.isArray(L.q)||L.q.length<5) probsL.push("문항 수가 5 미만");
    if(!L.xp) probsL.push("xp 없음");
    if(th&&NOEMOJI&&NOEMOJI.find){
      const hit=NOEMOJI.find(JSON.stringify(th));
      if(hit&&hit.length) probsL.push("이론에 이모지: "+hit.join(" "));
    }
    if(probsL.length){ bad++; console.log("✗ ["+u.t+" / "+L.t+"] "+probsL.join(" · ")); }

    (L.q||[]).forEach((q,i)=>{
      nq++;
      const tag="["+L.t+" #"+(i+1)+"] "+q.k;
      const p=[];
      const norm=s=>String(s).replace(/\s+/g," ").trim();
      if(seen.has(norm(q.q))) p.push("문항 중복");
      seen.add(norm(q.q));
      if(keys.has(q.k)) p.push("k(제목) 중복");
      keys.add(q.k);
      if(!q.ex||q.ex.length<80) p.push("해설이 부실하다("+((q.ex||"").length)+"자)");
      if(NOEMOJI&&NOEMOJI.find){
        const hit=NOEMOJI.find(JSON.stringify(q));
        if(hit&&hit.length) p.push("이모지: "+hit.join(" "));
      }
      if(q.t==="choice"){
        if(!Array.isArray(q.o)||q.o.length!==4) p.push("보기가 4개가 아니다");
        else{
          const n=q.o.map(norm);
          if(new Set(n).size!==n.length) p.push("보기 중복");
          if(!(q.a>=0&&q.a<q.o.length)) p.push("정답 인덱스 범위 밖");
        }
      } else if(q.t==="input"){
        if(!Array.isArray(q.a)||!q.a.length) p.push("정답 배열이 없다");
      } else p.push("알 수 없는 유형: "+q.t);

      if(q._p){
        probes++;
        const got=gitProbe(q._p.sh);
        if(got!==q._p.want) p.push("실행 결과 불일치 — git 이 돌려준 값: "+got+" / 문항이 전제한 값: "+q._p.want);
      }
      if(p.length){ bad++; console.log("✗ "+tag+"\n  "+p.join("\n  ")); }
    });
  });
});

/* 정답 자리 쏠림 — 네 자리가 고르게 쓰였는지 */
const pos=[0,0,0,0];
UNITS.forEach(u=>u.l.forEach(L=>(L.q||[]).forEach(q=>{ if(q.t==="choice") pos[q.a]++; })));
const tot=pos.reduce((s,x)=>s+x,0);
const worst=Math.max.apply(null,pos)/(tot||1);
if(worst>0.40){ bad++; console.log("✗ 정답 자리 쏠림: "+pos.join("/")+" (최고 "+(worst*100).toFixed(0)+"%)"); }

/* 보기 길이로 찍기 — 손으로 쓰면 정답이 가장 길어진다.
   app.test.cjs 가 저장소 전체로 재고 눈금을 지키므로, 배치 단계에서 미리 잡는다.
   길이 내림차순으로 묶고(0자·5자 허용) 정답이 든 묶음의 등수를 센다. */
const dec=s=>String(s).replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"')
  .replace(/&#39;/g,"'").replace(/&nbsp;/g," ").replace(/&amp;/g,"&");
const width=o=>dec(String(o).replace(/<[^>]*>/g,"").trim()).length;
const rk=[[0,0,0,0],[0,0,0,0]]; let nc=0;
UNITS.forEach(u=>u.l.forEach(L=>(L.q||[]).forEach(q=>{
  if(q.t!=="choice"||!Array.isArray(q.o)||q.o.length!==4) return;
  nc++;
  const len=q.o.map(width);
  [0,5].forEach((tol,ti)=>{
    const order=[0,1,2,3].sort((x,y)=>len[y]-len[x]);
    const g=[[order[0]]];
    for(let i=1;i<4;i++){
      const p=g[g.length-1];
      if(len[p[p.length-1]]-len[order[i]]<=tol) p.push(order[i]); else g.push([order[i]]);
    }
    g.forEach((grp,gi)=>{ if(grp.indexOf(q.a)>=0) rk[ti][gi]+=1/grp.length; });
  });
})));
const mx0=nc?Math.max.apply(null,rk[0])/nc:0;
const mx5=nc?Math.max.apply(null,rk[1])/nc:0;
/* 이상은 25%(네 자리에 고르게)다. 40% 를 넘으면 한 등수에 몰렸다는 뜻이라 막는다.
   최종 기준은 app.test.cjs 의 저장소 전체 눈금이고, 이 검사는 그 눈금을 깨기 전에
   배치 단계에서 먼저 알려 주는 장치다. 배치 하나는 표본이 작아 흔들리므로 40% 로 둔다. */
if(mx0>0.40||mx5>0.40){
  bad++;
  console.log("✗ 보기 길이로 찍을 수 있다 — 기계 "+(mx0*100).toFixed(1)+"% · 사람 "+(mx5*100).toFixed(1)+
    "% (상한 40%, 이상적으로는 25%)\n  오답을 정답만큼 구체적으로 써서 길이를 흩어 주세요.");
}

const total=UNITS.reduce((s,u)=>s+u.l.reduce((t,L)=>t+(L.q||[]).length,0),0);
console.log("\n유닛 "+UNITS.length+" · 레슨 "+UNITS.reduce((s,u)=>s+u.l.length,0)+
  " · 문항 "+total+" · 정답 자리 "+pos.join("/")+
  " · 길이 찍기 "+(mx0*100).toFixed(1)+"/"+(mx5*100).toFixed(1)+"%"+
  " · 실행 확인 "+probes+"건 · 문제 "+bad+"건");
process.exit(bad?1:0);
