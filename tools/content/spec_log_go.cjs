module.exports = {
  track: "go", guide: "", xp: 70,
  unit: "로그 분석 II — 고루틴이 남긴 자취",
  source: "./log_go.cjs",
  lessons: [
    { t: "떠난 뒤에도 남는 것", n: 5,
      th: { sum: "고루틴은 싸지만 **끝나지 않으면 영원히 남는다**.",
        body: [
          { h: "받는 쪽이 사라졌을 때", t: "버퍼 없는 채널은 상대가 있어야 진행합니다. 호출자가 타임아웃으로 먼저 돌아가면 보내려던 고루틴은 영원히 멈춘 채 메모리를 붙잡습니다. <b>고루틴 수</b>가 우상향하면 거의 언제나 이런 모양입니다. <code>select</code> 로 <code>ctx.Done()</code> 을 함께 기다려 포기할 줄 알게 만듭니다." },
          { h: "마감과 정리", t: "마감 없는 외부 호출은 상류 장애를 그대로 우리 것으로 만들고, 루프 안의 <code>defer</code> 는 함수가 끝날 때까지 아무 것도 닫지 않습니다. 자원을 잡는 코드를 쓸 때 <b>언제 놓는지</b>를 같은 화면에서 볼 수 있어야 합니다." }],
        code: { c: "ctx, cancel := context.WithTimeout(ctx, 2*time.Second)\nselect { case ch <- v: case <-ctx.Done(): }\nfor _, p := range paths { process(p) }  // defer 는 함수 안으로", cap: "끝나는 길을 함께 만든다" },
        key: ["보내는 쪽도 포기할 줄 알아야", "외부 호출에는 마감", "defer 는 함수 단위", "고루틴 수를 지표로"] } },
    { t: "함께 쓰면 깨지는 것", n: 5,
      th: { sum: "값 복사·공유 맵·세는 시점 — 동시성 사고는 대개 **조용히 틀린 값**으로 온다.",
        body: [
          { h: "복사되면 보호가 사라진다", t: "값 수신자로 메서드를 만들면 구조체와 그 안의 뮤텍스가 함께 복사되어 아무도 막지 못합니다. <code>go vet</code> 의 copylocks 경고가 이것을 잡아 주고, <code>-race</code> 는 실제 경합을 잡아 줍니다. 둘 다 CI 에서 실패 조건이어야 의미가 있습니다." },
          { h: "언제 세는가", t: "<code>wg.Add</code> 를 고루틴 안에서 부르면 <code>Wait</code> 가 먼저 지나가고, 공용 맵에 여럿이 쓰면 런타임이 <b>프로세스를 즉시 끝냅니다</b>(recover 불가). 결과가 실행마다 다르거나 동시성을 올릴 때만 죽는다면 이 두 가지를 먼저 봅니다." }],
        code: { c: "func (c *Counter) Inc()      // 포인터 수신자\nwg.Add(1); go func(){ defer wg.Done(); ... }()\nresults := make([]R, n)      // 인덱스로 각자 채우기", cap: "공유를 줄이고, 남는 것은 지킨다" },
        key: ["잠금은 복사되면 무용", "Add 는 고루틴 밖에서", "맵 동시 쓰기는 즉사", "vet 과 -race 를 CI 에"] } },
  ],
};
