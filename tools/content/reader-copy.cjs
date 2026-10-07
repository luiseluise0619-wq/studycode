/* Review learner-facing Korean copy without editing executable examples or answers.
   node tools/content/reader-copy.cjs --inventory
   node tools/content/reader-copy.cjs --write
   Uses the parser already bundled with the app. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const acorn=require('../../vendor/acorn.js');
const polish=require('./reader-polish.cjs');
const reviewed=require('./reader-reviewed-text.json');
const reviewedText=new Map(reviewed.map(row=>[row.before,row.after]));
const ROOT=path.resolve(__dirname,'../..');
function save(file,content){
  const temporary=file+'.reader-'+process.pid+'.tmp';
  fs.writeFileSync(temporary,content,{flag:'wx'});
  try{for(let attempt=0;;attempt++)try{fs.renameSync(temporary,file);break;}catch(error){if(attempt===5)throw error;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);}}
  finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
}
const PROTECTED=new Set(['a','answer','code','src','source','html','css','js','c','in','out','expect','expected','seed','sol','solution','solutions','reference','ref','files','addFiles','fixture','validate','setup','test','check','assert','run','stepsCode','starter','sample','data','rows','logs','log','cmd','commands','accept','replace','from','to','schema']);
const KEEP_NAMES=new Set(['id','k','lang','type','t0','ord','color','em','icon','selector','storageKey']);
const PROSE_KEYS=new Set(['q','ex','t','title','o','d','acc','sum','hint','brief','goal','desc','description','text','txt','why','teach','cap']);
const SKIP_FUNCTION=/^(?:gitRun|gRebaseStep|buildDoc|simDoc|pyDoc|sqlDoc|htmlDoc|reactDoc)$/;
const SKIP_FILES=/^(?:acorn|sucrase|sql-lib|sql-wasm|react-src|rt-shared)\.js$/;
const FIXES=[
  ['열었어요 돌아오는','열었다가 돌아오는'],
  ['시도하지 않았어요 라고','시도하지 않았다고'],['시도하지 않았다 라고','시도하지 않았다고'],
  ['되었어요 안 되었어요 하는','어떤 때는 되고 어떤 때는 안 되는'],['되었다 안 되었다 하는','어떤 때는 되고 어떤 때는 안 되는'],
  ['옮겨요 만 돈','이체를 마치지 못한 돈'],
  ['<b>합이 맞는가</b>를 봐요','<b>합계가 맞는지</b> 확인해요'],
  ['갖아요','가져요'],['갖는다','가져요'],['갖습니다','가져요'],['갖다','가져요'],
  ['걷어요','걸어요'],['깨닫아요','깨달아요'],['싣어요','실어요'],['낫아요','나아요'],
  ['남길지다','남길지예요'],['걸지다','걸지예요'],['빠른지다','빠른지예요'],
  ['있으나 마나다','있으나 마나예요'],['왜 그 답인가:','왜 이 답일까요?'],
  ['디스트랙터:','헷갈리기 쉬운 보기:'],
  ['소수점 아래 몇 자리까지 남길지예요','소수점 아래에 남길 자릿수를 뜻해요'],
  ['인덱스를 어느 열에 걸지예요','인덱스를 만들 열을 고르는 문제예요'],
  ['재귀 대신 반복문으로 쓰면 더 빠른지예요','반복문으로 바꿨을 때 더 빨라지는지예요'],
  ['하나는 사용자에게 보여 줄지, 다른 하나는 우리가 남길지예요','하나는 사용자에게 오류를 보여 줄지, 다른 하나는 오류 기록을 남길지 정해요'],
  ['정의해보세요','정해 보세요'],['적어보세요','적어 보세요'],['정의해 보세요','정해 보세요'],
  ['가장 올바른','가장 알맞은'],['올바른 설명','맞는 설명'],['올바르게','맞게'],
  ['가장 적절한','가장 알맞은'],['적절하지 않은','알맞지 않은'],
  ['다음 중 옳은 것은?','다음 중 맞는 설명을 골라 보세요.'],
  ['다음 중 옳지 않은 것은?','다음 중 틀린 설명을 골라 보세요.'],
  ['옳은 설명은?','어떤 설명이 맞을까요?'],['옳지 않은 설명은?','어떤 설명이 틀렸을까요?'],
  ['다음 코드의 출력 결과는?','다음 코드를 실행하면 무엇이 출력될까요?'],
  ['다음 코드의 출력은?','다음 코드를 실행하면 무엇이 출력될까요?'],
  ['출력 결과는?','무엇이 출력될까요?'],['출력값은?','어떤 값이 출력될까요?'],
  ['근본 원인은 무엇입니까?','여러 단서를 함께 보면, 무엇이 원인일까요?'],
  ['가장 먼저 무엇을 하겠습니까?','무엇부터 확인하면 좋을까요?'],
  ['예외가 발생한다','예외가 생긴다'],
  ['핵심 결함','문제를 일으키는 부분'],['관측 데이터','로그와 측정값'],
  ['원인을 특정','원인을 좁혀 확인'],
  ['개념: ','왜 그럴까요? '],['실무: ','실제로 사용할 때는 '],
  ['— 실무와 같습니다.','실제 작업에서도 앞서 쓴 코드에 새 기능을 덧붙여요.'],
  ['하루치를 대충 짜면 다음 날 그 위에서 고생하게 됩니다','앞 단계에서 빠뜨린 기능은 다음 단계에도 영향을 줘요'],
  ['선택지를 고르는 것이 아니라 파일을 씁니다.','직접 파일에 코드를 쓰고 결과를 확인해요.'],
];
const ENDINGS=[
  ['하시겠습니까','할까요'],['하겠습니까','할까요'],['주시겠습니까','줄까요'],
  ['고르시겠습니까','고를까요'],['정하시겠습니까','정할까요'],['쓰시겠습니까','쓸까요'],
  ['세시겠습니까','셀까요'],['보시겠습니까','볼까요'],['나누시겠습니까','나눌까요'],
  ['지우시겠습니까','지울까요'],['바꾸시겠습니까','바꿀까요'],['뽑으시겠습니까','뽑을까요'],
  ['막으시겠습니까','막을까요'],['넣으시겠습니까','넣을까요'],['고치시겠습니까','고칠까요'],
  ['다루시겠습니까','다룰까요'],['손대시겠습니까','손댈까요'],['견주시겠습니까','비교할까요'],
  ['옮기겠습니까','옮길까요'],['남기겠습니까','남길까요'],['다루겠습니까','다룰까요'],
  ['풀어가겠습니까','풀어 갈까요'],['원인이겠습니까','원인일까요'],
  ['입니까','인가요'],['무엇인가','무엇일까요'],['어떤가','어떤가요'],
  ['어떻게 되는가','어떻게 될까요'],['어떻게 동작하는가','어떻게 동작할까요'],
  ['맞는가','맞을까요'],['가능한가','가능할까요'],['필요한가','필요할까요'],
];
const SUFFIXES=[
  ['이렇습니다','이래요'],['그렇습니다','그래요'],['이렇다','이래요'],['그렇다','그래요'],
  ['마찬가지다','마찬가지예요'],['올바르다','맞아요'],['옳다','맞아요'],['옳습니다','맞아요'],
  ['나쁘다','나빠요'],['나쁩니다','나빠요'],['스럽다','스러워요'],['롭다','로워요'],
  ['무섭다','무서워요'],['싶다','싶어요'],['잦다','잦아요'],['늦다','늦어요'],['드물다','드물어요'],
  ['괜찮다','괜찮아요'],['틀리다','틀려요'],['가른다','갈라요'],['거른다','걸러요'],
  ['안다','알아요'],['압니다','알아요'],['판다','팔아요'],['산다','살아요'],['연다','열어요'],
  ['민다','밀어요'],['빈다','빌어요'],['푼다','풀어요'],
  ['단다','달아요'],['만다','말아요'],['듣는다','들어요'],['듣습니다','들어요'],
  ['잇는다','이어요'],['짓는다','지어요'],['긋는다','그어요'],['붓는다','부어요'],
  ['끈다','꺼요'],['쪼갠다','쪼개요'],['흩는다','흩어요'],['싸우다','싸워요'],
  ['쓰다','써요'],['살다','살아요'],['고치다','고쳐요'],['합치다','합쳐요'],
  ['기다리다','기다려요'],['뿌리다','뿌려요'],['나빠지다','나빠져요'],['세다','세요'],
  ['것입니다','거예요'],['것이다','거예요'],['했습니다','했어요'],['됐습니다','됐어요'],
  ['었습니다','었어요'],['았습니다','았어요'],
  ['아닙니다','아니에요'],['아니다','아니에요'],['합니다','해요'],['한다','해요'],
  ['됩니다','돼요'],['된다','돼요'],['있습니다','있어요'],['있다','있어요'],
  ['없습니다','없어요'],['없다','없어요'],['않습니다','않아요'],['않는다','않아요'],['않다','않아요'],
  ['만듭니다','만들어요'],['만든다','만들어요'],['만들다','만들어요'],
  ['되돌립니다','되돌려요'],['돌립니다','돌려요'],['돌린다','돌려요'],
  ['다릅니다','달라요'],['다르다','달라요'],['빠릅니다','빨라요'],['빠르다','빨라요'],
  ['느립니다','느려요'],['느리다','느려요'],['모릅니다','몰라요'],['모른다','몰라요'],
  ['고릅니다','골라요'],['고른다','골라요'],['부릅니다','불러요'],['부른다','불러요'],
  ['오릅니다','올라요'],['오른다','올라요'],['따릅니다','따라요'],['따른다','따라요'],
  ['흐릅니다','흘러요'],['흐른다','흘러요'],['자릅니다','잘라요'],['자른다','잘라요'],
  ['씁니다','써요'],['쓴다','써요'],['썼다','썼어요'],['쉽습니다','쉬워요'],['쉽다','쉬워요'],
  ['어렵습니다','어려워요'],['어렵다','어려워요'],['가깝습니다','가까워요'],['가깝다','가까워요'],
  ['가볍습니다','가벼워요'],['가볍다','가벼워요'],['무겁습니다','무거워요'],['무겁다','무거워요'],
  ['새롭다','새로워요'],['부드럽다','부드러워요'],['까다롭다','까다로워요'],
  ['크다','커요'],['큽니다','커요'],['작다','작아요'],['작습니다','작아요'],
  ['좋다','좋아요'],['좋습니다','좋아요'],['같다','같아요'],['같습니다','같아요'],
  ['맞는다','맞아요'],['맞다','맞아요'],['맞습니다','맞아요'],['낫다','나아요'],['낫습니다','나아요'],
  ['많다','많아요'],['많습니다','많아요'],['적다','적어요'],['적습니다','적어요'],
  ['않았다','않았어요'],['안전하다','안전해요'],['하다','해요'],
  ['바뀐다','바뀌어요'],['바꾼다','바꿔요'],['나눈다','나눠요'],['다룬다','다뤄요'],
  ['배운다','배워요'],['채운다','채워요'],['비운다','비워요'],['갖춘다','갖춰요'],
  ['맞춘다','맞춰요'],['낮춘다','낮춰요'],['멈춘다','멈춰요'],['숨긴다','숨겨요'],
  ['줄인다','줄여요'],['늘린다','늘려요'],['올린다','올려요'],['내린다','내려요'],
  ['읽는다','읽어요'],['읽다','읽어요'],['읽습니다','읽어요'],['읽힌다','읽혀요'],
  ['받는다','받아요'],['받다','받아요'],['받습니다','받아요'],['찾는다','찾아요'],
  ['찾다','찾아요'],['찾습니다','찾아요'],['잡는다','잡아요'],['잡힌다','잡혀요'],
  ['막는다','막아요'],['막다','막아요'],['막힙니다','막혀요'],['막힌다','막혀요'],
  ['담는다','담아요'],['남는다','남아요'],['남긴다','남겨요'],['남다','남아요'],
  ['온다','와요'],['옵니다','와요'],['준다','줘요'],['줍니다','줘요'],['둔다','둬요'],['둡니다','둬요'],
  ['본다','봐요'],['봅니다','봐요'],['간다','가요'],['갑니다','가요'],['난다','나요'],['납니다','나요'],
  ['낸다','내요'],['냅니다','내요'],['센다','세요'],['셉니다','세요'],
  ['보인다','보여요'],['보입니다','보여요'],['생긴다','생겨요'],['생깁니다','생겨요'],
  ['끝난다','끝나요'],['끝납니다','끝나요'],['지킨다','지켜요'],['지킵니다','지켜요'],
  ['돈다','돌아요'],['돕니다','돌아요'],['들어간다','들어가요'],['든다','들어요'],
  ['들다','들어요'],['듭니다','들어요'],['건다','걸어요'],['겁니다','걸어요'],
  ['걷는다','걸어요'],['묻는다','물어요'],['묻습니다','물어요'],['얻는다','얻어요'],['잃는다','잃어요'],
  ['먹는다','먹어요'],['넘는다','넘어요'],['붙는다','붙어요'],['죽는다','죽어요'],['겹친다','겹쳐요'],
  ['놓친다','놓쳐요'],['보낸다','보내요'],['던진다','던져요'],['지운다','지워요'],
  ['없앤다','없애요'],['끊는다','끊어요'],['끊긴다','끊겨요'],['끊습니다','끊어요'],
  ['버린다','버려요'],['걸린다','걸려요'],['날린다','날려요'],['헷갈린다','헷갈려요'],
  ['옮긴다','옮겨요'],['담긴다','담겨요'],['이긴다','이겨요'],['가린다','가려요'],
  ['틀린다','틀려요'],['적는다','적어요'],['적습니다','적어요'],['그린다','그려요'],
  ['붙인다','붙여요'],['쌓인다','쌓여요'],['쓰인다','쓰여요'],['쓰입니다','쓰여요'],
  ['달린다','달려요'],['깨진다','깨져요'],['터진다','터져요'],['빠진다','빠져요'],
  ['어진다','어져요'],['아진다','아져요'],['려진다','려져요'],['워진다','워져요'],
  ['쳐진다','쳐져요'],['켜진다','켜져요'],['여진다','여져요'],['해진다','해져요'],
  ['진다','져요'],['깁니다','겨요'],['립니다','려요'],['칩니다','쳐요'],['집니다','져요'],
  ['운다','워요'],['춘다','춰요'],['넣는다','넣어요'],['뺀다','빼요'],['빼다','빼요'],
  ['섞는다','섞어요'],['섞입니다','섞여요'],['재는다','재요'],['견준다','견줘요'],
  ['좁다','좁아요'],['넓다','넓어요'],['길다','길어요'],['길습니다','길어요'],
  ['짧다','짧아요'],['짧습니다','짧아요'],['높다','높아요'],['낮다','낮아요'],
  ['비싸다','비싸요'],['싸다','싸요'],['얕다','얕아요'],['깊다','깊어요'],
  ['정답이다','정답이에요'],['틀렸다','틀렸어요'],['맞았다','맞았어요'],
  ['했다','했어요'],['됐다','됐어요'],['었다','었어요'],['았다','았어요'],
  ['하나다','하나예요'],['먼저다','먼저예요'],['전부다','전부예요'],['그대로다','그대로예요'],
  ['위해서다','위해서예요'],['필수다','필수예요'],['오류다','오류예요'],['버그다','버그예요'],
  ['함수다','함수예요'],['문제다','문제예요'],['연습문제다','연습문제예요'],['결과다','결과예요'],
  ['상태다','상태예요'],['이유다','이유예요'],['사양이다','규칙이에요'],['유일하다','하나뿐이에요'],
  ['자리다','자리예요'],['차이다','차이예요'],['목표다','목표예요'],['신호다','신호예요'],
  ['경우다','경우예요'],['개다','개예요'],['순서다','순서예요'],['단계다','단계예요'],
  ['형태다','형태예요'],['장치다','장치예요'],['구조다','구조예요'],['규모다','규모예요'],
  ['번째다','번째예요'],['때다','때예요'],['표다','표예요'],['목록이다','목록이에요'],
].sort((a,b)=>b[0].length-a[0].length);
const NON_ENDINGS=new Set(['보다','마다','때마다','요청마다','호출마다','반복마다','행마다','단계마다','문장보다','진도보다','것보다','그보다','데이터보다']);
// These describe one action followed by another, rather than a sentence ending.
const SERIAL=[
 ['갈라졌다','합쳐'],['열었다','닫'],['열었다','돌아'],['지웠다','다시'],['떨어졌다','다시'],
 ['죽었다','살'],['부풀었다','줄'],['만들어졌다','사라'],['붙었다','떨어'],['끊겼다','붙'],
 ['켜졌다','꺼'],['뽑았다','꽂'],['비웠다','다시'],['늘었다','줄'],['넣었다','빼'],
 ['잡았다','놓'],['죽였다','띄'],['죽였다','살'],['살았다','죽'],['고쳐졌다','다시'],
 ['접었다','펴'],['모았다','내보'],['붙들었다','보내'],['넣었다','뺐'],['만들었다','대부분'],
 ['모았다','한'],['보였다','사라'],['비었다','돌아'],['남았다','사라'],['띄웠다','내'],['닫았다','열']
];
const WHOLE_WORD={'는다':'늘어요','늡니다':'늘어요','운다':'울어요','것들인다':'것들이에요','있어서다':'있어서예요','않아서다':'않아서예요','없어서다':'없어서예요','해서다':'해서예요','사라져서다':'사라져서예요','어긋나서다':'어긋나서예요','머문다':'머물어요','봅시다':'함께 볼게요',
 '가파르다':'가팔라요','아깝다':'아까워요','버겁다':'버거워요','멀다':'멀어요','익다':'익어요','얇다':'얇아요','시끄럽다':'시끄러워요','밝다':'밝아요','뜨겁다':'뜨거워요','더럽다':'더러워요','바쁘다':'바빠요','아프다':'아파요','낯설다':'낯설어요','값지다':'값져요','매끄럽다':'매끄러워요','게으르다':'게을러요','파이썬답다':'파이썬다워요','모자라다':'모자라요',
 '고르다':'골라요','자르다':'잘라요','이르다':'일러요','부르다':'불러요','펼치다':'펼쳐요','보내다':'보내요','그리다':'그려요','내려가다':'내려가요','채우다':'채워요','지나치다':'지나쳐요','되다':'돼요','늘리다':'늘려요','쌓다':'쌓아요','배우다':'배워요','내리다':'내려요','멈추다':'멈춰요','넣다':'넣어요','옮기다':'옮겨요','차오르다':'차올라요','가다':'가요','나누다':'나눠요','나아지다':'나아져요','주다':'줘요','풀다':'풀어요','갖다':'가져요','다루다':'다뤄요','느려지다':'느려져요','올리다':'올려요','따라가다':'따라가요','짜다':'짜요','넘어가다':'넘어가요','비우다':'비워요','내보내다':'내보내요','올라가다':'올라가요','돌다':'돌아요','치다':'쳐요','줄다':'줄어요','건드리다':'건드려요','머물다':'머물어요','늘다':'늘어요','두다':'둬요','바꾸다':'바꿔요','오가다':'오가요','가리키다':'가리켜요','가져오다':'가져와요','돌리다':'돌려요','커지다':'커져요'};
const NOUNS=new Set(('도구 누수 테스트 관례 관용구 실수 단서 이야기 설계 예 가지 반대 수 방어 사고 크기 오해 원리 복사 단위 코드 주제 낭비 객체 증거 뷰 비교 바이트 의미 일부 경로 정의 종류 근거 최적화 실패 손해 전제 용도 처리 트레이드오프 요소 초 뒤 관계 크래시 에러 통로 인터페이스 조치 캐시 예외 표시 무효 주소 숫자 부재 기계 표기 변수 참조 개수 횟수 범위 언어 과다 사례 한계 검사 구조체 메서드 위치 헤더 포인터 경계 값어치 오차 정체 전체 불가 정도 배 벡터 거래 비동기 대가 정리 종료 회로 일대 원소 비트 클래스 마무리 대 회 자체 위 로그 절차 군더더기 뼈대 캡처 오버플로 키워드 가치 배포 메모리 여기 인덱스 키 지시 진짜 리드 기호 글자 속도 하이퍼파라미터 클로저 탈출구 요구 완화 포화 대기 정수 큐 아이디어 윈도우 스탬피드 조회 연산자 대비 컨테이너 부수효과 이터레이터 분포 태그 스위치 불일치 루프 데이터 세트 선택지 미스 덩어리 기본기 관심사 포인트 제멋대로 통과 실체 무작위 프로퍼티 번호 포기 정밀도 출처 자유 케이스 장애 복구 부채 바운드 결제 나머지 스텝모터 타이머 따로 필터 징후 문자 효과 의도 붙여넣기 공유 분모 권고 파라미터 기울기 유틸리티 컬렉터 스레드 자바스크립트 빼기 인자 프로파일러 방지 엣지 라이브러리 커서 쿼리 비제어 배수 서비스 군데 무효화 회피 과제 체계 변화 리스트 반례 공짜 요지 교체 후자 거부 해제 노드 접기 조건 설정 부담 선물 수준 작업 버전 부록 개념 판단 함수명 성질 전략 연습 방법 문제점 목적 원칙 약속 규칙 약점 대책 효과 패턴 방식 신호 정답 답 원인 결과 뜻 대상 입력 출력 집계 힌트 구현 이벤트 상태명 상태값 상태코드 시간 공간 비율 목록 순환 과정 구조 관계도 계약 연산 기억 오답 난이도 차례 유형 규약 특징 기반 출발점 핵심 접근 비용 성공 최댓값 최솟값 표준 함정 맥락 요약 상황').split(' '));
for(const n of ('정반대 쓰기 시나리오 시차 경고 피연산자 인스턴스 생성기 정규화 갈래 문서 브랜치 상자 여부 지뢰 제어 음수 미검사 군집화 탈취 페이지 통지 레코드 딕셔너리 서버 복제 폐기 서브쿼리 자릿수 코레오그래피 대화 합계 무대 통계 복잡도 최소 투자 관리 리뷰 격리 이슈 자동화 방치 재료 우선순위 초기화 가지치기 그리디 단어 레지스터 기계어 멀티스레드 여지 나노초 브레이커 식별자 사용자 모드 무시 한정자 부류 지정자 난제 즉사 본체 즉시 헬퍼 인터프리터 가리기 빈도 층위 일치 설계도 소멸자 재정의 게이트 날짜 시도 순회 아티팩트 곱하기 감쇠 금기 폴더 메시지 예의 리시버 데코레이터 결합도 배치 회귀 디렉터리 스코프 피해 동기 읽기 고르기 대수 아래 분류 수치 준비 평상시 제거 프로세스 태도 부모 표준편차 컴포넌트 사용처 통제 나무 건수 입구 컨트롤러 직무 폭주 위기 과설계 적기 동기화 후퇴 출시 본말전도 재시도 쇄도 꼼수 악화 지렛대 레버리지 프로젝트 논리 보호 의무 괴리 드리프트 아키텍처 노브 프롬프트 열쇠 최대 피보나치 난해 명제 재귀 탐지기 바다 최단거리 포드 제외 줄기 멀티코어 머리글자 카운터 합치기 보드 주기 정확도 데이터베이스 예고 저장소 유래 우회 세부 접수 필수화 멱등키 뮤텍스 히스테리시스 집행자 붕괴 쓰레기 트리 단편화 무료 고리 보험료 계약대로 변주 하나짜리 완수 지도 단순화 렉서 파서 확장기 해석기 반복자 조건부 잔재 질의 매개변수 폴드 토대 조작자 운영체제 짝수 모지바케 순환소수 인증서 확장자 거리 양수 자르기 훑기 빌드 허용치 드라이버 리소스 기제 프랙티스 크로스엔트로피 거꾸로 가능도 렌즈 라이선스 예제 안내 보고 내기 일수 강제 논쟁거리 격언대로 워드 철회 슬라이스 랑데부 패키지 스케줄러 실행람다 클래스패스 빌더 플래그 근처 분리 그리기 전파 엔트로피 핸들러 서술자 활용처 이어붙이기 분기 필드 워커 기술자 더하기 유사도 역사 분해 최대공약수 예시 규제 강도 총오차 점수 순위 재검사 안드로이드 밀리초 메모 리다이렉트 히트 오버헤드 임시 조각내기 파괴 필요 스트라이드 각자 순환대기 희생자 세계 오토로더 한도 미루기 앵커 편의 픽스처 파라미터화 일반해 바이트코드 연결부 순서대로 하위 메타클래스 구현체 프록시 기초 기회 이유에서 렌더 칸짜리 쿠키 솔트 스캐너 난수 아이디 구분자 트리거 폐해 기본키 외래키 동의어 부여 삭제 와일드카드 인과관계 선형관계 산포 확률변수 모수 표준오차 역인과 근사 페널티 극대화 증폭기 클라이언트 모놀리스 대체재 동시 무방비 가짜 배려 네모 세로 텍스트 브라우저 무죄 가운데 너비').split(' '))NOUNS.add(n);
function vowelOf(ch){const n=ch.charCodeAt(0)-0xac00;return n>=0&&n<11172?Math.floor(n/28)%21:-1;}
function conjugate(stem){
  const ch=[...stem].at(-1)||'',n=ch.charCodeAt(0)-0xac00;if(n<0||n>=11172)return stem+'어요';
  const vowel=Math.floor(n/28)%21,jong=n%28;
  if(jong)return stem+([0,8].includes(vowel)?'아요':'어요');
  const base=stem.slice(0,-1),cho=Math.floor(n/588);
  const make=v=>base+String.fromCharCode(0xac00+cho*588+v*28)+'요';
  if(vowel===8)return make(9);if(vowel===13)return make(14);if(vowel===20)return make(6);
  if(vowel===18){const prev=vowelOf([...base].at(-1)||'');return make([0,8].includes(prev)?0:4);}
  if([0,1,4,5,6,9,10,14,15].includes(vowel))return stem+'요';
  return stem+'어요';
}
function copula(prefix){
  const ch=[...prefix].at(-1)||'';const code=ch.charCodeAt(0)-0xac00;
  return prefix+(code>=0&&code<11172&&code%28!==0?'이에요':'예요');
}
function friendlyWord(word){
  if(WHOLE_WORD[word])return WHOLE_WORD[word];
  if(NON_ENDINGS.has(word)||word.endsWith('마다')||word.endsWith('보다')||/려다$/.test(word)||['데다','가져다','내려다','어쩌다','람다','다','과다','다대다','일대다','가나다'].includes(word))return word;
  if(word.endsWith('다')&&['링크','디스크','네트워크','프레임워크','헬프데스크','리스크'].includes(word.slice(0,-1)))return copula(word.slice(0,-1));
  for(const [from,to] of ENDINGS)if(word.endsWith(from))return word.slice(0,-from.length)+to;
  for(const [from,to] of SUFFIXES)if(word.endsWith(from))return word.slice(0,-from.length)+to;
  if(word.endsWith('입니다'))return copula(word.slice(0,-3));
  if(word.endsWith('이다'))return copula(word.slice(0,-2));
  if(word.endsWith('인다')&&NOUNS.has(word.slice(0,-2)))return copula(word.slice(0,-2)); // Repair old malformed copulas.
  if(word.endsWith('다')&&NOUNS.has(word.slice(0,-1)))return copula(word.slice(0,-1));
  if(/(?:부터|까지|대로|마자|느냐|인가|는가|한가|큰가|은가|인지|는지|은지|할지|갈지|서|마다)다$/.test(word))return word.slice(0,-1)+'예요';
  if(word.endsWith('되다'))return word.slice(0,-2)+'돼요';
  if(word.endsWith('습니다'))return conjugate(word.slice(0,-3));
  if(word.endsWith('니다')){const stem=word.slice(0,-2),n=stem.charCodeAt(stem.length-1)-0xac00;if(n>=0&&n<11172&&n%28===17)return conjugate(stem.slice(0,-1)+String.fromCharCode(0xac00+n-17));}
  if(word.endsWith('는다'))return conjugate(word.slice(0,-2));
  if(word.endsWith('다')){
    const stem=word.slice(0,-1),n=stem.charCodeAt(stem.length-1)-0xac00;
    if(n>=0&&n<11172&&n%28===20)return stem+'어요'; // Past tense, not a guess at a noun.
    if(n>=0&&n<11172&&n%28===4)return conjugate(stem.slice(0,-1)+String.fromCharCode(0xac00+n-4));
  }
  return word;
}

function replaceWords(text){
  for(const [before,after] of FIXES)text=text.split(before).join(after);
  for(const [word,next] of SERIAL)for(const form of [word,friendlyWord(word)])text=text.replace(new RegExp(form+'\\s+(?='+next+')','g'),word+'가 ');
  text=text.replace(/죽(?:었다|었어요)\s+(?=판정)/g,'멈췄다고 ');
  text=text.replace(/[가-힣]+(?=\?)/gu,word=>word.endsWith('는가')?word.slice(0,-2)+'나요':word.endsWith('인가')?word+'요':word==='왜그런가'?'왜그럴까요':word);
  text=text.replace(/(\d+(?:\.\d+)?)\s+다(?=$|[.!?…,:;])/g,(_,n)=>n+('013678'.includes(n.at(-1))?'이에요':'예요'));
  return text.replace(/[가-힣]+(?=$|[\s.!?…,:;。（()\]”’*\uE000])/gu,friendlyWord);
}
// Leave examples, inline code, tag attributes and machine output untouched.
function prose(text){
  text=reviewedText.get(text)??text;
  text=polish.before(text);
  text=text.replace(/(<(b|strong|em)\b[^>]*>([^<]+)<\/\2>)(?:이)?다(?=$|[\s.!?…,:;）)\]”’])/gi,(_,markup,tag,word)=>markup+copula(word).slice(word.length));
  text=text.replace(/\)다(?=$|[\s.!?…,:;）)\]”’])/g,')예요');
  const fragments=[];
  const masked=text.replace(/<(?:b|strong|em)\b[^>]*>(?:[^<]|<(?!\/?(?:b|strong|em)\b)[^>]*>)*?(?:다|가)<\/(?:b|strong|em)>\s*(?=는|를|고)|\*\*[^*]+(?:다|가)\*\*\s*(?=는|를|고)|(?:만들다 만|읽다 만|껐다가|갔다가|멈췄다가|올렸다가|몰렸다가|갈라졌다가|늘었다가|죽었다가|붙었다가|끊겼다가|넣었다가|뽑았다가|접었다가|비웠다가|떨어졌다가)|<(pre|code|script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|`[^`]*`|<[^>]*>/gi,m=>{fragments.push(m);return '\uE000'+(fragments.length-1)+'\uE001';});
  const result=polish.after(replaceWords(masked)).replace(/\uE000(\d+)\uE001/g,(_,i)=>fragments[Number(i)]);
  return polish.finish(result,copula);
}
function keyOf(p){return p&&p.type==='Property'&&!p.computed?(p.key.name??p.key.value):null;}
function eligible(n,ancestors,options={}){
  if(ancestors.at(-1)?.type==='Property'&&ancestors.at(-1).key===n)return false;
  const s=n.type==='TemplateElement'?n.value.cooked:n.value;
  if(!/[가-힣]/.test(s||''))return false;
  // Bridge cards use positional arguments: protect executable examples and accepted
  // answers while still extracting descriptions that discuss module.exports.
  const bridgeCall=[...ancestors].reverse().find(a=>a.type==='CallExpression'&&a.callee.type==='Identifier'&&a.callee.name==='item');
  if(bridgeCall){
    const position=bridgeCall.arguments.findIndex(argument=>argument===n||ancestors.includes(argument));
    if([2,4].includes(position))return false;
    if(position===6&&/^(?:return|assert)\b/.test(s)&&!s.includes('—'))return false;
    if([0,1,3,5,6].includes(position))return true;
  }
  for(const a of ancestors){
    if(a.type==='Property'&&PROTECTED.has(keyOf(a))&&!(keyOf(a)==='code'&&a.value.type==='ObjectExpression')&&!(['c','test'].includes(keyOf(a))&&a.value.type==='ObjectExpression'&&a.value.properties.some(p=>keyOf(p)==='what')))return false;
    if(a.type==='FunctionDeclaration'&&SKIP_FUNCTION.test(a.id?.name||''))return false;
    if(a.type==='TaggedTemplateExpression'&&a.tag.type==='MemberExpression'&&a.tag.object.name==='String'&&a.tag.property.name==='raw')return false;
  }
  // Theory headings and bullet points are prose even when they begin with
  // const/return or discuss module.exports. Executable c fields were excluded above.
  if(ancestors.some(a=>a.type==='Property'&&keyOf(a)==='th'))return true;
  // The keyword cards are arrays of labels and explanations, not source snippets.
  if(ancestors.some(a=>a.type==='VariableDeclarator'&&['terms','basics'].includes(a.id?.name)))return true;
  if(/^\s*<!doctype|^\s*<html\b/i.test(s)&&ancestors.some(a=>(a.type==='VariableDeclarator'&&a.id?.name==='UI')||(a.type==='AssignmentExpression'&&a.left.type==='MemberExpression'&&a.left.property.name==='srcdoc')))return true;
  const p=[...ancestors].reverse().find(a=>a.type==='Property');
  if(options.titles&&keyOf(p)==='title')return true;
  if(KEEP_NAMES.has(keyOf(p)))return false;
  if(keyOf(p)==='t'){
    const object=[...ancestors].reverse().find(a=>a.type==='ObjectExpression');
    if(object?.properties.some(x=>['l','q','th'].includes(keyOf(x))||(keyOf(x)==='n'&&typeof x.value?.value==='number')))return !!options.titles; // Stable unit/lesson progress keys, including compact shell entries.
  }
  if(typeof s!=='string'||(!PROSE_KEYS.has(keyOf(p))&&/^(?:\s*(?:const|let|var|function|module\.exports|return\b|throw\b)|\s*(?:<!doctype|<html|<script))/i.test(s)))return false;
  if(!PROSE_KEYS.has(keyOf(p))&&/module\.exports|new Function\(|__src\[|__mods\[|^Q\(|^CLICK\(|^EQ\(/.test(s))return false;
  return true;
}
function walk(n,parents,visit){
  if(!n||typeof n!=='object')return;
  if(n.type==='Literal'&&typeof n.value==='string')visit(n,parents);
  if(n.type==='TemplateElement')visit(n,parents);
  for(const [key,value] of Object.entries(n)){
    if(['start','end','loc','range','raw'].includes(key))continue;
    if(Array.isArray(value)){for(const child of value)if(child?.type)walk(child,[...parents,n],visit);}
    else if(value?.type)walk(value,[...parents,n],visit);
  }
}
function stringNodes(code,offset=0,options={}){
  const result=[];
  walk(acorn.parse(code,{ecmaVersion:'latest',sourceType:'script'}),[],(n,a)=>{if(eligible(n,a,options)){
    // Keep only the metadata needed for editing. Retaining every ancestor kept
    // the complete AST of all 38 tracks alive during a whole-corpus review.
    const property=[...a].reverse().find(x=>x.type==='Property');
    result.push({n:{type:n.type},a:property?[{type:'Property',key:property.key}]:[],start:n.start+offset,end:n.end+offset,text:n.type==='TemplateElement'?n.value.cooked:n.value});
  }});
  return result;
}
function sources(options={}){
  const out=[];
  const read=name=>options.read?options.read(name):fs.readFileSync(path.join(ROOT,name),'utf8');
  const html=read('index.html');
  const indexNodes=[];
  for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi))if(m[1].trim())indexNodes.push(...stringNodes(m[1],m.index+m[0].indexOf('>')+1,options));
  for(const m of html.matchAll(/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<[^>]*>|([^<]+)/gi)){
    if(m[2]&&/[가-힣]/.test(m[2]))indexNodes.push({n:{type:'HTMLText'},a:[],start:m.index,end:m.index+m[0].length,text:m[2]});
    if(!m[1]&&!m[2]&&!m[0].startsWith('<!--'))for(const attr of m[0].matchAll(/\b(?:aria-label|placeholder|title|alt)\s*=\s*(["'])([\s\S]*?)\1/gi)){
      if(!/[가-힣]/.test(attr[2]))continue;
      const start=m.index+attr.index+attr[0].indexOf(attr[1])+1;
      indexNodes.push({n:{type:'HTMLAttribute',quote:attr[1]},a:[],start,end:start+attr[2].length,text:attr[2]});
    }
  }
  out.push({name:'index.html',raw:html,nodes:indexNodes});
  for(const name of fs.readdirSync(path.join(ROOT,'data')).filter(x=>x.endsWith('.js')&&!SKIP_FILES.test(x)).sort()){
    const raw=read('data/'+name);
    out.push({name:'data/'+name,raw,nodes:stringNodes(raw,0,options)});
  }
  for(const name of fs.readdirSync(__dirname).filter(x=>/^proj.*\.cjs$/.test(x)).sort()){
    const raw=read('tools/content/'+name);
    out.push({name:'tools/content/'+name,raw,nodes:stringNodes(raw,0,options)});
  }
  return out;
}
function inventory(){
  const fields={},ends={},examples={};let strings=0;
  for(const file of sources())for(const item of file.nodes){strings++;const p=[...item.a].reverse().find(a=>a.type==='Property'),key=keyOf(p)||'(UI)';fields[key]=(fields[key]||0)+1;
    const clean=item.text.replace(/`[^`]*`|<[^>]*>/g,' ');
    for(const m of clean.matchAll(/[가-힣]+(?:니다|다|십시오|습니까)(?=$|[\s.!?…,:;。）)\]”’])/gu)){
      const word=m[0];ends[word]=(ends[word]||0)+1;(examples[word]??=[]);if(examples[word].length<2)examples[word].push({file:file.name,text:clean.slice(Math.max(0,m.index-45),m.index+word.length+30)});
    }
  }
  return {strings,fields,endings:Object.entries(ends).sort((a,b)=>b[1]-a[1]),examples};
}
function apply(onlyTexts=null){
  const changed=[];let count=0;
  for(const file of sources()){
    const edits=[];
    for(const item of file.nodes){if(onlyTexts&&!onlyTexts.has(item.text))continue;let updated=prose(item.text);const property=[...item.a].reverse().find(n=>n.type==='Property');if(['q','question','sit'].includes(keyOf(property)))updated=polish.question(updated);if(updated===item.text)continue;
      if(item.n.type==='TemplateElement'){
        // Quasi ranges omit delimiters. Preserve interpolation and escape literal syntax.
        edits.push({start:item.start,end:item.end,text:updated.replace(/\\/g,'\\\\').replace(/`/g,'\\`').replace(/\$\{/g,'\\${')});
      }else edits.push({start:item.start,end:item.end,text:item.n.type==='HTMLText'?updated:item.n.type==='HTMLAttribute'?updated.replaceAll(item.n.quote,item.n.quote==='"'?'&quot;':'&#39;'):JSON.stringify(updated)});
    }
    let next=file.raw;for(const e of edits.sort((a,b)=>b.start-a.start))next=next.slice(0,e.start)+e.text+next.slice(e.end);
    if(file.name==='index.html'&&!onlyTexts)next=prose(next);
    if(next===file.raw)continue;
    save(path.join(ROOT,file.name),next);count+=edits.length;changed.push({file:file.name,strings:edits.length});
  }
  return {changed,count};
}
function writeConcepts(){
  const definitions=Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(path.join(__dirname,'reader-concepts.json'),'utf8'))).map(([key,text])=>[key,prose(text)]));
  const filename=path.join(ROOT,'data/glossary.js'),raw=fs.readFileSync(filename,'utf8');
  const ast=acorn.parse(raw,{ecmaVersion:'latest'});
  const call=ast.body.find(n=>n.type==='ExpressionStatement'&&n.expression.callee?.name==='__CR').expression;
  const obj=call.arguments[1];
  // Keep existing keys for tooltips and add the newly explained service terms.
  const original={};for(const p of obj.properties)original[p.key.value??p.key.name]=p.value.value;
  Object.assign(original,definitions);
  save(filename,raw.slice(0,obj.start)+JSON.stringify(original,null,2)+raw.slice(obj.end));
  const introFile=path.join(ROOT,'data/intro.js'),introRaw=fs.readFileSync(introFile,'utf8');
  const introAst=acorn.parse(introRaw,{ecmaVersion:'latest'}),introCall=introAst.body.find(n=>n.type==='ExpressionStatement'&&n.expression.callee?.name==='__CR').expression;
  const introNode=introCall.arguments[1],intro=JSON.parse(introRaw.slice(introNode.start,introNode.end));
  const analogies=JSON.parse(fs.readFileSync(path.join(__dirname,'reader-tracks.json'),'utf8'));
  for(const key of Object.keys(intro)){if(!analogies[key])throw Error('Missing track analogy: '+key);intro[key].analogy=prose(analogies[key]);}
  save(introFile,introRaw.slice(0,introNode.start)+JSON.stringify(intro)+introRaw.slice(introNode.end));
  const runtime=fs.readFileSync(path.join(__dirname,'reader-guide-runtime.js'),'utf8');
  const titles={};
  for(const name of fs.readdirSync(path.join(ROOT,'data')).filter(n=>/^t-.*\.js$/.test(n))){
    const raw=fs.readFileSync(path.join(ROOT,'data',name),'utf8');
    const ast=acorn.parse(raw,{ecmaVersion:'latest'}),call=ast.body.find(n=>n.type==='ExpressionStatement'&&n.expression.callee?.name==='__CR').expression;
    const units=JSON.parse(raw.slice(call.arguments[1].start,call.arguments[1].end));
    for(const u of units)for(const item of [u,...u.l]){const text=prose(item.t);if(text!==item.t)titles[item.t]=text;}
  }
  save(path.join(ROOT,'data/reader-guide.js'),'/* Generated from tools/content/reader-concepts.json and track titles. */\n'+runtime.replace('/* DEFINITIONS */ {}',JSON.stringify(definitions)).replace('/* TITLES */ {}',JSON.stringify(titles)));
  return Object.keys(definitions).length;
}
function writeOptions(){
  const overrides=JSON.parse(fs.readFileSync(path.join(__dirname,'reader-options.json'),'utf8')),answers=JSON.parse(fs.readFileSync(path.join(__dirname,'reader-output-answers.json'),'utf8')),seen=new Set(),converted=new Set();
  const edits=JSON.parse(fs.readFileSync(path.join(__dirname,'reader-option-edits.json'),'utf8')),edited=new Set();
  for(const name of fs.readdirSync(path.join(ROOT,'data')).filter(n=>/^t-.*\.js$/.test(n))){
    const file=path.join(ROOT,'data',name),raw=fs.readFileSync(file,'utf8'),ast=acorn.parse(raw,{ecmaVersion:'latest'});
    const call=ast.body.find(n=>n.type==='ExpressionStatement'&&n.expression.callee?.name==='__CR').expression,node=call.arguments[1],units=JSON.parse(raw.slice(node.start,node.end));let changed=false;
    for(const q of units.flatMap(u=>u.l.flatMap(l=>l.q))){
      if(overrides[q.qid])seen.add(q.qid);
      if(q.qid==='3o0ptp'&&q.q.includes('4개 넘으면')){q.q=q.q.replace('4개 넘으면','4개 이상이면');changed=true;}
      if(answers[q.qid]){
        // Output reading is recalled without a menu of candidate results. Keep its old identity.
        if(q.t!=='input'){q.t='input';q.a=answers[q.qid];changed=true;}
        if(!q.outputRecall||!q.caseSensitive){q.outputRecall=true;q.caseSensitive=true;changed=true;}
        if(q.qid==='3v7k1z'&&!q.q.includes('리틀엔디언 환경')){q.q='리틀엔디언 환경에서 '+q.q;changed=true;}
        if(q.qid==='1y8k7v4'&&!q.q.includes('엄격 모드를 사용하지')){q.q='엄격 모드를 사용하지 않는 환경이에요. '+q.q;changed=true;}
        converted.add(q.qid);
      }
      if((q.t||'choice')!=='choice')continue;
      const options=overrides[q.qid];
      if(options){if(options.length!==4)throw Error('Expected four options: '+q.qid);q.o=options.map(prose);seen.add(q.qid);changed=true;}
      for(const edit of edits.filter(e=>e.qid===q.qid)){q.o[edit.index]=prose(edit.text);edited.add(edit.qid+':'+edit.index);changed=true;}
      const finished=q.o.map(s=>s.replace(/때문(?=[.!]?$)/,'때문이에요').replace(/기 위해(?=[.!]?$)/,'기 위해서예요').replace(/때(?=[.!]?$)/,'때예요').replace(/것(?=[.!]?$)/,'거예요').replace(/경우(?=[.!]?$)/,'경우예요'));
      if(JSON.stringify(finished)!==JSON.stringify(q.o)){q.o=finished;changed=true;}
    }
    if(changed)save(file,raw.slice(0,node.start)+JSON.stringify(units)+raw.slice(node.end));
  }
  for(const key of Object.keys(overrides))if(!seen.has(key))throw Error('Missing editorial question: '+key);
  for(const key of Object.keys(answers))if(!converted.has(key))throw Error('Missing output question: '+key);
  for(const edit of edits)if(!edited.has(edit.qid+':'+edit.index))throw Error('Missing option edit: '+edit.qid);
  return {options:seen.size,optionEdits:edited.size,outputRecall:converted.size};
}
if(require.main===module){
  if(process.argv.includes('--inventory')){const report=inventory(),target=process.argv[process.argv.indexOf('--inventory')+1];if(target)fs.writeFileSync(target,JSON.stringify(report,null,2));console.log(JSON.stringify({strings:report.strings,fields:report.fields,endings:report.endings.slice(0,45)}));}
  else if(process.argv.includes('--write')){const result=apply();result.options=writeOptions();result.concepts=writeConcepts();console.log(JSON.stringify(result));}
  else console.log('Use --inventory [report.json] or --write');
}
module.exports={prose,sources,inventory,apply};
