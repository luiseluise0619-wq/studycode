module.exports = {
  track: "code", guide: "", xp: 70,
  unit: "코드 리뷰 — 결함 찾기",
  source: "./rev_code.cjs",
  lessons: [
    { t: "조용히 틀리는 값", n: 4,
      th: { sum: "예외가 나면 다행이다. 리뷰에서 잡아야 할 것은 **오류 없이 틀린 값**이다.",
        body: [
          { h: "거짓 같은 값", t: "<code>!x</code> 와 <code>==</code> 는 <code>0</code>·빈 문자열·<code>false</code> 를 없는 값처럼 다룬다. 없는 값만 걸러야 한다면 <code>== null</code> 로 좁히고, 비교는 타입을 정한 뒤 <code>===</code> 로 한다. 문자열이 산술에 섞이면 <code>NaN</code> 이 조용히 번진다." },
          { h: "날짜와 순회", t: "<code>getMonth()</code> 는 0 부터 세고, 날짜만 있는 ISO 문자열은 UTC 자정으로 해석된다. 순회하면서 <code>splice</code> 로 지우면 인덱스가 어긋나 하나 건너 하나만 지워진다 — 뒤에서부터 훑거나 <code>filter</code> 로 새 배열을 만든다." }],
        code: { c: "if (v == null) …            // 없는 값만\nd.getMonth() + 1              // 월은 0부터\nlist.filter(x => !x.done)     // 새 배열로", cap: "오류 없이 틀리는 자리를 본다" },
        key: ["거짓 같은 값과 없는 값을 구분", "비교 전에 타입을 정한다", "월은 0부터, 날짜는 UTC 해석", "순회 중 삭제 금지"] } },
    { t: "비동기와 공유", n: 4,
      th: { sum: "**기다리지 않은 것**과 **함께 쓰는 것** — 둘이 대부분의 사고를 만든다.",
        body: [
          { h: "기다렸는가", t: "<code>forEach</code> 는 콜백의 프라미스를 버리므로 저장이 끝나기 전에 함수가 반환하고, 버려진 거절은 잡히지 않아 프로세스를 끄기도 한다. 순서가 필요하면 <code>for...of</code> + <code>await</code>, 아니면 <code>Promise.all</code> 로 모은다." },
          { h: "혼자 쓰는가", t: "기본값으로 준 객체는 모듈에 하나뿐이라 호출 사이에 상태가 누적되고, 전개(<code>...</code>)는 <b>한 겹만</b> 복사해 중첩된 배열은 계속 공유된다. 예외를 잡아 빈 값으로 바꾸면 실패와 빈 결과가 구별되지 않는다." }],
        code: { c: "await Promise.all(rows.map(save));\nfunction f(opts = { tags: [] }) { … }   // 매 호출 새로\n{ ...s, filters: { ...s.filters } }      // 겹을 의식", cap: "버려진 프라미스와 공유된 객체" },
        key: ["forEach 는 비동기를 모른다", "잡지 않은 거절은 위험하다", "기본값은 매번 새로 만든다", "전개는 얕은 복사"] } },
  ],
};
