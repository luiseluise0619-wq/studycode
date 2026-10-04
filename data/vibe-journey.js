/* Practice evidence is separate from transfer evidence. No job rank is inferred. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else root.VibeJourney=factory(root.VIBE_SCENARIOS);})(typeof globalThis!=='undefined'?globalThis:this,function(projects){
 'use strict';
 const base=projects.filter(p=>!p.kind), families=base.map(p=>p.id), collection=projects.filter(p=>p.kind==='project');
 const dates=(day,n)=>{const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
 function book(S){if(!S.vibeJourney||typeof S.vibeJourney!=='object'||Array.isArray(S.vibeJourney))S.vibeJourney={};return S.vibeJourney;}
 function evidence(S,family){const b=book(S);if(!b[family]||typeof b[family]!=='object')b[family]={};return b[family];}
 function passed(S,p,i){return !!S.vibeLab?.[p.id]?.missions?.[p.missions[i].id]?.passed;}
 function stats(S,day){return {practice:base.reduce((n,p)=>n+p.missions.filter((_,i)=>passed(S,p,i)).length,0),independent:families.filter(f=>evidence(S,f).independent).length,due:families.filter(f=>{const e=evidence(S,f);return e.independent&&e.due&&e.due<=day;}).length,project:projects.find(p=>p.kind==='capstone').missions.filter((_,i)=>passed(S,projects.find(p=>p.kind==='capstone'),i)).length,collectionDone:collection.filter(p=>p.missions.every((_,i)=>passed(S,p,i))).length,collectionTotal:collection.length,collectionSteps:collection.reduce((n,p)=>n+p.missions.filter((_,i)=>passed(S,p,i)).length,0),collectionStepTotal:collection.reduce((n,p)=>n+p.missions.length,0),independentProjects:collection.filter(p=>{const r=S.vibeLab?.[p.id]?.missions?.[p.missions.at(-1).id];return r?.passed&&!r.helpUsed;}).length};}
 function transfer(S,family){const e=evidence(S,family),variant=((e.round||0)%3);return projects.find(p=>p.id===family+'-transfer-'+variant);}
 function recommend(S,day,level){
  const last=S.vibeLast,p=projects.find(p=>p.id===last?.id),r=p&&S.vibeLab?.[p.id]?.missions?.[p.missions[last.index]?.id];
  if(p&&p.missions[last.index]&&!r?.passed&&(S.vibeLab?.[p.id]?.source!==p.source||r?.attempts||r?.helpUsed||r?.note||Number.isInteger(r?.answer)))return {project:p,index:last.index,resume:true};
  const due=families.find(f=>{const e=evidence(S,f);return e.independent&&e.due<=day;});if(due)return {project:transfer(S,due),index:0,review:true};
  const ordered=base.slice().sort((a,b)=>level>=3?(b.level>=3)-(a.level>=3):a.level-b.level);
  for(const p of ordered){const i=p.missions.findIndex((_,i)=>!passed(S,p,i));if(i>=0)return {project:p,index:i};if(!evidence(S,p.id).independent)return {project:transfer(S,p.id),index:0,fresh:true};}
  const cap=projects.find(p=>p.kind==='capstone'),i=cap.missions.findIndex((_,i)=>!passed(S,cap,i));if(i>=0)return {project:cap,index:i};
  for(const p of collection){const index=p.missions.findIndex((_,i)=>!passed(S,p,i));if(index>=0)return {project:p,index};}
  const lastProject=collection.at(-1)||cap;return {project:lastProject,index:lastProject.missions.length-1,complete:true};
 }
 function complete(S,p,r,day){
  if(p.kind!=='transfer'||r.journeyCommitted)return;
  const e=evidence(S,p.family);r.previousEvidence={...e};e.round=(e.round||0)+1;r.committedRound=e.round;e.last=day;e.attempts=(e.attempts||0)+1;e.lastAssisted=!!r.helpUsed;
  if(!r.helpUsed){e.independent=true;e.successes=(e.successes||0)+1;e.interval=[1,3,7,14][Math.min(3,e.successes-1)];e.due=dates(day,e.interval);}
  else if(e.independent)e.due=dates(day,1);
  r.journeyCommitted=true;
 }
 function invalidate(S,p,r){if(p.kind!=='transfer'){r.passed=false;return;}if(!r.journeyCommitted||evidence(S,p.family).round!==r.committedRound)return;book(S)[p.family]=r.previousEvidence||{};r.journeyCommitted=false;r.passed=false;delete r.previousEvidence;}
 function resetAttempt(S,p){if(!S.vibeLab)S.vibeLab={};S.vibeLab[p.id]={source:p.source,currentMission:0,missions:{},attemptRound:evidence(S,p.family).round||0};}
 function begin(S,p){const old=S.vibeLab?.[p.id],round=evidence(S,p.family).round||0;if(old?.attemptRound===round)return;if(old&&old.attemptRound===undefined&&!old.missions?.transfer?.passed){old.attemptRound=round;return;}resetAttempt(S,p);}
 return {base,families,collection,stats,recommend,transfer,complete,invalidate,resetAttempt,begin,evidence,dates};
});
