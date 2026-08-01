"""CodeRun 실행 추적기 — 사용자 파이썬 코드를 한 줄씩 되감아 볼 수 있게 만든다.

여기서 만드는 이벤트 하나가 두 가지 일을 한다.
  1. 화면: 슬라이더로 되감는 재생 프레임
  2. 데이터: 나중에 학습 분석에 쓰는 기록
둘을 따로 만들면 반드시 어긋나므로 스키마를 하나로 둔다.

설계 원칙
  · 바뀐 것만 보낸다        — 매 줄 전체 지역변수를 찍으면 반복문에서 폭발한다
  · 값에 '모양' 을 붙인다    — 뷰를 언어가 아니라 모양으로 고르기 위해서다
  · 상한을 둔다             — 무한 루프가 브라우저를 죽이면 안 된다
  · 실패해도 앱을 막지 않는다 — 추적이 안 되면 결과만 보여 주면 된다

Pyodide(파이썬 3.12)와 CPython 3.11 양쪽에서 돈다. 다만 컴프리헨션은 3.12 에서
인라인되어(PEP 709) 별도 프레임이 생기지 않으므로, 그 내부 단계는 버전에 따라 다르다.
"""
import sys, io, json, time

SCHEMA = 1
MAX_STEPS = 1000        # 슬라이더로 훑을 수 있는 현실적 한계. 넘으면 cut 으로 알린다.
                        # (반복문을 접어 보여 주는 것은 v2 과제다 — 500번 도는 루프를
                        #  1500 프레임으로 펴 놓는 것은 아무도 못 본다)
MAX_STR = 200
MAX_SEQ = 50
MAX_MAP = 30
MAX_REPR = 80
FNAME = "<cr>"          # 사용자 코드에만 붙이는 표식. 추적기 자신은 걸리지 않는다


def shape(v):
    """값을 '모양 + 내용' 으로 바꾼다. 뷰는 이 모양만 보고 그린다."""
    try:
        if v is None:
            return {"k": "none"}
        if v is True or v is False:
            return {"k": "bool", "v": v}
        if isinstance(v, int):
            return {"k": "int", "v": v}
        if isinstance(v, float):
            return {"k": "float", "v": v}
        if isinstance(v, str):
            return {"k": "str", "v": v[:MAX_STR], "n": len(v),
                    "cut": len(v) > MAX_STR}
        if isinstance(v, (list, tuple)):
            return {"k": "list" if isinstance(v, list) else "tuple",
                    "v": [_brief(x) for x in v[:MAX_SEQ]], "n": len(v),
                    "cut": len(v) > MAX_SEQ}
        if isinstance(v, (set, frozenset)):
            items = list(v)[:MAX_SEQ]
            return {"k": "set", "v": [_brief(x) for x in items], "n": len(v),
                    "cut": len(v) > MAX_SEQ}
        if isinstance(v, dict):
            ks = list(v.keys())[:MAX_MAP]
            return {"k": "dict", "v": [[_brief(a), _brief(v[a])] for a in ks],
                    "n": len(v), "cut": len(v) > MAX_MAP}
        if callable(v):
            return {"k": "fn", "v": getattr(v, "__name__", "?")}
        return {"k": "obj", "v": _brief(v), "t": type(v).__name__}
    except Exception:
        return {"k": "obj", "v": "<표현할 수 없음>"}


def _brief(x):
    try:
        s = repr(x)
    except Exception:
        return "<?>"
    return s[:MAX_REPR] + ("…" if len(s) > MAX_REPR else "")


def _locals_of(frame):
    out = {}
    for k, v in list(frame.f_locals.items()):
        if k.startswith("__"):
            continue
        out[k] = shape(v)
    return out


def _diff(old, cur):
    """직전 지역변수와 비교해 set/del 이벤트를 만든다. from 이 있으면 '이 값에서 저 값으로'."""
    out = []
    for k, v in cur.items():
        if old.get(k) != v:
            ev = {"e": "set", "name": k, "to": v}
            if k in old:
                ev["from"] = old[k]
            out.append(ev)
    for k in old:
        if k not in cur:
            out.append({"e": "del", "name": k})
    return out


def trace(src, max_steps=MAX_STEPS, stdin="", ctx=None, run_id=None):
    """소스를 실행하며 단계 기록을 만든다. 항상 dict 를 돌려주고 예외를 밖으로 내보내지 않는다."""
    t0 = time.time()
    run_id = run_id or ("r-" + format(int(t0 * 1000), "x") + "-" + format(abs(hash(src)) % 0xfffff, "x"))
    events = []
    state = {"cut": False, "depth": 0, "s": -1, "n": 0}
    prev = {}                      # id(frame) -> 직전 지역변수 (재귀에서도 섞이지 않는다)
    buf = io.StringIO()
    seen_out = [0]

    def take_out():
        s = buf.getvalue()
        add = s[seen_out[0]:]
        seen_out[0] = len(s)
        return add

    def emit(**kw):
        kw["s"] = state["s"]
        events.append(kw)

    def step(frame, extras):
        """단계 하나를 연다. step 이벤트가 먼저 나오고 그 단계의 사건들이 뒤에 붙는다."""
        if state["n"] >= max_steps:
            state["cut"] = True
            sys.settrace(None)
            return False
        state["s"] = state["n"]
        state["n"] += 1
        emit(e="step", line=frame.f_lineno, fn=frame.f_code.co_name, d=state["depth"])
        add = take_out()
        if add:
            emit(e="out", text=add[:MAX_STR * 8])
        for ev in extras:
            emit(**ev)
        return True

    def tr(frame, ev, arg):
        if frame.f_code.co_filename != FNAME:
            return None
        is_mod = frame.f_code.co_name == "<module>"
        if ev == "call":
            if is_mod:                       # 모듈 진입은 사용자에게 보여 줄 사건이 아니다
                prev[id(frame)] = _locals_of(frame)
                state["mod"] = frame
                return tr
            state["depth"] += 1
            args = _locals_of(frame)
            prev[id(frame)] = args
            extras = [{"e": "call", "name": frame.f_code.co_name,
                       "args": [v for v in args.values()]}]
            extras += [{"e": "set", "name": k, "to": v} for k, v in args.items()]
            if not step(frame, extras):
                return None
            return tr
        if ev == "line":
            cur = _locals_of(frame)
            old = prev.get(id(frame), {})
            prev[id(frame)] = cur
            if not step(frame, _diff(old, cur)):
                return None
            return tr
        if ev == "return":
            if is_mod:
                # 모듈 종료는 아래 'end' 단계로 대신한다. 여기서 prev 를 갱신하면
                # 최종 상태끼리 비교하게 되어 마지막 문장의 효과가 사라진다.
                return tr
            cur = _locals_of(frame)
            old = prev.get(id(frame), {})
            step(frame, _diff(old, cur) + [{"e": "ret", "to": shape(arg)}])
            prev.pop(id(frame), None)
            state["depth"] = max(0, state["depth"] - 1)
            return tr
        if ev == "exception":
            step(frame, [{"e": "throw", "name": getattr(arg[0], "__name__", "Error"),
                          "msg": str(arg[1])[:MAX_STR]}])
            return tr
        return tr

    err = None
    gvars = {"__name__": "__main__"}
    so, si = sys.stdout, sys.stdin
    sys.stdout = buf
    sys.stdin = io.StringIO(stdin)
    try:
        code = compile(src, FNAME, "exec")
    except SyntaxError as e:
        sys.stdout, sys.stdin = so, si
        return {"v": SCHEMA, "run": run_id, "lang": "python", "at": int(t0 * 1000),
                "src": src, "ctx": ctx, "events": [], "steps": 0, "out": "",
                "err": {"type": "SyntaxError", "msg": str(e.msg), "line": e.lineno or 0},
                "cut": False, "ms": 0}
    try:
        sys.settrace(tr)
        exec(code, gvars)
    except BaseException as e:            # SystemExit·KeyboardInterrupt 도 잡아 기록만 한다
        tb = sys.exc_info()[2]
        line = 0
        while tb:
            if tb.tb_frame.f_code.co_filename == FNAME:
                line = tb.tb_lineno
            tb = tb.tb_next
        err = {"type": type(e).__name__, "msg": str(e)[:MAX_STR], "line": line}
    finally:
        sys.settrace(None)
        sys.stdout, sys.stdin = so, si

    # 줄 이벤트는 그 줄을 '실행하기 전' 에 온다. 그래서 마지막 문장의 결과는
    # 어떤 줄 이벤트에도 담기지 않는다 — 여기서 한 단계를 더 만들어 채운다.
    gl = {k: v for k, v in gvars.items() if not k.startswith("__")}
    final = {k: shape(v) for k, v in gl.items()}
    modf = state.get("mod")
    old = prev.get(id(modf), {}) if modf is not None else {}
    chg = {k: v for k, v in final.items() if old.get(k) != v}
    tail = take_out()
    if (chg or tail) and state["n"] < max_steps:
        last_line = 0
        for e in reversed(events):
            if e["e"] == "step":
                last_line = e["line"]
                break
        state["s"] = state["n"]
        state["n"] += 1
        emit(e="step", line=last_line, fn="<module>", d=0)
        if tail:
            emit(e="out", text=tail[:MAX_STR * 8])
        for k, v in chg.items():
            ev = {"e": "set", "name": k, "to": v}
            if k in old:
                ev["from"] = old[k]
            events.append(dict(ev, s=state["s"]))

    return {"v": SCHEMA, "run": run_id, "lang": "python", "at": int(t0 * 1000),
            "src": src, "ctx": ctx, "events": events, "steps": state["n"],
            "out": buf.getvalue(), "err": err, "cut": state["cut"],
            "ms": int((time.time() - t0) * 1000)}


def trace_json(src, max_steps=MAX_STEPS, stdin="", ctx=None, run_id=None):
    """Pyodide 에서 부르는 진입점. 문자열만 오가면 타입 변환 사고가 없다."""
    try:
        return json.dumps(trace(src, max_steps, stdin, ctx, run_id), ensure_ascii=False)
    except Exception as e:
        return json.dumps({"v": SCHEMA, "run": run_id or "r-0", "lang": "python",
                           "at": 0, "src": src, "ctx": ctx, "events": [], "steps": 0, "out": "",
                           "err": {"type": "TracerError", "msg": str(e)[:200], "line": 0},
                           "cut": False, "ms": 0}, ensure_ascii=False)
