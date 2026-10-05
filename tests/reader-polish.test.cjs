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
let questions=0,lessons=0,units=0;
const ids=new Map();
for(const filename of fs.readdirSync(path.join(__dirname,'../data')).filter(n=>/^t-.*\.js$/.test(n))){let data;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../data',filename),'utf8'),{__CR:(k,v)=>data=v});units+=data.length;for(const u of data)for(const l of u.l){lessons++;for(const q of l.q){questions++;assert.match(q.qid,/^[a-z0-9]+$/);ids.set(filename+':'+q.qid,true);}}}
check('the complete curriculum and question identities remain intact',()=>assert.deepEqual({questions,lessons,units},{questions:13852,lessons:2928,units:936}));
console.log(JSON.stringify({checks:passed,scannedFiles:files.length,scannedFields:strings,questions,distinctQuestionIds:ids.size,lessons,units}));
