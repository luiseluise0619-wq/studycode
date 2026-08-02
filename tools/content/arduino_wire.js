/* 아두이노 배선 실습 — 부품을 직접 이어 보는 문항(t:"wire").

   아두이노 64문항 중 61개가 고르기였고, 배우는 유닛 5개는 실습이 0이었다.
   그런데 아두이노에서 초보자가 실제로 태워 먹는 것은 코드가 아니라 배선이다.
   저항 없이 LED 를 물리고, 극성을 뒤집고, GND 를 빼먹고, 5V 와 GND 를 바로 잇는다.

   채점은 전기 시뮬레이션이 아니라 '무엇과 무엇이 이어졌는가' 그래프로 한다.
   through 로 '반드시 이 부품을 거쳐야 한다' 를 표현할 수 있어서,
   '저항을 거쳤는가' 같은 진짜 조건을 검사할 수 있다.

   start 를 주면 그 선들이 미리 그어진 채로 시작한다 — '틀린 배선 고치기' 문항이 된다. */

const UNO = (pins) => ({ id: "uno", kind: "board", label: "Arduino Uno", pins: pins });

module.exports = [
{
  unit: "아두이노 첫걸음",
  lesson: "직접 이어 보기 — LED 를 켜는 회로",
  th: {
    sum: "LED 는 **저항 없이 물리면 탄다.** 그리고 방향이 있어서 거꾸로 꽂으면 아예 안 켜진다.",
    body: [
      { h: "왜 저항이 필요한가", t: "LED 는 전압이 조금만 넘어도 전류가 급격히 늘어난다. 5V 를 그대로 물리면 견딜 수 있는 전류를 훌쩍 넘겨 순식간에 망가진다. 220Ω 정도를 **직렬로** 끼워 전류를 제한한다 — LED 옆이 아니라 전류가 지나가는 길목에 있어야 한다." },
      { h: "방향이 있다", t: "긴 다리(애노드, +)가 전원 쪽, 짧은 다리(캐소드, −)가 GND 쪽이다. 거꾸로 꽂으면 전류가 흐르지 않아 그냥 안 켜진다 — 고장이 아니라서 더 헷갈린다." },
      { h: "회로는 돌아와야 한다", t: "핀에서 나간 전류가 GND 로 **돌아와야** 회로가 완성된다. GND 를 빼먹으면 아무 일도 일어나지 않는다. 아두이노에서 가장 흔한 '왜 안 되지' 의 정체다." },
    ],
    code: { c: "void setup() { pinMode(13, OUTPUT); }\nvoid loop() { digitalWrite(13, HIGH); }\n// 코드가 맞아도 배선이 틀리면 안 켜진다", cap: "코드보다 배선이 먼저다" },
    key: ["LED 앞에는 저항을 직렬로", "긴 다리가 +, 짧은 다리가 −", "GND 로 돌아와야 회로가 닫힌다"],
  },
  q: [
    {
      k: "LED 켜기 — 저항을 거쳐서",
      sol: [["uno.D13", "r.1"], ["r.2", "led.+"], ["led.−", "uno.GND"]],
      qq: "13번 핀으로 LED 를 켜는 회로를 만드세요. <b>반드시 220Ω 저항을 거쳐야</b> 하고, LED 의 짧은 다리는 GND 로 가야 합니다.",
      parts: [
        UNO(["D13", "D2", "5V", "GND"]),
        { id: "r", label: "220Ω 저항", pins: ["1", "2"] },
        { id: "led", label: "LED", pins: ["+", "−"] },
      ],
      checks: [
        { d: "D13 이 LED 의 + 로 이어진다", link: ["uno.D13", "led.+"] },
        { d: "그 사이에 220Ω 저항이 끼어 있다", link: ["uno.D13", "led.+"], through: "r" },
        { d: "LED 의 − 가 GND 로 간다", link: ["led.−", "uno.GND"] },
        { d: "5V 와 GND 가 바로 붙어 있지 않다", apart: ["uno.5V", "uno.GND"], wires: true },
      ],
      ex: "저항은 LED 옆에 놓는 게 아니라 전류가 지나가는 길목에 끼워야 합니다. D13 → 저항 → LED(+) → LED(−) → GND 순서로 한 줄이 되어야 해요. 저항을 빼고 바로 이으면 LED 가 탑니다.",
    },
    {
      k: "합선 고치기",
      sol: [["uno.5V", "r.1"], ["r.2", "led.+"], ["led.−", "uno.GND"]],
      qq: "누군가 5V 와 GND 를 <b>바로 이어</b> 놓았습니다. 이 선을 지우고, LED 가 <b>5V 로 상시 점등</b>되도록 저항을 거쳐 다시 이으세요.",
      parts: [
        UNO(["D13", "5V", "GND"]),
        { id: "r", label: "330Ω 저항", pins: ["1", "2"] },
        { id: "led", label: "LED", pins: ["+", "−"] },
      ],
      start: [["uno.5V", "uno.GND"]],
      checks: [
        { d: "5V 와 GND 를 바로 잇는 선이 없다", apart: ["uno.5V", "uno.GND"], wires: true },
        { d: "5V 가 LED 의 + 로 이어진다", link: ["uno.5V", "led.+"] },
        { d: "그 사이에 저항이 끼어 있다", link: ["uno.5V", "led.+"], through: "r" },
        { d: "LED 의 − 가 GND 로 간다", link: ["led.−", "uno.GND"] },
      ],
      ex: "5V 와 GND 를 바로 이으면 아무것도 막지 않는 길이 생겨 큰 전류가 흐릅니다(합선). 보드가 보호 회로로 버티더라도 절대 만들면 안 되는 배선이에요. 먼저 그 선을 지운 뒤 저항과 LED 를 사이에 넣으세요.",
    },
  ],
},
{
  unit: "입력과 통신",
  lesson: "직접 이어 보기 — 버튼 읽기",
  th: {
    sum: "입력 핀은 아무것도 연결되지 않으면 **값이 떠다닌다**(플로팅). 0도 1도 아닌 상태라 읽을 때마다 달라진다.",
    body: [
      { h: "풀다운·풀업 저항", t: "버튼을 누르지 않았을 때 핀을 확실한 값으로 붙잡아 두는 저항이다. 10kΩ 을 GND 로 걸면 평소 LOW(풀다운), 5V 로 걸면 평소 HIGH(풀업)다. 이게 없으면 손을 가까이 대는 것만으로도 값이 바뀐다." },
      { h: "내장 풀업", t: "`pinMode(2, INPUT_PULLUP)` 을 쓰면 보드 안의 저항이 붙어 배선이 하나 줄어든다. 대신 **눌렀을 때 LOW** 가 되어 논리가 뒤집힌다 — 이걸 모르면 버튼이 거꾸로 동작한다." },
    ],
    code: { c: "pinMode(2, INPUT_PULLUP);\nif (digitalRead(2) == LOW) { /* 눌림 */ }\n// 내장 풀업은 눌렀을 때 LOW 다", cap: "안 눌렀을 때의 값을 정해 둬야 한다" },
    key: ["아무것도 안 걸면 값이 떠다닌다", "풀다운은 평소 LOW, 풀업은 평소 HIGH", "내장 풀업은 논리가 뒤집힌다"],
  },
  q: [
    {
      k: "버튼 + 풀다운 저항",
      sol: [["btn.1", "uno.5V"], ["btn.2", "uno.D2"], ["uno.D2", "rd.1"], ["rd.2", "uno.GND"]],
      qq: "2번 핀으로 버튼을 읽는 회로를 만드세요. 버튼을 누르면 <b>5V 가 2번 핀에</b> 닿고, 안 눌렀을 때는 <b>10kΩ 저항을 거쳐 GND</b> 로 붙잡혀 있어야 합니다.",
      parts: [
        UNO(["D2", "5V", "GND"]),
        { id: "btn", label: "버튼", pins: ["1", "2"], noInternal: true },
        { id: "rd", label: "10kΩ 풀다운", pins: ["1", "2"] },
      ],
      checks: [
        { d: "버튼 한쪽이 5V 에 붙는다", link: ["btn.1", "uno.5V"] },
        { d: "버튼 다른 쪽이 2번 핀으로 간다", link: ["btn.2", "uno.D2"] },
        { d: "2번 핀이 저항을 거쳐 GND 로 붙잡힌다", link: ["uno.D2", "uno.GND"], through: "rd" },
        { d: "5V 와 GND 가 바로 붙어 있지 않다", apart: ["uno.5V", "uno.GND"], wires: true },
      ],
      ex: "풀다운 저항이 없으면 버튼을 안 눌렀을 때 2번 핀이 아무 데도 연결되지 않아 값이 떠다닙니다. 저항을 GND 로 걸어 평소 LOW 로 붙잡아 둬야 해요. 저항 없이 GND 에 바로 이으면 버튼을 눌렀을 때 5V 와 GND 가 합선됩니다.",
    },
    {
      k: "내장 풀업으로 배선 줄이기",
      sol: [["btn.1", "uno.D3"], ["btn.2", "uno.GND"]],
      qq: "<code>INPUT_PULLUP</code> 을 쓰면 외부 저항이 필요 없습니다. 버튼 한쪽을 <b>3번 핀</b>에, 다른 쪽을 <b>GND</b> 에 이으세요. 5V 는 쓰지 않습니다.",
      parts: [
        UNO(["D3", "5V", "GND"]),
        { id: "btn", label: "버튼", pins: ["1", "2"], noInternal: true },
      ],
      checks: [
        { d: "버튼 한쪽이 3번 핀에 붙는다", link: ["btn.1", "uno.D3"] },
        { d: "버튼 다른 쪽이 GND 로 간다", link: ["btn.2", "uno.GND"] },
        { d: "5V 는 쓰지 않는다", apart: ["uno.5V", "uno.D3"], wires: true },
        { d: "5V 와 GND 가 바로 붙어 있지 않다", apart: ["uno.5V", "uno.GND"], wires: true },
      ],
      ex: "내장 풀업은 보드 안에서 핀을 5V 쪽으로 붙잡아 둡니다. 그래서 버튼은 GND 로만 내리면 되고, 누르면 LOW 가 돼요 — 논리가 뒤집히는 것을 코드에서 감안해야 합니다.",
    },
  ],
},
{
  unit: "디지털·아날로그 입출력과 PWM 듀티 제어",
  lesson: "직접 이어 보기 — 아날로그 입력과 PWM",
  th: {
    sum: "아날로그 입력(A0~)은 0~5V 를 0~1023 숫자로 읽는다. PWM 출력(~ 표시 핀)은 켜고 끄기를 빠르게 반복해 밝기를 흉내 낸다.",
    body: [
      { h: "가변저항의 세 다리", t: "양끝은 5V 와 GND 에 걸고, 가운데(와이퍼)를 아날로그 핀으로 보낸다. 손잡이를 돌리면 가운데 전압이 0~5V 사이에서 움직인다. 양끝을 거꾸로 걸면 방향만 반대가 되고, **가운데를 안 걸면** 값이 떠다닌다." },
      { h: "PWM 은 진짜 아날로그가 아니다", t: "`analogWrite(9, 128)` 은 절반쯤 켜 두는 것이 아니라, 아주 빠르게 켰다 껐다 해서 절반처럼 보이게 하는 것이다. LED 밝기나 모터 속도에는 잘 맞지만, 진짜 전압이 필요한 곳에는 못 쓴다." },
    ],
    code: { c: "int v = analogRead(A0);        // 0~1023\nanalogWrite(9, v / 4);         // 0~255\n// 9번은 ~ 가 붙은 PWM 핀이어야 한다", cap: "읽은 값의 범위와 쓰는 값의 범위가 다르다" },
    key: ["가변저항 가운데를 아날로그 핀으로", "PWM 은 빠르게 껐다 켜는 것", "`analogRead` 0~1023, `analogWrite` 0~255"],
  },
  q: [
    {
      k: "가변저항으로 밝기 조절",
      sol: [["pot.1", "uno.5V"], ["pot.3", "uno.GND"], ["pot.W", "uno.A0"], ["uno.D9", "r.1"], ["r.2", "led.+"], ["led.−", "uno.GND"]],
      qq: "가변저항으로 LED 밝기를 조절하는 회로를 만드세요. 가변저항 양끝은 <b>5V·GND</b>, 가운데는 <b>A0</b> 로 보내고, LED 는 <b>PWM 핀 D9</b> 에서 저항을 거쳐 켭니다.",
      parts: [
        UNO(["A0", "D9", "5V", "GND"]),
        { id: "pot", label: "가변저항", pins: ["1", "W", "3"] },
        { id: "r", label: "220Ω 저항", pins: ["1", "2"] },
        { id: "led", label: "LED", pins: ["+", "−"] },
      ],
      checks: [
        { d: "가변저항 한쪽 끝이 5V 에 붙는다", link: ["pot.1", "uno.5V"] },
        { d: "다른 쪽 끝이 GND 에 붙는다", link: ["pot.3", "uno.GND"] },
        { d: "가운데(W)가 A0 로 간다", link: ["pot.W", "uno.A0"] },
        { d: "D9 가 저항을 거쳐 LED 로 간다", link: ["uno.D9", "led.+"], through: "r" },
        { d: "LED 의 − 가 GND 로 간다", link: ["led.−", "uno.GND"] },
      ],
      ex: "가변저항은 양끝에 전압을 걸어 두고 가운데에서 나눠진 전압을 꺼내 쓰는 부품입니다. 양끝 중 하나만 걸거나 가운데를 안 걸면 A0 값이 떠다녀요. LED 쪽은 D13 과 똑같이 저항을 직렬로 끼웁니다.",
    },
    {
      k: "잘못된 배선 고치기 — 가운데를 안 걸었다",
      sol: [["pot.1", "uno.5V"], ["pot.3", "uno.GND"], ["pot.W", "uno.A0"]],
      qq: "가변저항의 <b>가운데 다리가 A0 가 아니라 5V 에</b> 잘못 이어져 있습니다. 잘못된 선을 지우고 바르게 이으세요.",
      parts: [
        UNO(["A0", "5V", "GND"]),
        { id: "pot", label: "가변저항", pins: ["1", "W", "3"] },
      ],
      start: [["pot.1", "uno.5V"], ["pot.3", "uno.GND"], ["pot.W", "uno.5V"]],
      checks: [
        { d: "가운데(W)가 A0 로 간다", link: ["pot.W", "uno.A0"] },
        { d: "가운데가 5V 에 직접 붙어 있지 않다", apart: ["pot.W", "uno.5V"], wires: true },
        { d: "한쪽 끝이 5V 에 붙는다", link: ["pot.1", "uno.5V"] },
        { d: "다른 쪽 끝이 GND 에 붙는다", link: ["pot.3", "uno.GND"] },
      ],
      ex: "가운데를 5V 에 붙이면 손잡이를 돌려도 A0 값이 변하지 않습니다. 게다가 가운데와 한쪽 끝이 같은 전위가 되어 그 구간이 합선처럼 동작해요. 가운데는 반드시 읽을 핀으로 보냅니다.",
    },
  ],
},
{
  unit: "센서 폴링·외부 인터럽트·millis 논블로킹 타이밍",
  lesson: "직접 이어 보기 — 센서와 인터럽트 핀",
  th: {
    sum: "센서 대부분은 전원(VCC)·접지(GND)·신호(OUT) 세 가닥이다. 세 가닥이 다 있어야 값을 준다.",
    body: [
      { h: "전원을 빼먹으면", t: "신호선만 잇고 VCC 를 안 걸면 센서가 아예 동작하지 않는다. 값이 0으로 고정되거나 떠다니는데, 코드를 아무리 봐도 원인이 안 보인다. 센서가 이상하면 **전원·접지·신호 세 가닥부터** 확인한다." },
      { h: "인터럽트 핀", t: "Uno 에서 외부 인터럽트를 쓸 수 있는 핀은 **D2 와 D3 뿐**이다. 다른 핀에 물리고 `attachInterrupt` 를 부르면 동작하지 않는다. 빠르게 지나가는 신호(회전 센서·엔코더)는 폴링으로 놓치기 쉬워 인터럽트 핀에 물린다." },
    ],
    code: { c: "attachInterrupt(digitalPinToInterrupt(2), onEdge, RISING);\n// Uno 는 D2·D3 만 된다", cap: "센서는 세 가닥, 인터럽트는 D2·D3" },
    key: ["센서는 VCC·GND·OUT 세 가닥", "전원을 빼먹으면 값이 안 나온다", "Uno 인터럽트는 D2·D3"],
  },
  q: [
    {
      k: "모션 센서 세 가닥 잇기",
      sol: [["pir.VCC", "uno.5V"], ["pir.GND", "uno.GND"], ["pir.OUT", "uno.D2"]],
      qq: "모션 센서를 이으세요. <b>VCC 는 5V</b>, <b>GND 는 GND</b>, <b>OUT 은 인터럽트가 되는 핀</b>에 물려야 합니다.",
      parts: [
        UNO(["D2", "D7", "5V", "GND"]),
        { id: "pir", label: "모션 센서", pins: ["VCC", "OUT", "GND"] },
      ],
      checks: [
        { d: "VCC 가 5V 에 붙는다", link: ["pir.VCC", "uno.5V"] },
        { d: "GND 가 GND 에 붙는다", link: ["pir.GND", "uno.GND"] },
        { d: "OUT 이 인터럽트 핀(D2)으로 간다", link: ["pir.OUT", "uno.D2"] },
        { d: "OUT 이 D7 에 붙어 있지 않다", apart: ["pir.OUT", "uno.D7"], wires: true },
        { d: "5V 와 GND 가 바로 붙어 있지 않다", apart: ["uno.5V", "uno.GND"], wires: true },
      ],
      ex: "Uno 에서 attachInterrupt 를 쓸 수 있는 핀은 D2 와 D3 뿐입니다. D7 에 물리면 코드가 맞아도 인터럽트가 걸리지 않아요. 그리고 VCC 를 빼먹으면 센서 자체가 안 돌아 OUT 값이 의미가 없습니다.",
    },
    {
      k: "전원을 빼먹은 배선 고치기",
      sol: [["tmp.OUT", "uno.A1"], ["tmp.VCC", "uno.5V"], ["tmp.GND", "uno.GND"]],
      qq: "온도 센서의 <b>신호선만</b> 이어져 있습니다. 값이 안 나오는 이유를 찾아 <b>빠진 두 가닥</b>을 마저 이으세요.",
      parts: [
        UNO(["A1", "5V", "GND"]),
        { id: "tmp", label: "온도 센서", pins: ["VCC", "OUT", "GND"] },
      ],
      start: [["tmp.OUT", "uno.A1"]],
      checks: [
        { d: "OUT 이 A1 로 간다", link: ["tmp.OUT", "uno.A1"] },
        { d: "VCC 가 5V 에 붙는다", link: ["tmp.VCC", "uno.5V"] },
        { d: "GND 가 GND 에 붙는다", link: ["tmp.GND", "uno.GND"] },
        { d: "VCC 와 GND 가 서로 붙어 있지 않다", apart: ["tmp.VCC", "tmp.GND"], wires: true },
      ],
      ex: "신호선만 이으면 센서에 전원이 없어 아무 값도 만들지 못합니다. A1 은 떠다니는 값을 읽어요 — 숫자가 나오니까 동작하는 것처럼 보여서 더 헷갈립니다. 센서가 이상하면 세 가닥부터 확인하세요.",
    },
  ],
},
{
  unit: "UART·I2C·SPI 통신과 전력·메모리 제약",
  lesson: "직접 이어 보기 — I2C 와 UART",
  th: {
    sum: "I2C 는 두 가닥(SDA·SCL)으로 여러 장치를 잇는다. UART 는 두 가닥이지만 **서로 엇갈려** 이어야 한다.",
    body: [
      { h: "I2C 는 같은 이름끼리", t: "SDA 는 SDA 로, SCL 은 SCL 로 잇는다. Uno 에서는 A4 가 SDA, A5 가 SCL 이다. 여러 장치를 같은 두 가닥에 나란히 붙일 수 있고, 주소로 구분한다. 접지(GND)를 공유하지 않으면 통신이 되지 않는다." },
      { h: "UART 는 엇갈려서", t: "내 TX(보내기)는 상대의 RX(받기)로, 내 RX 는 상대의 TX 로 간다. TX 를 TX 에 이으면 둘 다 말만 하고 아무도 듣지 않는다. 이것도 GND 를 공유해야 기준 전압이 맞는다." },
    ],
    code: { c: "// I2C:  SDA↔SDA, SCL↔SCL, GND 공유\n// UART: TX→RX, RX→TX, GND 공유", cap: "I2C 는 같은 이름, UART 는 엇갈려서" },
    key: ["I2C 는 SDA·SCL 같은 이름끼리", "UART 는 TX↔RX 로 엇갈리게", "어느 쪽이든 GND 를 공유한다"],
  },
  q: [
    {
      k: "I2C 디스플레이 잇기",
      sol: [["oled.SDA", "uno.A4"], ["oled.SCL", "uno.A5"], ["oled.VCC", "uno.5V"], ["oled.GND", "uno.GND"]],
      qq: "I2C 디스플레이를 이으세요. Uno 의 <b>A4 가 SDA, A5 가 SCL</b> 입니다. 전원과 접지도 함께 이어야 합니다.",
      parts: [
        UNO(["A4", "A5", "5V", "GND"]),
        { id: "oled", label: "I2C 디스플레이", pins: ["VCC", "GND", "SDA", "SCL"] },
      ],
      checks: [
        { d: "SDA 끼리 이어진다 (A4)", link: ["oled.SDA", "uno.A4"] },
        { d: "SCL 끼리 이어진다 (A5)", link: ["oled.SCL", "uno.A5"] },
        { d: "VCC 가 5V 에 붙는다", link: ["oled.VCC", "uno.5V"] },
        { d: "접지를 공유한다", link: ["oled.GND", "uno.GND"] },
        { d: "SDA 와 SCL 이 서로 붙어 있지 않다", apart: ["oled.SDA", "oled.SCL"], wires: true },
      ],
      ex: "I2C 는 같은 이름끼리 잇습니다 — SDA 를 SCL 에 물리면 통신이 되지 않아요. 그리고 두 장치가 GND 를 공유해야 신호의 기준이 맞습니다. 공유하지 않으면 값이 제멋대로 들어옵니다.",
    },
    {
      k: "UART 를 엇갈려 잇기",
      sol: [["bt.TX", "uno.RX"], ["bt.RX", "uno.TX"], ["bt.VCC", "uno.5V"], ["bt.GND", "uno.GND"]],
      qq: "블루투스 모듈을 UART 로 이으세요. <b>TX 는 RX 로, RX 는 TX 로</b> 엇갈려야 합니다. 접지도 공유합니다.",
      parts: [
        UNO(["TX", "RX", "5V", "GND"]),
        { id: "bt", label: "블루투스 모듈", pins: ["VCC", "GND", "TX", "RX"] },
      ],
      start: [["bt.TX", "uno.TX"], ["bt.RX", "uno.RX"]],
      checks: [
        { d: "모듈의 TX 가 보드의 RX 로 간다", link: ["bt.TX", "uno.RX"] },
        { d: "모듈의 RX 가 보드의 TX 로 간다", link: ["bt.RX", "uno.TX"] },
        { d: "TX 끼리 붙어 있지 않다", apart: ["bt.TX", "uno.TX"], wires: true },
        { d: "VCC 가 5V 에 붙는다", link: ["bt.VCC", "uno.5V"] },
        { d: "접지를 공유한다", link: ["bt.GND", "uno.GND"] },
      ],
      ex: "TX 를 TX 에, RX 를 RX 에 물려 놓았습니다. 둘 다 말만 하고 아무도 듣지 않아 한 글자도 오가지 않아요. 먼저 두 선을 지우고 엇갈려 다시 이으세요.",
    },
  ],
},
];
