const {Game}=require('../src/engine.js');
function play(level,seed){
  const L=Object.assign({},level,{seed});
  const g=new Game(L); let guard=0;
  while(g.state==='play' && guard++<500){
    let m=g.hint(); if(!m){g.shuffle();continue;}
    const ta=g.tile(...m.a), tb=g.tile(...m.b);
    let r;
    if(ta.sp && !tb.sp && ta.sp!=='orb'&&ta.sp!=='star' && Math.random()<0.5) r={ok:g.tapSpecial(...m.a)};
    else r=g.trySwap(m.a,m.b);
    if(!r.ok){ g.tapSpecial(...m.a)||g.shuffle(); }
    let loops=0;
    do{ while(g.runWave()){} while(g.gravityStep()){} g.collectRelics(); while(g.gravityStep()){} if(loops++>200)throw new Error('loop'); }
    while(g.resolveMatches()||g.queue.length);
    // sanity: no empty non-block cells
    g.each((x,r,c)=>{ if(!x.hole&&!x.block&&!x.tile&&!g.stuckAbove(r,c)) throw new Error('hole at '+r+','+c+'\n'+g.dump()); });
    g.endTurn();
  }
  return g;
}
module.exports={play};
if(require.main===module){
  const lvl={w:8,h:8,colors:5,moves:25,objectives:[{t:'color',c:0,n:25},{t:'stone'},{t:'cage'},{t:'relic',n:2}],
    obstacles:[[3,3],[3,4],[4,3],[4,4]].map(([r,c])=>({t:'stone',r,c,hp:2})).concat([{t:'cage',r:6,c:1},{t:'cage',r:6,c:6},{t:'vine',r:0,c:0},{t:'ice',r:7,c:7,hp:2},{t:'shadow',r:1,c:4}]),
    mask:["  ......","........","........","........","........","........","........","......  "]};
  let wins=0; const N=200; const st={};
  for(let i=0;i<N;i++){ const g=play(lvl,i+1); if(g.state==='won')wins++; for(const k of ['beams','cores','orbs','sparks','stars','combos'])st[k]=(st[k]||0)+g.stats[k]; }
  console.log('winrate',wins/N, st);
}
