const CAT={S:"しゅご",V:"どうさ",O:"ひとこと"},QUOTA={S:5,V:5,O:3};
const TIP={S:"あとに、したいことなどを つづけてみよう！",V:"そのまま ひとかたまりで いってみよう！",O:"かいわで すぐ つかえる ひとことだよ！"};
const CARDS=[];for(const c of ["S","V","O"])RAW[c].split("\n").forEach((l,i)=>{const[j,e,x,xj]=l.split("|");CARDS.push({id:c+(i+1),c,j,e,x,xj})});
const BY=Object.fromEntries(CARDS.map(c=>[c.id,c]));
const INT=[1,3,7,14,30];
// ---- Storage ----
const K="charlie-english-v1";let canSave=true,mem=null;
function load(){try{const r=localStorage.getItem(K);if(r){const o=JSON.parse(r);if(o&&typeof o==="object"&&!Array.isArray(o)){o.cards=o.cards||{};o.days=o.days||{};o.done=o.done||[];return o}}}catch(e){canSave=false}return{cards:{},days:{},done:[]}}
let st=load();st.sp=st.sp||{rev:{},cur:null,hist:[]};
function save(){try{localStorage.setItem(K,JSON.stringify(st))}catch(e){canSave=false}}
// ---- Dates (device local) ----
const pad=n=>String(n).padStart(2,"0");
const ds=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const addDays=(s,n)=>{const[y,m,d]=s.split("-").map(Number);return ds(new Date(y,m-1,d+n))};
const todayStr=()=>ds(new Date());
// ---- Day plan: built once per day, then saved so reopening never regenerates ----
function getDay(){
  const t=todayStr();
  if(!st.days[t]){
    const rev=Object.entries(st.cards).filter(([id,c])=>c.next<=t&&BY[id]).sort((a,b)=>a[1].next<b[1].next?-1:1).map(e=>e[0]);
    const nw=[];for(const c of ["S","V","O"])nw.push(...CARDS.filter(x=>x.c===c&&!st.cards[x.id]).slice(0,QUOTA[c]).map(x=>x.id));
    st.days[t]={r:rev,n:nw,q:rev.concat(nw),retry:{},judged:{}};
    if(!nw.length&&!rev.length&&!st.done.includes(t))st.done.push(t);
    save();
  }
  return st.days[t];
}
function judge(id,ok){
  const t=todayStr(),day=getDay();
  if(!day.judged[id]&&!day.retry[id]){
    const c=st.cards[id]||{first:t,streak:0,hist:[]};
    c.last=t;c.hist.push([t,ok?1:0]);
    if(ok){c.streak++;c.next=addDays(t,INT[Math.min(c.streak,5)-1])}else{c.streak=0;c.next=addDays(t,1)}
    st.cards[id]=c;day.judged[id]=ok?"g":"a";
  }
  day.q.shift();
  if(!ok){day.retry[id]=1;day.q.push(id)}
  if(!day.q.length&&!st.done.includes(t))st.done.push(t);
  save();
}
function streakDays(){let t=todayStr();if(!st.done.includes(t))t=addDays(t,-1);let n=0;while(st.done.includes(t)){n++;t=addDays(t,-1)}return n}
// ---- Sound ----
let lastSay=0,noUS=false;function say(t,sl){if(Date.now()-lastSay<350)return;lastSay=Date.now();
  const s=window.speechSynthesis;
  if(!s||!window.SpeechSynthesisUtterance){toast("このブラウザでは おとが でないよ");return}
  try{
    s.cancel();const u=new SpeechSynthesisUtterance(t.replace(/\.\.\./g,""));
    u.lang="en-US";u.rate=sl?.55:.8;u.onstart=()=>setStat("🔊 さいせいちゅう…");u.onend=()=>setStat("");
    const vs=s.getVoices();const v=vs.find(v=>/^en[-_]US/i.test(v.lang))||vs.find(v=>/^en/i.test(v.lang));
    if(v)u.voice=v;if((!v||!/^en[-_]US/i.test(v.lang))&&!noUS){noUS=true;toast("アメリカえいごの おとが みつからないよ。ほかの おとで ながすね")}
    u.onerror=()=>toast("おとが でなかったよ。もういちど おしてね");
    s.speak(u);
  }catch(e){toast("おとが でなかったよ。もういちど おしてね")}
}
let tt;function toast(m){const e=document.getElementById("toast");e.textContent=m;e.classList.add("on");clearTimeout(tt);tt=setTimeout(()=>e.classList.remove("on"),2600)}
// ---- Views ----
let view="home",shown=false;
const $=document.getElementById("app");
const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;");
function go(v){view=v;shown=false;render()}
function show(){shown=true;render()}
function say2(k){const c=BY[getDay().q[0]];say(k?c.x:c.e)}
function pick(ok){
  const id=getDay().q[0];judge(id,ok);shown=false;
  if(!getDay().q.length)view="done";
  render();
}
function warn(){return canSave?"":`<div class="card" style="border-color:var(--again)">このたんまつでは きろくが ほぞんできないよ。（このまま あそぶことは できるよ）</div>`}
function render(){
  const day=getDay();
  if(view.startsWith("sp")){renderSP();return}
  if(view==="data"){renderData();return}
  if(view==="home"){
    const left=day.q.length,nr=day.q.filter(i=>!st.cards[i]).length,rv=left-nr;
    $.innerHTML=`<div class="center card"><div class="charlie">🐶</div><h1>Charlie English</h1>
    <div class="sub">${left?"やっほー！きょうも いっしょに やろう！":"きょうは ぜんぶ おわったよ！Great job!"}</div></div>${warn()}
    ${left?`<div class="card center"><div class="ex">ふくしゅう <b>${rv}</b>まい ＋ あたらしい <b>${nr}</b>まい</div>
    <button class="btn" onclick="go('study')">${Object.keys(day.judged).length?"つづきから はじめる":"きょうの がくしゅう"}</button></div>`
    :`<button class="btn ok" onclick="go('done')">きょうの けっかを みる</button>`}
    <button class="btn ghost" onclick="go('sp')">⚡ しゅんかん えいさくぶん</button>
    <button class="btn ghost" onclick="go('rec')">📒 がくしゅう きろく</button>
    <button class="btn ghost" onclick="go('data')">💾 きろくの ほぞん・よみこみ</button>`;
  }else if(view==="study"){
    const id=day.q[0];if(!id){go("done");return}
    const c=BY[id],isNew=!st.cards[id],total=day.r.length+day.n.length,left=day.q.length;
    $.innerHTML=`<div class="row" style="align-items:center;justify-content:space-between"><button class="snd" onclick="go('home')">← もどる</button><span class="sub">のこり ${left}まい</span></div>
    <div class="bar"><i style="width:${Math.round((total-left)/total*100)}%"></i></div>
    <div class="card center ${shown?"":"pop"}">
    <span class="tag ${isNew?"":"rev"}">${isNew?"あたらしい":"ふくしゅう"}・${CAT[c.c]}${day.retry[id]?"・もういちど":""}</span>
    <div class="ja">「${esc(c.j)}」</div>
    ${shown?`<div class="en">${esc(c.e)}</div>
      <button class="snd" onclick="say2(0)">🔊 きく</button>
      <div class="ex" style="margin-top:16px">${esc(c.x)}</div><button class="snd" onclick="say2(1)">🔊 れいぶんを きく</button>
      <div class="ex sub">${esc(c.xj)}</div><div class="hint">💡 ${TIP[c.c]}　こえに だして いってみよう！</div>`
    :`<div class="sub">えいごで なんて いう？</div>`}
    </div>
    ${shown?`<div class="row"><button class="btn again" onclick="pick(false)">もういちど</button><button class="btn ok" onclick="pick(true)">おぼえた！</button></div>`
    :`<button class="btn" onclick="show()">こたえを みる</button>`}`;
  }else if(view==="done"){
    const j=day.judged,ids=Object.keys(j),g=ids.filter(i=>j[i]==="g").length,a=ids.length-g;
    const cnt=c=>day.n.filter(i=>BY[i].c===c).length;
    const revDone=day.r.filter(i=>j[i]).length;
    const nexts=Object.values(st.cards).map(c=>c.next).sort();
    const nx=nexts.find(n=>n>todayStr())||nexts[0];
    $.innerHTML=`<div class="card center pop"><div class="charlie">🐶🎉</div><h1>Great job! You did it!</h1><div class="sub">よく がんばったね！</div></div>
    <div class="card"><div class="stat">きょうの あたらしい<b>${day.n.length}こ</b></div>
    <div class="stat">しゅご・どうさ・ひとこと<b>${cnt("S")}・${cnt("V")}・${cnt("O")}</b></div>
    <div class="stat">おぼえた<b>${g}</b></div><div class="stat">もういちど れんしゅう<b>${a}</b></div>
    <div class="stat">ふくしゅう おわった<b>${revDone}/${day.r.length}</b></div>
    <div class="stat">ぜんぶで まなんだ<b>${Object.keys(st.cards).length}こ</b></div>
    <div class="stat">つぎの ふくしゅう<b>${nx?nx.slice(5).replace("-","/"):"—"}</b></div></div>
    <button class="btn" onclick="go('home')">ホームへ</button>`;
  }else{
    const cs=Object.values(st.cards),mastered=cs.filter(c=>c.streak>=4).length;
    const unseen=CARDS.filter(c=>!st.cards[c.id]).length,t=todayStr();
    const due=cs.filter(c=>c.next<=t).length,soon=cs.filter(c=>c.next>t&&c.next<=addDays(t,7)).length;
    $.innerHTML=`<div class="card center"><div class="charlie">📒</div><h1>がくしゅう きろく</h1></div>
    <div class="card"><div class="stat">れんぞく がくしゅう<b>${streakDays()}にち</b></div>
    <div class="stat">まなんだ カード<b>${cs.length}まい</b></div>
    <div class="stat">しっかり おぼえた<b>${mastered}まい</b></div>
    <div class="stat">きょう ふくしゅう<b>${due}まい</b></div>
    <div class="stat">7にち いないの ふくしゅう<b>${soon}まい</b></div>
    <div class="stat">あたらしい カード のこり<b>${unseen}まい</b></div>
    ${unseen<13?`<div class="hint">あたらしい カードが すくなくなったよ。おうちの人に ついかを たのんでね。</div>`:""}</div>
    ${warn()}<button class="btn" onclick="go('home')">ホームへ</button>`;
  }
}
// ---- 瞬間英作文 (own data in st.sp; Daily Cards data is never touched) ----
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const CM={};"i'm|i am|let's|let us|it's|it is|that's|that is|there's|there is|what's|what is|you're|you are|we're|we are|they're|they are|i'll|i will|don't|do not|can't|can not|cannot|can not|isn't|is not|i've|i have|didn't|did not|doesn't|does not|won't|will not|he's|he is|she's|she is".split("|").forEach((x,i,a)=>{if(i%2==0)CM[x]=a[i+1]});
const norm=s=>s.toLowerCase().replace(/[’‘`]/g,"'").replace(/[^a-z0-9' ]/g," ").split(/\s+/).filter(Boolean).flatMap(w=>(CM[w]||w).split(" ")).map(w=>w.replace(/'/g,""));
function ed(a,b){const d=[...Array(a.length+1)].map((_,i)=>[i]);for(let j=1;j<=b.length;j++)d[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[a.length][b.length]}
const sim=(a,b)=>1-ed(a,b)/Math.max(a.length,b.length,1);
const has=(a,k)=>k.length&&a.some((_,i)=>k.every((w,j)=>a[i+j]===w));
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const qa=s=>esc(s).replace(/"/g,"&quot;");
let Q={};const newQ=()=>{Q={ph:"ask",text:"",mic:"",src:"",err:"",ef:0,ev:null,pt:""}};newQ();
const SP=()=>st.sp,curQ=()=>{const c=SP().cur;return c&&BY[c.ids[c.i]]};
function setStat(t){const e=document.getElementById("stat");if(e)e.textContent=t}
function spStart(){
  const t=todayStr(),rv=SP().rev;
  let p=Object.keys(rv).filter(i=>BY[i]&&rv[i].d<t).sort((a,b)=>rv[a].d<rv[b].d?-1:1).slice(0,10);
  const n=p.length,rest=shuf(CARDS.map(c=>c.id).filter(i=>!p.includes(i)));
  p=shuf(p.concat(rest.slice(0,10-p.length)));
  SP().cur={d:t,ids:p,i:0,res:{},n};save();newQ();
}
function setRes(id,r){const s=SP();s.cur.res[id]=r;if(r==="c")delete s.rev[id];else s.rev[id]={d:todayStr(),n:(s.rev[id]&&s.rev[id].n||0)+1};save()}
const MIC="マイクが つかえないよ。ブラウザの マイクの きょかを たしかめてね。かいて こたえても いいよ。";
let RC=null;function stopL(){try{RC&&RC.stop()}catch(e){}}
function listen(cb){
  if(!SR){cb(null,"このブラウザでは マイクが つかえないよ。かいて こたえてね。");return}
  try{speechSynthesis.cancel()}catch(e){}
  let fin=false;const done=(a,e)=>{if(!fin){fin=true;RC=null;cb(a,e)}};
  const r=new SR();RC=r;r.lang="en-US";r.interimResults=false;r.maxAlternatives=3;
  r.onresult=e=>done([...e.results[0]].map(x=>x.transcript),null);
  r.onerror=e=>done(null,({"not-allowed":MIC,"service-not-allowed":MIC,"no-speech":"こえが きこえなかったよ。もういちど はなしてね。","audio-capture":"マイクが みつからないよ。かいて こたえてね。","network":"つうしんに しっぱいしたよ。ネットを たしかめて もういちど。","aborted":"とちゅうで とまったよ。もういちど。"})[e.error]||"うまく ききとれなかったよ。もういちど。");
  r.onend=()=>done(null,"こえが きこえなかったよ。もういちど はなしてね。");
  try{r.start()}catch(e){done(null,"マイクを はじめられなかったよ。もういちど おしてね。")}
}
function micGo(prac){
  const m=norm(curQ().x);Q.err="";Q.ph="rec";render();
  listen((alts,err)=>{
    if(err){Q.err=err;if(!prac)Q.ef=1;Q.ph=prac?"result":"ask"}
    else{const b=alts.slice().sort((x,y)=>sim(norm(y),m)-sim(norm(x),m))[0]||"";
      if(prac){Q.pt=b;Q.ph="result"}else{Q.text=b;Q.mic=b;Q.ph="confirm"}}
    render()});
}
function judgeNow(){
  const c=curQ(),t=document.getElementById("ans");Q.text=t?t.value.trim():Q.text;Q.src=Q.text===Q.mic?"mic":"kb";
  const a=norm(Q.text),m=norm(c.x);
  if(!a.length){Q.err="こたえが からっぽだよ。もういちど いってみよう。";Q.ph="ask";render();return}
  const key=has(a,norm(c.e.replace(/\.\.\./g,"")));
  const v=ed(a,m)===0?"ok":(key&&sim(a,m)>=.75?"hold":"ng");
  Q.ev={v,key,missing:m.filter(w=>!a.includes(w)),extra:a.filter(w=>!m.includes(w))};
  if(v!=="hold")setRes(c.id,v==="ok"?"c":"w");
  Q.ph="result";render();
}
function hold(ok){Q.ev.v=ok?"ok":"ng";setRes(curQ().id,ok?"c":"w");render()}
function selfOk(){Q.ev.v="ok";Q.self=1;setRes(curQ().id,"c");render()}
function skip(){const c=curQ();Q.ev={v:"skip",key:1,missing:[],extra:[]};setRes(c.id,Q.ef?"r":"s");Q.ph="result";render()}
function nextQ(){const c=SP().cur;c.i++;newQ();
  if(c.i>=c.ids.length){SP().hist.push({d:todayStr(),s:c.ids.filter(i=>c.res[i]==="c").length,n:c.ids.length});save();view="spr"}else save();
  render()}
const spSay=sl=>say(curQ().x,sl);
function why(c){const e=Q.ev,s=[];
  if(!e.key)s.push(`「${c.j}」の いいかた（${c.e.replace("...","")}）を つかおう。`);
  if(e.missing.length)s.push(`たりない ことば: ${e.missing.join(" ")}`);
  if(e.extra.length)s.push(`ちがう ことば: ${e.extra.join(" ")}`);
  return s.join("<br>")}
function renderSP(){
  const s=SP(),t=todayStr(),c=s.cur;
  if(view==="sp"){
    const due=Object.keys(s.rev).filter(i=>BY[i]&&s.rev[i].d<t).length,n=Math.min(10,CARDS.length);
    const prog=c&&c.i<c.ids.length,fin=c&&c.i>=c.ids.length;
    $.innerHTML=`<div class="center card"><div class="charlie">⚡</div><h1>しゅんかん えいさくぶん</h1><div class="sub">にほんごを みて、すぐ えいごで いってみよう！</div></div>${warn()}
    <div class="card center"><div class="ex">ふくしゅうの もんだい <b>${due}</b>もん</div><div class="sub">ぜんぶで ${CARDS.length}フレーズから ${n}もん でるよ</div>${SR?"":`<div class="hint">このブラウザでは マイクが つかえないよ。かいて こたえてね。</div>`}</div>
    ${prog?`<button class="btn" onclick="go('spq')">つづきから（${c.i+1}/${c.ids.length}）</button>`:fin?`<button class="btn" onclick="go('spr')">まえの けっかを みる</button><button class="btn ghost" onclick="spStart();go('spq')">あたらしく はじめる</button>`:`<button class="btn" onclick="spStart();go('spq')">はじめる（${n}もん）</button>`}
    <button class="btn ghost" onclick="go('home')">ホームへ</button>`;return}
  if(!c){go("sp");return}
  if(view==="spr"){
    const ids=c.ids,r=c.res,ok=ids.filter(i=>r[i]==="c").length,bad=ids.filter(i=>r[i]&&r[i]!=="c");
    const L={w:"ちがった",s:"わからなかった",r:"マイクが うまく いかなかった"};
    $.innerHTML=`<div class="card center pop"><div class="charlie">🐶</div><h1>${ok} / ${ids.length}</h1><div class="sub">せいかいりつ ${Math.round(ok/ids.length*100)}%　Great job!</div></div>
    ${bad.map(i=>`<div class="card"><span class="tag rev">${L[r[i]]}</span><div class="ex">${BY[i].xj}</div><div class="ex"><b>${BY[i].x}</b></div><button class="snd" onclick="say(BY['${i}'].x)">🔊 きく</button></div>`).join("")}
    ${bad.length?`<div class="hint">この ${bad.length}もんは ふくしゅうに とうろくしたよ。あしたいこう、さいしょに でるよ。</div>`:`<div class="card center">ぜんぶ せいかい！すごい！</div>`}
    <button class="btn" onclick="spStart();go('spq')">もういちど ちょうせん</button><button class="btn ghost" onclick="go('home')">ホームへ</button>`;return}
  if(c.i>=c.ids.length){go("spr");return}
  const q=curQ(),e=Q.ev,isRev=!!s.rev[q.id];let b="";
  const sndBtns=`<div class="row"><button class="snd" onclick="spSay(0)">🔊 ふつう</button><button class="snd" onclick="spSay(1)">🐢 ゆっくり</button></div>`;
  if(Q.ph==="ask")b=`${Q.err?`<div class="hint">${Q.err}</div>`:""}${SR?`<button class="btn" onclick="micGo()">🎤 はなす</button>`:`<div class="hint">マイクが つかえないので、かいて こたえてね。</div>`}<button class="btn ghost" onclick="Q.ph='confirm';render()">⌨️ かいて こたえる</button><button class="btn ghost" onclick="skip()">わからない（こたえを みる）</button>`;
  else if(Q.ph==="rec")b=`<button class="btn again" onclick="stopL()">🎤 きいているよ… はなしてね</button><div class="sub center">はなしおわったら おしてね</div>`;
  else if(Q.ph==="confirm")b=`<div class="card"><div class="sub">${Q.mic?"きこえた えいご（なおしても いいよ）":"えいごで かいてね"}</div><input id="ans" value="${qa(Q.text)}" autocapitalize="off" autocomplete="off" style="width:100%;font:inherit;font-size:22px;padding:12px;margin-top:8px;border-radius:14px;border:3px solid var(--line);background:var(--bg);color:var(--ink)"></div><button class="btn ok" onclick="judgeNow()">これで はんてい</button>${SR?`<button class="btn ghost" onclick="micGo()">🎤 もういちど はなす</button>`:""}`;
  else{
    const v=e.v,mh=Q.src==="mic"&&e.missing.length?`<div class="hint">🎤 おんせいにんしきで ききとれなかった ことば: ${e.missing.join(" ")}<br>（にんしきの けっかだけで みているよ。はつおんを くわしく しらべては いないよ）</div>`:"";
    const model=`<div class="ex"><b>${esc(q.x)}</b></div><div class="sub">${q.xj}</div>${sndBtns}`;
    const nxt=`<button class="btn" onclick="nextQ()">${c.i+1>=c.ids.length?"けっかを みる":"つぎへ"}</button>`;
    if(v==="hold")b=`<div class="card center"><div class="en" style="font-size:28px">🤔 ほぼ あってるよ！</div><div class="ex">あなた: <b>${esc(Q.text)}</b></div><div class="ex">おてほん: <b>${esc(q.x)}</b></div>${sndBtns}<div class="sub">おなじ いみで あってたかな？</div></div>${mh}<div class="row"><button class="btn ok" onclick="hold(1)">あってた</button><button class="btn again" onclick="hold(0)">ちがってた</button></div>`;
    else if(v==="ok")b=`<div class="card center"><div class="en pop" style="color:var(--ok)">✅ せいかい！</div><div>${Q.self?"じぶんの こたえも OK だね！":"すごい！ いいね！"}</div><div class="sub" style="margin-top:10px">おてほん</div>${model}</div>${nxt}`;
    else b=`<div class="card center"><div class="en" style="color:var(--again);font-size:30px">${v==="skip"?"こたえを みてみよう":"もうすこし！"}</div><div class="sub">おてほん</div>${model}${v==="skip"?`<div class="hint">「${q.j}」= ${esc(q.e)}</div>`:`<div class="hint">${why(q)}</div>`}${mh}</div>
      ${SR?`<button class="btn ghost" onclick="micGo(1)">🎤 おてほんを いってみよう</button>`:""}${Q.pt?`<div class="card center"><div class="ex">きこえた: <b>${esc(Q.pt)}</b></div><div class="sub">${sim(norm(Q.pt),norm(q.x))>=.9?"✅ よく きこえたよ！":"もういちど いってみよう"}</div></div>`:""}${Q.err?`<div class="hint">${Q.err}</div>`:""}
      ${v==="ng"?`<button class="btn ghost" onclick="selfOk()">じぶんの こたえも あってた</button>`:""}${nxt}`;
  }
  $.innerHTML=`<div class="row" style="align-items:center;justify-content:space-between"><button class="snd" onclick="go('sp')">← もどる</button><span class="sub">${c.i+1} / ${c.ids.length}</span></div><div class="bar"><i style="width:${Math.round(c.i/c.ids.length*100)}%"></i></div>
  <div class="card center"><span class="tag ${isRev?"rev":""}">${isRev?"ふくしゅう・":""}つかう フレーズ「${q.j}」</span><div class="ja" style="font-size:30px">${q.xj}</div><div class="sub">えいごで なんて いう？</div></div><div id="stat" class="sub center" style="min-height:22px"></div>${b}`;
}
if(window.speechSynthesis)speechSynthesis.getVoices();
if("serviceWorker" in navigator&&(location.protocol==="https:"||location.hostname==="localhost"))navigator.serviceWorker.register("sw.js").catch(()=>{});
render();
