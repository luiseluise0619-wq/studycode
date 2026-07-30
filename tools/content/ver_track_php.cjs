/* PHP 트랙 문항 검증.
   ① 구조: 보기 4개·정답 인덱스·해설 길이·중복 보기·이론 형식
   ② 사실: _p 가 붙은 문항은 실제 php 로 표현식을 돌려 var_export 결과를 비교한다.
      "PHP 가 이렇게 동작한다" 는 주장을 손으로 쓰지 않고 기계가 확인하게 한다. */
const {execFileSync}=require("child_process");
const fs=require("fs");
const os=require("os");
const path=require("path");

const UNITS=require(process.argv[2]||"./track_php1.cjs");

function php(expr, pre){
  const f=path.join(os.tmpdir(), "cr_probe_"+process.pid+".php");
  fs.writeFileSync(f, "<?php\n"+(pre||"")+"\nvar_export("+expr+");\n");
  try{ return execFileSync("php",["-d","display_errors=1",f],{encoding:"utf8",timeout:10000}).trim(); }
  catch(e){ return "ERROR: "+String((e.stdout||"")+(e.stderr||"")).trim(); }
  finally{ try{fs.unlinkSync(f);}catch(_){} }
}

let bad=0, nq=0, probes=0;
const seen=new Set();
UNITS.forEach(u=>{
  if(!u.t||!Array.isArray(u.l)) { console.log("✗ 유닛 형식: "+u.t); bad++; return; }
  u.l.forEach(L=>{
    const th=L.th, probsL=[];
    if(!th||!th.sum||!Array.isArray(th.body)||th.body.length!==2||!th.code||!th.code.c||!Array.isArray(th.key)||th.key.length<3)
      probsL.push("이론 형식(sum·body2·code·key3+)");
    if(!Array.isArray(L.q)||L.q.length<5) probsL.push("문항 수가 5 미만");
    if(probsL.length){ bad++; console.log("✗ ["+u.t+" / "+L.t+"] "+probsL.join(" · ")); }

    (L.q||[]).forEach((q,i)=>{
      nq++;
      const tag="["+L.t+" #"+(i+1)+"] "+q.k;
      const p=[];
      const norm=s=>String(s).replace(/\s+/g," ").trim();
      if(seen.has(norm(q.q))) p.push("문항 중복");
      seen.add(norm(q.q));
      if(!q.ex||q.ex.length<80) p.push("해설이 부실하다("+((q.ex||"").length)+"자)");
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
        const got=php(q._p.code, q._p.pre);
        if(got!==q._p.want) p.push("실행 결과 불일치 — php 가 돌려준 값: "+got.replace(/\n/g," ")+" / 문항이 전제한 값: "+String(q._p.want).replace(/\n/g," "));
      }
      if(p.length){ bad++; console.log("✗ "+tag+"\n  "+p.join("\n  ")); }
    });
  });
});
const total=UNITS.reduce((s,u)=>s+u.l.reduce((t,L)=>t+(L.q||[]).length,0),0);
console.log("\n유닛 "+UNITS.length+" · 레슨 "+UNITS.reduce((s,u)=>s+u.l.length,0)+" · 문항 "+total+" · 실행 확인 "+probes+"건 · 문제 "+bad+"건");
process.exit(bad?1:0);
