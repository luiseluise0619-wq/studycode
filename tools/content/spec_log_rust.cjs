module.exports = {
  track: "rust", guide: "📜", xp: 70,
  unit: "로그 분석 II — 패닉과 런타임",
  source: "./log_rust.cjs",
  lessons: [
    { t: "패닉이 말해 주는 것", n: 5,
      th: { sum: "러스트의 패닉은 대개 **'그럴 리 없다' 고 적어 둔 곳**에서 난다.",
        body: [
          { h: "주장과 현실", t: "<code>unwrap()</code> 은 실패하지 않는다는 주장이고, 바이트 인덱스 슬라이싱은 경계가 글자 가운데가 아니라는 주장입니다. 옛 데이터의 빈 값 하나, 한글 한 글자면 그 주장이 깨집니다. 운영 경로에서는 <b>없는 경우를 값으로</b> 다루어야 합니다." },
          { h: "빌드에 따라 달라지는 것", t: "정수 오버플로는 디버그에서 패닉하고 릴리스에서는 감싸 돕니다. 그래서 테스트에서 보이던 사고가 배포판에서 <b>거대한 잔액</b>으로 조용히 지나갑니다. 금액처럼 위험한 계산은 <code>checked_*</code> 로 명시하거나 릴리스에서도 검사를 켭니다." }],
        code: { c: "let Some(v) = map.get(k) else { return Err(...) };\ns.chars().take(20).collect::<String>()\nbalance.checked_sub(amount).ok_or(Insufficient)?", cap: "주장 대신 처리한다" },
        key: ["unwrap 은 주장이다", "슬라이싱은 바이트 단위", "릴리스는 오버플로를 감싼다", "없는 경우를 값으로"] } },
    { t: "비동기와 소유권", n: 5,
      th: { sum: "런타임 위에서는 **막지 않기**와 **놓아주기**가 곧 성능이고 안정성이다.",
        body: [
          { h: "막지 않기", t: "async 안에서 CPU 를 오래 붙잡으면 워커가 멈추고, 동기 잠금을 쥔 채 <code>await</code> 하면 서로를 기다립니다. 무거운 계산은 <code>spawn_blocking</code> 으로 보내고, 잠금은 <b>await 전에 놓습니다</b>." },
          { h: "놓아주기", t: "<code>Rc</code> 순환은 참조 세기로 풀리지 않고, 무한 채널은 느려진 소비자를 메모리로 메꾸며, 버린 <code>JoinHandle</code> 은 종료 때 조용히 취소됩니다. 읽기만 하는 큰 데이터를 <code>clone()</code> 하는 것도 같은 종류의 낭비입니다." }],
        code: { c: "let v = { let g = m.lock(); g.value };  // await 전에 해제\nmpsc::channel(1024)                     // 유계\nlet mut set = JoinSet::new(); set.join_all().await;", cap: "막지 말고, 반드시 놓아준다" },
        key: ["CPU 작업은 blocking 풀로", "잠금 쥔 채 await 금지", "순환은 Weak 로 끊는다", "유계 채널로 역압"] } },
  ],
};
