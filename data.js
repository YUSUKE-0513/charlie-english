// ---- きろくの書き出し・読み込み（JSON）----
// 書き出し形式: {app:"charlie-english",format:1,exportedAt,data:{cards,days,done,sp}}
// cards/days/done = Daily Cards の履歴、sp = 瞬間英作文の履歴
const YMD=/^\d{4}-\d\d-\d\d$/,IDRE=/^[SVO]\d+$/;
let DM={show:false,pending:null,msg:"",ok:false,text:""};
function expJSON(){return JSON.stringify({app:"charlie-english",format:1,exportedAt:new Date().toISOString(),data:{cards:st.cards,days:st.days,done:st.done,sp:st.sp}},null,1)}
function validate(o){
  const bad=m=>({err:m}),isO=x=>x&&typeof x==="object"&&!Array.isArray(x),ids=a=>Array.isArray(a)&&a.every(i=>typeof i==="string"&&BY[i]);
  if(!isO(o)||o.app!=="charlie-english")return bad("Charlie English の きろくファイルでは ないよ。");
  if(o.format!==1)return bad("ファイルの バージョンが ちがうよ。");
  const d=o.data;if(!isO(d)||!isO(d.cards)||!isO(d.days)||!Array.isArray(d.done)||!isO(d.sp))return bad("ファイルの なかみが こわれているよ。");
  for(const[id,c]of Object.entries(d.cards)){
    if(!BY[id])return bad("しらない フレーズ("+id+")が はいっているよ。");
    if(!isO(c)||!YMD.test(c.next||"")||!Number.isInteger(c.streak)||c.streak<0||c.streak>99||!Array.isArray(c.hist)||!c.hist.every(h=>Array.isArray(h)&&YMD.test(h[0])&&(h[1]===0||h[1]===1)))return bad("カード "+id+" の きろくが おかしいよ。");
  }
  for(const[t,v]of Object.entries(d.days)){
    if(!YMD.test(t)||!isO(v)||!ids(v.r)||!ids(v.n)||!ids(v.q)||!isO(v.retry)||!isO(v.judged))return bad(t+" の きろくが おかしいよ。");
  }
  if(!d.done.every(x=>YMD.test(x)))return bad("がくしゅうした ひの きろくが おかしいよ。");
  const s=d.sp;
  if(!isO(s.rev)||!Array.isArray(s.hist))return bad("しゅんかん えいさくぶんの きろくが おかしいよ。");
  for(const[id,r]of Object.entries(s.rev))if(!BY[id]||!isO(r)||!YMD.test(r.d||"")||!Number.isFinite(r.n))return bad("ふくしゅうの きろくが おかしいよ。");
  if(!s.hist.every(h=>isO(h)&&YMD.test(h.d)&&Number.isFinite(h.s)&&Number.isFinite(h.n)))return bad("けっかの きろくが おかしいよ。");
  const c=s.cur;if(c!==null&&c!==undefined&&(!isO(c)||!ids(c.ids)||!Number.isInteger(c.i)||c.i<0||c.i>c.ids.length||!isO(c.res)))return bad("とちゅうの もんだいの きろくが おかしいよ。");
  return{data:{cards:d.cards,days:d.days,done:d.done,sp:{rev:s.rev,hist:s.hist,cur:c||null}},at:o.exportedAt||""};
}
function merge(cur,inc){
  const o=JSON.parse(JSON.stringify(cur));o.sp=o.sp||{rev:{},cur:null,hist:[]};
  for(const[id,c]of Object.entries(inc.cards)){const a=o.cards[id];if(!a||(c.last||"")>(a.last||""))o.cards[id]=c}
  // まだ1まいも判定していない日のプランは、読みこんだ きろくに合わせて作りなおす（学習ずみカードが新規に出るのを防ぐ）
  const fresh=t=>!Object.keys(o.days[t].judged).length;
  for(const t of Object.keys(o.days))if(fresh(t))delete o.days[t];
  for(const[t,v]of Object.entries(inc.days))if(!o.days[t])o.days[t]=v;
  o.done=[...new Set(o.done.concat(inc.done))].sort();
  for(const[id,r]of Object.entries(inc.sp.rev)){const a=o.sp.rev[id];if(!a||r.d>a.d)o.sp.rev[id]=r}
  const seen=new Set(o.sp.hist.map(h=>JSON.stringify(h)));inc.sp.hist.forEach(h=>{if(!seen.has(JSON.stringify(h)))o.sp.hist.push(h)});
  if(!o.sp.cur)o.sp.cur=inc.sp.cur;
  return o;
}
function dlExport(){
  try{const b=new Blob([expJSON()],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="charlie-english-"+todayStr()+".json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}
  catch(e){toast("ほぞんできなかったよ。コピーを つかってね")}
}
function cpExport(){
  const j=expJSON();DM.show=true;DM.text=j;
  const fin=m=>{toast(m);render()};
  try{navigator.clipboard.writeText(j).then(()=>fin("コピーしたよ"),()=>fin("したの もじを ぜんぶ えらんで コピーしてね"))}catch(e){fin("したの もじを ぜんぶ えらんで コピーしてね")}
}
function checkText(t){
  DM.pending=null;DM.msg="";
  if(!t||!t.trim()){DM.msg="ファイルか もじを いれてね。";DM.ok=false;return render()}
  if(t.length>3e6){DM.msg="ファイルが おおきすぎるよ。";DM.ok=false;return render()}
  let o;try{o=JSON.parse(t)}catch(e){DM.msg="JSON として よめないよ。ぜんぶ コピーできているか たしかめてね。";DM.ok=false;return render()}
  const r=validate(o);
  if(r.err){DM.msg=r.err;DM.ok=false}else DM.pending=r;
  render();
}
function fileIn(inp){const f=inp.files&&inp.files[0];if(!f)return;const r=new FileReader();r.onload=()=>checkText(String(r.result));r.onerror=()=>{DM.msg="ファイルを よめなかったよ。";DM.ok=false;render()};r.readAsText(f)}
function applyImp(mode){
  const p=DM.pending;if(!p)return;
  if(mode==="replace"&&!confirm("いまの きろくを ぜんぶ ファイルの ないように おきかえるよ。いいかな？"))return;
  try{localStorage.setItem(K+"-backup",JSON.stringify(st))}catch(e){if(!confirm("バックアップが つくれなかったよ。このまま すすむ？"))return}
  st=mode==="replace"?{cards:p.data.cards,days:p.data.days,done:p.data.done,sp:p.data.sp}:merge(st,p.data);
  st.sp=st.sp||{rev:{},cur:null,hist:[]};save();
  DM={show:false,pending:null,msg:canSave?"よみこんだよ！ （まえの きろくは バックアップに のこしてあるよ）":"よみこんだけど、この たんまつでは ほぞんできないよ。",ok:canSave,text:""};render();
}
function renderData(){
  const p=DM.pending,sum=(d,l)=>`<div class="stat">${l}<b>${Object.keys(d.cards).length}まい／${d.done.length}にち／ふくしゅう${Object.keys(d.sp.rev).length}</b></div>`;
  $.innerHTML=`<div class="center card"><div class="charlie">💾</div><h1>きろくの ほぞん・よみこみ</h1><div class="sub">おうちの人 むけ。きろくは この たんまつの なかだけに のこるよ。</div></div>${warn()}
  ${DM.msg?`<div class="card" style="border-color:${DM.ok?"var(--ok)":"var(--again)"}">${DM.msg}</div>`:""}
  ${p?`<div class="card"><b>よみこむ ないよう</b>${sum(p.data,"ファイル")}${sum(st.sp?{cards:st.cards,done:st.done,sp:st.sp}:{cards:{},done:[],sp:{rev:{}}},"いま")}<div class="sub">（まい／がくしゅうした ひ／ふくしゅう）${p.at?" かきだした ひ: "+p.at.slice(0,10):""}</div>
  <button class="btn ok" style="margin-top:12px" onclick="applyImp('merge')">あわせる（いまの きろくも のこす）</button>
  <button class="btn ghost" style="margin-top:10px" onclick="applyImp('replace')">ぜんぶ おきかえる</button>
  <button class="btn ghost" style="margin-top:10px" onclick="DM.pending=null;render()">やめる</button></div>`:
  `<div class="card"><b>かきだす</b><button class="btn" style="margin:10px 0" onclick="dlExport()">ファイルに ほぞん</button><button class="btn ghost" onclick="cpExport()">もじを コピー</button>
  ${DM.show?`<textarea readonly onfocus="this.select()" style="margin-top:10px">${esc(DM.text)}</textarea>`:""}</div>
  <div class="card"><b>よみこむ</b><div class="sub" style="margin:6px 0">ファイル、または コピーした もじを いれてね。いれても すぐには かわらないよ。</div>
  <input type="file" accept=".json,application/json" onchange="fileIn(this)" style="width:100%;font:inherit;margin-bottom:10px">
  <textarea placeholder="ここに はりつけ" oninput="DM.text2=this.value">${esc(DM.text2||"")}</textarea>
  <button class="btn ghost" style="margin-top:10px" onclick="checkText(DM.text2)">チェックする</button></div>`}
  <button class="btn ghost" onclick="DM.msg='';DM.pending=null;go('home')">ホームへ</button>`;
}
