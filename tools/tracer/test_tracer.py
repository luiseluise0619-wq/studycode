"""추적기 검증 — 기계가 확인한다.

파이썬 3.11 과 3.12 에서 결과가 달라지는 부분(컴프리헨션 인라인, PEP 709)은
단정하지 않는다. 버전에 따라 깨지는 테스트는 테스트가 아니라 함정이다.
"""
import json
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tracer import trace, trace_json, MAX_STEPS

FAIL = []


def ok(cond, name, extra=""):
    if cond:
        print("  ✓ " + name)
    else:
        FAIL.append(name)
        print("  ✗ " + name + ("  " + str(extra) if extra else ""))


def sets(r):
    """set 이벤트를 (이름, 값) 으로 납작하게"""
    return [(e["name"], e["to"].get("v")) for e in r["events"] if e["e"] == "set"]


def ev(r, kind):
    return [e for e in r["events"] if e["e"] == kind]


def lines(r):
    return [e["line"] for e in ev(r, "step")]


def depths(r):
    return [e["d"] for e in ev(r, "step")]


print("기본")
r = trace("x = 10\ny = x + 5\nprint(y)")
ok(r["err"] is None, "오류 없이 끝난다", r["err"])
ok(r["out"].strip() == "15", "표준출력을 잡는다", r["out"])
ok(lines(r)[:3] == [1, 2, 3], "줄 번호가 1,2,3", lines(r))
ok(("x", 10) in sets(r) and ("y", 15) in sets(r), "변수 변화가 기록된다", sets(r))
ok(any(e.get("from", {}).get("v") is None for e in ev(r, "set")), "처음 생긴 변수에는 from 이 없다")
ok(any(e["text"] == "15\n" for e in ev(r, "out")), "출력이 out 이벤트로 나온다")

print("\n바뀐 것만 보낸다")
r = trace("a = 1\nb = 2\na = 1\nb = 3")
names = [e["name"] for e in ev(r, "set")]
ok(names.count("a") == 1, "a 는 한 번만 기록된다 (같은 값 재대입 무시)", names)
ok(("b", 3) in sets(r), "달라진 값은 기록한다", sets(r))

print("\n값의 모양")
r = trace("n=1\nf=1.5\ns='hi'\nl=[1,2]\nd={'a':1}\nt=(1,)\nst={1,2}\nb=True\nz=None\n")
kinds = {e["name"]: e["to"]["k"] for e in ev(r, "set")}
ok(kinds.get("n") == "int" and kinds.get("f") == "float", "숫자", kinds)
ok(kinds.get("s") == "str" and kinds.get("b") == "bool" and kinds.get("z") == "none", "문자열·불·널", kinds)
ok(kinds.get("l") == "list" and kinds.get("t") == "tuple", "리스트·튜플", kinds)
ok(kinds.get("d") == "dict" and kinds.get("st") == "set", "딕셔너리·집합", kinds)

print("\n함수 호출")
r = trace("def add(a, b):\n    return a + b\nr = add(2, 3)\nprint(r)")
ok(ev(r, "call") and ev(r, "ret"), "call·ret 이벤트가 있다")
ok(any(a.get("v") == 2 for c in ev(r, "call") for a in c.get("args", [])),
   "호출 시 인자가 기록된다", ev(r, "call"))
ok(any(e["to"].get("v") == 5 for e in ev(r, "ret")), "반환값이 기록된다", ev(r, "ret"))
ok(max(depths(r)) >= 1, "호출 깊이가 올라간다")
ok(depths(r)[-1] == 0, "마지막 단계는 모듈 깊이 0", depths(r)[-1])

print("\n재귀 — 프레임이 섞이지 않는다")
r = trace("def f(n):\n    if n <= 1:\n        return 1\n    return n * f(n-1)\nprint(f(4))")
ok(r["out"].strip() == "24", "결과가 맞다", r["out"])
ns = [v for k, v in sets(r) if k == "n"]
ok(ns == [4, 3, 2, 1], "재귀 각 단계의 n 이 따로 기록된다", ns)
ok(max(depths(r)) == 4, "최대 깊이 4 (모듈은 0)", max(depths(r)))

print("\n예외")
r = trace("a = [1, 2]\nprint(a[5])")
ok(r["err"] and r["err"]["type"] == "IndexError", "예외 종류를 잡는다", r["err"])
ok(r["err"]["line"] == 2, "예외가 난 줄을 잡는다", r["err"])
ok(ev(r, "throw"), "예외 이벤트가 남는다")

r = trace("x = (")
ok(r["err"] and r["err"]["type"] == "SyntaxError", "문법 오류를 구분한다", r["err"])
ok(r["events"] == [] and r["steps"] == 0, "문법 오류면 단계가 없다")

r = trace("import sys\nsys.exit(3)")
ok(r["err"] and r["err"]["type"] == "SystemExit", "SystemExit 도 기록만 하고 죽지 않는다", r["err"])

print("\n상한과 크기")
r = trace("t = 0\nfor i in range(100000):\n    t += i\n", max_steps=500)
ok(r["cut"] is True, "상한에서 잘린다")
ok(r["steps"] <= 500, "상한을 넘지 않는다", r["steps"])
size = len(json.dumps(r, ensure_ascii=False).encode())
ok(size < 120 * 1024, "500단계가 120KB 미만", str(size // 1024) + "KB")

r = trace("a = list(range(5000))\nb = list(map(lambda x: x * 2, a))\nprint(len(b))")
ok(r["out"].strip() == "5000", "큰 리스트도 끝까지 돈다", r["out"])
big = [v for k, v in sets(r) if k == "a"]
ok(big and len(big[0]) <= 50, "큰 리스트는 앞부분만 담는다", len(big[0]) if big else None)
size = len(json.dumps(r, ensure_ascii=False).encode())
ok(size < 160 * 1024, "큰 리스트 추적이 160KB 미만", str(size // 1024) + "KB")

print("\n표준입력")
r = trace("s = input()\nprint('안녕 ' + s)", stdin="세계\n")
ok(r["out"].strip() == "안녕 세계", "input() 이 주어진 값을 읽는다", r["out"])

print("\n추적기가 자기 자신을 추적하지 않는다")
r = trace("x = 1")
ok(all(e["fn"] == "<module>" for e in ev(r, "step")), "사용자 프레임만 남는다",
   set(e["fn"] for e in ev(r, "step")))

print("\n부작용 복구")
before_trace, before_out = sys.gettrace(), sys.stdout
trace("a = [1,2]\nprint(a[9])")
ok(sys.gettrace() is before_trace, "추적 함수가 복구된다")
ok(sys.stdout is before_out, "표준출력이 복구된다")

print("\nJSON 진입점")
j = trace_json("x = 1\nprint(x)")
d = json.loads(j)
ok(d["v"] == 1 and d["lang"] == "python", "스키마 버전과 언어 표시")
ok(isinstance(j, str), "문자열을 돌려준다")

print("\n스키마 적합성 (JS 검증기)")
import subprocess, tempfile, os as _os
CASES = ["x = 10\ny = x + 5\nprint(y)",
         "def f(n):\n    return 1 if n < 2 else n * f(n-1)\nprint(f(5))",
         "a = [1,2]\nprint(a[5])",
         "x = (",
         "t = 0\nfor i in range(500):\n    t += i",
         "d = {'a': [1,2], 'b': None}\ns = {1,2}\nc = 1+2j\n"]
bad = 0
for i, c in enumerate(CASES):
    env = json.loads(trace_json(c, max_steps=300))
    fp = _os.path.join(tempfile.gettempdir(), "cr_env_%d.json" % i)
    with open(fp, "w", encoding="utf8") as f:
        json.dump(env, f, ensure_ascii=False)
    p = subprocess.run(["node", _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "schema.cjs"), fp],
                       capture_output=True, text=True)
    if p.returncode != 0:
        bad += 1
        print("  ✗ 사례 %d\n%s" % (i, p.stdout.strip()[:600]))
    _os.unlink(fp)
ok(bad == 0, "%d개 봉투가 모두 스키마 v1 을 통과한다" % len(CASES))

print("\n" + ("전부 통과" if not FAIL else str(len(FAIL)) + "건 실패: " + ", ".join(FAIL)))
sys.exit(1 if FAIL else 0)
