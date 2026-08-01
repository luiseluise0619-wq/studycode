"""재생 뷰어가 쓸 예제 트레이스를 만든다.

Pyodide 없이도 뷰어를 보여 주고 검증할 수 있어야 한다 —
'브라우저에서 파이썬이 도는가' 와 '이 화면이 이해에 도움이 되는가' 는 다른 질문이고,
두 번째를 먼저 확인해야 한다.

예제는 '초보자가 여기서 막힌다' 를 기준으로 골랐다. 문법 소개가 아니다.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tracer import trace  # noqa: E402

DEMOS = [
    {
        "id": "basic",
        "title": "값이 변수에 담기는 순간",
        "hint": "한 줄씩 넘겨 보세요. y 가 언제 생기는지, print 가 언제 찍히는지 보입니다.",
        "src": "x = 10\ny = x + 5\nprint(y)\n",
    },
    {
        "id": "range",
        "title": "range(1, 5) 는 왜 4까지만 도나",
        "hint": "가장 많이 헷갈리는 곳입니다. i 가 어떤 값들을 거치는지 직접 세어 보세요.",
        "src": "for i in range(1, 5):\n    print(i)\nprint('끝났을 때 i 는', i)\n",
    },
    {
        "id": "swap",
        "title": "두 값을 바꾸려다 둘 다 잃는 경우",
        "hint": "a 를 먼저 덮어쓰면 원래 a 값이 사라집니다. 3단계에서 무슨 일이 일어나는지 보세요.",
        "src": "a = 1\nb = 2\na = b\nb = a\nprint(a, b)\n",
    },
    {
        "id": "alias",
        "title": "리스트를 복사한 줄 알았는데",
        "hint": "b = a 는 복사가 아닙니다. b 를 바꿨는데 a 도 바뀌는 순간을 찾아보세요.",
        "src": "a = [1, 2, 3]\nb = a\nb.append(4)\nprint('a =', a)\nprint('b =', b)\n",
    },
    {
        "id": "scope",
        "title": "함수 안에서 바꾼 값이 왜 밖에 안 보이나",
        "hint": "호출할 때 깊이가 1 로 들어갔다가 돌아옵니다. 안쪽 n 과 바깥 n 은 다른 상자입니다.",
        "src": "def bump(n):\n    n = n + 1\n    return n\n\nn = 5\nbump(n)\nprint(n)\n",
    },
    {
        "id": "error",
        "title": "IndexError 가 나기 직전까지",
        "hint": "오류가 난 줄에서 멈춥니다. 그 직전에 값이 무엇이었는지 보면 원인이 보입니다.",
        "src": "nums = [10, 20, 30]\ntotal = 0\nfor i in range(4):\n    total = total + nums[i]\nprint(total)\n",
    },
]


def main():
    out = []
    for d in DEMOS:
        env = trace(d["src"], max_steps=200, run_id="demo-" + d["id"])
        env["ctx"] = {"demo": d["id"]}
        out.append({"id": d["id"], "title": d["title"], "hint": d["hint"], "env": env})
        note = " · " + env["err"]["type"] if env["err"] else ""
        print("  %-8s 단계 %3d · 이벤트 %4d%s" % (d["id"], env["steps"], len(env["events"]), note))

    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    path = os.path.join(root, "data", "trace-demo.js")
    body = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
    with open(path, "w", encoding="utf8") as f:
        f.write("/* 자동 생성 — tools/tracer/make_demo.py 를 돌려 만든다.\n"
                "   Pyodide 없이도 재생 뷰어를 보여 주고 검증하기 위한 예제 트레이스다. */\n")
        f.write("__CR('traceDemo', " + body + ");\n")
    print("data/trace-demo.js · %dKB" % (len(body.encode()) // 1024))


if __name__ == "__main__":
    main()
