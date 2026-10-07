/* Validate imported progress and keep connection credentials out of backups. */
(function (root) {
  'use strict';
  const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  function clean(value, depth) {
    if (depth > 60) throw new Error('백업의 구조가 너무 깊어요.');
    if (!value || typeof value !== 'object') return;
    for (const key of Object.keys(value)) {
      if (key === '__proto__') throw new Error('백업에 허용하지 않는 속성이 있어요.');
      clean(value[key], depth + 1);
    }
  }
  function parseBackup(raw) {
    if (typeof raw !== 'string' || raw.length > 10 * 1024 * 1024) throw new Error('백업 파일은 10MB 이하의 JSON이어야 해요.');
    let state;
    try { state = JSON.parse(raw); } catch (_) { throw new Error('백업의 내용을 읽지 못했어요. 코드런에서 받은 JSON 파일을 골라 주세요.'); }
    if (object(state) && state.format === 'coderun-backup') {
      if (state.version !== 1) throw new Error('이 백업 버전은 아직 읽을 수 없어요.');
      state = state.data;
    }
    if (!object(state) || !own(state, 'xp') || !own(state, 'done')) throw new Error('코드런에서 받은 학습 백업을 골라 주세요.');
    clean(state, 0);
    for (const key of ['xp', 'streak', 'qTotal', 'okTotal', 'dayCount', 'doneV', 'hearts', 'dailyTarget']) {
      if (own(state, key) && (!Number.isFinite(state[key]) || state[key] < 0)) throw new Error('학습 수치가 올바르지 않아요.');
    }
    for (const key of ['done', 'build', 'proj', 'trk', 'hist', 'skills', 'vibeLab', 'introSeen', 'git', 'ax', 'axj', 'ach', 'lvN', 'lvOk', 'catN', 'catOk', 'trkN', 'sims', 'diags', 'implByK', 'runner']) {
      if (own(state, key) && !object(state[key])) throw new Error('학습 기록의 형식이 올바르지 않아요.');
    }
    if (own(state, 'wrongs') && !Array.isArray(state.wrongs)) throw new Error('오답 기록의 형식이 올바르지 않아요.');
    if (state.wrongs?.some(item => !object(item))) throw new Error('오답 기록의 형식이 올바르지 않아요.');
    for (const key of ['recall', 'freeMode', 'onboarded']) {
      if (own(state, key) && typeof state[key] !== 'boolean') throw new Error('학습 설정의 형식이 올바르지 않아요.');
    }
    if (own(state, 'ai') && !object(state.ai)) throw new Error('AI 설정의 형식이 올바르지 않아요.');
    return state;
  }
  function backup(state) {
    const data = JSON.parse(JSON.stringify(state));
    if (object(data.ai)) { delete data.ai.key; delete data.ai.proxyToken; }
    return { format: 'coderun-backup', version: 1, data };
  }
  const api = { parseBackup, backup };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ReleaseHelpers = api;
})(typeof window !== 'undefined' ? window : globalThis);
