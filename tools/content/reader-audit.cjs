'use strict';
const {sources}=require('./reader-copy.cjs'),{plain}=require('./reader-extract.cjs');
function issues(text){
  const clean=plain(text),out=[];
  if(/골랐아요/.test(clean))out.push({kind:'inflection',word:'골랐아요'});
  for(const m of clean.matchAll(/([가-힣]+)(이에요|예요)(?=$|[\s.!?…,:;）)\]”’])/g)){
    const jong=(m[1].at(-1).charCodeAt(0)-0xac00)%28;
    if((jong===0&&m[2]==='이에요')||(jong!==0&&m[2]==='예요'))out.push({kind:'copula',word:m[0]});
  }
  for(const m of clean.matchAll(/([가-힣]+)["'”’]\s*(이에요|예요)(?=$|[\s.!?…,:;])/g)){
    const jong=(m[1].at(-1).charCodeAt(0)-0xac00)%28;
    if((jong===0&&m[2]==='이에요')||(jong!==0&&m[2]==='예요'))out.push({kind:'quoted-copula',word:m[0]});
  }
  for(const m of clean.matchAll(/([가-힣]+요)\s*(?:는|가|를|다는|다고|라고|라는|라서|도록|는데|면|지만|거나|며|면서|고)(?=$|[\s.!?,:;])/g)){
    if(!['필요','소요','수요','실수요','주요','중요','강요','좋아요','싫어요'].includes(m[1]))out.push({kind:'clause',word:m[0]});
  }
  if(/실제로 사용할 때는 실제로/.test(clean))out.push({kind:'repetition',word:'실제로 사용할 때는 실제로'});
  for(const m of clean.matchAll(/'[^'\n]+'|"[^"\n]+"|“[^”\n]+”|‘[^’\n]+’/g)){
    if(/^\s*(?:이)?다(?=$|[\s.!?…,:;—])/.test(clean.slice(m.index+m[0].length)))out.push({kind:'quoted-ending',word:'따옴표 뒤의 다'});
  }
  return out;
}
function audit(){const found=[];let fields=0;const files=sources();for(const file of files)for(const n of file.nodes){fields++;for(const issue of issues(n.text))found.push({file:file.name,start:n.start,...issue,text:n.text});}return {files:files.length,fields,found};}
if(require.main===module){const result=audit();console.log(JSON.stringify({...result,found:result.found.slice(0,40)},null,2));if(result.found.length)process.exitCode=1;}
module.exports={issues,audit};
