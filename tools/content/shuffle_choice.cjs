/* 보기 자리를 결정적으로 섞는다.

   손으로 문항을 쓰면 정답이 두 번째 자리에 몰린다 — 사람은 '틀린 것 하나,
   정답, 나머지 오답' 순으로 생각하기 때문이다. 그대로 실으면 '두 번째를
   찍으면 맞는다' 는 규칙이 생겨 학습이 아니라 요령을 가르치게 된다.

   무작위가 아니라 문항의 k·q 를 해시한 값을 씨앗으로 쓰므로, 몇 번을 돌려도
   같은 배치가 나온다. 그래야 검증 결과와 실린 데이터가 일치한다.

   '위 모두'·'둘 다' 처럼 자리에 의존하는 보기가 있으면 쓰면 안 된다 —
   그런 보기는 애초에 쓰지 않는 것이 원칙이고, 발견되면 실패시킨다. */

const ORDER_DEPENDENT=/^(위 모두|둘 다|모두 맞다|모두 옳다|1번과 2번|앞의 둘)/;

function seedOf(s){
  let h=2166136261;
  for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); }
  return h>>>0;
}
function rng(seed){
  let x=seed||1;
  return ()=>{ x^=x<<13; x>>>=0; x^=x>>17; x^=x<<5; x>>>=0; return x/4294967296; };
}

/* 한 문항의 보기를 섞고 정답 인덱스를 따라 옮긴다. */
function shuffleOne(q){
  if(q.t!=="choice"||!Array.isArray(q.o)||q.o.length!==4) return q;
  q.o.forEach(o=>{ if(ORDER_DEPENDENT.test(String(o).trim()))
    throw new Error("자리에 의존하는 보기라 섞을 수 없다: "+q.k+" / "+o); });
  const r=rng(seedOf(String(q.k)+"|"+String(q.q)));
  const idx=[0,1,2,3];
  for(let i=idx.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); const t=idx[i]; idx[i]=idx[j]; idx[j]=t; }
  const out=Object.assign({},q);
  out.o=idx.map(i=>q.o[i]);
  out.a=idx.indexOf(q.a);
  return out;
}

/* 유닛 배열 전체에 적용한다. 원본을 건드리지 않고 새 배열을 돌려준다. */
function shuffleUnits(units){
  return units.map(u=>({ t:u.t, ord:u.ord, l:u.l.map(L=>Object.assign({},L,{
    q:L.q.map(shuffleOne)
  })) }));
}

module.exports={shuffleUnits, shuffleOne};
