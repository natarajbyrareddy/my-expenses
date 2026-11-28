/* Chai & Cigarettes module for My Expenses.
   Uses the existing My Expenses transaction store. Do not change KEY. */
(() => {
  'use strict';
  const CATEGORY = 'Tea & Cigarettes';
  const SETTINGS_KEY = 'myExpenses.chai.settings.v1';
  const META_KEY = 'chaiMeta';
  const defaults = { brands: [], activeBrandId: '', halfTea: 0, fullTea: 0, baseline: 0, target: 0, targetDate: '' };
  const readSettings = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      const s = { ...defaults, ...raw };
      if (!Array.isArray(s.brands) || !s.brands.length) {
        const oldName = raw.brand || 'Cigarette';
        const oldPrice = Number(raw.packPrice || 0), oldSize = Number(raw.packSize || 20);
        s.brands = [{ id: 'legacy-default', name: oldName, price: oldSize > 0 ? oldPrice / oldSize : 0 }];
      } else s.brands = s.brands.map((b, i) => ({ id: b.id || `brand-${i}`, name: b.name || 'Cigarette', price: Number(b.price ?? (Number(b.packSize) > 0 ? Number(b.packPrice || 0) / Number(b.packSize) : 0)) }));
      if (!s.activeBrandId || !s.brands.some(b => b.id === s.activeBrandId)) s.activeBrandId = s.brands[0].id;
      return s;
    } catch { return { ...defaults, brands: [{ id: 'legacy-default', name: 'Cigarette', price: 0 }], activeBrandId: 'legacy-default' }; }
  };
  let settings = readSettings();
  const activeBrand = () => settings.brands.find(b => b.id === settings.activeBrandId) || settings.brands[0];
  const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(n) || 0);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateToday = () => typeof today === 'function' ? today() : new Date().toLocaleDateString('en-CA');
  const entries = () => transactions.filter(t => t.category === CATEGORY && t.chaiMeta);
  const meta = t => t.chaiMeta || {};
  const sum = list => list.reduce((n,t) => n + Number(t.amount || 0), 0);
  const count = (list, kind, owner) => list.filter(t => meta(t).kind === kind && meta(t).owner === owner).length;
  const persistSettings = () => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  const monthTitle = m => { const [y,mo] = m.split('-').map(Number); return new Intl.DateTimeFormat('en-IN',{month:'long',year:'numeric'}).format(new Date(y,mo-1,1)); };
  const dayLabel = d => new Date(d+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});

  function ensureUI() {
    if (document.getElementById('chaiModule')) return;
    const nav = document.querySelector('nav');
    const button = document.createElement('button'); button.type='button'; button.dataset.view='chai'; button.textContent='Chai'; button.setAttribute('aria-label','Chai & Cigarettes');
    button.addEventListener('click', () => showView('chai')); nav.insertBefore(button, nav.children[1] || null);
    const style=document.createElement('style'); style.id='chaiModuleStyle'; style.textContent=`nav{display:flex;justify-content:space-between;gap:2px}nav button{flex:1 1 0;min-width:0;padding:9px 2px;font-size:12px}.chai-panel{margin:14px 0}.chai-spend{background:var(--theme-soft);border:1px solid var(--theme-mid);border-radius:18px;padding:17px}.chai-total{font-size:32px;font-weight:500;margin:5px 0 12px}.chai-split{display:grid;grid-template-columns:1fr 1fr;gap:8px}.chai-split>div{background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px}.chai-split small{display:block;color:var(--muted);margin-bottom:5px}.chai-split strong{font-size:18px}.chai-table{width:100%;border-collapse:collapse;font-size:13px}.chai-table td,.chai-table th{padding:9px 5px;border-bottom:1px solid var(--line);text-align:left}.chai-table td:last-child,.chai-table th:last-child{text-align:right}.chai-hidden{display:none!important}.chai-mini{font-size:12px;color:var(--muted)}.chai-report-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.chai-report-grid .insight{min-width:0}.chai-controls{display:flex;gap:8px;flex-wrap:wrap}.chai-controls>*{flex:1;min-width:110px}.chai-section-title{font-size:17px;font-weight:650;margin:22px 2px 10px}.chai-brand-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.chai-brand-actions button{width:100%;margin:0}#chaiSaveTea{width:100%;margin-top:4px}.chai-today{background:#fff;border:1px solid var(--line);border-radius:18px;padding:14px 16px;margin:14px 0}.chai-today-title{font-size:17px;font-weight:650;margin-bottom:6px}.chai-today-grid{display:grid;grid-template-columns:62px 1fr 1fr;align-items:stretch;text-align:center}.chai-today-grid>small{color:var(--muted);font-size:12px;padding-bottom:4px}.chai-today-grid>.chai-who{display:flex;align-items:center;text-align:left;font-weight:600;font-size:15px;padding:10px 0;border-top:1px solid var(--line)}.chai-today-grid>.chai-num{display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:600;line-height:1;padding:10px 0;border-top:1px solid var(--line)}.chai-today-grid>.chai-num:nth-of-type(odd){color:var(--theme)}.chai-sp{display:grid;grid-template-columns:auto 1fr 1fr;column-gap:0;background:#fff;border:1px solid var(--line);border-radius:14px;padding:6px 14px}.chai-sp>*{padding:9px 0;border-top:1px solid var(--line);font-size:15px;font-variant-numeric:tabular-nums;white-space:nowrap}.chai-sp>:nth-child(-n+3){border-top:0;padding-bottom:4px}.chai-sp>small{color:var(--muted);font-size:13px;font-weight:600}.chai-sp>:nth-child(3n+2),.chai-sp>:nth-child(3n){text-align:right}.chai-sp>:nth-child(3n+1){color:var(--muted);padding-right:20px}.chai-sp>b{font-size:17px;font-weight:700;color:var(--text,inherit)}.chai-sp>b:nth-child(3n+1){color:inherit}.chai-chart-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:6px}#chaiChart svg{width:100%;height:auto;display:block}.chai-stats3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}.chai-stats3 .insight{padding:10px 8px;min-width:0}.chai-stats3 .insight strong{font-size:18px;display:block;white-space:nowrap}.chai-stats3 .insight small{font-size:12px}`; document.head.appendChild(style);
    const section=document.createElement('section'); section.className='view'; section.id='chai';
    section.innerHTML=`<div id="chaiModule">
      <header><div class="top"><div class="brand">Chai & Cigarettes</div><div class="month" id="chaiMonth"></div></div></header>
      <div class="chai-section-title">Spending · <span id="chaiSpendMonth"></span></div>
      <div class="chai-spend"><div class="chai-mini">Total recorded spending</div><div class="chai-total" id="chaiTotalSpend">₹0</div><div class="chai-sp">
        <span></span><small>Me</small><small>Group</small>
        <span>Cigarettes</span><span id="chaiMyCigSpend">₹0</span><span id="chaiGroupCigSpend">₹0</span>
        <span>Tea</span><span id="chaiMyTeaSpend">₹0</span><span id="chaiGroupTeaSpend">₹0</span>
        <b>Total</b><b id="chaiMySpend">₹0</b><b id="chaiGroupSpend">₹0</b></div></div>
      <div class="chai-today"><div class="chai-today-title">Today<span id="chaiMyToday" style="display:none"></span></div><div class="chai-today-grid"><span></span><small>Cigarettes</small><small>Chai</small><span class="chai-who">Me</span><strong class="chai-num" id="myCigCount">0</strong><strong class="chai-num" id="myTeaCount">0</strong><span class="chai-who">Group</span><strong class="chai-num" id="groupCigCount">0</strong><strong class="chai-num" id="groupTeaCount">0</strong></div></div>
      <div class="sectionhead"><h2>Quick add · Me</h2><span class="subtle">One tap per item</span></div><div class="actions"><button class="primary" data-owner="my" data-kind="cigarette">＋ Cigarette</button><button class="secondary" data-owner="my" data-kind="half">＋ Half chai</button><button class="secondary" data-owner="my" data-kind="full">＋ Full chai</button><button class="secondary" id="chaiUndoMy">Undo last</button></div>
      <div class="sectionhead"><h2>Quick add · Group</h2><span class="subtle">Recorded in spending</span></div><div class="actions"><button class="primary" data-owner="group" data-kind="cigarette">＋ Group cigarette</button><button class="secondary" data-owner="group" data-kind="half">＋ Group half chai</button><button class="secondary" data-owner="group" data-kind="full">＋ Group full chai</button><button class="secondary" id="chaiUndoGroup">Undo last group entry</button></div>
      <div class="chai-section-title">Cigarette reduction tracker</div><div class="formcard"><div class="chai-chart-head"><strong>My cigarettes · last 7 days</strong><span class="chai-mini">Target per day: <span id="chaiTargetDisplay">Not set</span></span></div><div id="chaiChart"></div><div class="chai-stats3"><div class="insight"><small>7-day avg</small><strong id="chaiAverage">—</strong></div><div class="insight"><small>Streak</small><strong id="chaiStreak">—</strong></div><div class="insight"><small>Saved this month</small><strong id="chaiSaved">—</strong></div></div><div class="note" id="chaiSavedNote"></div><div class="row" style="margin-top:10px"><div class="field"><label for="chaiBaseline">Baseline cigarettes / day</label><input id="chaiBaseline" type="number" min="0" step="1"></div><div class="field"><label for="chaiTarget">Target cigarettes / day</label><input id="chaiTarget" type="number" min="0" step="1"></div></div><div class="field"><label for="chaiTargetDate">Target date (optional)</label><input id="chaiTargetDate" type="date"></div><button class="primary" id="chaiSaveGoal" type="button">Save reduction goal</button><div class="note" id="chaiReductionNote">Start tracking to establish your baseline. No pressure or alerts.</div></div>

      <div class="formcard chai-panel"><div class="sectionhead" style="margin-top:0"><h2>Prices & Brands</h2><span class="subtle">Select before adding</span></div>
        <div class="field"><label for="chaiBrandSelect">Selected cigarette brand</label><select id="chaiBrandSelect"></select></div>
        <div class="row"><div class="field"><label for="chaiBrandName">Brand name</label><input id="chaiBrandName" maxlength="35" placeholder="e.g. Gold Flake"></div><div class="field"><label for="chaiCigPrice">Price per cigarette (₹)</label><input id="chaiCigPrice" type="number" min="0" step="0.01" inputmode="decimal"></div></div>
        <div class="chai-brand-actions"><button class="secondary" type="button" id="chaiSaveBrand">Add brand</button><button class="secondary" type="button" id="chaiDeleteBrand">Delete brand</button></div>
        <div class="row" style="margin-top:10px"><div class="field"><label for="chaiHalfPrice">Half chai (₹)</label><input id="chaiHalfPrice" type="number" min="0" step="0.01"></div><div class="field"><label for="chaiFullPrice">Full chai (₹)</label><input id="chaiFullPrice" type="number" min="0" step="0.01"></div></div>
        <button class="primary" type="button" id="chaiSaveTea">Save tea prices</button>
      </div>
      
            <div class="sectionhead"><h2>Consumption & spending report</h2><span class="subtle">Load when needed</span></div><button class="secondary" id="chaiShowReport" type="button" style="width:100%">View Chai report</button><div id="chaiReport" class="formcard chai-hidden chai-panel"></div>
      <div class="sectionhead"><h2>Transaction history</h2><span class="subtle">Load only when needed</span></div><button class="secondary" id="chaiShowHistory" type="button" style="width:100%">View Chai history</button><div id="chaiHistory" class="formcard chai-hidden chai-panel"></div>
    </div>`;
    document.querySelector('main').appendChild(section);
    section.querySelectorAll('button[data-owner]').forEach(b=>b.addEventListener('click',()=>addEntry(b.dataset.owner,b.dataset.kind)));
    document.getElementById('chaiBrandSelect').addEventListener('change',selectBrand);
    document.getElementById('chaiSaveBrand').addEventListener('click',saveBrand);document.getElementById('chaiCigPrice').addEventListener('change',updateBrandPrice);
    document.getElementById('chaiDeleteBrand').addEventListener('click',deleteBrand);
    document.getElementById('chaiSaveTea').addEventListener('click',saveTea);
    document.getElementById('chaiUndoMy').addEventListener('click',()=>undoLast('my'));
    document.getElementById('chaiUndoGroup').addEventListener('click',()=>undoLast('group'));
    document.getElementById('chaiSaveGoal').addEventListener('click',saveGoal);
    document.getElementById('chaiShowReport').addEventListener('click',toggleReport);
    document.getElementById('chaiShowHistory').addEventListener('click',toggleHistory);
    fillSettings(); renderModule();
  }
  function fillSettings(){const sel=document.getElementById('chaiBrandSelect');sel.innerHTML=settings.brands.map(b=>`<option value="${esc(b.id)}">${esc(b.name)}</option>`).join('');sel.value=settings.activeBrandId;const b=activeBrand()||{name:'',price:0};document.getElementById('chaiBrandName').value=b.name;document.getElementById('chaiCigPrice').value=b.price||'';document.getElementById('chaiHalfPrice').value=settings.halfTea||'';document.getElementById('chaiFullPrice').value=settings.fullTea||'';document.getElementById('chaiBaseline').value=settings.baseline||'';document.getElementById('chaiTarget').value=settings.target||'';document.getElementById('chaiTargetDate').value=settings.targetDate||'';}
  function selectBrand(){settings.activeBrandId=document.getElementById('chaiBrandSelect').value;persistSettings();fillSettings();}
  function saveBrand(){
    const nameEl=document.getElementById('chaiBrandName'),priceEl=document.getElementById('chaiCigPrice');
    const name=nameEl.value.trim(),price=Number(priceEl.value||0);
    if(!name)return showToast('Enter a cigarette brand name.');
    if(price<=0)return showToast('Enter the price of one cigarette.');
    if(settings.brands.some(x=>x.name.toLowerCase()===name.toLowerCase()))return showToast('That brand is already in your list.');
    const b={id:'brand-'+Date.now(),name,price};
    settings.brands.push(b);settings.activeBrandId=b.id;
    persistSettings();fillSettings();showToast('Brand added.');
  }
  function updateBrandPrice(){
    const b=activeBrand(),name=document.getElementById('chaiBrandName').value.trim(),price=Number(document.getElementById('chaiCigPrice').value||0);
    if(!b||name.toLowerCase()!==b.name.toLowerCase()||price<=0||price===b.price)return;
    b.price=price;persistSettings();showToast(b.name+' price updated.');
  }
  function deleteBrand(){
    const brand=activeBrand();
    if(!brand)return showToast('No cigarette brand selected.');
    if(settings.brands.length<=1)return showToast('Add another brand before deleting the last one.');
    if(!confirm(`Delete ${brand.name} from your brand list? Previous entries and their spending will be kept.`))return;
    settings.brands=settings.brands.filter(b=>b.id!==brand.id);
    settings.activeBrandId=settings.brands[0].id;
    persistSettings();
    fillSettings();
    renderModule();
    showToast(`${brand.name} deleted. Previous entries were kept.`);
  }
  function saveTea(){settings.halfTea=Number(document.getElementById('chaiHalfPrice').value||0);settings.fullTea=Number(document.getElementById('chaiFullPrice').value||0);persistSettings();showToast('Tea prices saved.');}
  function saveGoal(){settings.baseline=Math.max(0,Number(document.getElementById('chaiBaseline').value||0));settings.target=Math.max(0,Number(document.getElementById('chaiTarget').value||0));settings.targetDate=document.getElementById('chaiTargetDate').value;persistSettings();renderModule();showToast('Reduction goal saved.');}
function addEntry(owner,kind){
  const b=activeBrand();
  let amount,label,item;

  if(kind==='cigarette'){
    amount=Number(b?.price||0);
    label='Cigarette';
    item=b?.name||'Cigarette';
  }else if(kind==='half'){
    amount=Number(settings.halfTea);
    label='Half chai';
    item=label;
  }else{
    amount=Number(settings.fullTea);
    label='Full chai';
    item=label;
  }

  if(!(amount>0))
    return showToast(kind==='cigarette'
      ?'Set the selected brand price per cigarette first.'
      :'Set the tea price first.');

  const record={
    id:crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(16).slice(2),
    type:'expense',
    amount,
    category:CATEGORY,
    description:`${owner==='my'?'My':'Group'} · ${label}${kind==='cigarette'?' · '+item:''}`,
    date:dateToday(),
    created:Date.now(),
    chaiMeta:{owner,kind,label,item,unitPrice:amount,brand:kind==='cigarette'?item:''}
  };

  transactions.push(record);
  save();
  renderModule();

  const name=kind==='cigarette'?'cigarette':'tea';
  showToast(owner==='group'
    ?`1 ${name} added to Group.`
    :`1 ${name} added.`);
}
  function undoLast(owner){
  const last=entries()
    .filter(t=>meta(t).owner===owner)
    .sort((a,b)=>Number(b.created||0)-Number(a.created||0))[0];

  if(!last)
    return showToast(`No ${owner==='my'?'personal':'group'} entry to undo.`);

  const label=meta(last).label||'Entry';
  const canRestore=typeof showUndoToast==='function';

  if(!canRestore&&!confirm(`Undo last ${owner==='my'?'personal':'group'} entry?\n${label} · ${money(last.amount)}\n\nCancel / OK`))
    return;

  transactions=transactions.filter(t=>String(t.id)!==String(last.id));
  save();
  renderModule();

  if(canRestore)
    showUndoToast(`${label} removed.`,()=>{
      if(transactions.some(t=>String(t.id)===String(last.id)))return;
      transactions.push(last);
      save();
      renderModule();
    });
  else
    showToast('Entry undone.');
}
  function renderModule(){if(!document.getElementById('chaiModule'))return;const all=entries(),month=dateToday().slice(0,7),thisMonth=all.filter(t=>(t.date||'').slice(0,7)===month),my=thisMonth.filter(t=>meta(t).owner==='my'),group=thisMonth.filter(t=>meta(t).owner==='group'),todayRows=all.filter(t=>t.date===dateToday());document.getElementById('chaiMonth').textContent=monthTitle(month);document.getElementById('chaiSpendMonth').textContent=monthTitle(month);document.getElementById('chaiTotalSpend').textContent=money(sum(thisMonth));document.getElementById('chaiMySpend').textContent=money(sum(my));document.getElementById('chaiGroupSpend').textContent=money(sum(group));const cigS=a=>money(sum(a.filter(t=>meta(t).kind==='cigarette'))),teaS=a=>money(sum(a.filter(t=>meta(t).kind!=='cigarette')));document.getElementById('chaiMyCigSpend').textContent=cigS(my);document.getElementById('chaiMyTeaSpend').textContent=teaS(my);document.getElementById('chaiGroupCigSpend').textContent=cigS(group);document.getElementById('chaiGroupTeaSpend').textContent=teaS(group);document.getElementById('chaiMyToday').textContent=`${todayRows.filter(t=>meta(t).owner==='my').length} today`;document.getElementById('myCigCount').textContent=count(todayRows,'cigarette','my');document.getElementById('myTeaCount').textContent=count(todayRows,'half','my')+count(todayRows,'full','my');document.getElementById('groupCigCount').textContent=count(todayRows,'cigarette','group');document.getElementById('groupTeaCount').textContent=count(todayRows,'half','group')+count(todayRows,'full','group');renderReduction(all);renderProgress(all);}
  function renderProgress(all){
    const host=document.getElementById('chaiChart');if(!host)return;
    const todayD=dateToday(),tgt=Number(settings.target)||0,base=Number(settings.baseline)||0;
    const addDays=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return x.toLocaleDateString('en-CA');};
    const mineAll=all.filter(t=>meta(t).owner==='my'),by={};
    mineAll.filter(t=>meta(t).kind==='cigarette').forEach(t=>{by[t.date]=(by[t.date]||0)+1;});
    const first=mineAll.map(t=>t.date).sort()[0];
    const days=[];for(let i=6;i>=0;i--)days.push(addDays(todayD,-i));
    const vals=days.map(d=>by[d]||0),max=Math.max(1,tgt,...vals),W=300,slot=W/7,bw=24,base0=104,ph=78;
    let svg='<svg viewBox="0 0 300 130" role="img" aria-label="Cigarettes per day, last 7 days">';
    days.forEach((d,i)=>{
      const v=vals[i],h=v?Math.max(4,Math.round(v/max*ph)):2,x=Math.round(i*slot+(slot-bw)/2),over=tgt>0&&v>tgt,isT=d===todayD;
      const fill=over?'var(--muted)':'var(--theme)';
      svg+=`<rect x="${x}" y="${base0-h}" width="${bw}" height="${h}" rx="4" style="fill:${fill};opacity:${isT?1:.75}"/>`;
      svg+=`<text x="${x+bw/2}" y="${base0-h-5}" text-anchor="middle" style="font-size:12px;font-weight:600;fill:var(--text,currentColor)">${v}</text>`;
      const lab=new Date(d+'T12:00:00').toLocaleDateString('en-IN',{weekday:'short'});
      svg+=`<text x="${x+bw/2}" y="123" text-anchor="middle" style="font-size:11px;fill:var(--muted);font-weight:${isT?700:400}">${isT?'Today':lab}</text>`;
    });
    if(tgt>0){const y=base0-Math.round(tgt/max*ph);svg+=`<line x1="0" x2="300" y1="${y}" y2="${y}" style="stroke:var(--muted);stroke-width:1;stroke-dasharray:4 4"/>`;}
    host.innerHTML=svg+'</svg>';
    // streak: completed days (up to yesterday) at or under target, since tracking began
    let streak=0;
    if(first&&tgt>0){let d=addDays(todayD,-1);while(d>=first&&streak<3650){if((by[d]||0)<=tgt){streak++;d=addDays(d,-1);}else break;}}
    document.getElementById('chaiStreak').textContent=tgt>0?streak+(streak===1?' day':' days'):'Set target';
    // money saved this month vs baseline (completed days only)
    const sv=document.getElementById('chaiSaved'),note=document.getElementById('chaiSavedNote');
    const price=Number(activeBrand()?.price||0),monthStart=todayD.slice(0,8)+'01',yest=addDays(todayD,-1);
    const start=first&&first>monthStart?first:monthStart;
    if(!(base>0)){sv.textContent='—';note.textContent='Set your baseline cigarettes per day below to see money saved and your streak. No pressure or alerts.';return;}
    if(!first||start>yest){sv.textContent='—';note.textContent='Savings start counting from your first full day of tracking.';return;}
    let n=0,actual=0;for(let d=start;d<=yest;d=addDays(d,1)){n++;actual+=by[d]||0;}
    const fewer=base*n-actual,saved=fewer>0?fewer*price:0;
    sv.textContent=money(saved);
    note.textContent=`Since ${dayLabel(start)} (${n} full ${n===1?'day':'days'}): ${fewer>0?fewer+' fewer':Math.abs(fewer)+' more'} cigarettes than your baseline of ${base}/day, valued at ${money(price)} each.`+(tgt>0?'':' Set a target to track a streak.');
  }
  function renderReduction(all){const now=new Date(dateToday()+'T12:00:00'),start=new Date(now);start.setDate(start.getDate()-6);const days=[];for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);days.push(d.toLocaleDateString('en-CA'));}const counts=days.map(d=>all.filter(t=>t.date===d&&meta(t).owner==='my'&&meta(t).kind==='cigarette').length);const avg=counts.reduce((a,b)=>a+b,0)/7;document.getElementById('chaiAverage').textContent=avg.toFixed(1);document.getElementById('chaiTargetDisplay').textContent=settings.target?String(settings.target):'Not set';let note='Your seven-day average is based on recorded personal cigarette entries.';if(settings.baseline>0){const diff=settings.baseline-avg;note+=diff>=0?` You are ${diff.toFixed(1)} below your baseline of ${settings.baseline}/day.`:` You are ${Math.abs(diff).toFixed(1)} above your baseline of ${settings.baseline}/day.`;}if(settings.targetDate)note+=` Target date: ${dayLabel(settings.targetDate)}.`;document.getElementById('chaiReductionNote').textContent=note;}
  function toggleReport(){const host=document.getElementById('chaiReport'),show=host.classList.contains('chai-hidden');host.classList.toggle('chai-hidden');document.getElementById('chaiShowReport').textContent=show?'Hide Chai report':'View Chai report';if(show)renderChaiReport();}
  function renderChaiReport(){const host=document.getElementById('chaiReport');const all=entries();host.innerHTML=`<div class="field"><label for="chaiPeriod">Report period</label><select id="chaiPeriod"><option value="today">Today</option><option value="week">This week</option><option value="month" selected>This month</option><option value="year">This year</option><option value="custom">Custom dates</option></select></div><div class="row chai-hidden" id="chaiCustomDates"><div class="field"><label>From</label><input type="date" id="chaiFrom"></div><div class="field"><label>To</label><input type="date" id="chaiTo"></div></div><button class="secondary" id="chaiApplyPeriod" type="button" style="width:100%;margin:8px 0">Apply period</button><div id="chaiReportBody"></div>`;document.getElementById('chaiPeriod').addEventListener('change',e=>document.getElementById('chaiCustomDates').classList.toggle('chai-hidden',e.target.value!=='custom'));document.getElementById('chaiApplyPeriod').addEventListener('click',()=>renderChaiReportBody(all));renderChaiReportBody(all);}
  function renderChaiReportBody(all){const period=document.getElementById('chaiPeriod').value,todayDate=dateToday();let from,to;if(period==='today')from=to=todayDate;else if(period==='week'){const d=new Date(todayDate+'T12:00:00');d.setDate(d.getDate()-6);from=d.toLocaleDateString('en-CA');to=todayDate;}else if(period==='month'){from=todayDate.slice(0,7)+'-01';to=todayDate;}else if(period==='year'){from=todayDate.slice(0,4)+'-01-01';to=todayDate;}else{from=document.getElementById('chaiFrom').value;to=document.getElementById('chaiTo').value;}if(!from||!to||from>to){showToast('Choose a valid date range.');return;}const rows=all.filter(t=>t.date>=from&&t.date<=to),mine=rows.filter(t=>meta(t).owner==='my'),group=rows.filter(t=>meta(t).owner==='group');const block=(title,list,owner)=>{const cig=count(list,'cigarette',owner),half=count(list,'half',owner),full=count(list,'full',owner),tea=half+full;return `<h3>${title}</h3><table class="chai-table"><tr><td>Cigarettes</td><td>${cig}</td></tr><tr><td>Half chai</td><td>${half}</td></tr><tr><td>Full chai</td><td>${full}</td></tr><tr><th>Total chai</th><th>${tea}</th></tr></table>`;};const brands={};mine.filter(t=>meta(t).kind==='cigarette').forEach(t=>{const b=meta(t).brand||meta(t).item||'Unknown';brands[b]=(brands[b]||0)+1;});const spend=(list,kind)=>money(sum(list.filter(t=>meta(t).kind===kind)));document.getElementById('chaiReportBody').innerHTML=`<div class="chai-mini">${dayLabel(from)} – ${dayLabel(to)}</div>${block('My consumption',mine,'my')}${block('Group consumption',group,'group')}<h3>Spending breakdown</h3><table class="chai-table"><tr><td>My cigarettes</td><td>${spend(mine,'cigarette')}</td></tr><tr><td>My tea</td><td>${money(sum(mine.filter(t=>meta(t).kind==='half'||meta(t).kind==='full')))}</td></tr><tr><td>Group cigarettes</td><td>${spend(group,'cigarette')}</td></tr><tr><td>Group tea</td><td>${money(sum(group.filter(t=>meta(t).kind==='half'||meta(t).kind==='full')))}</td></tr></table><h3>My cigarettes by brand</h3>${Object.keys(brands).length?Object.entries(brands).map(([b,n])=>`<div class="barlabel"><span>${esc(b)}</span><b>${n}</b></div>`).join(''):'<div class="note">No cigarette entries in this period.</div>'}`;}
  function toggleHistory(){const host=document.getElementById('chaiHistory'),show=host.classList.contains('chai-hidden');host.classList.toggle('chai-hidden');document.getElementById('chaiShowHistory').textContent=show?'Hide Chai history':'View Chai history';if(show)renderChaiHistory();}
  function renderChaiHistory(){const host=document.getElementById('chaiHistory'),all=entries().sort((a,b)=>b.date.localeCompare(a.date)||Number(b.created||0)-Number(a.created||0));host.innerHTML=`<div class="field"><label for="chaiHistoryFilter">Show entries</label><select id="chaiHistoryFilter"><option value="all">All</option><option value="my">My entries</option><option value="group">Group entries</option></select></div><div id="chaiHistoryList"></div>`;const draw=()=>{const f=document.getElementById('chaiHistoryFilter').value,rows=all.filter(t=>f==='all'||meta(t).owner===f);document.getElementById('chaiHistoryList').innerHTML=rows.length?rows.map(t=>`<div class="transaction"><div class="dot">${meta(t).kind==='cigarette'?'↗':'＋'}</div><div class="txinfo"><div class="txname">${esc(meta(t).owner==='group'?'Group':'My')} · ${esc(meta(t).label||'Entry')}${meta(t).brand?' · '+esc(meta(t).brand):''}</div><div class="txmeta">${dayLabel(t.date)} · ${t.created?new Date(Number(t.created)).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'}):'Time unavailable'}</div></div><div class="txamt">${money(t.amount)}</div></div>`).join(''):'<div class="empty">No entries found.</div>';};document.getElementById('chaiHistoryFilter').addEventListener('change',draw);draw();}
  // Always render from the latest saved transaction snapshot. This also
  // covers iOS Home Screen/PWA resumes where background JS may be suspended.
  function refreshChaiFromStorage(){
    try{const latest=JSON.parse(localStorage.getItem('myExpenses.transactions.v1')||'[]');if(Array.isArray(latest))transactions=latest;}catch(e){}
    renderModule();
  }
  window.renderChaiModule=renderModule;
  window.reloadChaiSettings=()=>{settings=readSettings();if(document.getElementById('chaiModule'))fillSettings();renderModule();};
  document.addEventListener('click',e=>{if(e.target.closest('nav button[data-view="chai"]'))requestAnimationFrame(refreshChaiFromStorage);});
  window.addEventListener('storage',e=>{if(e.key==='myExpenses.transactions.v1')requestAnimationFrame(refreshChaiFromStorage);if(e.key===SETTINGS_KEY){settings=readSettings();if(document.getElementById('chaiModule')){fillSettings();refreshChaiFromStorage();}}});
  window.addEventListener('pageshow',refreshChaiFromStorage);
  window.addEventListener('focus',refreshChaiFromStorage);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshChaiFromStorage();});
  if('BroadcastChannel' in window){try{const channel=new BroadcastChannel('myExpenses.sync.v1');channel.addEventListener('message',e=>{if(e.data?.type==='transactions-updated')refreshChaiFromStorage();});}catch(e){}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureUI);else ensureUI();
})();
