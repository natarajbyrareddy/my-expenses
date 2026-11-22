/* Chai & Cigarettes module for My Expenses.
   Uses the existing My Expenses transaction store and visual theme.
   Do not change KEY / existing storage keys. */
(() => {
  'use strict';
  const CATEGORY = 'Tea & Cigarettes';
  const SETTINGS_KEY = 'myExpenses.chai.settings.v1';
  const META_KEY = 'chaiMeta';
  const defaults = { brand: 'Cigarette', packPrice: 0, packSize: 20, halfTea: 0, fullTea: 0 };
  let settings = (() => {
    try {
      const saved = { ...defaults, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')) };
      if (!Array.isArray(saved.brands)) {
        saved.brands = [{ id: 'legacy-default', name: saved.brand || 'Cigarette', packPrice: Number(saved.packPrice) || 0, packSize: Number(saved.packSize) || 20 }];
      }
      if (!saved.activeBrandId || !saved.brands.some(b => b.id === saved.activeBrandId)) saved.activeBrandId = saved.brands[0]?.id || 'legacy-default';
      return saved;
    } catch {
      return { ...defaults, brands: [{ id: 'legacy-default', name: 'Cigarette', packPrice: 0, packSize: 20 }], activeBrandId: 'legacy-default' };
    }
  })();
  const activeBrand = () => settings.brands.find(b => b.id === settings.activeBrandId) || settings.brands[0];
  const unitCigarette = () => {
    const b = activeBrand();
    return b && Number(b.packSize) > 0 ? Number(b.packPrice) / Number(b.packSize) : 0;
  };

  const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(n) || 0);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateToday = () => typeof today === 'function' ? today() : new Date().toISOString().slice(0,10);
  const entries = () => transactions.filter(t => t.category === CATEGORY && t.chaiMeta);
  const meta = t => t.chaiMeta || {};
  const sum = (list, predicate) => list.filter(predicate).reduce((n,t) => n + Number(t.amount || 0), 0);
  const counts = (list, kind, owner) => list.filter(t => meta(t).kind === kind && meta(t).owner === owner).length;

  function ensureUI() {
    if (document.getElementById('chaiModule')) return;
    const nav = document.querySelector('nav');
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.view = 'chai'; button.textContent = 'Chai'; button.setAttribute('aria-label', 'Chai & Cigarettes'); button.title = 'Chai & Cigarettes';
    button.addEventListener('click', () => showView('chai'));
    nav.appendChild(button);
    // Five destinations must fit the iPhone bottom bar without horizontal clipping.
    const navStyle = document.createElement('style');
    navStyle.id = 'chaiNavFit';
    navStyle.textContent = 'nav{display:flex;justify-content:space-between;gap:2px}nav button{flex:1 1 0;min-width:0;padding:9px 2px;font-size:12px;white-space:normal;line-height:1.2}.summary{grid-template-columns:1fr 1fr}.card.primary-spend{grid-column:auto;padding:16px}.card.primary-spend .amount{font-size:23px}.spend-breakdown{display:grid;gap:6px;margin-top:10px;padding-top:9px;border-top:1px solid #f0e2da;font-size:12px;color:#887b74}.spend-breakdown span{display:flex;justify-content:space-between;gap:6px}.spend-breakdown strong{color:#292421;font-weight:600}';
    document.head.appendChild(navStyle);

    const section = document.createElement('section');
    section.className = 'view'; section.id = 'chai';
    section.innerHTML = `
      <div id="chaiModule">
        <header><div class="top"><div class="brand">Chai & Cigarettes</div><div class="month" id="chaiMonth"></div></div></header>
        <div class="summary">
          <div class="card primary-spend"><small>My spending · This month</small><div class="amount" id="chaiMySpend">₹0</div>
            <div class="spend-breakdown"><span>Cigarettes <strong id="chaiMyCigSpend">₹0</strong></span><span>Tea <strong id="chaiMyTeaSpend">₹0</strong></span></div></div>
          <div class="card"><small>Group spending · This month</small><div class="amount" id="chaiGroupSpend">₹0</div>
            <div class="spend-breakdown"><span>Cigarettes <strong id="chaiGroupCigSpend">₹0</strong></span><span>Tea <strong id="chaiGroupTeaSpend">₹0</strong></span></div></div>
        </div>
        <div class="sectionhead"><h2>My count</h2><span class="subtle" id="chaiMyToday"></span></div>
        <div class="insights-grid">
          <div class="insight"><small>My cigarettes</small><strong id="myCigCount">0</strong></div>
          <div class="insight"><small>My chai</small><strong id="myTeaCount">0</strong></div>
        </div>
        <div class="sectionhead"><h2>Quick add · Me</h2><span class="subtle">One tap per item</span></div>
        <div class="actions">
          <button class="primary" type="button" data-owner="my" data-kind="cigarette">＋ Cigarette</button>
          <button class="secondary" type="button" data-owner="my" data-kind="half">＋ Half chai</button>
          <button class="secondary" type="button" data-owner="my" data-kind="full">＋ Full chai</button>
          <button class="secondary" type="button" id="chaiUndo">Undo last</button>
        </div>
        <div class="sectionhead"><h2>Group count</h2><span class="subtle">Shared purchases</span></div>
        <div class="insights-grid">
          <div class="insight"><small>Group cigarettes</small><strong id="groupCigCount">0</strong></div>
          <div class="insight"><small>Group chai</small><strong id="groupTeaCount">0</strong></div>
        </div>
        <div class="sectionhead"><h2>Quick add · Group</h2><span class="subtle">Counts in spending, not my count</span></div>
        <div class="actions">
          <button class="primary" type="button" data-owner="group" data-kind="cigarette">＋ Group cigarette</button>
          <button class="secondary" type="button" data-owner="group" data-kind="half">＋ Group half chai</button>
          <button class="secondary" type="button" data-owner="group" data-kind="full">＋ Group full chai</button>
        </div>
        <div class="sectionhead"><h2>Recent entries</h2><span class="subtle">My & group</span></div>
        <div class="formcard" id="chaiRecent"></div>
        <div class="sectionhead"><h2>Prices & brand</h2><span class="subtle">Configure once</span></div>
        <div class="formcard">
          <form id="chaiSettings">
            <div class="field"><label for="chaiBrandSelect">Select cigarette brand</label><select id="chaiBrandSelect"></select></div>
            <div class="row">
              <div class="field"><label for="chaiBrand">Brand name</label><input id="chaiBrand" maxlength="35" placeholder="e.g. Gold Flake"></div>
              <div class="field"><label for="chaiPackPrice">Packet price (₹)</label><input id="chaiPackPrice" type="number" min="0" step="0.01"></div>
            </div>
            <div class="row">
              <div class="field"><label for="chaiPackSize">Cigarettes per packet</label><input id="chaiPackSize" type="number" min="1" step="1"></div>
              <div class="field"><label>&nbsp;</label><button class="secondary" type="button" id="chaiAddBrand">＋ Add brand</button></div>
            </div>
            <div class="note" id="chaiUnitPrice"></div>
            <div class="row">
              <div class="field"><label for="chaiHalfPrice">Half chai (₹)</label><input id="chaiHalfPrice" type="number" min="0" step="0.01"></div>
              <div class="field"><label for="chaiFullPrice">Full chai (₹)</label><input id="chaiFullPrice" type="number" min="0" step="0.01"></div>
            </div>
            <button class="primary" type="submit">Save prices</button>
          </form>
        </div>
        <p class="note">Entries are saved in your existing My Expenses records under “Tea & Cigarettes”. Group entries count toward money spent, but remain separate from your personal consumption. Existing Expense Manager records are not changed.</p>
      </div>`;
    document.querySelector('main').appendChild(section);

    section.querySelectorAll('button[data-owner]').forEach(b => b.addEventListener('click', () => addEntry(b.dataset.owner, b.dataset.kind)));
    document.getElementById('chaiUndo').addEventListener('click', undoLast);
    document.getElementById('chaiSettings').addEventListener('submit', saveSettings);
    ['chaiPackPrice','chaiPackSize'].forEach(id => document.getElementById(id).addEventListener('input', updateUnitPrice));
    document.getElementById('chaiBrandSelect').addEventListener('change', selectBrand);
    document.getElementById('chaiAddBrand').addEventListener('click', addBrand);
    fillSettings();
    renderModule();
  }

  function fillSettings() {
    const select = document.getElementById('chaiBrandSelect');
    select.innerHTML = settings.brands.map(b => `<option value="${esc(b.id)}">${esc(b.name)}</option>`).join('');
    select.value = settings.activeBrandId;
    const brand = activeBrand() || { name: '', packPrice: 0, packSize: 20 };
    document.getElementById('chaiBrand').value = brand.name || '';
    document.getElementById('chaiPackPrice').value = brand.packPrice || '';
    document.getElementById('chaiPackSize').value = brand.packSize || 20;
    document.getElementById('chaiHalfPrice').value = settings.halfTea || '';
    document.getElementById('chaiFullPrice').value = settings.fullTea || '';
    updateUnitPrice();
  }
  function selectBrand() {
    settings.activeBrandId = document.getElementById('chaiBrandSelect').value;
    fillSettings();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
  function updateUnitPrice() {
    const price = Number(document.getElementById('chaiPackPrice').value || 0);
    const size = Number(document.getElementById('chaiPackSize').value || 0);
    document.getElementById('chaiUnitPrice').textContent = size > 0 && price > 0 ? `Selected brand cost per cigarette: ${money(price / size)}` : 'Enter packet price and packet size to calculate per-cigarette cost.';
  }
  function addBrand() {
    const name = document.getElementById('chaiBrand').value.trim();
    const price = Number(document.getElementById('chaiPackPrice').value || 0);
    const size = Number(document.getElementById('chaiPackSize').value || 0);
    if (!name) return showToast('Enter a brand name first.');
    if (!(size > 0)) return showToast('Enter a valid packet size.');
    const existing = settings.brands.find(b => b.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      existing.packPrice = price; existing.packSize = size; settings.activeBrandId = existing.id;
    } else {
      const brand = { id: 'brand-' + Date.now(), name, packPrice: price, packSize: size };
      settings.brands.push(brand); settings.activeBrandId = brand.id;
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    fillSettings(); showToast('Brand added. It is now selected.');
  }
  function saveSettings(e) {
    e.preventDefault();
    const size = Number(document.getElementById('chaiPackSize').value);
    const name = document.getElementById('chaiBrand').value.trim();
    if (!name) return showToast('Enter a brand name.');
    if (!(size > 0)) return showToast('Enter a valid packet size.');
    let brand = activeBrand();
    if (!brand || brand.name.toLowerCase() !== name.toLowerCase()) {
      brand = { id: 'brand-' + Date.now(), name, packPrice: 0, packSize: size };
      settings.brands.push(brand); settings.activeBrandId = brand.id;
    }
    brand.name = name;
    brand.packPrice = Number(document.getElementById('chaiPackPrice').value || 0);
    brand.packSize = size;
    settings.halfTea = Number(document.getElementById('chaiHalfPrice').value || 0);
    settings.fullTea = Number(document.getElementById('chaiFullPrice').value || 0);
    // Keep legacy fields populated for compatibility with older builds.
    settings.brand = brand.name; settings.packPrice = brand.packPrice; settings.packSize = brand.packSize;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    fillSettings(); showToast('Brand and tea prices saved.');
  }
  function addEntry(owner, kind) {
    let amount, label, item;
    if (kind === 'cigarette') { amount = unitCigarette(); label = 'Cigarette'; item = activeBrand()?.name || 'Cigarette'; }
    else if (kind === 'half') { amount = Number(settings.halfTea); label = 'Half chai'; item = 'Half chai'; }
    else { amount = Number(settings.fullTea); label = 'Full chai'; item = 'Full chai'; }
    if (!(amount > 0)) { showToast('Set the price first in Prices & brand.'); return; }
    const record = {
      id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)),
      type: 'expense', amount, category: CATEGORY,
      description: `${owner === 'my' ? 'My' : 'Group'} · ${label}${kind === 'cigarette' ? ' · ' + item : ''}`,
      date: dateToday(), payment: 'Cash', created: Date.now(),
      chaiMeta: { owner, kind, label, item, unitPrice: amount, brand: activeBrand()?.name || 'Cigarette' }
    };
    transactions.push(record);
    save();
    renderModule();
    showToast(`${owner === 'my' ? 'My' : 'Group'} ${label.toLowerCase()} added.`);
  }
  function undoLast() {
    const last = entries().sort((a,b) => Number(b.created || 0) - Number(a.created || 0))[0];
    if (!last) return showToast('No Chai & Cigarettes entry to undo.');
    const who = meta(last).owner === 'group' ? 'Group' : 'My';
    const label = meta(last).label || 'Entry';
    if (!confirm(`Undo last entry?\n${who} ${label} · ${money(last.amount)}\n\nCancel / OK`)) return;
    transactions = transactions.filter(t => String(t.id) !== String(last.id));
    save(); renderModule(); showToast('Last entry undone.');
  }
  function renderModule() {
    const host = document.getElementById('chaiModule');
    if (!host) return;
    const all = entries(), month = dateToday().slice(0,7), thisMonth = all.filter(t => (t.date || '').slice(0,7) === month);
    const my = thisMonth.filter(t => meta(t).owner === 'my'), group = thisMonth.filter(t => meta(t).owner === 'group');
    document.getElementById('chaiMonth').textContent = typeof monthTitle === 'function' ? monthTitle(month) : month;
    document.getElementById('chaiMySpend').textContent = money(sum(my, () => true));
    document.getElementById('chaiGroupSpend').textContent = money(sum(group, () => true));
    const spendFor = (list, kind) => sum(list, t => meta(t).kind === kind);
    document.getElementById('chaiMyCigSpend').textContent = money(spendFor(my, 'cigarette'));
    document.getElementById('chaiMyTeaSpend').textContent = money(spendFor(my, 'half') + spendFor(my, 'full'));
    document.getElementById('chaiGroupCigSpend').textContent = money(spendFor(group, 'cigarette'));
    document.getElementById('chaiGroupTeaSpend').textContent = money(spendFor(group, 'half') + spendFor(group, 'full'));
    const todayRows = all.filter(t => t.date === dateToday());
    document.getElementById('chaiMyToday').textContent = `${todayRows.filter(t => meta(t).owner === 'my').length} today`;
    document.getElementById('myCigCount').textContent = counts(my,'cigarette','my');
    document.getElementById('myTeaCount').textContent = counts(my,'half','my') + counts(my,'full','my');
    document.getElementById('groupCigCount').textContent = counts(group,'cigarette','group');
    document.getElementById('groupTeaCount').textContent = counts(group,'half','group') + counts(group,'full','group');
    const recent = [...all].sort((a,b) => Number(b.created||0)-Number(a.created||0)).slice(0,12);
    document.getElementById('chaiRecent').innerHTML = recent.length ? recent.map(t => {
      const m = meta(t);
      return `<div class="transaction"><div class="dot">${m.kind === 'cigarette' ? '🚬' : '☕'}</div><div class="txinfo"><div class="txname">${esc(m.owner === 'group' ? 'Group' : 'My')} · ${esc(m.label || '')}</div><div class="txmeta">${esc(t.date)} · ${esc(t.payment || 'Cash')}</div></div><div class="txamt">${money(t.amount)}</div></div>`;
    }).join('') : '<div class="empty">No entries yet. Use the quick actions above.</div>';
  }

  // Existing save() refreshes the parent app; refresh this module when it is visible.
  document.addEventListener('click', e => {
    if (e.target.closest('nav button[data-view="chai"]')) setTimeout(renderModule, 0);
  });
  window.addEventListener('storage', e => { if (e.key === 'myExpenses.transactions.v1') setTimeout(renderModule, 0); });
  setInterval(() => { if (document.getElementById('chai')?.classList.contains('active')) renderModule(); }, 1500);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureUI);
  else ensureUI();
})();
