exports.mainPage = (appURL, quickButtons = []) => {
  const customButtonsHtml = quickButtons
    .map((b) => {
      const cmd = b.command.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return `<button class="btn bq bc" data-v="${cmd}">${b.label}</button>`;
    })
    .join('');

  const appLinkStyle = appURL
    ? '.app-link{display:block;padding:8px 14px;background:#1f3a5f;color:#58a6ff;text-align:center;text-decoration:none;font-size:13px;border-bottom:1px solid #30363d}'
    : '';
  const appLinkHtml = appURL ? `<a class="app-link" href="${appURL}">Open App</a>` : '';
  const customRow = customButtonsHtml
    ? `<div class="row quick cust">${customButtonsHtml}</div>`
    : '';

  return `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>Tapback</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;height:100dvh;overflow:hidden}
body{font-family:-apple-system,BlinkMacSystemFont,monospace;background:#0d1117;color:#c9d1d9}
#sidebar{position:fixed;top:0;left:0;bottom:0;width:44px;background:#161b22;border-right:1px solid #30363d;display:flex;flex-direction:column;padding-top:env(safe-area-inset-top);overflow:hidden;z-index:10;transition:width 0.2s}
#sidebar.expanded{width:200px;box-shadow:4px 0 20px rgba(0,0,0,0.5)}
#toggle-btn{width:100%;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;color:#8b949e;border-bottom:1px solid #30363d}
#legend-btn{width:100%;height:36px;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;color:#8b949e;border-top:1px solid #30363d;margin-top:auto}
#legend{display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#161b22;border:1px solid #30363d;border-radius:10px;padding:16px;z-index:200;min-width:200px}
#legend.show{display:block}
#legend-overlay{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:199}
#legend-overlay.show{display:block}
#legend h3{margin:0 0 12px;font-size:14px;color:#c9d1d9}
.legend-item{display:flex;align-items:center;gap:10px;margin:8px 0;font-size:13px}
.legend-color{width:20px;height:20px;border-radius:4px;display:flex;align-items:center;justify-content:center}
.legend-color.starting{background:#3d2f1a}
.legend-color.processing{background:#1a3d1a}
.legend-color.idle{background:#1a2a3f}
.legend-color.waiting{background:#3d3520}
.legend-color.ended{background:#2d2d2d}
.sess{width:100%;height:44px;display:flex;align-items:center;padding:0 10px;font-size:16px;cursor:pointer;border:2px solid transparent;transition:background 0.2s;gap:8px;background:#21262d}
.sess .name{display:none;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#c9d1d9}
#sidebar.expanded .sess .name{display:block}
.sess.active{border-color:#fff}
.sess.status-starting{background:#3d2f1a}
.sess.status-processing{background:#1a3d1a}
.sess.status-idle{background:#1a2a3f}
.sess.status-waiting{background:#3d3520}
.sess.status-ended{background:#2d2d2d}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
.sess.status-processing .icon{animation:pulse 1s infinite}
#main{display:flex;flex-direction:column;height:100%;margin-left:44px;overflow:hidden}
#h{padding:10px 14px;padding-top:max(10px,env(safe-area-inset-top));background:#161b22;border-bottom:1px solid #30363d;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}
#h .t{font-weight:bold;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#h .t.status-starting{color:#f0883e}
#h .t.status-processing{color:#3fb950}
#h .t.status-idle{color:#58a6ff}
#h .t.status-waiting{color:#d29922}
#h .t.status-ended{color:#8b949e}
#h .s{font-size:13px;flex-shrink:0}
#sound-toggle{font-size:18px;cursor:pointer;margin-left:8px}
.on{color:#3fb950}.off{color:#f85149}
${appLinkStyle}
#term-contents{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px;font-size:13px;line-height:1.5;white-space:pre-wrap;word-break:break-all;font-family:monospace}
#in{padding:12px;padding-bottom:max(12px,env(safe-area-inset-bottom));background:#161b22;border-top:1px solid #30363d;flex-shrink:0}
.row{display:flex;gap:8px;align-items:center}
.quick{margin-bottom:8px}
.btn{padding:12px 18px;font-size:15px;font-weight:600;border:none;border-radius:10px;cursor:pointer;-webkit-tap-highlight-color:transparent}
.btn:active{opacity:0.7}
.bq{flex:1;background:#21262d;color:#c9d1d9}
.cust{overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch}
.bc{flex:none;background:#1f3a5f;color:#58a6ff;font-size:13px;padding:10px 14px}
#txt{flex:1;padding:12px 14px;font-size:16px;background:#0d1117;color:#c9d1d9;border:1px solid #30363d;border-radius:10px;min-width:0}
#txt:focus{outline:none;border-color:#8b5cf6}
.bsend{background:#8b5cf6;color:#fff}
.empty{color:#8b949e;text-align:center;padding:20px}
</style></head>
<body>
<div id="legend-overlay"></div>
<div id="legend">
    <h3>ステータス</h3>
    <div class="legend-item"><span class="legend-color starting">🔄</span><span>starting - 開始中</span></div>
    <div class="legend-item"><span class="legend-color processing">⚡</span><span>processing - 処理中</span></div>
    <div class="legend-item"><span class="legend-color idle">💤</span><span>idle - 待機中</span></div>
    <div class="legend-item"><span class="legend-color waiting">⏳</span><span>waiting - 入力待ち</span></div>
    <div class="legend-item"><span class="legend-color ended">⏹</span><span>ended - 終了</span></div>
</div>
<div id="sidebar">
    <div id="toggle-btn">☰</div>
    <div id="sessions"></div>
    <div id="legend-btn">❓</div>
</div>
<div id="main">
    <div id="h"><span class="t" id="title">Tapback</span><span id="sound-toggle">🔇</span><span class="s" id="st">...</span></div>
    ${appLinkHtml}
    <div id="term-contents"></div>
    <div id="in">
        <div class="row quick">
            <button class="btn bq" data-v="1">1</button>
            <button class="btn bq" data-v="2">2</button>
            <button class="btn bq" data-v="3">3</button>
            <button class="btn bq" data-v="4">4</button>
            <button class="btn bq" data-v="5">5</button>
        </div>
        ${customRow}
        <div class="row">
            <input type="text" id="txt" placeholder="Input..." autocomplete="off" enterkeyhint="send">
            <button class="btn bsend" id="send">Send</button>
        </div>
    </div>
</div>
<script>
const st=document.getElementById('st'),txt=document.getElementById('txt');
const contents=document.getElementById('term-contents');
const title=document.getElementById('title');
const sidebar=document.getElementById('sidebar');
const sessionsEl=document.getElementById('sessions');
const legend=document.getElementById('legend');
const legendOverlay=document.getElementById('legend-overlay');
const legendBtn=document.getElementById('legend-btn');
const soundToggle=document.getElementById('sound-toggle');
let ws,activeId='',sessions=[],outputs={},sessionPaths={},claudeStatuses={};
let soundEnabled=localStorage.getItem('tapback_sound')==='1';
let prevStatuses={};

function updateSoundIcon(){soundToggle.textContent=soundEnabled?'🔔':'🔇';}
updateSoundIcon();
soundToggle.onclick=()=>{soundEnabled=!soundEnabled;localStorage.setItem('tapback_sound',soundEnabled?'1':'0');updateSoundIcon();};

function playTone(freq,duration,type='sine'){
    if(!soundEnabled)return;
    try{
        const ctx=new(window.AudioContext||window.webkitAudioContext)();
        const osc=ctx.createOscillator();
        const gain=ctx.createGain();
        osc.connect(gain);gain.connect(ctx.destination);
        osc.frequency.value=freq;
        osc.type=type;
        gain.gain.setValueAtTime(1.0,ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+duration);
        osc.start();osc.stop(ctx.currentTime+duration);
    }catch(e){}
}
function playIdleSound(){playTone(600,0.3,'sine');}
function playWaitingSound(){
    playTone(700,0.2,'sine');
    setTimeout(()=>playTone(800,0.2,'sine'),250);
}

const statusIcons={starting:'🔄',processing:'⚡',idle:'💤',waiting:'⏳',ended:'⏹'};

function getProjectName(sessionName){
    const path=sessionPaths[sessionName];
    if(!path)return sessionName;
    const parts=path.split('/').filter(p=>p);
    return parts[parts.length-1]||sessionName;
}

function getStatusForSession(sessionName){
    const sessionPath=sessionPaths[sessionName];
    if(!sessionPath)return null;
    if(claudeStatuses[sessionPath])return claudeStatuses[sessionPath].status;
    for(const[dir,s]of Object.entries(claudeStatuses)){
        if(sessionPath.startsWith(dir+'/'))return s.status;
    }
    return null;
}

function renderSidebar(){
    const prevActive=activeId;
    sessionsEl.innerHTML='';
    if(sessions.length===0){
        contents.innerHTML='<div class="empty">No tmux sessions found</div>';
        activeId='';
        title.textContent='Tapback';
        return;
    }
    if(!prevActive||!sessions.find(s=>s.name===prevActive)){
        activeId=sessions[0].name;
    }
    sessions.forEach(s=>{
        const btn=document.createElement('div');
        const status=getStatusForSession(s.name);
        btn.className='sess'+(s.name===activeId?' active':'')+(status?' status-'+status:'');
        btn.dataset.id=s.name;
        const icon=document.createElement('span');
        icon.className='icon';
        icon.textContent=status?statusIcons[status]:'📁';
        btn.appendChild(icon);
        const name=document.createElement('span');
        name.className='name';
        name.textContent=getProjectName(s.name);
        btn.appendChild(name);
        btn.onclick=()=>selectSession(s.name);
        sessionsEl.appendChild(btn);
    });
    updateContent();
}

function selectSession(id){
    activeId=id;
    document.querySelectorAll('.sess').forEach(el=>{
        const status=getStatusForSession(el.dataset.id);
        el.className='sess'+(el.dataset.id===activeId?' active':'')+(status?' status-'+status:'');
    });
    updateContent();
}

function updateSidebar(){
    document.querySelectorAll('.sess').forEach(el=>{
        const id=el.dataset.id;
        const status=getStatusForSession(id);
        const icon=el.querySelector('.icon');
        const name=el.querySelector('.name');
        el.className='sess'+(id===activeId?' active':'')+(status?' status-'+status:'');
        if(icon)icon.textContent=status?statusIcons[status]:'📁';
        if(name)name.textContent=getProjectName(id);
    });
    updateTitle();
}

function updateTitle(){
    if(activeId){
        const status=getStatusForSession(activeId);
        const icon=status?statusIcons[status]+' ':'';
        title.textContent=icon+getProjectName(activeId);
        title.className='t'+(status?' status-'+status:'');
    }else{
        title.textContent='Tapback';
        title.className='t';
    }
}

function updateContent(){
    if(!activeId){contents.innerHTML='';return;}
    const text=outputs[activeId]||'(waiting for output...)';
    const wasAtBottom=contents.scrollHeight-contents.scrollTop-contents.clientHeight<50;
    contents.innerHTML=escapeHtml(filterOutput(text));
    if(wasAtBottom)contents.scrollTop=contents.scrollHeight;
    updateTitle();
}

function escapeHtml(t){
    return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function filterOutput(t){
    return t.split('\\n').filter(line=>{
        const trimmed=line.trim();
        if(/^[─]+$/.test(trimmed))return false;
        if(/^❯\\s*$/.test(trimmed))return false;
        return true;
    }).join('\\n');
}

function connect(){
    const p=location.protocol==='https:'?'wss:':'ws:';
    ws=new WebSocket(p+'//'+location.host+'/ws');
    ws.onopen=()=>{st.textContent='Connected';st.className='s on'};
    ws.onmessage=(e)=>{
        const d=JSON.parse(e.data);
        if(d.t==='o'){
            outputs[d.id]=d.c;
            if(d.path)sessionPaths[d.id]=d.path;
            if(d.id===activeId)updateContent();
            if(!sessions.find(s=>s.name===d.id)){
                sessions.push({name:d.id});
                renderSidebar();
            }
            updateSidebar();
        }else if(d.t==='status'){
            const s=d.d;
            const prev=prevStatuses[s.project_dir];
            if(prev!==s.status){
                if(s.status==='idle')playIdleSound();
                else if(s.status==='waiting')playWaitingSound();
            }
            prevStatuses[s.project_dir]=s.status;
            claudeStatuses[s.project_dir]=s;
            updateSidebar();
        }
    };
    ws.onclose=()=>{st.textContent='Reconnecting...';st.className='s off';setTimeout(connect,2000)};
    ws.onerror=()=>ws.close();
}

function send(v){if(ws&&ws.readyState===1&&activeId)ws.send(JSON.stringify({t:'i',id:activeId,c:v}))}

document.querySelectorAll('.bq').forEach(b=>b.onclick=()=>send(b.dataset.v));
document.getElementById('send').onclick=()=>{send(txt.value);txt.value='';};
txt.onkeypress=(e)=>{if(e.key==='Enter'){send(txt.value);txt.value='';}};

document.getElementById('toggle-btn').onclick=()=>{sidebar.classList.toggle('expanded');};
legendBtn.onclick=()=>{legend.classList.add('show');legendOverlay.classList.add('show');};
legendOverlay.onclick=()=>{legend.classList.remove('show');legendOverlay.classList.remove('show');};
contents.onclick=()=>sidebar.classList.remove('expanded');

async function loadSessions(){
    try{
        const r=await fetch('/api/sessions');
        const newSessions=await r.json();
        const newNames=newSessions.map(s=>s.name).sort().join(',');
        const oldNames=sessions.map(s=>s.name).sort().join(',');
        if(newNames!==oldNames){
            sessions=newSessions;
            renderSidebar();
        }
    }catch(e){console.error(e)}
}

async function loadStatuses(){
    try{
        const r=await fetch('/api/claude-status');
        const statuses=await r.json();
        statuses.forEach(s=>{claudeStatuses[s.project_dir]=s});
        updateSidebar();
    }catch(e){console.error(e)}
}

loadSessions();
loadStatuses();
connect();
setInterval(loadSessions,5000);
</script>
</body></html>`;
};

exports.settingsPage = (config) => {
  const proxyRows = Object.entries(config.proxyPorts || {})
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(
      ([target, external]) =>
        `<div class="item" data-proxy="${target}"><div class="item-content"><span class="item-icon">⇌</span><div class="item-text"><span class="item-label">localhost:${target}</span><span class="item-arrow">→</span><span class="item-value">:${external}</span></div></div><button class="del-btn" onclick="delProxy('${target}')"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button></div>`,
    )
    .join('');

  const buttonRows = (config.quickButtons || [])
    .map(
      (b, i) =>
        `<div class="item" data-btn="${i}"><div class="item-content"><span class="item-icon">⚡</span><div class="item-text"><span class="item-label">${b.label}</span><span class="item-arrow">→</span><span class="item-value">${b.command}</span></div></div><button class="del-btn" onclick="delBtn(${i})"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button></div>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Tapback — Settings</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#0a0e14;--surface:#12171f;--surface2:#1a2030;--border:#252d3a;--border-hover:#3a4558;
  --text:#d4dae4;--text2:#8892a2;--text3:#555e6e;
  --accent:#8b5cf6;--accent2:#a78bfa;--accent-glow:rgba(139,92,246,0.15);
  --red:#ef4444;--red-bg:rgba(239,68,68,0.08);
  --green:#22c55e;--green-bg:rgba(34,197,94,0.08);
  --radius:14px;--radius-sm:10px;
}
*{box-sizing:border-box;margin:0;padding:0}
html{background:var(--bg)}
body{font-family:'Outfit',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;min-height:100dvh;padding:0 0 40px;overflow-x:hidden;-webkit-font-smoothing:antialiased}

/* Header */
.header{position:sticky;top:0;z-index:50;padding:16px 20px;padding-top:max(16px,env(safe-area-inset-top));background:rgba(10,14,20,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--border)}
.header-inner{display:flex;align-items:center;justify-content:space-between;max-width:520px;margin:0 auto}
.back-link{display:flex;align-items:center;gap:6px;color:var(--accent2);text-decoration:none;font-size:14px;font-weight:500;transition:opacity .2s}
.back-link:active{opacity:.6}
.back-link svg{transition:transform .2s}
.back-link:active svg{transform:translateX(-2px)}
.header-title{font-size:18px;font-weight:600;letter-spacing:-0.02em}
.header-badge{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--accent);background:var(--accent-glow);padding:3px 8px;border-radius:6px;font-weight:500}

/* Content */
.content{max-width:520px;margin:0 auto;padding:24px 20px}

/* Section */
.section{margin-bottom:28px;animation:fadeUp .4s ease both}
.section:nth-child(1){animation-delay:.05s}
.section:nth-child(2){animation-delay:.1s}
.section:nth-child(3){animation-delay:.15s}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

.section-header{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.section-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.section-icon.auth{background:linear-gradient(135deg,#8b5cf620,#8b5cf640)}
.section-icon.proxy{background:linear-gradient(135deg,#3b82f620,#3b82f640)}
.section-icon.buttons{background:linear-gradient(135deg,#f59e0b20,#f59e0b40)}
.section-title{font-size:15px;font-weight:600;letter-spacing:-0.01em}
.section-desc{font-size:12px;color:var(--text3);margin-top:2px}

/* Card */
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;transition:border-color .2s}

/* Toggle row */
.toggle-row{display:flex;align-items:center;justify-content:space-between;padding:16px 18px}
.toggle-label{font-size:14px;font-weight:500}
.toggle-sub{font-size:12px;color:var(--text3);margin-top:3px}
.switch{position:relative;width:48px;height:28px;flex-shrink:0}
.switch input{opacity:0;width:0;height:0;position:absolute}
.slider{position:absolute;cursor:pointer;inset:0;background:var(--surface2);border:1px solid var(--border);border-radius:28px;transition:all .3s cubic-bezier(.4,0,.2,1)}
.slider:before{content:"";position:absolute;height:20px;width:20px;left:3px;bottom:3px;background:var(--text3);border-radius:50%;transition:all .3s cubic-bezier(.4,0,.2,1);box-shadow:0 1px 3px rgba(0,0,0,.3)}
input:checked+.slider{background:var(--accent);border-color:var(--accent)}
input:checked+.slider:before{transform:translateX(20px);background:#fff}

/* Item list */
.item-list{min-height:0}
.item{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-bottom:1px solid var(--border);transition:background .15s}
.item:last-child{border-bottom:none}
.item:active{background:var(--surface2)}
.item-content{display:flex;align-items:center;gap:12px;min-width:0;flex:1}
.item-icon{font-size:15px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:var(--surface2);border-radius:7px;flex-shrink:0}
.item-text{display:flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;font-size:13px;min-width:0;flex-wrap:wrap}
.item-label{color:var(--text);font-weight:500}
.item-arrow{color:var(--text3);font-size:11px}
.item-value{color:var(--accent2)}
.del-btn{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:none;background:transparent;color:var(--text3);cursor:pointer;transition:all .15s;flex-shrink:0}
.del-btn:active{background:var(--red-bg);color:var(--red);transform:scale(.9)}
.empty-state{padding:24px 18px;text-align:center}
.empty-icon{font-size:24px;margin-bottom:8px;opacity:.4}
.empty-text{font-size:13px;color:var(--text3)}

/* Add form */
.add-form{padding:14px 18px;border-top:1px solid var(--border);background:var(--surface2);display:flex;gap:8px;align-items:center}
.add-form input{flex:1;padding:10px 12px;font-size:14px;font-family:'JetBrains Mono',monospace;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:var(--radius-sm);transition:border-color .2s;min-width:0}
.add-form input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-glow)}
.add-form input::placeholder{color:var(--text3);font-family:'Outfit',sans-serif}
.add-btn{display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:var(--radius-sm);border:none;background:var(--accent);color:#fff;cursor:pointer;transition:all .15s;flex-shrink:0;font-size:20px;font-weight:300}
.add-btn:active{transform:scale(.92);background:var(--accent2)}

/* Toast */
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);padding:12px 20px;border-radius:12px;font-size:13px;font-weight:500;pointer-events:none;z-index:100;transition:transform .4s cubic-bezier(.4,0,.2,1),opacity .4s;opacity:0;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.toast.show{transform:translateX(-50%) translateY(0);opacity:1}
.toast.ok{background:rgba(34,197,94,0.15);color:var(--green);border:1px solid rgba(34,197,94,0.2)}
.toast.err{background:rgba(239,68,68,0.15);color:var(--red);border:1px solid rgba(239,68,68,0.2)}

/* Restart hint */
.restart-hint{display:flex;align-items:center;gap:8px;padding:14px 18px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.12);border-radius:var(--radius-sm);margin-top:20px;animation:fadeUp .4s ease both;animation-delay:.2s}
.restart-hint-icon{font-size:14px}
.restart-hint-text{font-size:12px;color:#f59e0b;line-height:1.4}
</style></head>
<body>

<div class="header">
  <div class="header-inner">
    <a href="/" class="back-link"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Back</a>
    <span class="header-title">Settings</span>
    <span class="header-badge">v1.0</span>
  </div>
</div>

<div class="content">

  <!-- Auth Section -->
  <div class="section">
    <div class="section-header">
      <div class="section-icon auth">🔐</div>
      <div><div class="section-title">Authentication</div><div class="section-desc">Require PIN to access terminal</div></div>
    </div>
    <div class="card">
      <div class="toggle-row">
        <div>
          <div class="toggle-label">PIN Authentication</div>
          <div class="toggle-sub">4-digit PIN on main page</div>
        </div>
        <label class="switch"><input type="checkbox" id="pinToggle" ${config.pinEnabled ? 'checked' : ''} onchange="savePin()"><span class="slider"></span></label>
      </div>
    </div>
  </div>

  <!-- Proxy Section -->
  <div class="section">
    <div class="section-header">
      <div class="section-icon proxy">🔀</div>
      <div><div class="section-title">Proxy Ports</div><div class="section-desc">Forward localhost to external ports</div></div>
    </div>
    <div class="card">
      <div class="item-list" id="proxyList">${proxyRows || '<div class="empty-state"><div class="empty-icon">🌐</div><div class="empty-text">No proxy ports configured</div></div>'}</div>
      <div class="add-form">
        <input type="number" id="proxyTarget" placeholder="3000" inputmode="numeric">
        <input type="number" id="proxyExternal" placeholder="3001" inputmode="numeric">
        <button class="add-btn" onclick="addProxy()">+</button>
      </div>
    </div>
  </div>

  <!-- Quick Buttons Section -->
  <div class="section">
    <div class="section-header">
      <div class="section-icon buttons">⚡</div>
      <div><div class="section-title">Quick Buttons</div><div class="section-desc">Custom commands for mobile UI</div></div>
    </div>
    <div class="card">
      <div class="item-list" id="btnList">${buttonRows || '<div class="empty-state"><div class="empty-icon">🎛️</div><div class="empty-text">No custom buttons</div></div>'}</div>
      <div class="add-form">
        <input type="text" id="btnLabel" placeholder="Label">
        <input type="text" id="btnCmd" placeholder="Command">
        <button class="add-btn" onclick="addBtn()">+</button>
      </div>
    </div>
  </div>

  <div class="restart-hint">
    <span class="restart-hint-icon">⚠️</span>
    <span class="restart-hint-text">Changes to proxy ports and quick buttons take effect after restarting Tapback.</span>
  </div>

</div>

<div class="toast" id="toast"></div>

<script>
async function api(method,body){
  const r=await fetch('/api/settings',{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  return r.json();
}
function toast(ok,text){
  const t=document.getElementById('toast');
  t.className='toast '+(ok?'ok':'err');
  t.textContent=text;
  requestAnimationFrame(()=>{t.classList.add('show');});
  setTimeout(()=>{t.classList.remove('show');},2200);
}
async function savePin(){
  const res=await api('PUT',{pinEnabled:document.getElementById('pinToggle').checked});
  toast(res.ok,res.ok?'Saved':'Error');
}
async function addProxy(){
  const t=document.getElementById('proxyTarget').value,e=document.getElementById('proxyExternal').value;
  if(!t||!e)return;
  const res=await api('PUT',{addProxy:{target:Number(t),external:Number(e)}});
  if(res.ok)location.reload();else toast(false,'Error');
}
async function delProxy(target){
  const el=document.querySelector('[data-proxy="'+target+'"]');
  if(el){el.style.transition='all .25s';el.style.opacity='0';el.style.transform='translateX(20px)';
    setTimeout(async()=>{const res=await api('PUT',{delProxy:Number(target)});if(res.ok)location.reload();},250);
  }else{const res=await api('PUT',{delProxy:Number(target)});if(res.ok)location.reload();}
}
async function addBtn(){
  const l=document.getElementById('btnLabel').value,c=document.getElementById('btnCmd').value;
  if(!l||!c)return;
  const res=await api('PUT',{addButton:{label:l,command:c}});
  if(res.ok)location.reload();else toast(false,'Error');
}
async function delBtn(idx){
  const el=document.querySelector('[data-btn="'+idx+'"]');
  if(el){el.style.transition='all .25s';el.style.opacity='0';el.style.transform='translateX(20px)';
    setTimeout(async()=>{const res=await api('PUT',{delButton:idx});if(res.ok)location.reload();},250);
  }else{const res=await api('PUT',{delButton:idx});if(res.ok)location.reload();}
}
</script>
</body></html>`;
};

exports.pinPage = (error, action = '/auth') => {
  const errorHtml = error ? `<div class="e">${error}</div>` : '';
  return `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tapback</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:sans-serif;background:#0d1117;color:#c9d1d9;min-height:100vh;display:flex;align-items:center;justify-content:center}
.c{max-width:320px;width:100%;padding:20px;text-align:center}
.l{font-size:2rem;margin-bottom:1.5rem;color:#8b5cf6}
.p{width:100%;padding:1.2rem;font-size:2rem;text-align:center;letter-spacing:0.8rem;border:1px solid #30363d;border-radius:8px;background:#161b22;color:#c9d1d9;margin-bottom:1rem}
.b{width:100%;padding:1rem;font-size:1.1rem;border:none;border-radius:8px;background:#8b5cf6;color:#fff;cursor:pointer}
.e{color:#f85149;margin-top:1rem}
</style></head>
<body><div class="c">
<div class="l">Tapback</div>
<form method="POST" action="${action}">
<input type="text" name="pin" class="p" maxlength="4" inputmode="numeric" placeholder="----" required autofocus>
<button type="submit" class="b">Auth</button>
</form>${errorHtml}
</div></body></html>`;
};
