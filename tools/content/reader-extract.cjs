/* Export learner copy separately from code, with enough provenance to edit it safely. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {sources}=require('./reader-copy.cjs');
const ROOT=path.resolve(__dirname,'../..');
const plain=text=>text.replace(/<(pre|code|script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|`[^`]*`/gi,' [코드] ').replace(/<[^>]*>|\*\*/g,'').replace(/\s+/g,' ').trim();
function extract(options={}){
  const rows=[],unique=new Map();
  for(const file of sources({titles:true,...options}))for(const node of file.nodes){
    const text=node.text,field=node.a.at(-1)?.key?.name??node.a.at(-1)?.key?.value??'UI';
    const id=crypto.createHash('sha256').update(text).digest('hex').slice(0,16);
    const location={file:file.name,field,start:node.start,end:node.end};
    rows.push({id,...location,text});
    if(!unique.has(id))unique.set(id,{id,text,plain:plain(text),locations:[]});
    unique.get(id).locations.push(location);
  }
  return {rows,unique:[...unique.values()]};
}
if(require.main===module){
  const flag=process.argv.indexOf('--out'),out=path.resolve(flag>=0?process.argv[flag+1]:path.join(ROOT,'../../outputs/CodeRun-copy'));
  const refFlag=process.argv.indexOf('--ref'),ref=refFlag>=0?process.argv[refFlag+1]:null;
  const options=ref?{read:name=>require('node:child_process').execFileSync('git',['show',ref+':'+name],{cwd:ROOT,encoding:'utf8',maxBuffer:8e6})}:{};
  const {rows,unique}=extract(options);fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'all-texts.jsonl'),rows.map(x=>JSON.stringify(x)).join('\n')+'\n');
  fs.writeFileSync(path.join(out,'unique-texts.jsonl'),unique.map(x=>JSON.stringify(x)).join('\n')+'\n');
  fs.writeFileSync(path.join(out,'unique-texts.txt'),unique.map(x=>'['+x.id+'] '+x.locations[0].file+' · '+x.locations[0].field+' · '+x.locations.length+'곳\n'+x.plain).join('\n\n')+'\n');
  console.log(JSON.stringify({fields:rows.length,unique:unique.length,files:new Set(rows.map(x=>x.file)).size,out}));
}
module.exports={extract,plain};
