"""문항에 붙은 코드 블록 중 '실제로 추적되는 것' 만 골라낸다.

출력 예측 문항은 재생 뷰어와 가장 잘 맞는다 — 예측하고, 틀리고, 진짜로 어떻게
도는지 본다. 하지만 코드 블록 중 상당수는 설명용 조각이라 그대로 돌지 않는다.
돌지 않는 것에 '돌려 보기' 버튼을 달면 누른 사람이 한 번 속는다.

그래서 여기서 전부 실제로 돌려 보고, 통과한 것만 허용 목록에 넣는다.
런타임 추측이 아니라 기계가 확인한 사실이다.

  python3 tools/tracer/scan_code.py            # 검사만
  python3 tools/tracer/scan_code.py --write    # data/traceable.js 생성
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "data")

MIN_STEPS = 3          # 한두 단계짜리는 슬라이더로 볼 게 없다
MAX_STEPS = 400        # 문항 예시가 이보다 길면 예시가 잘못된 것이다
TIMEOUT = 10


def unescape(s):
    prev = None
    while prev != s:
        prev = s
        s = (s.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
              .replace("&quot;", '"').replace("&#39;", "'").replace("&apos;", "'"))
    return s


def strip_html(c):
    c = re.sub(r"<br\s*/?>", "\n", c, flags=re.I)
    c = re.sub(r"</(div|p)>", "\n", c, flags=re.I)
    c = re.sub(r"<[^>]+>", "", c)
    return unescape(c)


def key(code):
    """앱과 같은 방식으로 코드 블록을 식별한다 — 공백을 지운 UTF-8 바이트의 FNV-1a 32비트.

    SHA-1 을 쓰지 않는 이유: 브라우저의 crypto.subtle 은 보안 컨텍스트에서만 돌아서
    file:// 로 연 오프라인 앱에서 못 쓴다. 같은 해시를 양쪽에서 계산할 수 있어야 한다.
    """
    n = re.sub(r"\s+", "", strip_html(code)).encode("utf8")
    h = 2166136261
    for b in n:
        h = ((h ^ b) * 16777619) & 0xFFFFFFFF
    return format(h, "08x")


def collect(path):
    """트랙 파일에서 (코드, 문항수) 를 모은다. __CR 콜백을 흉내 내지 않고 JSON 만 읽는다."""
    src = open(path, encoding="utf8").read()
    i = src.index("(")
    body = src[src.index(",", i) + 1: src.rindex(")")]
    data = json.loads(body)
    found = []

    def walk(o):
        if isinstance(o, list):
            for x in o:
                walk(x)
        elif isinstance(o, dict):
            if o.get("code") and o.get("t") in ("choice", "input"):
                found.append(strip_html(o["code"]))
            for v in o.values():
                walk(v)
    walk(data)
    return found


PROBE = r"""
import json, sys, os
sys.path.insert(0, %r)
from tracer import trace
src = json.loads(sys.stdin.read())
r = trace(src, max_steps=%d)
print(json.dumps({"steps": r["steps"], "err": r["err"], "cut": r["cut"],
                  "n": len(r["events"])}, ensure_ascii=False))
""" % (HERE, MAX_STEPS + 50)


def probe(code):
    """따로 띄운 프로세스에서 돌린다 — 무한 루프나 이상한 코드가 검사기를 죽이면 안 된다."""
    try:
        p = subprocess.run([sys.executable, "-c", PROBE], input=json.dumps(code),
                           capture_output=True, text=True, timeout=TIMEOUT, cwd=HERE)
    except subprocess.TimeoutExpired:
        return None, "시간 초과"
    if p.returncode != 0:
        return None, "추적기 실패"
    try:
        return json.loads(p.stdout.strip().splitlines()[-1]), None
    except Exception:
        return None, "결과를 읽을 수 없음"


def main():
    write = "--write" in sys.argv
    tracks = sorted(f for f in os.listdir(DATA) if f.startswith("t-") and f.endswith(".js"))
    allow, stats, reasons = set(), [], {}

    for f in tracks:
        codes = collect(os.path.join(DATA, f))
        if not codes:
            continue
        ok = 0
        for c in codes:
            k = key(c)
            if k in allow:
                ok += 1
                continue
            r, why = probe(c)
            if r is None:
                reasons[why] = reasons.get(why, 0) + 1
                continue
            if r["err"]:
                # 예외로 끝나는 코드도 좋은 교보재다 — 문법 오류만 뺀다
                if r["err"]["type"] in ("SyntaxError", "IndentationError", "TracerError"):
                    reasons["문법 오류"] = reasons.get("문법 오류", 0) + 1
                    continue
                if r["err"]["type"] in ("NameError", "ModuleNotFoundError", "ImportError"):
                    reasons["조각 코드 (정의가 없음)"] = reasons.get("조각 코드 (정의가 없음)", 0) + 1
                    continue
            if r["steps"] < MIN_STEPS:
                reasons["단계가 너무 적음"] = reasons.get("단계가 너무 적음", 0) + 1
                continue
            if r["cut"] or r["steps"] > MAX_STEPS:
                reasons["너무 김"] = reasons.get("너무 김", 0) + 1
                continue
            allow.add(k)
            ok += 1
        stats.append((f[2:-3], ok, len(codes)))

    total = sum(s[2] for s in stats)
    print("트랙별 (통과 / 코드 블록)")
    for name, ok, n in sorted(stats, key=lambda s: -s[1]):
        if n:
            print("  %-10s %4d / %4d" % (name, ok, n))
    print("\n합계 %d / %d 블록 · 서로 다른 코드 %d개" % (sum(s[1] for s in stats), total, len(allow)))
    print("뺀 이유")
    for why, n in sorted(reasons.items(), key=lambda x: -x[1]):
        print("  %-24s %d" % (why, n))

    if write:
        out = os.path.join(DATA, "traceable.js")
        body = json.dumps(sorted(allow), separators=(",", ":"))
        with open(out, "w", encoding="utf8") as fh:
            fh.write("/* 자동 생성 — tools/tracer/scan_code.py --write\n"
                     "   실제로 CPython 에서 돌려 보고 추적이 되는 코드 블록만 담았다.\n"
                     "   돌지 않는 코드에 '돌려 보기' 버튼을 달면 누른 사람이 한 번 속는다. */\n")
            fh.write("__CR('traceable', " + body + ");\n")
        print("\ndata/traceable.js · %dKB" % (len(body.encode()) // 1024))


if __name__ == "__main__":
    main()
