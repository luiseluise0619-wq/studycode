module.exports = {
  track: "c", guide: "", xp: 70,
  unit: "로그 분석 II — 메모리가 남긴 흔적",
  source: "./log_c.cjs",
  lessons: [
    { t: "경계를 넘는 순간", n: 5,
      th: { sum: "C 의 사고는 대개 **한 칸**에서 시작한다. 그리고 한참 뒤 엉뚱한 곳에서 드러난다.",
        body: [
          { h: "넘어 쓰기", t: "<code>i &lt;= n</code> 한 글자, 길이를 모르는 <code>strcpy</code>, 넘쳐 버린 크기 계산 — 모두 남의 자리에 씁니다. 스택이면 옆 변수가 바뀌고, 힙이면 할당기 구조가 망가져 <b>나중에</b> 죽습니다. 할당이 성공했다는 것이 안전을 뜻하지 않습니다." },
          { h: "수명이 끝난 뒤", t: "해제한 메모리를 가리키는 포인터가 남아 있으면 한동안은 옛 값이 그대로 읽혀 정상처럼 보이고, 지역 배열의 주소를 돌려주면 다음 호출이 덮을 때까지만 맞습니다. '가끔 이상한 값' 은 거의 언제나 수명 문제입니다." }],
        code: { c: "if (count > SIZE_MAX / sizeof(item)) return -1;\nsnprintf(out, sizeof out, \"%s\", src);\nfree(p); p = NULL;", cap: "쓰기 전에 크기, 놓은 뒤엔 NULL" },
        key: ["한 칸 넘침이 남의 값을 바꾼다", "할당 성공 ≠ 안전", "해제 뒤 포인터를 지운다", "지역 배열 주소를 돌려주지 않는다"] } },
    { t: "빠져나가는 길과 끼어드는 신호", n: 5,
      th: { sum: "정상 경로만 보면 안 보이는 것들이 있다 — **오류 경로**, **형식 지정자**, **신호 처리기**.",
        body: [
          { h: "중간에 나가는 길", t: "성공 경로에는 <code>free</code> 가 있어도 실패해서 일찍 <code>return</code> 하는 길에는 빠져 있기 쉽습니다. 오류율이 오를 때만 메모리가 는다면 이것입니다. <code>goto cleanup;</code> 으로 <b>모든 출구를 한 곳으로</b> 모으면 빠뜨릴 수 없습니다." },
          { h: "타입과 시점", t: "<code>%d</code> 로 8바이트를 찍거나 <code>getchar()</code> 를 <code>char</code> 에 담으면 값이 조용히 틀립니다. 신호 처리기 안에서 <code>printf</code>·<code>malloc</code> 을 부르면 잠금을 두 번 요구해 교착이 됩니다. 처리기는 <b>플래그만</b> 세우고 주 루프가 일합니다." }],
        code: { c: "int c = getchar();\nprintf(\"%lld\\n\", total);\nstatic volatile sig_atomic_t stop; // 처리기는 이것만", cap: "예외 경로와 경계 타입을 먼저 본다" },
        key: ["오류 경로에서 새기 쉽다", "goto cleanup 으로 출구 통일", "형식 지정자는 크기까지 맞춘다", "신호 처리기는 플래그만"] } },
  ],
};
