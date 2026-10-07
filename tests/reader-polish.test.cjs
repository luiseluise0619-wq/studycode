/* Regression checks for grammatical copy, protected examples and whole-corpus coverage. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {prose,sources}=require('../tools/content/reader-copy.cjs');
const {question}=require('../tools/content/reader-polish.cjs');
const Guide=require('../data/reader-guide.js');
const acorn=require('../vendor/acorn.js');
let passed=0;
function check(name,fn){fn();passed++;console.log('PASS '+name);}
const cases=[
 ['값예요. 모델예요.','값이에요. 모델이에요.'],
 ['기다렸어요 다시 보내요.','기다린 뒤 다시 보내요.'],
 ['일대다 조인과 다대다 관계를 비교한다.','일대다 조인과 다대다 관계를 비교해요.'],
 ['prototype은 원형을 가리키는 링크다.','prototype은 원형을 가리키는 링크예요.'],
 ['데이터는 디스크다.','데이터는 디스크예요.'],
 ['chmod 777 /app 을 추가하라.','chmod 777 /app 을 추가하세요.'],
 ['<b>작아요</b>고 나와요.','<b>작다</b>고 나와요.'],
 ['문제는 <b>어디에 저장되나요</b>이고, 결과는 같다.','문제는 <b>어디에 저장되는지</b>이고, 결과는 같아요.'],
 ['좋아요 수를 센다. 싫어요가 세 개다.','좋아요 수를 세요. 싫어요가 세 개예요.'],
 ['<code>None</code> 다.','<code>None</code>예요.'],
 ['<b>항등식</b>예요.','<b>항등식</b>이에요.'],
 ['문제는 **값**예요.','문제는 **값**이에요.'],
 ['학습 재료는 **데이터**다.','학습 재료는 **데이터**예요.'],
 ['결과도 **같아요**는 약속이에요.','결과도 **같다**는 약속이에요.'],
 ['결과도 같아요는 약속이에요.','결과도 같다는 약속이에요.'],
 ['세 번째 테스트를 보라.','세 번째 테스트를 확인해 보세요.'],
 ['실제로 사용할 때는 실제로는 간격을 늘려요.','실제로 사용할 때는 간격을 늘려요.'],
 ['실제로 사용할 때는 실제로 쓰이는지 확인해요.','실제로 사용할 때는 쓰이는지 확인해요.'],
 ["답은 '<b>최대 개수</b>' 다.","답은 '<b>최대 개수</b>'예요."],
 ["핵심은 '처음 상태로 돌아간다' 다.","핵심은 '처음 상태로 돌아간다'예요."],
 ['결과는 “같은 값” 다.','결과는 “같은 값”이에요.'],
 ["목표는 '변경 계획'예요.","목표는 '변경 계획'이에요."],
 ["목표는 <b>'변경 계획'</b>예요.","목표는 <b>'변경 계획'</b>이에요."],
 ['결과는 “같은 값”이에요.','결과는 “같은 값”이에요.'],
 ["핵심은 '선언'다.","핵심은 '선언'이에요."],
 ['값은 <code>"N일 전"</code>예요.','값은 <code>"N일 전"</code>이에요.'],
 ['구현이 열 줄여요.','구현이 열 줄이에요.'],
 ['<b>어떤 조합에서 틀려요</b> 가 정확한 표현이에요.','<b>어떤 조합에서는 오차가 생긴다는 것</b>이 정확한 표현이에요.'],
 ['상대 지표는 <b>기준선이 무엇일까요</b>가 전부예요.','상대 지표는 <b>무엇을 기준으로 비교하는지</b>가 중요해요.'],
 ['**측정하지 않은 것을 고치지 않아요** 가 첫 규칙이에요.','**무작정 고치기 전에 먼저 측정하는 것**이 첫 규칙이에요.'],
];
check('reviewed endings and connected clauses are grammatical',()=>{for(const [a,b] of cases)assert.equal(prose(a),b,a);});
check('copy changes are stable on a second pass',()=>{for(const [,s] of cases)assert.equal(prose(s),s,s);});
check('short question prompts become complete questions',()=>{assert.equal(question(prose('값은?')),'값은 무엇일까요?');assert.equal(question(prose('출력은?')),'무엇이 출력될까요?');assert.equal(question(prose('다음 중 옳지 않은 것은?')),'다음 중 틀린 설명을 골라 보세요.');});
check('executable text and literal output are preserved inside explanations',()=>{const code='<pre>const answer = "기다렸어요 다시 보내요";\nconsole.log("값은?");</pre>',inline='`"모델예요. 값은?"`',script='<script>const value = "값예요. 출력은?";</script>';assert.equal(prose(code),code);assert.equal(question(prose(inline)),inline);assert.equal(question(prose(script)),script);});
check('database meanings do not appear for text or array normalization',()=>{assert.equal(Guide.compatible('정규화','backend','헤더 이름의 대소문자를 정규화해요.'),false);assert.equal(Guide.compatible('인덱스','backend','배열의 인덱스 0은 첫 칸이에요.'),false);assert.equal(Guide.compatible('정규화','dbt','테이블의 중복을 줄이고 의존성을 정리해요.'),true);});
check('curated definitions have unique keys and are all included',()=>{const raw=fs.readFileSync(path.join(__dirname,'../tools/content/reader-concepts.json'),'utf8');const keys=acorn.parse('('+raw+')',{ecmaVersion:'latest'}).body[0].expression.properties.map(p=>p.key.value);assert.equal(new Set(keys).size,keys.length);assert.equal(keys.length,182);assert.deepEqual(Object.keys(Guide.definitions).sort(),keys.sort());});
const files=sources();
const broken=/일대예요|다대예요|쓰예요 만|가져요는|디스커요|네트워커요|프레임워커요|값예요|모델예요|(?:작아요|달라요|같아요|있어요|일어나요|지겠어요)<\/b>고|기다렸어요 (?:다시|세)|제가 (?:판단하지|지어내지)/;
const found=[];let strings=0;
for(const file of files)for(const item of file.nodes){strings++;const text=item.text.replace(/<(pre|code|script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|`[^`]*`/gi,'');if(broken.test(text))found.push(file.name+': '+text.slice(0,160));}
check('every learner-facing field is scanned for known copy regressions',()=>{assert.ok(strings>110000);assert.ok(files.length>=87);assert.deepEqual(found,[]);});
check('emphasis markup cannot hide copula and connected-clause errors',()=>{const {audit,issues}=require('../tools/content/reader-audit.cjs');assert.equal(issues('필요는 없어요. 좋아요는 버튼 이름이에요.').length,0);assert.equal(issues('<b>값</b>예요. **같아요**는 약속이에요.').length,2);assert.equal(issues('<b>무엇일까요</b>가 전부예요.').length,1);assert.equal(issues("답은 '같은 값' 다.").length,1);assert.equal(issues("'검색 품질'이고, '다 직접 만들고 싶다'는 의욕이에요.").length,0);assert.deepEqual(audit().found,[]);});
check('all Korean theory fields including const, return and module.exports are extracted',()=>{
 const selected=new Map(files.map(f=>[f.name,new Set(f.nodes.map(n=>n.text))]));let fields=0;
 for(const filename of fs.readdirSync(path.join(__dirname,'../data')).filter(n=>/^t-.*\.js$/.test(n))){let units;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../data',filename),'utf8'),{__CR:(k,v)=>units=v});
 function walk(value,p=[]){if(typeof value==='string'){if(p.at(-1)!=='c'&&/[가-힣]/.test(value)){fields++;assert.ok(selected.get('data/'+filename).has(value),filename+' '+p.join('.')+' '+value.slice(0,90));}return;}if(value&&typeof value==='object')for(const[k,v]of Object.entries(value))walk(v,[...p,k]);}
 for(const u of units)for(const l of u.l)walk(l.th);}
 assert.ok(fields>=33600);
});
check('keyword-looking choices, test descriptions and the C intro are extracted',()=>{
 const selected=new Map(files.map(f=>[f.name,new Set(f.nodes.map(n=>n.text))]));let options=0,descriptions=0;
 for(const filename of fs.readdirSync(path.join(__dirname,'../data')).filter(n=>/^t-.*\.js$/.test(n))){let units;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../data',filename),'utf8'),{__CR:(k,v)=>units=v});
  for(const u of units)for(const l of u.l)for(const q of l.q){
   for(const s of q.o||[])if(/[가-힣]/.test(s)){options++;assert.ok(selected.get('data/'+filename).has(s),filename+' choice '+s);}
   for(const test of q.tests||[])if(/[가-힣]/.test(test.d||'')){descriptions++;assert.ok(selected.get('data/'+filename).has(test.d),filename+' test description '+test.d);}
  }
 }
 let intro;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../data/intro.js'),'utf8'),{__CR:(k,v)=>intro=v});
 function walk(value){if(typeof value==='string'&&/[가-힣]/.test(value))assert.ok(selected.get('data/intro.js').has(value),'C intro '+value);else if(value&&typeof value==='object')Object.values(value).forEach(walk);}
 walk(intro.c);assert.equal(options,24065);assert.equal(descriptions,4277);
});
check('static accessibility labels and exported app instructions are extracted',()=>{
 const index=files.find(f=>f.name==='index.html');assert.ok(index.nodes.some(n=>n.n.type==='HTMLAttribute'));
 const exported=files.find(f=>f.name==='data/service-export.js');assert.ok(exported.nodes.some(n=>n.text.includes('저장 파일에서 예약을 다시 불러와요.')));
});
check('reviewed conceptual corrections survive another prose pass',()=>{const edits=require('../tools/content/reader-reviewed-text.json');assert.ok(edits.length>=20);for(const row of edits){const after=prose(row.before);assert.equal(after,prose(row.after),row.reason);assert.equal(prose(after),after,row.reason+' stable');}});
check('clause repairs never edit code literals',()=>{for(const s of ['<code>"같아요는"</code>','`const msg = "있어요는";`','<pre>console.log("값예요. 없어요는");</pre>',"<code>'같은 값' 다.</code>","`'같은 값' 다.`"])assert.equal(prose(s),s);});
let questions=0,lessons=0,units=0;
const ids=new Map();
for(const filename of fs.readdirSync(path.join(__dirname,'../data')).filter(n=>/^t-.*\.js$/.test(n))){let data;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../data',filename),'utf8'),{__CR:(k,v)=>data=v});units+=data.length;for(const u of data)for(const l of u.l){lessons++;for(const q of l.q){questions++;assert.match(q.qid,/^[a-z0-9]+$/);ids.set(filename+':'+q.qid,true);}}}
check('the complete curriculum and question identities remain intact',()=>assert.deepEqual({questions,lessons,units},{questions:13852,lessons:2928,units:936}));
console.log(JSON.stringify({checks:passed,scannedFiles:files.length,scannedFields:strings,questions,distinctQuestionIds:ids.size,lessons,units}));
