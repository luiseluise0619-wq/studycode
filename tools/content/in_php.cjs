/* PHP 단답 15 — 비교 규칙과 표준 함수의 동작을 적어 본다.
   검증:  node ver_input.cjs ./in_php.cjs
   출력값 대조:  node chk_predict_php.cjs ./in_php.cjs */
module.exports = [

{ track:"php", t:"input", cat:"internals", k:"숫자와 글자를 느슨하게 견주면",
  q:"PHP 8 에서 숫자 0 과 숫자가 아닌 문자열을 <code>==</code> 로 견주면 결과는 무엇일까요? 출력값을 적으세요. (true 또는 false)",
  code:"echo (0 == 'abc') ? 'true' : 'false';",
  a:["false", "거짓"],
  ex:"PHP 8 부터 규칙이 바뀌었습니다 — 이제 <b>숫자를 문자열로 바꿔</b> 견주므로 <code>'0' == 'abc'</code> 가 되어 거짓입니다.\n💡 개념: PHP 7 까지는 문자열을 숫자로 바꿔 <code>0 == 0</code> 이 되어 <b>참</b>이었습니다 — 인증 우회 취약점의 단골 원인이었습니다.\n🛠 실무: 버전에 기대지 말고 <code>===</code> 를 기본으로 쓰세요. 특히 토큰·해시 비교에는 시간 공격까지 막는 <code>hash_equals</code> 를 씁니다." },

{ track:"php", t:"input", cat:"internals", k:"앞에 0 이 붙은 숫자 문자열",
  q:"문자열 <code>'1'</code> 과 <code>'01'</code> 을 <code>==</code> 로 견주면 결과는 무엇일까요? 출력값을 적으세요. (true 또는 false)",
  code:"echo ('1' == '01') ? 'true' : 'false';",
  a:["true", "참"],
  ex:"둘 다 <b>숫자로 보이는 문자열</b>이면 숫자로 바꿔 견줍니다. 그래서 <code>'10' == '1e1'</code> 도 참입니다.\n💡 개념: 문자열끼리 견주는데도 결과가 숫자 비교라는 점이 함정입니다 — 해시 문자열이 우연히 <code>0e</code> 로 시작하면 서로 같아지는 유명한 문제가 여기서 나옵니다.\n🛠 실무: 문자열은 <code>===</code> 나 <code>strcmp</code> 로 견주세요. 정렬 키·식별자·해시에는 절대 <code>==</code> 를 쓰지 마세요." },

{ track:"php", t:"input", cat:"internals", k:"한글 한 글자의 바이트",
  q:"UTF-8 한글 한 글자에 <code>strlen()</code> 을 부르면 얼마가 나올까요? 출력값을 적으세요. (숫자)",
  code:"echo strlen('한');",
  a:["3"],
  ex:"이 함수는 글자가 아니라 <b>바이트</b>를 셉니다.\n💡 개념: 그래서 <code>substr</code>·<code>strrev</code> 같은 함수도 바이트 단위로 잘라 <b>글자를 깨뜨립니다</b>.\n🛠 실무: 다국어 문자열에는 <code>mb_</code> 계열을 쓰세요. 입력 길이 검사도 어느 단위인지 명시해야 합니다 — '20 자' 와 '20 바이트' 는 전혀 다릅니다." },

{ track:"php", t:"input", cat:"internals", k:"글자 수를 세려면",
  q:"같은 한글 한 글자에 <code>mb_strlen()</code> 을 부르면 얼마가 나올까요? 출력값을 적으세요. (숫자)",
  code:"echo mb_strlen('한');",
  a:["1"],
  ex:"이 계열은 인코딩을 알고 <b>글자 단위</b>로 셉니다.\n💡 개념: 기본 인코딩이 UTF-8 이 아니면 결과가 달라지므로, 두 번째 인자로 명시하거나 <code>mbstring.internal_encoding</code> 을 확인해야 합니다.\n🛠 실무: 프로젝트 시작 때 '문자열은 언제나 UTF-8, 길이는 언제나 <code>mb_</code>' 처럼 규칙을 못 박아 두면 이 부류의 버그가 사라집니다." },

{ track:"php", t:"input", cat:"internals", k:"정수로 나누기",
  q:"7 을 2 로 정수 나눗셈(<code>intdiv</code>)하면 얼마일까요? 출력값을 적으세요. (숫자)",
  code:"echo intdiv(7, 2);",
  a:["3"],
  ex:"<code>/</code> 는 실수 3.5 를 주지만 이 함수는 <b>정수</b>를 줍니다.\n💡 개념: 음수에서는 0 쪽으로 버립니다 — <code>intdiv(-7, 2)</code> 는 -4 가 아니라 <b>-3</b> 입니다.\n🛠 실무: 페이지 수 계산처럼 올림이 필요하면 <code>intdiv($n + $size - 1, $size)</code> 처럼 적으세요 — 실수로 나눈 뒤 <code>ceil</code> 하는 것보다 오차가 없습니다." },

{ track:"php", t:"input", cat:"internals", k:"우주선 연산자",
  q:"<code>7 &lt;=&gt; 3</code> 의 결과는 얼마일까요? 출력값을 적으세요. (숫자, 부호 포함)",
  code:"echo 7 <=> 3;",
  a:["1"],
  ex:"왼쪽이 크면 1, 같으면 0, 작으면 -1 을 줍니다.\n💡 개념: <code>usort</code> 의 비교 함수가 정확히 이 세 값을 요구하므로, 한 줄로 적을 수 있습니다.\n🛠 실무: 여러 기준으로 정렬할 때는 <code>$a['x'] &lt;=&gt; $b['x'] ?: $a['y'] &lt;=&gt; $b['y']</code> 처럼 이어 붙이면 동점 처리까지 깔끔합니다." },

{ track:"php", t:"input", cat:"internals", k:"숫자로 바꾸다 만 문자열",
  q:"문자열 <code>'12abc'</code> 를 정수로 형변환하면 얼마가 될까요? 출력값을 적으세요. (숫자)",
  code:"echo (int)'12abc';",
  a:["12"],
  ex:"<b>앞에서부터 숫자로 읽히는 데까지</b> 읽고 멈춥니다. 예외도 경고도 없습니다.\n💡 개념: 그래서 사용자 입력을 이렇게 바꾸면 <b>잘못된 값이 조용히 통과</b>합니다.\n🛠 실무: 검증에는 <code>filter_var($s, FILTER_VALIDATE_INT)</code> 를 쓰세요 — 형식이 어긋나면 <code>false</code> 를 돌려줘 걸러 낼 수 있습니다." },

{ track:"php", t:"input", cat:"internals", k:"번호가 띄엄띄엄한 배열",
  q:"열쇠가 <code>0</code> 과 <code>2</code> 인 배열을 JSON 으로 바꾸면 무엇이 나올까요? 출력값을 그대로 적으세요. (중괄호 또는 대괄호 포함)",
  code:"echo json_encode([0 => 'a', 2 => 'b']);",
  a:['{"0":"a","2":"b"}'],
  ex:"PHP 배열은 <b>순서 있는 맵</b>이라 목록과 사전을 한 타입으로 씁니다. 번호가 0 부터 빈틈없이 이어질 때만 JSON 배열이 되고, 아니면 <b>객체</b>가 됩니다.\n💡 개념: 그래서 <code>unset</code> 이나 <code>array_filter</code> 로 원소를 지운 뒤 그대로 내보내면 <b>클라이언트가 받는 타입이 바뀝니다</b>.\n🛠 실무: 목록을 내보내기 전에 <code>array_values()</code> 로 번호를 다시 매기세요. API 응답 타입이 데이터에 따라 흔들리는 사고를 막습니다." },

{ track:"php", t:"input", cat:"internals", k:"없을 때만 기본값",
  q:"<code>null</code> 인 변수에 <code>??</code> 로 기본값을 주면 무엇이 나올까요? 출력값을 그대로 적으세요. (영문)",
  code:"$x = null; echo $x ?? 'def';",
  a:["def"],
  ex:"<code>??</code> 는 <b>없거나 <code>null</code> 일 때만</b> 오른쪽을 씁니다. 게다가 정의되지 않은 키를 물어도 <b>경고를 내지 않습니다</b>.\n💡 개념: <code>?:</code> 는 '거짓 같으면' 이라 <code>0</code>·<code>''</code>·<code>'0'</code> 까지 덮어씁니다 — 뜻이 전혀 다릅니다.\n🛠 실무: 기본값 채우기에는 <code>??</code>, 참·거짓 판단에만 <code>?:</code> 라고 규칙을 정하세요. 대입에는 <code>??=</code> 도 있습니다." },

{ track:"php", t:"input", cat:"security", k:"화면에 내보내기 전에 다듬기",
  q:"사용자가 입력한 글을 HTML 로 내보낼 때 <code>&lt;</code>·<code>&gt;</code>·<code>&amp;</code> 등을 엔티티로 바꿔 XSS 를 막는 표준 함수의 이름은? (영문)",
  a:["htmlspecialchars", "htmlentities", "html특수문자"],
  ex:"막아야 할 것은 <b>입력이 아니라 출력</b>입니다 — 같은 값이라도 HTML·속성·자바스크립트·URL 중 어디에 놓이느냐로 다듬는 방법이 다릅니다.\n💡 개념: 인코딩을 명시하고(<code>'UTF-8'</code>) 따옴표까지 바꾸는 플래그를 켜야 속성 안에서도 안전합니다.\n🛠 실무: 템플릿 엔진의 <b>자동 이스케이프</b>를 켜 두는 편이 가장 확실합니다. 일부러 끄는 자리는 코드 리뷰에서 반드시 짚으세요." },

{ track:"php", t:"input", cat:"security", k:"비밀번호를 저장하는 함수",
  q:"비밀번호를 안전하게 저장할 때 쓰는, 소금과 비용까지 알아서 넣어 주는 PHP 표준 함수의 이름은? (영문, 밑줄 포함)",
  a:["password_hash", "passwordhash"],
  ex:"결과 문자열 안에 <b>알고리즘·비용·소금</b>이 함께 들어 있어, 검증할 때 따로 보관할 것이 없습니다.\n💡 개념: 검증은 <code>password_verify</code> 로 하고, 비용을 올렸다면 <code>password_needs_rehash</code> 로 로그인 시점에 조용히 갱신합니다.\n🛠 실무: <code>md5</code>·<code>sha1</code> 은 <b>너무 빨라서</b> 비밀번호에 쓰면 안 됩니다. 느린 것이 이 용도에서는 장점입니다." },

{ track:"php", t:"input", cat:"internals", k:"의존성을 관리하는 도구",
  q:"PHP 프로젝트에서 라이브러리를 내려받고 자동 로딩을 만들어 주는 표준 의존성 관리 도구의 이름은? (영문)",
  a:["Composer", "컴포저"],
  ex:"<code>composer.json</code> 에 원하는 범위를 적고, 실제로 설치된 정확한 버전은 <code>composer.lock</code> 에 남습니다.\n💡 개념: 잠금 파일을 저장소에 함께 커밋해야 <b>어디서 설치해도 같은 버전</b>이 깔립니다 — 애플리케이션에서는 필수입니다.\n🛠 실무: 이 도구가 만들어 주는 자동 로딩(PSR-4)을 쓰면 <code>require</code> 를 직접 적을 일이 없습니다. 배포 때는 <code>--no-dev</code> 로 개발 의존성을 빼세요." },

{ track:"php", t:"input", cat:"perf", k:"컴파일 결과를 남겨 두기",
  q:"요청마다 소스를 다시 해석하지 않도록 컴파일된 바이트코드를 메모리에 캐시해 두는 PHP 확장의 이름은? (영문)",
  a:["OPcache", "옵캐시", "opcode cache"],
  ex:"PHP 는 요청마다 새로 시작하는 모델이라, 이것이 없으면 <b>매 요청마다 전체 소스를 다시 컴파일</b>합니다.\n💡 개념: 그래서 켜기만 해도 처리량이 몇 배가 됩니다 — 운영에서 끄고 쓰는 것은 사실상 실수입니다.\n🛠 실무: 배포 후 캐시를 비우지 않으면 <b>옛 코드가 계속 돕니다</b>. 파일 변경 검사 주기를 짧게 두거나, 배포 스크립트에서 명시적으로 비우세요." },

{ track:"php", t:"input", cat:"internals", k:"타입을 엄격하게 지키기",
  q:"파일 맨 위에 적어 그 파일 안의 함수 인자·반환값 타입을 <b>자동 변환 없이</b> 엄격히 검사하게 하는 선언의 이름은? (영문, 밑줄 포함)",
  a:["strict_types", "stricttypes", "declare(strict_types=1)"],
  ex:"없으면 <code>int</code> 를 요구하는 자리에 <code>'5'</code> 를 넘겨도 조용히 바뀝니다.\n💡 개념: 선언은 <b>파일 단위</b>로 적용되고 '호출하는 쪽' 기준이라, 라이브러리에 적어도 부르는 파일에 없으면 느슨하게 동작합니다.\n🛠 실무: 새 파일에는 언제나 첫 줄에 넣는 것을 규칙으로 두세요. 정적 분석기(PHPStan·Psalm)와 함께 쓰면 런타임 전에 대부분의 타입 실수가 잡힙니다." },

{ track:"php", t:"input", cat:"internals", k:"세션을 담는 쿠키 이름",
  q:"PHP 가 세션을 이어 주기 위해 브라우저에 심는 쿠키의 기본 이름은? (영문 대문자)",
  a:["PHPSESSID", "피에이치피세션아이디"],
  ex:"이 값만 있으면 그 세션이 됩니다 — 그래서 <b>훔치면 로그인한 것과 같습니다</b>.\n💡 개념: 그래서 <code>HttpOnly</code>(스크립트가 못 읽게)·<code>Secure</code>(HTTPS 에서만)·<code>SameSite</code>(다른 사이트 요청에 안 붙게) 세 속성을 켜야 합니다.\n🛠 실무: 로그인에 성공한 직후 <code>session_regenerate_id(true)</code> 를 부르세요 — 공격자가 미리 심어 둔 값을 그대로 쓰는 <b>세션 고정</b> 공격을 막습니다." },

];
