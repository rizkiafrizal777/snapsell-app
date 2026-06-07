/* ===== API BASE URL (Railway Backend) ===== */
const API_BASE = 'https://backend-snap-production-c9a5.up.railway.app';

/* ===== CONSTANTS ===== */
const PLAT = {
  instagram:{ label:'Instagram', color:'#C13584', icon:'#ic-instagram', hint:'Caption · Hashtag · Engagement' },
  tokopedia:{ label:'Tokopedia', color:'#3BAB49', icon:'#ic-shop',      hint:'SEO Marketplace · Deskripsi detail' },
  shopee:   { label:'Shopee',    color:'#EE4D2D', icon:'#ic-shop',      hint:'Keyword-rich · Poin keunggulan' },
  tiktok:   { label:'TikTok',   color:'#555',    icon:'#ic-play',      hint:'Skrip video 15-30 detik' }
};
const CHAR_LIMIT = { instagram:2200, tokopedia:3000, shopee:3000, tiktok:1000 };

let imgBase64=null, imgType=null, lastResult=null;

/* ===== THEME ===== */
(function(){
  const s=localStorage.getItem('ss-theme');
  if(s==='dark'){
    document.documentElement.setAttribute('data-theme','dark');
    document.querySelectorAll('[id^="themeIcon"]').forEach(u=>u.setAttribute('href','#ic-sun'));
  }
})();
function toggleTheme(){
  const h=document.documentElement,d=h.getAttribute('data-theme')==='dark';
  h.setAttribute('data-theme',d?'light':'dark');
  const href=d?'#ic-moon':'#ic-sun';
  document.querySelectorAll('[id^="themeIcon"]').forEach(u=>u.setAttribute('href',href));
  localStorage.setItem('ss-theme',d?'light':'dark');
}

/* ===== API CONFIG & STORAGE ===== */
document.addEventListener('DOMContentLoaded', () => {
  const savedKey = localStorage.getItem('ss-or-key');
  const savedModel = localStorage.getItem('ss-or-model');
  
  if (savedKey) {
    const keyInput = document.getElementById('apiKeyInput');
    if (keyInput) keyInput.value = savedKey;
  }
  if (savedModel) {
    const modelSelect = document.getElementById('modelSelect');
    if (modelSelect) modelSelect.value = savedModel;
  }
  
  // Set initial badge state
  handleModelChange();
  
  // Auto-save key on input change
  const keyInput = document.getElementById('apiKeyInput');
  if (keyInput) {
    keyInput.addEventListener('input', (e) => {
      localStorage.setItem('ss-or-key', e.target.value.trim());
    });
  }
});

function togglePasswordVisibility() {
  const input = document.getElementById('apiKeyInput');
  const icon = document.getElementById('eyeIcon');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.querySelector('use').setAttribute('href', '#ic-eye-off');
  } else {
    input.type = 'password';
    if (icon) icon.querySelector('use').setAttribute('href', '#ic-eye');
  }
}

function handleModelChange() {
  const modelSelect = document.getElementById('modelSelect');
  if (!modelSelect) return;
  const model = modelSelect.value;
  localStorage.setItem('ss-or-model', model);
  
  const badge = document.getElementById('modelBadge');
  if (badge) {
    const isFree = model.endsWith(':free');
    badge.textContent = isFree ? 'GRATIS' : 'BERBAYAR';
    badge.className = 'model-badge' + (isFree ? '' : ' paid');
  }
}

/* ===== NAV ===== */
function goToApp(){document.getElementById('landing').style.display='none';document.getElementById('app').style.display='flex';}
function goToLanding(){document.getElementById('landing').style.display='flex';document.getElementById('app').style.display='none';}

/* ===== PROGRESS ===== */
function updateProg(){
  const hi=!!imgBase64,hn=!!document.getElementById('productName').value.trim(),hc=!!document.getElementById('category').value;
  ['pb1','pb2','pb3'].forEach((id,i)=>{
    document.getElementById(id).classList.toggle('done',[hi,hn,hc][i]);
  });
  const miss=[];
  if(!hi)miss.push('upload foto');if(!hn)miss.push('nama produk');if(!hc)miss.push('kategori');
  document.getElementById('progLbl').textContent=miss.length?'Perlu: '+miss.join(', '):'Siap generate! 🎉';
}

/* ===== FILE ===== */
function handleFile(e){
  const f=e.target.files[0];if(!f)return;
  if(f.size>5*1024*1024){showToast('File terlalu besar. Maks 5MB.');return;}
  const r=new FileReader();
  r.onload=ev=>{
    imgBase64=ev.target.result.split(',')[1];imgType=f.type;
    document.getElementById('previewImg').src=ev.target.result;
    document.getElementById('uploadZone').style.display='none';
    document.getElementById('previewWrap').style.display='block';
    document.getElementById('tipsChip').style.display='block';
    document.getElementById('photoAnalysis').style.display='none';
    updateProg();
  };
  r.readAsDataURL(f);
}
function triggerChange(){document.getElementById('fileHidden').click();}
function removeImg(){
  imgBase64=null;imgType=null;
  document.getElementById('fileInput').value='';
  document.getElementById('uploadZone').style.display='block';
  document.getElementById('previewWrap').style.display='none';
  document.getElementById('tipsChip').style.display='none';
  document.getElementById('photoAnalysis').style.display='none';
  updateProg();
}
const uz=document.getElementById('uploadZone');
uz.addEventListener('dragover',e=>{e.preventDefault();uz.classList.add('drag-over');});
uz.addEventListener('dragleave',()=>uz.classList.remove('drag-over'));
uz.addEventListener('drop',e=>{
  e.preventDefault();uz.classList.remove('drag-over');
  const f=e.dataTransfer.files[0];
  if(f&&f.type.startsWith('image/')){const dt=new DataTransfer();dt.items.add(f);document.getElementById('fileInput').files=dt.files;handleFile({target:{files:dt.files}});}
});

/* ===== PLATFORM ===== */
function togglePlat(id,cb){document.getElementById(id).classList.toggle('on',cb.checked);}
function getPlats(){return[...document.querySelectorAll('.plat-lbl input:checked')].map(i=>i.value);}

/* ===== GENERATE ===== */
async function generate(){
  const name=document.getElementById('productName').value.trim();
  const cat=document.getElementById('category').value;
  const cost=document.getElementById('costPrice').value;
  const keu=document.getElementById('keunggulan').value.trim();
  const tgt=document.getElementById('target').value.trim();
  const tone=document.getElementById('tone').value;
  const plats=getPlats();
  const doAB=document.getElementById('abToggle').checked;
  const model=document.getElementById('modelSelect')?.value || 'google/gemini-2.0-flash-exp:free';

  if(!name){showToast('Isi nama produk dulu!');return;}
  if(!cat){showToast('Pilih kategori produk!');return;}
  if(!plats.length){showToast('Pilih minimal 1 platform!');return;}

  setLoad(true);clearResults();

  try{
    const response = await fetch(API_BASE + '/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_name: name,
        category: cat,
        cost_price: cost ? Number(cost) : undefined,
        target_buyer: tgt || undefined,
        keunggulan: keu || undefined,
        tone: tone,
        platforms: plats,
        is_ab_mode: doAB,
        model: model,
        image_base64: imgBase64 || undefined,
        image_mime_type: imgType || undefined
      })
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Terjadi kesalahan pada server');
    }

    const parsed = result.data; // contains photo_insight, harga, captions

    lastResult={name,cat,plats,parsed,doAB,ts:Date.now()};
    renderResults(plats,parsed,doAB,name);
    saveHist(name,cat,plats,parsed,doAB);
    showToast('Konten berhasil digenerate!');
    document.dispatchEvent(new CustomEvent('snapsell:generated'));
  }catch(err){
    showToast('Error: '+(err.message||'Coba lagi'));
    document.getElementById('emptyState').style.display='flex';
  }finally{setLoad(false);}
}

/* ===== OPENROUTER API (with fallback) ===== */
const OR_MODELS=[
  {id:'google/gemini-2.0-flash-exp:free',                    label:'Gemini 2.0 Flash'},
  {id:'meta-llama/llama-3.2-11b-vision-instruct:free',       label:'Llama 3.2 Vision'},
  {id:'anthropic/claude-3.5-haiku',                          label:'Claude 3.5 Haiku'},
  {id:'openai/gpt-4o-mini',                                  label:'GPT-4o Mini'}
];

async function callOpenRouter(apiKey,systemPrompt,userText){
  const preferredModel=document.getElementById('modelSelect')?.value
    ||localStorage.getItem('ss-or-model')||OR_MODELS[0].id;

  // Preferred model first, then the rest as fallback
  const ordered=[
    OR_MODELS.find(m=>m.id===preferredModel)||OR_MODELS[0],
    ...OR_MODELS.filter(m=>m.id!==preferredModel)
  ];

  let lastError;
  for(const model of ordered){
    try{
      setLoad(true,`⏳ ${model.label}...`);

      // Build user content — include image if present
      let userContent;
      if(imgBase64){
        userContent=[
          {type:'image_url',image_url:{url:`data:${imgType};base64,${imgBase64}`}},
          {type:'text',text:userText}
        ];
      }else{
        userContent=userText;
      }

      const res=await fetch('https://openrouter.ai/api/v1/chat/completions',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':`Bearer ${apiKey}`,
          'HTTP-Referer':'https://snapsell.app',
          'X-Title':'SnapSell'
        },
        body:JSON.stringify({
          model:model.id,
          max_tokens:2800,
          messages:[
            {role:'system',content:systemPrompt},
            {role:'user',  content:userContent}
          ]
        })
      });

      const data=await res.json();

      // Detect quota / capacity errors → fallback
      if(data.error){
        const msg=(data.error.message||'')+' '+(data.error.code||'')+(data.error.type||'');
        const isQuota=/rate.limit|quota|capacity|overload|unavailable|context_length/i.test(msg);
        const notLast=ordered.indexOf(model)<ordered.length-1;
        if(isQuota&&notLast){
          showToast(`⚠️ ${model.label} penuh, beralih ke model berikutnya...`);
          lastError=new Error(data.error.message);
          continue;
        }
        throw new Error(data.error.message||'OpenRouter error');
      }

      const text=data?.choices?.[0]?.message?.content;
      if(!text)throw new Error('Respons kosong dari model AI.');
      return text;

    }catch(err){
      const notLast=ordered.indexOf(model)<ordered.length-1;
      if(notLast){
        lastError=err;
        showToast(`⚠️ ${model.label} gagal, beralih ke model berikutnya...`);
        continue;
      }
      throw err;
    }
  }
  throw lastError||new Error('Semua model gagal. Coba lagi.');
}

function clearResults(){
  document.getElementById('emptyState').style.display='none';
  document.getElementById('priceCard').style.display='none';
  document.getElementById('exportBar').classList.remove('show');
  document.getElementById('captionCards').innerHTML='';
  document.getElementById('photoAnalysis').style.display='none';
}

function renderResults(plats,parsed,doAB,name){
  if(parsed.photo_insight&&imgBase64){
    const el=document.getElementById('photoAnalysis');
    el.innerHTML=`<strong><svg class="ic ic-sm" style="vertical-align:-.12em"><use href="#ic-camera"/></svg> Analisis Foto:</strong> `+parsed.photo_insight;
    el.style.display='block';
  }
  const h=parsed.harga||{};
  if(h.rekomendasi){
    document.getElementById('priceMin').textContent=fRp(h.min);
    document.getElementById('priceRec').textContent=fRp(h.rekomendasi);
    document.getElementById('priceMax').textContent=fRp(h.premium);
    document.getElementById('priceNote').textContent=h.catatan||'';
    document.getElementById('priceCard').style.display='block';
  }
  const caps=parsed.captions||{};
  const cc=document.getElementById('captionCards');
  plats.forEach(p=>{
    const raw=caps[p];if(!raw)return;
    const meta=PLAT[p];
    const isAB=doAB&&typeof raw==='object';
    const tA=isAB?raw.a:(raw||'');
    const tB=isAB?raw.b:null;
    const card=document.createElement('div');
    card.className='caption-card';card.id='card-'+p;card.style.display='block';
    const svgIcon=`<svg class="ic ic-sm" style="vertical-align:-.1em"><use href="${meta.icon}"/></svg>`;
    card.innerHTML=`
      <div class="cap-header">
        <div class="cap-plat">
          <div class="cap-icon" style="background:${meta.color}20;color:${meta.color}">${svgIcon}</div>
          <div><div class="cap-name" style="color:${meta.color}">${meta.label}</div><div class="cap-hint">${meta.hint}</div></div>
        </div>
        <div class="cap-actions">
          ${isAB?`<button class="btn-sm accent" id="pA-${p}" onclick="pickVer('${p}','a')"><svg class="ic ic-sm"><use href="#ic-check"/></svg> A</button><button class="btn-sm" id="pB-${p}" onclick="pickVer('${p}','b')">B</button>`:''}
          <button class="btn-sm" id="copy-${p}" onclick="copyCaption('${p}')">
            <svg class="ic ic-sm"><use href="#ic-copy"/></svg> Salin
          </button>
        </div>
      </div>
      ${isAB?`<div class="cap-tabs"><button class="tab-btn active" id="tab-${p}-a" onclick="switchTab('${p}','a')">Versi A</button><button class="tab-btn" id="tab-${p}-b" onclick="switchTab('${p}','b')">Versi B</button></div>`:''}
      <div class="cap-body" id="caption-${p}" data-a="${enc(tA)}" data-b="${enc(tB||'')}" data-active="a"></div>
      <div class="char-count" id="chars-${p}"></div>`;
    cc.appendChild(card);
    typewrite(document.getElementById('caption-'+p),tA,5).then(()=>updateCharCount(p,tA));
  });
  document.getElementById('exportMeta').textContent=`${name} · ${plats.length} platform · ${doAB?'A/B mode':'Single'}`;
  document.getElementById('exportBar').classList.add('show');
}

function updateCharCount(p,text){
  const lim=CHAR_LIMIT[p];if(!lim)return;
  const el=document.getElementById('chars-'+p);
  const len=text.length;
  el.textContent=`${len} / ${lim} karakter`;
  el.className='char-count'+(len>lim?' over':len>lim*.85?' warn':'');
}

/* ===== A/B ===== */
function switchTab(p,v){
  const el=document.getElementById('caption-'+p);
  const t=dec(el.getAttribute('data-'+v));
  el.setAttribute('data-active',v);el.textContent=t;
  document.getElementById('tab-'+p+'-a').classList.toggle('active',v==='a');
  document.getElementById('tab-'+p+'-b').classList.toggle('active',v==='b');
  updateCharCount(p,t);
}
function pickVer(p,v){
  switchTab(p,v);
  ['a','b'].forEach(x=>{
    const b=document.getElementById('p'+x.toUpperCase()+'-'+p);if(!b)return;
    const checkSvg=`<svg class="ic ic-sm"><use href="#ic-check"/></svg>`;
    b.innerHTML=x===v?(checkSvg+' Dipilih'):x.toUpperCase();
    b.style.color=x===v?'var(--success)':'';
    b.style.borderColor=x===v?'rgba(30,122,68,.4)':'';
  });
}

/* ===== COPY ===== */
async function copyCaption(p){
  const el=document.getElementById('caption-'+p);
  const v=el.getAttribute('data-active')||'a';
  const t=dec(el.getAttribute('data-'+v))||el.textContent;
  const btn=document.getElementById('copy-'+p);
  try{
    await navigator.clipboard.writeText(t);
    btn.innerHTML=`<svg class="ic ic-sm"><use href="#ic-check"/></svg> Tersalin`;
    btn.classList.add('copied');
    setTimeout(()=>{
      btn.innerHTML=`<svg class="ic ic-sm"><use href="#ic-copy"/></svg> Salin`;
      btn.classList.remove('copied');
    },2200);
  }catch{showToast('Gagal menyalin.');}
}

/* ===== EXPORT ===== */
function exportTxt(){
  if(!lastResult)return;
  const {name,plats,parsed,doAB}=lastResult;
  const h=parsed.harga||{};
  let out=`SNAPSELL EXPORT\nProduk : ${name}\nTanggal: ${new Date().toLocaleString('id-ID')}\n${'='.repeat(52)}\n\n`;
  out+=`REKOMENDASI HARGA\nMinimum  : ${fRp(h.min)}\nIdeal    : ${fRp(h.rekomendasi)}\nPremium  : ${fRp(h.premium)}\n`;
  if(h.catatan)out+=`Strategi : ${h.catatan}\n`;
  out+=`\n${'='.repeat(52)}\n\n`;
  const caps=parsed.captions||{};
  plats.forEach(p=>{
    const meta=PLAT[p];const raw=caps[p];
    out+=`--- ${meta.label.toUpperCase()} ---\n`;
    if(doAB&&typeof raw==='object'){out+=`[VERSI A]\n${raw.a||''}\n\n[VERSI B]\n${raw.b||''}\n`;}
    else out+=`${raw||''}\n`;
    out+=`\n${'='.repeat(52)}\n\n`;
  });
  const blob=new Blob([out],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=`snapsell-${name.replace(/\s+/g,'-').toLowerCase()}-${Date.now()}.txt`;
  a.click();URL.revokeObjectURL(url);
  showToast('File berhasil diunduh!');
}

/* ===== HISTORY ===== */
function saveHist(name,cat,plats,parsed,doAB){
  const hist=getHist();
  hist.unshift({id:Date.now(),name,cat,plats,parsed,doAB,thumb:imgBase64?('data:'+imgType+';base64,'+imgBase64):null,ts:Date.now()});
  if(hist.length>25)hist.pop();
  localStorage.setItem('ss-hist',JSON.stringify(hist));
}
function getHist(){try{return JSON.parse(localStorage.getItem('ss-hist')||'[]');}catch{return[];}}
function openHistory(){renderHistList();document.getElementById('historyModal').classList.add('open');}
function closeHistory(){document.getElementById('historyModal').classList.remove('open');}
function renderHistList(){
  const hist=getHist();const el=document.getElementById('historyList');
  if(!hist.length){
    el.innerHTML='<div style="padding:2rem;text-align:center;color:var(--ink3);font-size:13px">Belum ada riwayat.</div>';
    return;
  }
  el.innerHTML=hist.map(h=>`
    <div class="hist-item" onclick="loadHist(${h.id})">
      <div class="hist-thumb">${h.thumb?`<img src="${h.thumb}" alt="">`:`<svg class="ic" style="opacity:.4"><use href="#ic-folder"/></svg>`}</div>
      <div style="flex:1;min-width:0">
        <div class="hist-name">${h.name}</div>
        <div class="hist-meta">${h.cat} · ${h.plats.length} platform · ${new Date(h.ts).toLocaleDateString('id-ID')}</div>
      </div>
      <button class="hist-del" onclick="delHist(event,${h.id})" title="Hapus">
        <svg class="ic ic-sm"><use href="#ic-trash"/></svg>
      </button>
    </div>`).join('');
}
function loadHist(id){
  const h=getHist().find(x=>x.id===id);if(!h)return;
  closeHistory();goToApp();
  document.getElementById('productName').value=h.name;
  document.getElementById('category').value=h.cat;
  clearResults();lastResult=h;
  renderResults(h.plats,h.parsed,h.doAB,h.name);
  showToast('Riwayat dimuat!');
}
function delHist(e,id){
  e.stopPropagation();
  localStorage.setItem('ss-hist',JSON.stringify(getHist().filter(h=>h.id!==id)));
  renderHistList();
}
function clearHistory(){
  if(!confirm('Hapus semua riwayat?'))return;
  localStorage.removeItem('ss-hist');renderHistList();
}
document.getElementById('historyModal').addEventListener('click',function(e){if(e.target===this)closeHistory();});

/* ===== LOADING ===== */
function setLoad(on, customText){
  const btn=document.getElementById('btnGen'),sp=document.getElementById('spinner');
  const t=document.getElementById('btnTxt');
  const genIcon=document.getElementById('genIcon');
  btn.disabled=on;
  sp.style.display=on?'block':'none';
  if(genIcon) genIcon.style.display=on?'none':'inline-block';
  if (on) {
    t.textContent = customText || 'Sedang generate...';
  } else {
    t.textContent = 'Generate Konten Sekarang';
  }
}

/* ===== TYPEWRITE ===== */
function typewrite(el,text,speed=5){
  el.textContent='';
  const cur=document.createElement('span');cur.className='streaming-cursor';el.appendChild(cur);
  let i=0;
  return new Promise(res=>{
    function tick(){
      if(i<text.length){cur.before(text[i++]);setTimeout(tick,speed);}
      else{cur.remove();res();}
    }
    tick();
  });
}

/* ===== TOAST ===== */
let toastTimer=null;
function showToast(msg){
  const t=document.getElementById('toast');
  t.innerHTML=msg; // allow HTML so SVG icons can be passed
  t.classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3000);
}

/* ===== UTILS ===== */
function fRp(n){if(!n)return'—';return'Rp '+Math.round(n).toLocaleString('id-ID');}
function enc(s){try{return encodeURIComponent(s||'');}catch{return '';}}
function dec(s){try{return decodeURIComponent(s||'');}catch{return s||'';}}
