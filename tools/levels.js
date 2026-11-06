global.window=undefined;
require('../src/engine.js'); require('../src/data.js');
const {play}=require('./bot.js');
const D=globalThis.GKData;
const rows=[];
const sample=process.argv[2]?process.argv[2].split(',').map(Number):[...Array(160)].map((_,i)=>i+1);
for(const n of sample){
  const L=D.makeLevel(n); let w=0; const N=+process.argv[3]||30;
  for(let s=0;s<N;s++){ const g=play(L,s+1); if(g.state==='won')w++; }
  rows.push([n,D.DIFF[L.difficulty].name,L.moves,L.objectives.map(o=>o.t+(o.n?o.n:'')).join('+'),(w/N).toFixed(2)]);
}
console.log(rows.map(r=>r.join('\t')).join('\n'));
const avg=rows.reduce((a,r)=>a+ +r[4],0)/rows.length; console.log('avg',avg.toFixed(2),'zero:',rows.filter(r=>+r[4]===0).map(r=>r[0]).join(','));
