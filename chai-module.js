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
    try { return { ...defaults, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')) }; }
    catch { return { ...defaults }; }
  })();

  const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(n) || 0);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateToday = () => typeof today === 'function' ? today() : new Date().toISOString().slice(0,10);
  const unitCigarette = () => Number(settings.packSize) > 0 ? Number(settings.packPrice) / Number(settings.packSize) : 0;
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
    navStyle.textContent = 'nav{display:flex;justify-content:space-between;gap:2px}nav button{flex:1 1 0;min-width:0;padding:9px 2px;font-size:12px;white-space:normal;line-height:1.2}.summary{grid-template-columns:1fr 1fr}.card.primary-spend{grid-column:auto;padding:16px}.card.primary-spend .amount{font-size:23px}';
    document.head.appendChild(navStyle);

    const section = document.createElement('section');
    section.className = 'view'; section.id = 'chai';
    section.innerHTML = `
      <div id="chaiModule">
        <header><div class="top"><div class="brand">Chai & Cigarettes</div><div class="month" id="chaiMonth"></div></div></header>
        <div class="summary">
          <div class="card primary-spend"><small>My spending · This month</small><div class="amount" id="chaiMySpend">₹0</div></div>
          <div class="card"><small>Group spending · This month</small><div class="amount" id="chaiGroupSpend">₹0</div></div>
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
            <div class="field"><label for="chaiBrand">Cigarette brand</label><input id="chaiBrand" maxlength="35"></div>
            <div class="row">
              <div class="field"><label for="chaiPackPrice">Packet price (₹)</label><input id="chaiPackPrice" type="number" min="0" step="0.01"></div>
              <div class="field"><label for="chaiPackSize">Cigarettes per packet</label><input id="chaiPackSize" type="number" min="1" step="1"></div>
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
    fillSettings();
    renderModule();
  }

  function fillSettings() {
    document.getElementById('chaiBrand').value = settings.brand;
    document.getElementById('chaiPackPrice').value = settings.packPrice || '';
    document.getElementById('chaiPackSize').value = settings.packSize || 20;
    document.getElementById('chaiHalfPrice').value = settings.halfTea || '';
    document.getElementById('chaiFullPrice').value = settings.fullTea || '';
    updateUnitPrice();
  }
  function updateUnitPrice() {
    const price = Number(document.getElementById('chaiPackPrice').value || 0);
    const size = Number(document.getElementById('chaiPackSize').value || 0);
    document.getElementById('chaiUnitPrice').textContent = size > 0 && price > 0 ? `Per cigarette: ${money(price / size)} (packet price ÷ packet size)` : 'Enter packet price and packet size to calculate per-cigarette cost.';
  }
  function saveSettings(e) {
    e.preventDefault();
    const size = Number(document.getElementById('chaiPackSize').value);
    if (!(size > 0)) return showToast('Enter a valid packet size.');
    settings = {
      brand: document.getElementById('chaiBrand').value.trim() || 'Cigarette',
      packPrice: Number(document.getElementById('chaiPackPrice').value || 0),
      packSize: size,
      halfTea: Number(document.getElementById('chaiHalfPrice').value || 0),
      fullTea: Number(document.getElementById('chaiFullPrice').value || 0)
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    fillSettings(); showToast('Chai & Cigarettes prices saved.');
  }
  function addEntry(owner, kind) {
    let amount, label, item;
    if (kind === 'cigarette') { amount = unitCigarette(); label = 'Cigarette'; item = settings.brand; }
    else if (kind === 'half') { amount = Number(settings.halfTea); label = 'Half chai'; item = 'Half chai'; }
    else { amount = Number(settings.fullTea); label = 'Full chai'; item = 'Full chai'; }
    if (!(amount > 0)) { showToast('Set the price first in Prices & brand.'); return; }
    const record = {
      id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)),
      type: 'expense', amount, category: CATEGORY,
      description: `${owner === 'my' ? 'My' : 'Group'} · ${label}${kind === 'cigarette' ? ' · ' + item : ''}`,
      date: dateToday(), payment: 'Cash', created: Date.now(),
      chaiMeta: { owner, kind, label, item, unitPrice: amount, brand: settings.brand }
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
