/* javascript — 정답률 15% 아래 끝맺음의 오답 17개를 구체적인 틀린 답으로 (72차) */
module.exports = { track: "javascript", fixes: [
  { k: "fe2-cl-let-block", from: "매번 복사본을 주기 때문", to: "let 은 클로저가 변수를 공유하는 것을 금지해 매번 복사본을 주어서" },
  { k: "js-mod-cyclic", from: "순환 참조를 신경 쓸 필요가 없다", to: "CommonJS 는 순환이 생기면 에러를 던지고, ESM 은 의존 순서를 자동으로 재배치해 해결해 준다. 그래서 ESM 쪽에서는 순환 참조가 문제로 드러나지 않는다" },
  { k: "js-dyn-error", from: "실패하지 않으므로 처리할 필요가 없다", to: "동적 import는 실패하지 않으므로 처리 코드는 비워 둔다" },
  { k: "js-dyn-error", from: "3회 재시도되므로 코드가 필요 없다", to: "실패하면 자동으로 3회 재시도되므로 코드는 그대로 두면 된다" },
  { k: "js-tree-req", from: "식별자를 찾을 수 있기 때문이다", to: "코드가 minify 되어 있을 것 — 이름이 짧아진 뒤에야 사용되지 않는 식별자를 찾을 수 있어서다" },
  { k: "js-async-foreach", from: "forEach에서 문법 오류가 난다", to: "async 콜백은 forEach 가 받지 않아 파서가 거부한다" },
  { k: "js-conc-pool", from: "알아서 제한해 주기 때문", to: "Promise.all 이 내부적으로 동시에 실행되는 워커 수를 알아서 제한해 주어서" },
  { k: "js-err-swallow", from: "다시 던지지 않으면 문법 오류가 난다", to: "e를 다시 던지지 않으면 린터가 빌드를 막는다" },
  { k: "js-err-swallow", from: "에러가 유실될 수 있기 때문이다", to: "console.log 는 비동기라 그 사이에 에러가 유실될 수 있는 탓이다" },
  { k: "js-err-finally", from: "return 을 쓸 수 없기 때문이다", to: "SyntaxError — finally 블록 안의 return 은 파서가 거부하는 탓이다" },
  { k: "js-store-cookie", from: "다른 사이트에서는 쓸 수 없게 된다", to: "교차 사이트 요청을 보낼 때 쿠키가 붙지 않도록 막아 준다. 다른 사이트에서는 쓰지 못하게 된다" },
  { k: "js2-o1-04", from: "열거 여부를 보지 않기 때문이다", to: "JSON.stringify 에는 포함되지만 Object.keys 에서만 빠진다. 직렬화는 열거 여부를 보지 않는 탓이다" },
  { k: "js2-o1-04", from: "delete 연산자로 지울 수 없게 된다", to: "delete 연산자로 지우려 하면 무시된다" },
  { k: "js2-o1-09", from: "스프레드로 복사되지 않기 때문이다", to: "undefined — 접근자는 스프레드로 복사되지 않는 탓이다" },
  { k: "js2-g2-03", from: "돌 수 있게 되어 있기 때문이다", to: "[키, 값] 쌍이 차례로 순회된다 — 일반 객체도 배열처럼 순서대로 돌 수 있게 되어 있어서다" },
  { k: "js2-w7-06", from: "자동으로 정리하므로 문제가 없다", to: "브라우저가 DOM 제거를 감지해 스스로 정리해 준다" },
  { k: "js2-t8-15", from: "자동으로 타입을 검사해 주기 때문", to: "unknown은 런타임에 자동으로 타입을 검사해 주어서" },
  { k: "js2-t8-15", from: "두 값을 자동으로 걸러 주기 때문", to: "unknown 쪽은 null 과 undefined 두 값을 자동으로 걸러 내 주어서" }
] };
