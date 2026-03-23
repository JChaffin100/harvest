// js/app.js — Navigation, screen rendering, modals

// ── STATE ────────────────────────────────────────────────────────────────────

let currentPersonId = null;
let addStageSel = 1;
let addFollowupDate = null;
let logStageSel = 1;
let logFollowupDate = null;

// ── DATE PICKER ──────────────────────────────────────────────────────────────

let _dpCallback = null;
let _dpSelected = null;
let _dpViewYear = null;
let _dpViewMonth = null;

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function openDatePicker(title, currentDate, onDone) {
  _dpCallback = onDone;
  _dpSelected = currentDate || null;
  const today = new Date();
  if (_dpSelected) {
    const d = new Date(_dpSelected + 'T12:00:00');
    _dpViewYear = d.getFullYear();
    _dpViewMonth = d.getMonth();
  } else {
    _dpViewYear = today.getFullYear();
    _dpViewMonth = today.getMonth();
  }
  document.getElementById('datepicker-title').textContent = title;
  renderDatePickerCalendar();
  document.getElementById('datepicker-overlay').classList.add('open');
}

function closeDatePicker() {
  document.getElementById('datepicker-overlay').classList.remove('open');
}

function renderDatePickerCalendar() {
  document.getElementById('datepicker-month-year').textContent =
    MONTH_NAMES[_dpViewMonth] + ' ' + _dpViewYear;
  const grid = document.getElementById('datepicker-grid');
  grid.innerHTML = '';
  const today = todayStr();
  const firstDay = new Date(_dpViewYear, _dpViewMonth, 1).getDay();
  const daysInMonth = new Date(_dpViewYear, _dpViewMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'datepicker-day empty';
    empty.setAttribute('aria-hidden', 'true');
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(_dpViewMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateStr = _dpViewYear + '-' + mm + '-' + dd;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'datepicker-day';
    btn.textContent = d;
    btn.setAttribute('aria-label', formatDate(dateStr));
    if (dateStr === today) btn.classList.add('today');
    if (dateStr === _dpSelected) btn.classList.add('selected');
    const diff = daysDiff(dateStr);
    if (diff < 0) btn.classList.add('past');
    btn.addEventListener('click', () => {
      _dpSelected = dateStr;
      renderDatePickerCalendar();
    });
    grid.appendChild(btn);
  }
}

function dpPrevMonth() {
  _dpViewMonth--;
  if (_dpViewMonth < 0) { _dpViewMonth = 11; _dpViewYear--; }
  renderDatePickerCalendar();
}

function dpNextMonth() {
  _dpViewMonth++;
  if (_dpViewMonth > 11) { _dpViewMonth = 0; _dpViewYear++; }
  renderDatePickerCalendar();
}

function dpClearDate() {
  _dpSelected = null;
  renderDatePickerCalendar();
}

function dpDone() {
  const cb = _dpCallback;
  const sel = _dpSelected;
  closeDatePicker();
  if (cb) cb(sel);
}

// ── CONFIRM SHEET ─────────────────────────────────────────────────────────────

let _confirmCallback = null;

function openConfirmSheet(title, body, cancelLabel, confirmLabel, confirmStyle, onConfirm) {
  _confirmCallback = onConfirm;
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-body').textContent = body;
  document.getElementById('confirm-cancel').textContent = cancelLabel;
  const confirmBtn = document.getElementById('confirm-confirm');
  confirmBtn.textContent = confirmLabel;
  confirmBtn.className = 'confirm-confirm ' + (confirmStyle || 'danger');
  document.getElementById('confirm-overlay').classList.add('open');
}

function closeConfirmSheet() {
  document.getElementById('confirm-overlay').classList.remove('open');
  _confirmCallback = null;
}

function doConfirm() {
  const cb = _confirmCallback;
  closeConfirmSheet();
  if (cb) cb();
}

// ── NAVIGATION ───────────────────────────────────────────────────────────────

function setNav(id) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const b = document.getElementById('nav-' + id);
  if (b) b.classList.add('active');
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
  const fab = document.getElementById('main-fab');
  fab.style.display = (id === 'home' || id === 'prayer') ? 'flex' : 'none';
}

function showHome() { showScreen('home'); setNav('home'); renderHome(); }
function showPrayer() { showScreen('prayer'); setNav('prayer'); renderPrayer(); }
function showAdd() { showScreen('add'); setNav(''); renderAddForm(); }
function showDetail(id) { currentPersonId = id; showScreen('detail'); setNav('home'); renderDetail(id); }
function showSettings() { showScreen('settings'); setNav(''); renderSettings(); }

// ── HOME ─────────────────────────────────────────────────────────────────────

function urgClass(fu) {
  if (!fu) return 'ok';
  const d = daysDiff(fu);
  if (d < 0) return 'overdue';
  if (d <= 3) return 'soon';
  return 'ok';
}

function urgScore(p) {
  if (!p.followup) return 999;
  const d = daysDiff(p.followup);
  return d < 0 ? d - 10000 : d;
}

function renderHome() {
  const people = getPeople();
  const stages = getStages();
  const list = document.getElementById('home-list');
  const sub = document.getElementById('home-subtitle');

  const ov = people.filter(p => p.followup && daysDiff(p.followup) < 0).length;
  if (ov > 0) {
    sub.innerHTML = '<span style="color:var(--terracotta)">' + ov +
      ' follow-up' + (ov > 1 ? 's' : '') + ' overdue</span>';
  } else {
    sub.textContent = people.length + ' ' + (people.length === 1 ? 'person' : 'people') +
      ' in your harvest';
  }

  list.innerHTML = '';

  // Welcome card (first launch only)
  if (localStorage.getItem('harvest_welcomed') !== '1') {
    const wc = document.createElement('div');
    wc.id = 'welcome-card';
    wc.className = 'welcome-card';
    wc.innerHTML =
      '<div class="welcome-icon">🌾</div>' +
      '<div class="welcome-heading">Welcome to Harvest</div>' +
      '<div class="welcome-body">Harvest helps you remember the people God has placed in your life and stay faithful to follow up. Add someone you\'ve been meaning to reach out to, log your conversations, and let the Prayer tab guide your daily intercession.</div>' +
      '<button class="welcome-btn" onclick="dismissWelcomeCard()">Got it</button>';
    list.appendChild(wc);
  }

  if (!people.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML =
      '<div class="empty-icon">🌱</div>' +
      '<div class="empty-title">Your harvest awaits</div>' +
      '<div class="empty-body">Tap + to add the first person God has placed on your heart.</div>';
    list.appendChild(empty);
    return;
  }

  [...people].sort((a, b) => urgScore(a) - urgScore(b)).forEach(person => {
    const stage = stages.find(s => s.id === person.stage) || stages[0];
    const urg = urgClass(person.followup);
    const last = person.logs && person.logs.length ? person.logs[person.logs.length - 1] : null;
    const diff = person.followup ? daysDiff(person.followup) : null;

    let fu;
    if (diff === null) fu = '<span class="card-meta no-followup">No follow-up set</span>';
    else if (diff < 0) fu = '<span class="card-meta overdue-tag">' + Math.abs(diff) + 'd overdue</span>';
    else if (diff === 0) fu = '<span class="card-meta overdue-tag">Follow-up today</span>';
    else if (diff === 1) fu = '<span class="card-meta soon-tag">Follow-up tomorrow</span>';
    else if (diff <= 3) fu = '<span class="card-meta soon-tag">Follow-up in ' + diff + 'd</span>';
    else fu = '<span class="card-meta">Follow-up in ' + diff + 'd</span>';

    const card = document.createElement('div');
    card.className = 'person-card ' + urg;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', person.name + ', ' + stage.name);
    card.onclick = () => showDetail(person.id);
    card.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') showDetail(person.id); };

    card.innerHTML =
      '<div class="card-top">' +
        '<div>' +
          '<div class="card-name">' + escHtml(person.name) + '</div>' +
          (person.context ? '<div class="card-context">' + escHtml(person.context) + '</div>' : '') +
        '</div>' +
        '<span class="stage-badge stage-' + stage.id + '">' + escHtml(stage.name) + '</span>' +
      '</div>' +
      (last && last.note
        ? '<div class="last-note">' + escHtml(last.note.slice(0, 80)) +
          (last.note.length > 80 ? '&hellip;' : '') + '</div>'
        : '') +
      '<div class="card-bottom">' + fu + '</div>';

    list.appendChild(card);
  });
}

function dismissWelcomeCard() {
  const card = document.getElementById('welcome-card');
  if (!card) return;
  card.classList.add('dismissing');
  setTimeout(() => {
    card.remove();
    localStorage.setItem('harvest_welcomed', '1');
  }, 300);
}

// ── PRAYER ───────────────────────────────────────────────────────────────────

const PROMPTS = [
  'Pray for open ears and a soft heart.',
  'Ask God for the right moment to share.',
  "Pray they sense Christ's love through you.",
  'Ask for wisdom to answer their questions.',
  'Pray through any barriers or past hurts.',
  'Thank God for placing them in your life.',
];

function renderPrayer() {
  const pids = syncPrayerList();
  const people = getPeople();
  const stages = getStages();
  const container = document.getElementById('prayer-list');
  const sub = document.getElementById('prayer-subtitle');

  const cnt = pids.filter(id => isCheckedToday(id)).length;
  if (pids.length === 0) sub.textContent = 'Prayer list is empty';
  else if (cnt === pids.length) sub.textContent = 'All prayed for today \u2713';
  else sub.textContent = cnt + ' / ' + pids.length + ' prayed for today';

  if (!pids.length) {
    container.innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-icon">🙏</div>' +
        '<div class="empty-title">Prayer list is empty</div>' +
        '<div class="empty-body">People you add appear here automatically. Tap \u00d7 to remove someone from this list without deleting them.</div>' +
      '</div>';
    return;
  }

  container.innerHTML = '';
  pids.forEach((pid, idx) => {
    const person = people.find(p => p.id === pid);
    if (!person) return;
    const stage = stages.find(s => s.id === person.stage) || stages[0];
    const last = person.logs && person.logs.length ? person.logs[person.logs.length - 1] : null;
    const ctxText = last && last.note
      ? last.note.slice(0, 55) + (last.note.length > 55 ? '\u2026' : '')
      : PROMPTS[idx % PROMPTS.length];
    const checked = isCheckedToday(pid);

    const card = document.createElement('div');
    card.className = 'prayer-card';
    card.dataset.id = pid;
    card.innerHTML =
      '<div class="drag-handle" aria-label="Drag to reorder">\u22ee\u22ee</div>' +
      '<div class="prayer-card-body">' +
        '<div class="prayer-initial">' + escHtml(person.name[0].toUpperCase()) + '</div>' +
        '<div class="prayer-info">' +
          '<div class="prayer-name">' + escHtml(person.name) + '</div>' +
          '<div class="prayer-context">' + escHtml(stage.name) + ' &middot; ' + escHtml(ctxText) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="prayer-actions">' +
        '<button class="prayer-check' + (checked ? ' checked' : '') +
          '" data-pid="' + pid + '" aria-label="Mark prayed">\u2713</button>' +
        '<button class="prayer-remove" data-pid="' + pid +
          '" aria-label="Remove from prayer list">\u00d7</button>' +
      '</div>';

    card.querySelector('.prayer-check').addEventListener('click', function() {
      togglePrayer(pid, this);
    });
    card.querySelector('.prayer-remove').addEventListener('click', () => {
      removeFromPrayer(pid);
    });

    const handle = card.querySelector('.drag-handle');
    enableDrag(handle, card, container);
    container.appendChild(card);
  });
}

function togglePrayer(id, btn) {
  const c = getPrayerChecked();
  if (isCheckedToday(id)) {
    delete c[id];
  } else {
    c[id] = todayStr();
    btn.classList.add('pop');
    setTimeout(() => btn.classList.remove('pop'), 350);
  }
  savePrayerChecked(c);
  btn.classList.toggle('checked', !!c[id]);
  updatePrayerSubtitle();
}

function updatePrayerSubtitle() {
  const pids = getPrayerList() || [];
  const cnt = pids.filter(id => isCheckedToday(id)).length;
  const sub = document.getElementById('prayer-subtitle');
  if (!sub) return;
  if (!pids.length) sub.textContent = 'Prayer list is empty';
  else if (cnt === pids.length) sub.textContent = 'All prayed for today \u2713';
  else sub.textContent = cnt + ' / ' + pids.length + ' prayed for today';
}

function removeFromPrayer(id) {
  savePrayerList((getPrayerList() || []).filter(i => i !== id));
  const removed = getPrayerRemoved();
  if (!removed.includes(id)) { removed.push(id); savePrayerRemoved(removed); }
  renderPrayer();
}

// ── STAGE PICKER ─────────────────────────────────────────────────────────────

function renderStagePicker(elId, sel, onChange) {
  const stages = getStages();
  const el = document.getElementById(elId);
  el.innerHTML = '';
  stages.forEach(stage => {
    const opt = document.createElement('div');
    opt.className = 'stage-option' + (stage.id === sel ? ' selected' : '');
    opt.setAttribute('role', 'radio');
    opt.setAttribute('aria-checked', stage.id === sel ? 'true' : 'false');
    opt.setAttribute('tabindex', '0');
    opt.innerHTML =
      '<div class="stage-dot" style="background:' + stage.color + '"></div>' +
      '<div>' +
        '<div class="stage-option-label">' + escHtml(stage.name) + '</div>' +
        '<div class="stage-option-desc">' + escHtml(stage.desc) + '</div>' +
      '</div>' +
      '<div class="stage-radio"></div>';
    const select = () => {
      el.querySelectorAll('.stage-option').forEach(o => {
        o.classList.remove('selected');
        o.setAttribute('aria-checked', 'false');
      });
      opt.classList.add('selected');
      opt.setAttribute('aria-checked', 'true');
      if (onChange) onChange(stage.id);
    };
    opt.onclick = select;
    opt.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') select(); };
    el.appendChild(opt);
  });
}

// ── ADD PERSON ───────────────────────────────────────────────────────────────

function renderAddForm() {
  addStageSel = 1;
  document.getElementById('add-name').value = '';
  document.getElementById('add-context').value = '';
  document.getElementById('add-note').value = '';
  document.getElementById('add-name-error').textContent = '';

  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 7);
  addFollowupDate = defaultDate.toISOString().slice(0, 10);
  updateAddFollowupDisplay();

  renderStagePicker('add-stage-picker', 1, id => { addStageSel = id; });
}

function openAddFollowupPicker() {
  openDatePicker('Set Follow-up Date', addFollowupDate, date => {
    addFollowupDate = date;
    updateAddFollowupDisplay();
  });
}

function updateAddFollowupDisplay() {
  const el = document.getElementById('add-followup-display');
  const btn = document.getElementById('add-followup-trigger');
  if (addFollowupDate) {
    el.textContent = formatDate(addFollowupDate);
    btn.classList.add('has-date');
  } else {
    el.textContent = 'Tap to set a follow-up date';
    btn.classList.remove('has-date');
  }
}

function submitAddPerson() {
  const nameEl = document.getElementById('add-name');
  const errorEl = document.getElementById('add-name-error');
  const name = nameEl.value.trim();

  if (!name) {
    errorEl.textContent = 'Please enter a name.';
    nameEl.focus();
    return;
  }
  errorEl.textContent = '';

  const person = {
    id: generateId(),
    name,
    context: document.getElementById('add-context').value.trim(),
    stage: addStageSel,
    followup: addFollowupDate || null,
    logs: [],
  };

  const note = document.getElementById('add-note').value.trim();
  if (note) person.logs.push({ date: todayStr(), note, stageChange: null });

  const people = getPeople();
  people.push(person);
  savePeople(people);

  const list = getPrayerList() || [];
  list.push(person.id);
  savePrayerList(list);

  showHome();
}

// ── PERSON DETAIL ─────────────────────────────────────────────────────────────

function renderDetail(personId) {
  const person = getPersonById(personId);
  if (!person) { showHome(); return; }
  const stages = getStages();
  const stage = stages.find(s => s.id === person.stage) || stages[0];

  document.getElementById('detail-initial').textContent = person.name[0].toUpperCase();
  document.getElementById('detail-name').textContent = person.name;
  document.getElementById('detail-context').textContent = person.context || '';
  const badge = document.getElementById('detail-stage-badge');
  badge.textContent = stage.name;
  badge.className = 'stage-badge stage-' + stage.id;

  // Prayer toggle
  const onPrayer = (getPrayerList() || []).includes(personId);
  const ptDiv = document.getElementById('detail-prayer-toggle');
  ptDiv.innerHTML =
    '<div class="prayer-toggle-row">' +
      '<div>' +
        '<div class="prayer-toggle-label">Include in daily prayer</div>' +
        '<div class="prayer-toggle-sub">' +
          (onPrayer ? 'Appears on your prayer list' : 'Not on your prayer list') +
        '</div>' +
      '</div>' +
      '<button class="toggle-switch' + (onPrayer ? ' on' : '') +
        '" id="prayer-toggle-btn" aria-label="Toggle prayer list" ' +
        'aria-pressed="' + onPrayer + '"></button>' +
    '</div>';
  document.getElementById('prayer-toggle-btn').addEventListener('click', () => {
    togglePersonPrayer(personId);
  });

  // Timeline
  const tl = document.getElementById('detail-timeline');
  if (!person.logs || !person.logs.length) {
    tl.innerHTML =
      '<div class="timeline-label">Conversation History</div>' +
      '<div class="timeline-empty">No conversations logged yet.</div>';
    return;
  }

  let html = '<div class="timeline-label">Conversation History</div>';
  [...person.logs].reverse().forEach((log, i, arr) => {
    html +=
      '<div class="timeline-entry">' +
        '<div class="timeline-line">' +
          '<div class="tl-dot"></div>' +
          (i < arr.length - 1 ? '<div class="tl-stroke"></div>' : '') +
        '</div>' +
        '<div class="timeline-content">' +
          '<div class="tl-date">' + escHtml(formatDate(log.date)) + '</div>' +
          (log.note ? '<div class="tl-note">' + escHtml(log.note) + '</div>' : '') +
          (log.stageChange
            ? '<div class="tl-stage-change">\uD83D\uDCCD ' +
              escHtml(stages.find(s => s.id === log.stageChange.from)?.name || '?') +
              ' \u2192 ' +
              escHtml(stages.find(s => s.id === log.stageChange.to)?.name || '?') +
              '</div>'
            : '') +
        '</div>' +
      '</div>';
  });
  tl.innerHTML = html;
}

function togglePersonPrayer(id) {
  const list = getPrayerList() || [];
  const removed = getPrayerRemoved();
  if (list.includes(id)) {
    savePrayerList(list.filter(i => i !== id));
    if (!removed.includes(id)) { removed.push(id); savePrayerRemoved(removed); }
  } else {
    savePrayerRemoved(removed.filter(i => i !== id));
    list.push(id);
    savePrayerList(list);
  }
  renderDetail(id);
}

function openDeleteConfirm() {
  const p = getPersonById(currentPersonId);
  if (!p) return;
  openConfirmSheet(
    'Remove ' + p.name + '?',
    'This will permanently remove ' + p.name + ' from your harvest list and all conversation history.',
    'Cancel',
    'Remove',
    'danger',
    () => {
      savePeople(getPeople().filter(x => x.id !== currentPersonId));
      savePrayerList((getPrayerList() || []).filter(id => id !== currentPersonId));
      const removed = getPrayerRemoved().filter(id => id !== currentPersonId);
      savePrayerRemoved(removed);
      showHome();
    }
  );
}

function openSetFollowup() {
  const p = getPersonById(currentPersonId);
  if (!p) return;
  openDatePicker('Set Follow-up Date', p.followup, date => {
    const people = getPeople();
    const idx = people.findIndex(x => x.id === currentPersonId);
    if (idx === -1) return;
    people[idx].followup = date;
    savePeople(people);
    renderDetail(currentPersonId);
  });
}

// ── LOG MODAL ─────────────────────────────────────────────────────────────────

function openLogModal() {
  const p = getPersonById(currentPersonId);
  if (!p) return;
  logStageSel = p.stage;
  logFollowupDate = p.followup || (() => {
    const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10);
  })();
  document.getElementById('log-modal-title').textContent = 'Log \u2014 ' + p.name;
  document.getElementById('log-note').value = '';
  renderStagePicker('log-stage-picker', p.stage, id => { logStageSel = id; });
  updateLogFollowupDisplay();
  document.getElementById('log-modal').classList.add('open');
}

function closeLogModal(e) {
  if (e && e.target !== document.getElementById('log-modal')) return;
  document.getElementById('log-modal').classList.remove('open');
}

function closeLogModalDirect() {
  document.getElementById('log-modal').classList.remove('open');
}

function openLogFollowupPicker() {
  openDatePicker('Set Follow-up Date', logFollowupDate, date => {
    logFollowupDate = date;
    updateLogFollowupDisplay();
  });
}

function updateLogFollowupDisplay() {
  const el = document.getElementById('log-followup-display');
  const btn = document.getElementById('log-followup-trigger');
  if (logFollowupDate) {
    el.textContent = formatDate(logFollowupDate);
    btn.classList.add('has-date');
  } else {
    el.textContent = 'Tap to set a follow-up date';
    btn.classList.remove('has-date');
  }
}

function saveLog() {
  const p = getPersonById(currentPersonId);
  if (!p) return;
  const note = document.getElementById('log-note').value.trim();
  const log = {
    date: todayStr(),
    note,
    stageChange: logStageSel !== p.stage ? { from: p.stage, to: logStageSel } : null,
  };
  const people = getPeople();
  const idx = people.findIndex(x => x.id === currentPersonId);
  if (idx === -1) return;
  people[idx].logs = people[idx].logs || [];
  people[idx].logs.push(log);
  people[idx].stage = logStageSel;
  people[idx].followup = logFollowupDate || null;
  savePeople(people);
  document.getElementById('log-modal').classList.remove('open');
  renderDetail(currentPersonId);
}

// ── SETTINGS ─────────────────────────────────────────────────────────────────

function renderSettings() {
  const stages = getStages();
  const container = document.getElementById('stage-settings-list');
  container.innerHTML = '';
  stages.forEach((stage, i) => {
    const row = document.createElement('div');
    row.className = 'settings-row';
    row.innerHTML =
      '<div class="settings-stage-dot" style="background:' + stage.color + '"></div>' +
      '<div class="settings-row-label">' +
        '<div class="settings-row-name">Stage ' + stage.id + '</div>' +
        '<div class="settings-row-desc">' + escHtml(stage.desc) + '</div>' +
      '</div>' +
      '<input class="settings-input" type="text" ' +
        'value="' + escHtml(stage.name) + '" maxlength="24" ' +
        'aria-label="Stage ' + stage.id + ' label" ' +
        'data-idx="' + i + '">';
    row.querySelector('.settings-input').addEventListener('input', function() {
      updateStageName(parseInt(this.dataset.idx), this.value);
    });
    container.appendChild(row);
  });
}

function updateStageName(i, v) {
  const names = getStages().map(s => s.name);
  names[i] = v;
  saveStageNames(names);
}

function exportCSV() {
  const people = getPeople();
  const stages = getStages();
  const rows = [['Name', 'Context', 'Stage', 'Follow-up Date', 'Last Note']];
  people.forEach(p => {
    const s = stages.find(x => x.id === p.stage);
    const l = p.logs && p.logs.length ? p.logs[p.logs.length - 1] : null;
    rows.push([
      p.name,
      p.context || '',
      s ? s.name : '',
      p.followup || '',
      l ? (l.note || '').replace(/\n/g, ' ') : '',
    ]);
  });
  const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'harvest-export.csv';
  a.click();
}

function importCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    
    // Very simple CSV parser handling basic quotes and commas
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          currentCell += '"';
          i++; // skip next quote
        } else if (char === '"') {
          inQuotes = false;
        } else {
          currentCell += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          currentRow.push(currentCell);
          currentCell = '';
        } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
          currentRow.push(currentCell);
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
          if (char === '\r') i++;
        } else if (char !== '\r') {
          currentCell += char;
        }
      }
    }
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell);
      rows.push(currentRow);
    }
    
    // Process rows
    if (rows.length === 0) {
      event.target.value = '';
      return;
    }
    
    // Check header
    const header = rows[0];
    if (header[0] !== 'Name') {
      alert('Invalid CSV format. Please make sure you are importing a Harvest export file.');
      event.target.value = '';
      return;
    }
    
    const newPeople = [];
    const stages = getStages();
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || (!row[0] && row.length === 1)) continue; // skip empty rows
      
      const name = row[0] || '';
      if (!name.trim()) continue; // Name is required
      const context = row[1] || '';
      const stageName = row[2] || '';
      const followup = row[3] || '';
      const lastNote = row[4] || '';
      
      // Match stage by name, fallback to 1
      let stageId = 1;
      const matchedStage = stages.find(s => s.name.toLowerCase() === stageName.toLowerCase());
      if (matchedStage) stageId = matchedStage.id;
      
      // Validate date
      let validFollowup = null;
      if (followup && /^\d{4}-\d{2}-\d{2}$/.test(followup)) {
         validFollowup = followup;
      }
      
      const logs = [];
      if (lastNote.trim()) {
        logs.push({ date: todayStr(), note: lastNote.trim(), stageChange: null });
      }
      
      newPeople.push({
        id: generateId(),
        name: name,
        context: context,
        stage: stageId,
        followup: validFollowup,
        logs: logs
      });
    }
    
    if (newPeople.length === 0) {
      alert('No valid people found in the CSV.');
      event.target.value = '';
      return;
    }
    
    openConfirmSheet(
      'Import ' + newPeople.length + ' People?',
      'This will append ' + newPeople.length + ' people to your harvest list. Anyone already on your list will be duplicated. Use this primarily for restoring data from another device.',
      'Cancel',
      'Import',
      'primary',
      () => {
        const people = getPeople();
        const updatedPeople = people.concat(newPeople);
        savePeople(updatedPeople);
        
        const list = getPrayerList() || [];
        newPeople.forEach(p => list.push(p.id));
        savePrayerList(list);
        
        alert('Successfully imported ' + newPeople.length + ' people.');
        showHome();
      }
    );
    
    event.target.value = '';
  };
  reader.readAsText(file);
}

function openClearDataConfirm() {
  openConfirmSheet(
    'Delete Everything?',
    'This will permanently delete all your people, conversations, and settings. This cannot be undone.',
    'Cancel',
    'Delete Everything',
    'danger',
    () => {
      ['harvest_people', 'harvest_seeded', 'harvest_prayer_list',
       'harvest_prayer_checked', 'harvest_prayer_removed', 'harvest_stages',
       'harvest_welcomed'].forEach(k => localStorage.removeItem(k));
      showHome();
    }
  );
}

// ── DEMO DATA ─────────────────────────────────────────────────────────────────

function seedDemoData() {
  if (localStorage.getItem('harvest_seeded')) return;
  const past = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
  const future = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const people = [
    {
      id: generateId(), name: 'Marcus', context: 'Coworker', stage: 3,
      followup: past(3),
      logs: [
        { date: past(21), note: "Had lunch together. He mentioned his dad passed away last year and he\u2019s been thinking about what happens after death.", stageChange: null },
        { date: past(8),  note: "Shared the gospel over coffee. He listened carefully, said he needed time to think.", stageChange: { from: 2, to: 3 } },
      ],
    },
    {
      id: generateId(), name: 'Sarah', context: 'Neighbor', stage: 2,
      followup: future(4),
      logs: [
        { date: past(14), note: "She asked what I was reading. Great conversation about faith \u2014 she grew up Catholic but walked away.", stageChange: { from: 1, to: 2 } },
      ],
    },
    {
      id: generateId(), name: 'David', context: "Friend's brother", stage: 5,
      followup: future(7),
      logs: [
        { date: past(45), note: 'Met through Kevin. Seemed spiritually curious.', stageChange: null },
        { date: past(30), note: 'Shared the gospel fully. He was moved.', stageChange: { from: 2, to: 3 } },
        { date: past(20), note: 'He said he wanted to follow Christ. Prayed together!', stageChange: { from: 3, to: 5 } },
        { date: past(5),  note: 'Meeting weekly to study the Gospel of John.', stageChange: null },
      ],
    },
    {
      id: generateId(), name: 'Linda', context: 'Gym', stage: 1,
      followup: future(14),
      logs: [
        { date: past(3), note: "Introduced myself. She\u2019s friendly. No spiritual conversation yet.", stageChange: null },
      ],
    },
    {
      id: generateId(), name: 'Tom', context: 'Uncle', stage: 1,
      followup: past(10),
      logs: [],
    },
  ];
  savePeople(people);
  savePrayerList(people.map(p => p.id));
  localStorage.setItem('harvest_seeded', '1');
}

// ── INIT ─────────────────────────────────────────────────────────────────────

seedDemoData();
syncPrayerList();
showHome();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
