const fs = require('fs');
const files = {
  'blackjack.html':   { o: 'G', busy: "busy||G.phase==='play'", ui: 'ui();', trig: '.top>svg' },
  'limbo.html':       { o: 'S', busy: 'busy', ui: 'ui();', trig: '#prof' },
  'plinko.html':      { o: 'S', busy: 'busy', ui: 'ui();', trig: '.me' },
  'dice.html':        { o: 'S', busy: 'busy', ui: 'ui();', trig: '.cb' },
  'coinflip.html':    { o: 'S', busy: 'busy', ui: 'ui();', trig: '.sk' },
  'mines-phone.html': { o: 'S', busy: "S.status==='playing'", ui: 'draw();', trig: '.top .tl:nth-child(2)', nosave: true }
};
const CSS = `
#wm{position:fixed;left:14px;top:64px;z-index:97;background:#14161a;border:1px solid #2a2e35;border-radius:14px;padding:6px;box-shadow:0 10px 30px rgba(0,0,0,.5)}
#wm button{display:block;width:100%;min-width:170px;text-align:left;padding:12px 14px;border:0;background:none;color:#fff;font:inherit;font-size:15px;font-weight:600;border-radius:10px;cursor:pointer}
#wm button:active{background:#23272e}
#wd{position:fixed;inset:0;z-index:98;background:#0f1114;color:#fff;font-family:inherit;display:flex;flex-direction:column;overflow-y:auto}
#wd *{box-sizing:border-box}
#wd .wh{display:flex;align-items:center;gap:14px;padding:calc(env(safe-area-inset-top,0px) + 14px) 16px 14px;border-bottom:1px solid #23272e;font-size:18px}
#wd .wh button{border:0;background:#1b1e24;color:#fff;width:38px;height:38px;border-radius:50%;font-size:18px;cursor:pointer}
#wd .wb{padding:18px 16px;max-width:440px;width:100%;margin:0 auto}
#wd small{display:block;font-size:12px;color:#8b93a1;margin:16px 0 7px;font-weight:600}
#wd .av{font-size:34px;font-weight:700;margin-top:2px}
#wd .cn{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
#wd .cn button{border:1px solid #2a2e35;background:#14161a;color:#c9ced6;border-radius:12px;padding:12px 0;font:inherit;font-size:14px;font-weight:700;cursor:pointer}
#wd .cn button.on{border-color:#fff;color:#fff;background:#1d2026}
#wd input{width:100%;padding:14px;border-radius:12px;border:1px solid #2a2e35;background:#0b0c0f;color:#fff;font:inherit;font-size:16px;outline:none;-webkit-user-select:text;user-select:text}
#wd input:focus{border-color:#5b6270}
#wd .ar{display:flex;gap:8px}
#wd .ar button{border:0;background:#23272e;color:#fff;border-radius:12px;padding:0 18px;font:inherit;font-weight:700;cursor:pointer}
#wd .er{min-height:20px;margin-top:12px;color:#ff6b6b;font-size:13px;font-weight:600}
#wd .go{width:100%;margin-top:6px;padding:16px;border:0;border-radius:14px;background:#fff;color:#111;font:inherit;font-size:17px;font-weight:800;cursor:pointer}
#wd .pr{text-align:center;padding-top:70px}
#wd .sp{width:64px;height:64px;margin:0 auto 22px;border-radius:50%;border:5px solid #2a2e35;border-top-color:#fff;animation:wsp 1s linear infinite}
@keyframes wsp{to{transform:rotate(360deg)}}
#wd .ok{width:64px;height:64px;margin:0 auto 22px;border-radius:50%;background:#2e9d62;position:relative}
#wd .ok::after{content:"";position:absolute;left:23px;top:13px;width:14px;height:26px;border:solid #fff;border-width:0 5px 5px 0;transform:rotate(45deg)}
#wd .pr h3{margin:0 0 8px;font-size:22px}
#wd .pr p{margin:0;color:#8b93a1;font-size:14px}
#wd .rows{margin:26px 0 22px;border:1px solid #23272e;border-radius:14px;padding:4px 16px;text-align:left}
#wd .rows div{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #23272e;font-size:14px}
#wd .rows div:last-child{border:0}
#wd .rows span{color:#8b93a1}
`;
function js(c, save) {
  return `(function(){
  var trig=document.querySelector('${c.trig}');if(!trig)return;trig.style.cursor='pointer';
  var COINS=['USDT','BTC','ETH','BNB'],wdBusy=false;
  function closeMenu(){var m=document.getElementById('wm');if(m)m.remove()}
  function isBusy(){return ${c.busy}}
  function openWd(){
    if(isBusy()){alert('Finish your round first');return}
    var coin='USDT',o=document.createElement('div');o.id='wd';
    function form(){
      o.innerHTML='<div class="wh"><button type="button" id="wx">&larr;</button><b>Withdraw</b></div><div class="wb"><small>Available balance</small><div class="av">'+fmt(${c.o}.balance)+'</div><small>Coin</small><div class="cn">'+COINS.map(function(k){return '<button type="button" data-c="'+k+'"'+(k===coin?' class="on"':'')+'>'+k+'</button>'}).join('')+'</div><small>Wallet address</small><input id="wa" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Paste your wallet address"><small>Amount (USD)</small><div class="ar"><input id="wv" type="number" inputmode="decimal" placeholder="0.00"><button type="button" id="wm2">MAX</button></div><div class="er" id="we">Minimum withdrawal is $10.00</div><button type="button" class="go" id="wg">Withdraw</button></div>';
      document.getElementById('wx').onclick=function(){o.remove()};
      [].forEach.call(o.querySelectorAll('.cn button'),function(b){b.onclick=function(){coin=b.dataset.c;[].forEach.call(o.querySelectorAll('.cn button'),function(x){x.className=x===b?'on':''})}});
      document.getElementById('wm2').onclick=function(){document.getElementById('wv').value=Math.floor(${c.o}.balance*100)/100};
      document.getElementById('wg').onclick=submit;
    }
    function submit(){
      var a=document.getElementById('wa').value.replace(/\\s+/g,''),v=Math.round(parseFloat(document.getElementById('wv').value)*100)/100,e=document.getElementById('we');
      if(a.length<10){e.textContent='Enter a valid wallet address';return}
      if(!(v>=10)){e.textContent='Minimum withdrawal is $10.00';return}
      if(v>${c.o}.balance){e.textContent='Not enough balance';return}
      var short=a.slice(0,6)+'...'+a.slice(-4);
      wdBusy=true;${c.o}.balance=Math.round((${c.o}.balance-v)*100)/100;${c.o}.start=${c.o}.start-v;${save}${c.ui}
      lg('info','withdrawal requested, '+fmt(v)+' '+coin+' to '+short);pub();
      o.innerHTML='<div class="wh"><b>Withdraw</b></div><div class="wb pr"><div class="sp"></div><h3>Processing your withdrawal</h3><p>'+fmt(v)+' '+coin+'</p></div>';
      setTimeout(function(){
        lg('ok','withdrawal approved, '+fmt(v)+' '+coin);pub();wdBusy=false;
        o.innerHTML='<div class="wh"><b>Withdraw</b></div><div class="wb pr"><div class="ok"></div><h3>Withdrawal sent</h3><p>Your withdrawal was approved</p><div class="rows"><div><span>Amount</span><b>'+fmt(v)+'</b></div><div><span>Coin</span><b>'+coin+'</b></div><div><span>To</span><b>'+short+'</b></div></div><button type="button" class="go" id="wdone">Done</button></div>';
        document.getElementById('wdone').onclick=function(){o.remove()};
      },8000);
    }
    document.body.appendChild(o);form();
  }
  trig.addEventListener('click',function(ev){
    if(document.getElementById('wd'))return;
    if(document.getElementById('wm')){closeMenu();return}
    var m=document.createElement('div');m.id='wm';
    m.innerHTML='<button type="button" id="wm-w">Withdraw</button><button type="button" id="wm-n">Change name</button>';
    document.body.appendChild(m);
    document.getElementById('wm-w').onclick=function(){closeMenu();openWd()};
    document.getElementById('wm-n').onclick=function(){closeMenu();askName(true)};
    setTimeout(function(){document.addEventListener('click',function h(e){if(!m.contains(e.target)&&e.target!==trig){closeMenu();document.removeEventListener('click',h)}})},0);
    ev.stopPropagation();
  });
})();/*setWdTap*/
  `;
}
for (const f in files) {
  if (!fs.existsSync(f)) { console.log('missing ' + f); continue; }
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes('setWdTap')) { console.log('already done ' + f); continue; }
  const c = files[f];
  const save = c.nosave ? '' : "try{localStorage.setItem(KEY+'_bal',"+c.o+".balance)}catch(e){}";
  const mark = 'if(!U)askName();';
  if (s.split(mark).length !== 2) { console.log('could not patch ' + f); continue; }
  s = s.replace(mark, js(c, save) + mark);
  const i = s.lastIndexOf('</style>');
  s = s.slice(0, i) + CSS + s.slice(i);
  if (f === 'limbo.html') s = s.replace("if(pf)pf.addEventListener('click',function(){askName(true)});", '');
  if (f === 'coinflip.html' && s.includes('var res=S.next.shift();S.next.push(coin());')) {
    s = s.replace('var res=S.next.shift();S.next.push(coin());', 'var res=S.next[0];');
    s = s.replace("S.phase=win?'won':'lost';busy=false;", "S.next.shift();S.next.push(coin());S.phase=win?'won':'lost';busy=false;");
  }
  fs.writeFileSync(f, s);
  console.log('patched ' + f);
}
