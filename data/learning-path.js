/* LearningPath: recommendations are a starting point, never a lock or a job title.
   All functions leave their inputs unchanged. Existing progress keys stay intact.
   Browser: window.LearningPath. Node: require('./data/learning-path.js'). */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LearningPath = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var EXPERIENCES = [
    { id: 'new', label: '처음이에요', description: '코드를 처음 보거나, 어디서 시작할지 모르겠어요.', level: 1 },
    { id: 'basic', label: '기초는 알아요', description: '변수와 조건문을 알고, 짧은 코드를 읽을 수 있어요.', level: 2 },
    { id: 'working', label: '만들어 봤어요', description: '작은 프로그램을 만들었고, 실무 감각을 키우고 싶어요.', level: 3 },
    { id: 'advanced', label: '더 깊게 배우고 싶어요', description: '개발 경험이 있고, 성능·설계·문제 해결을 연습하고 싶어요.', level: 4 }
  ];
  var LEVELS = [
    { level: 1, name: '처음', outcome: '짧은 코드를 읽고 직접 실행하기' },
    { level: 2, name: '기초', outcome: '함수와 데이터를 다뤄 작은 기능 만들기' },
    { level: 3, name: '응용', outcome: '여러 기능을 연결하고 오류를 고치기' },
    { level: 4, name: '실무', outcome: '테스트·성능·운영을 생각하며 구현하기' },
    { level: 5, name: '심화', outcome: '설계의 선택과 비용을 설명하고 검증하기' }
  ];
  var PATHS = {
    free: [['python', 'web', 'sql'], ['python', 'javascript', 'sql', 'git'], ['backend', 'react', 'pandas', 'test'], ['sysd', 'security', 'devops', 'cloud'], ['sysd', 'compiler', 'mleval']],
    fullstack: [['web', 'javascript'], ['javascript', 'web', 'sql', 'git'], ['react', 'backend', 'test'], ['backend', 'sysd', 'security', 'devops'], ['sysd', 'devops', 'security']],
    frontend: [['web', 'javascript'], ['javascript', 'web', 'git'], ['react', 'test'], ['react', 'web', 'security'], ['react', 'sysd', 'test']],
    backend: [['python', 'web'], ['python', 'sql', 'git'], ['backend', 'net', 'test'], ['sysd', 'security', 'devops'], ['sysd', 'cloud', 'security']],
    ai: [['python'], ['python', 'sql', 'math'], ['numpy', 'pandas', 'stat'], ['ml', 'mleval', 'dl'], ['mleval', 'dl', 'sysd']],
    ds: [['python', 'sql'], ['python', 'sql', 'math'], ['pandas', 'numpy', 'stat'], ['ml', 'mleval'], ['mleval', 'ml', 'dbt']],
    data: [['sql', 'python'], ['sql', 'python', 'stat'], ['pandas', 'numpy', 'stat'], ['dbt', 'ml'], ['dbt', 'mleval', 'sysd']]
  };
  var BASE_LEVEL = {
    python: 1, javascript: 1, web: 1, sql: 1, git: 1, c: 1, cpp: 1, java: 1,
    go: 1, rust: 1, php: 1, arduino: 1, code: 1, algo: 1, linux: 1,
    react: 2, backend: 2, pandas: 2, numpy: 2, stat: 2, cs: 2, os: 2,
    net: 2, math: 2, test: 2, mobile: 2, fp: 2, cloud: 2,
    sysd: 3, dbt: 3, ml: 3, security: 3, devops: 3, arch: 3, ai: 3,
    compiler: 4, dl: 4, mleval: 4
  };
  var PRACTICE_TYPES = ['code', 'py', 'sql', 'html', 'react', 'ts', 'sim', 'arch', 'wire'];
  var MAX_RECENT = 240;
  var MAX_TRACK_SAMPLE = 40;
  var RECENT_DAYS = 21;

  function finite(n, fallback) { return typeof n === 'number' && isFinite(n) ? n : fallback; }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function level(n, fallback) { return clamp(Math.round(finite(n, fallback || 1)), 1, 5); }
  function validDay(day) {
    if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
    var parsed = Date.parse(day + 'T00:00:00Z');
    return isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === day ? day : null;
  }
  function dayNumber(day) { return validDay(day) ? Date.parse(day + 'T00:00:00Z') / 86400000 : null; }
  function plain(s) { return String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
  function hash(s) {
    var n = 5381;
    for (var i = 0; i < s.length; i++) n = ((n * 33) ^ s.charCodeAt(i)) >>> 0;
    return n.toString(36);
  }
  function experience(id) { return EXPERIENCES.find(function (e) { return e.id === id; }) || EXPERIENCES[0]; }
  function profile(state) {
    var src = state && state.learning || {};
    var exp = experience(src.experience);
    return {
      version: 1,
      configured: src.configured === true,
      experience: exp.id,
      startingLevel: exp.level,
      minutes: [10, 20, 30].indexOf(src.minutes) >= 0 ? src.minutes : 10,
      totalAnswers: Math.max(0, Math.floor(finite(src.totalAnswers, 0))),
      baselineAfter: Math.max(0, Math.floor(finite(src.baselineAfter, 0))),
      trackLevels: Object.assign({}, src.trackLevels || {}),
      recent: Array.isArray(src.recent) ? src.recent.slice(-MAX_RECENT) : [],
      lastAdjustment: src.lastAdjustment || null
    };
  }
  function configure(state, options) {
    options = options || {};
    var p = profile(state);
    if (options.experience && experience(options.experience).id === options.experience) {
      if (p.experience !== options.experience) {
        p.trackLevels = {};
        p.baselineAfter = p.totalAnswers;
        p.lastAdjustment = null;
      }
      p.experience = options.experience;
      p.startingLevel = experience(p.experience).level;
    }
    if ([10, 20, 30].indexOf(options.minutes) >= 0) p.minutes = options.minutes;
    p.configured = true;
    return Object.assign({}, state || {}, { learning: p });
  }
  function currentLevel(state, track) {
    var p = profile(state), setting = p.trackLevels[track];
    return level(setting && (typeof setting === 'number' ? setting : setting.level), p.startingLevel);
  }
  function questionId(q) {
    q = q || {};
    if (typeof q.qid === 'string' && /^[a-z0-9]+$/.test(q.qid)) return q.qid;
    return hash([q.t || 'choice', q.k || '', q.q || '', q.code || '', q.src || '', JSON.stringify(q.o || [])].join('\u0001'));
  }
  function lessonId(track, unit, lesson) {
    return track + ':' + hash(String(unit && (unit.title || unit.t) || '') + '  ' + String(lesson && (lesson.title || lesson.t) || ''));
  }
  function explicitLevel(obj) {
    if (!obj) return null;
    for (var i = 0, keys = ['d', 'lv', 'level', 'difficulty']; i < keys.length; i++) {
      if (typeof obj[keys[i]] === 'number' && isFinite(obj[keys[i]])) return level(obj[keys[i]], 1);
    }
    return null;
  }
  function titleLevel(title, track) {
    var base = BASE_LEVEL[track] || 1, s = plain(title);
    if (/시니어|스태프|프린시펄|\bStaff\b|\bPrincipal\b/i.test(s)) return 5;
    if (/코드\s*리뷰|로그\s*분석|설계\s*면접|장애|병목|분산|샤딩|일관성|멱등|백프레셔|CPython|바이트코드|커널|메모리\s*모델/i.test(s)) return Math.max(base, 4);
    if (/동시성|비동기|async|await|아키텍처|프로파일|최적화|성능|인덱스|트랜잭션|데드락|GIL|가비지|라이프타임|소유권|커넥션|인증|OAuth|JWT|FastAPI|심화|고차|클로저|데코레이터|제너레이터|실행\s*채점|직접\s*구현|챌린지|함정|가변\s*기본|별칭|늦은\s*바인딩|얕은\s*복사|단락\s*평가|실무\s*운영|릴리스|재해\s*복구|롤백|관측|부하/i.test(s)) return Math.max(base, 3);
    if (/함수|딕셔너리|클래스|객체|문자열|튜플|집합|배열|컴프리헨션|조인|\bJOIN\b|GROUP BY|집계|예외|재귀|정렬|파일\s*입출력|포인터|구조체|모듈|테스트|패턴|정규표현식|타입힌트/i.test(s)) return Math.max(base, 2);
    if (/첫걸음|첫\s*걸음|입문|처음|시작하기|출력|print|변수|자료형|조건문|반복문|리스트\s*(다루기|기초)|화면|태그|선택자|SELECT|WHERE|커밋|값에\s*이름|기초|기본/i.test(s)) return base;
    return null;
  }
  function lessonLevel(unit, lesson, track) {
    var declared = explicitLevel(lesson) || explicitLevel(unit);
    if (declared) return declared;
    var qs = lesson && (lesson.q || lesson.questions) || [];
    var levels = qs.map(explicitLevel).filter(function (n) { return n !== null; }).sort(function (a, b) { return a - b; });
    if (levels.length >= Math.max(1, Math.ceil(qs.length / 2))) return levels[Math.floor(levels.length / 2)];
    // Content and its prerequisites decide difficulty; array position and XP do not.
    var fromLesson = titleLevel(lesson && (lesson.title || lesson.t), track);
    var fromUnit = titleLevel(unit && (unit.title || unit.t), track);
    return fromLesson || fromUnit ? Math.max(fromLesson || 1, fromUnit || 1) : Math.max(BASE_LEVEL[track] || 1, 2);
  }
  function questionLevel(q, unit, lesson, track) { return explicitLevel(q) || lessonLevel(unit, lesson, track); }
  function estimateMinutes(lesson, lev) {
    var qs = lesson && (lesson.q || lesson.questions) || [];
    var count = qs.length || finite(lesson && lesson.n, 5);
    var practical = qs.filter(function (q) { return PRACTICE_TYPES.indexOf(q.t) >= 0; }).length;
    var total = 2 + count * (level(lev, 2) <= 2 ? 0.8 : 1.15) + practical * 1.25;
    return clamp(Math.ceil(total), 4, 30);
  }
  function flatten(courses, track) {
    var course = courses && courses[track];
    var rows = [];
    if (!course) return rows;
    (course.units || []).forEach(function (u, ui) {
      (u.lessons || []).forEach(function (l, li) {
        var lev = lessonLevel(u, l, track);
        rows.push({ track: track, ui: ui, li: li, id: lessonId(track, u, l), title: l.title,
          unitTitle: u.title, level: lev, minutes: estimateMinutes(l, lev), order: rows.length });
      });
    });
    return rows;
  }
  function recentEvidence(state, track, options) {
    options = options || {};
    var p = profile(state), active = currentLevel(state, track), setting = p.trackLevels[track];
    var after = Math.max(p.baselineAfter, finite(setting && setting.after, 0));
    var todayN = dayNumber(options.today), unique = new Set(), lessons = new Set();
    var rows = p.recent.filter(function (r) {
      if (!r || r.track !== track || !(r.seq > after) || r.review || level(r.level, 1) < active) return false;
      var dn = dayNumber(r.day);
      return todayN === null || dn === null || (dn <= todayN && todayN - dn <= RECENT_DAYS);
    }).slice(-MAX_TRACK_SAMPLE);
    var ok = 0, hints = 0, known = 0, practice = 0;
    rows.forEach(function (r) {
      if (r.correct === true) ok++;
      if (typeof r.hinted === 'boolean') { known++; if (r.hinted) hints++; }
      if (r.questionId) unique.add(r.questionId);
      if (r.lessonId) lessons.add(r.lessonId);
      if (r.practice && r.correct === true && r.hinted === false) practice++;
    });
    var tail = rows.slice(-6), tailOk = tail.filter(function (r) { return r.correct === true; }).length;
    return { count: rows.length, correct: ok, accuracy: rows.length ? ok / rows.length : null,
      hinted: hints, hintRate: known ? hints / known : null, hintKnown: known,
      uniqueQuestions: unique.size, lessons: lessons.size, independentPractice: practice,
      recentAccuracy: tail.length ? tailOk / tail.length : null };
  }
  function difficulty(state, track, options) {
    var current = currentLevel(state, track), ev = recentEvidence(state, track, options);
    var target = current, action = 'steady', reason = '지금 단계에서 새 개념 하나를 익혀 보세요.';
    if (ev.count < 8) reason = '몇 문제만으로 실력을 단정하지 않아요. 지금 단계에서 천천히 맞춰 갈게요.';
    else if (current > 1 && ev.uniqueQuestions >= 4 &&
      ((ev.accuracy < 0.6 && ev.recentAccuracy < 0.6) || (ev.hintKnown >= 8 && ev.hintRate > 0.6))) {
      target--; action = 'ease'; reason = '막히는 부분이 있어요. 한 단계 쉬운 예제로 다시 연결해 보세요.';
    } else if (current < 5 && ev.count >= 12 && ev.uniqueQuestions >= 6 && ev.lessons >= 2 &&
      ev.accuracy >= 0.85 && ev.recentAccuracy >= 0.8 && ev.hintKnown === ev.count && ev.hintRate <= 0.2 &&
      (current < 3 || ev.independentPractice >= 3)) {
      target++; action = 'advance'; reason = '여러 문제를 혼자 해결했어요. 다음 단계의 짧은 레슨을 추천해요.';
    } else if (ev.hintRate !== null && ev.hintRate > 0.2) {
      reason = '힌트로 이해한 내용을, 다음에는 힌트 없이 한 번 더 풀어 보세요.';
    } else if (ev.count >= 12 && ev.accuracy >= 0.85) {
      reason = current >= 3 && ev.independentPractice < 3 ?
        '개념은 잘 이해하고 있어요. 코드를 직접 작성해 확인해 보세요.' :
        '잘 풀고 있어요. 다른 레슨에서도 같은 내용을 스스로 꺼내 보세요.';
    }
    return { level: target, currentLevel: current, targetLevel: target, name: LEVELS[target - 1].name,
      action: action, reason: reason, evidence: ev };
  }
  function recordAnswer(state, answer) {
    answer = answer || {};
    if (!answer.track || typeof answer.correct !== 'boolean') return state;
    var p = profile(state), seq = p.totalAnswers + 1;
    var row = { seq: seq, track: String(answer.track), lessonId: answer.lessonId || null,
      questionId: answer.questionId || null, level: level(answer.level, currentLevel(state, answer.track)),
      correct: answer.correct, hinted: typeof answer.hinted === 'boolean' ? answer.hinted : null,
      review: !!answer.review, practice: answer.practice === true || PRACTICE_TYPES.indexOf(answer.type) >= 0,
      day: validDay(answer.day) };
    p.totalAnswers = seq;
    p.recent = p.recent.concat([row]).slice(-MAX_RECENT);
    var next = Object.assign({}, state || {}, { learning: p });
    var change = difficulty(next, row.track, { today: row.day });
    if (change.targetLevel !== change.currentLevel) {
      p.trackLevels[row.track] = { level: change.targetLevel, after: seq };
      p.lastAdjustment = { track: row.track, from: change.currentLevel, to: change.targetLevel,
        reason: change.reason, day: row.day, seq: seq };
    }
    return next;
  }
  function stages(state, courses) {
    var path = PATHS[state && state.goal] || PATHS.free;
    return LEVELS.map(function (s, i) {
      return { level: s.level, name: s.name, outcome: s.outcome, unlocked: true,
        tracks: path[i].filter(function (key) { return !!(courses && courses[key]); }) };
    });
  }
  function recommendedTracks(state, courses, lev) {
    var rows = stages(state, courses), active = level(lev, profile(state).startingLevel);
    var list = rows[active - 1].tracks;
    if (!list.length) list = rows.reduce(function (all, s) { return all.concat(s.tracks); }, []);
    if (!list.length) list = Object.keys(courses || {});
    return list.filter(function (id, i) { return list.indexOf(id) === i; }).slice(0, 4);
  }
  function chooseLesson(state, courses, track, options) {
    options = options || {};
    var target = level(options.level, difficulty(state, track, options).targetLevel);
    var rows = flatten(courses, track), done = state && state.done || {};
    var unseen = rows.filter(function (r) { return !done[r.id] && !done[r.track + '-' + r.ui + '-' + r.li]; });
    var candidates = unseen.length ? unseen : rows;
    var p = profile(state);
    var checks=state&&state.lessonChecks||{};
    var recover=rows.filter(function(r){return done[r.id]&&checks[r.id]&&checks[r.id].accuracy<80&&r.level<=target;});
    var foundation = p.experience === 'new' && unseen.length && target <= 2 ? unseen.filter(function (r) {
      return r.level === 1 && /첫걸음|첫\s*걸음|입문|반복과 데이터|HTML 기초|CSS 기초|기본 조회|Git 첫걸음/.test(r.unitTitle || '');
    }) : [];
    if (foundation.length) candidates = foundation;
    if (recover.length) candidates=recover;
    function score(r) {
      // A shorter later lesson must not jump ahead of its prerequisites.
      // Time decides where to pause in a lesson, not what the learner skips.
      return r.level <= target ? (target - r.level) * 25 : (r.level - target) * 100;
    }
    candidates = candidates.slice().sort(function (a, b) { return score(a) - score(b) || a.order - b.order; });
    if (!candidates.length) return null;
    var result = Object.assign({}, candidates[0]);
    result.review = recover.length>0 || !unseen.length;
    result.split = !!options.minutes && result.minutes > options.minutes;
    result.reason = result.review ? '배운 내용을 다시 꺼내 보는 복습이에요.' :
      foundation.length ? '다음 내용을 읽는 데 필요한 기초부터 연결해요.' :
      result.level > target ? '이 트랙은 선수 지식이 필요해요. 개념부터 짧게 확인하세요.' : '지금 단계에 맞는 다음 레슨이에요.';
    return result;
  }
  function recommendation(state, courses, options) {
    options = options || {};
    var p = profile(state), tracks = recommendedTracks(state, courses, p.startingLevel);
    var track = options.track && courses && courses[options.track] ? options.track : tracks[0];
    if (!track) return { profile: p, tracks: [], stages: stages(state, courses), lesson: null, steps: [], minutes: p.minutes };
    var diff = difficulty(state, track, options), minutes = p.minutes;
    var rows = flatten(courses, track), done = state && state.done || {};
    var learned = rows.filter(function (r) { return !!done[r.id] || !!done[r.track + '-' + r.ui + '-' + r.li]; });
    var wrongs = Array.isArray(state && state.wrongs) ? state.wrongs : [];
    var day = validDay(options.today);
    var due = wrongs.filter(function (w) { return w && (!w.due || !day || w.due <= day); });
    var reviewMinutes = due.length || learned.length ? Math.round(minutes * 0.2) : 0;
    var reflectMinutes = minutes === 30 ? 3 : 2;
    var learnMinutes = minutes - reviewMinutes - reflectMinutes;
    var lesson = chooseLesson(state, courses, track, { level: diff.targetLevel, minutes: learnMinutes, today: day });
    var resume = state && state.studyResume;
    if (resume && resume.track === track && (resume.next > 0 || resume.resumeCurrent)) {
      var interrupted = rows.find(function (r) { return r.id === resume.id && (!done[r.id]||resume.resumeCurrent); });
      if (interrupted) lesson = Object.assign({}, interrupted, { review: false,
        split: interrupted.minutes > learnMinutes, reason: resume.resumeCurrent?'작성하던 문제부터 이어서 배워요.':'확인한 문제 다음부터 이어서 배워요.' });
    }
    var checks=state&&state.lessonChecks||{};
    var refreshPool=learned.filter(function (r) { return r.level <= Math.max(1, diff.targetLevel - 1); });
    if(!refreshPool.length)refreshPool=learned;
    var refresh = refreshPool.slice().sort(function(a,b){return finite(checks[a.id]&&checks[a.id].seq,0)-finite(checks[b.id]&&checks[b.id].seq,0)||a.order-b.order;})[0] || null;
    var review = { kind: due.length ? 'due' : learned.length ? 'recall' : 'none',
      available: due.length, count: Math.min(due.length, Math.max(1, Math.round(reviewMinutes / 1.2))),
      minutes: reviewMinutes, lesson: refresh };
    var steps = [];
    if (reviewMinutes) steps.push({ kind: 'review', minutes: reviewMinutes,
      title: due.length ? '헷갈렸던 문제 다시 풀기' : '배운 내용 기억해 보기',
      description: due.length ? '해설을 보기 전에 답부터 떠올려 보세요.' : '쉬운 문제도 보기를 가리고 설명해 보세요.' });
    if (lesson) steps.push({ kind: 'learn', minutes: learnMinutes, title: lesson.title,
      description: lesson.split ? '개념을 읽고 앞부분부터 풀어 보세요. 남은 문제는 다음에 이어가도 돼요.' :
        '예제를 실행하고, 값이나 조건 하나를 바꿔 결과를 확인하세요.', lesson: lesson });
    steps.push({ kind: 'explain', minutes: reflectMinutes, title: '내 말로 한 문장 정리하기',
      description: '“이 코드는 무엇을 하고, 왜 이렇게 썼을까?” 답을 떠올리고 해설과 비교하세요.' });
    return { profile: p, track: track, trackName: courses[track].name, minutes: minutes,
      difficulty: diff, tracks: recommendedTracks(state, courses, diff.targetLevel),
      stages: stages(state, courses), lesson: lesson, review: review, steps: steps,
      title: '오늘은 새 개념 하나면 충분해요',
      note: '시간은 예상이에요. 막히면 힌트를 쓰고, 쉬운 복습을 섞어 가세요.' };
  }

  EXPERIENCES.forEach(Object.freeze); LEVELS.forEach(Object.freeze);
  return Object.freeze({ experiences: Object.freeze(EXPERIENCES), levels: Object.freeze(LEVELS),
    profile: profile, configure: configure, currentLevel: currentLevel, lessonId: lessonId,
    questionId: questionId, lessonLevel: lessonLevel, questionLevel: questionLevel,
    estimateMinutes: estimateMinutes, recentEvidence: recentEvidence, difficulty: difficulty,
    recordAnswer: recordAnswer, stages: stages, recommendedTracks: recommendedTracks,
    chooseLesson: chooseLesson, recommendation: recommendation });
});
