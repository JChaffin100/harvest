// js/data.js — All localStorage read/write. No business logic.

const DEFAULT_STAGES = [
  { id:1, name:'Unplanted',      color:'#6a5040', desc:'Not yet aware of the gospel' },
  { id:2, name:'Preparing Soil', color:'#5a5020', desc:'Open, asking questions' },
  { id:3, name:'Seed Sown',      color:'#7a4800', desc:'Has heard the gospel' },
  { id:4, name:'Sprout',         color:'#7a2800', desc:'Showing signs of faith' },
  { id:5, name:'Growing',        color:'#1e4a18', desc:'Committed to following Christ' },
  { id:6, name:'Bearing Fruit',  color:'#0a2a0a', desc:'Discipling others' },
];

function getStages() {
  const s = localStorage.getItem('harvest_stages');
  if (!s) return DEFAULT_STAGES;
  const names = JSON.parse(s);
  return DEFAULT_STAGES.map((x, i) => ({ ...x, name: names[i] || x.name }));
}

function saveStageNames(names) {
  localStorage.setItem('harvest_stages', JSON.stringify(names));
}

function getPeople() {
  const r = localStorage.getItem('harvest_people');
  return r ? JSON.parse(r) : [];
}

function savePeople(people) {
  localStorage.setItem('harvest_people', JSON.stringify(people));
}

function getPersonById(id) {
  return getPeople().find(p => p.id === id);
}

function getPrayerList() {
  const r = localStorage.getItem('harvest_prayer_list');
  return r ? JSON.parse(r) : null;
}

function savePrayerList(list) {
  localStorage.setItem('harvest_prayer_list', JSON.stringify(list));
}

function getPrayerChecked() {
  const r = localStorage.getItem('harvest_prayer_checked');
  return r ? JSON.parse(r) : {};
}

function savePrayerChecked(obj) {
  localStorage.setItem('harvest_prayer_checked', JSON.stringify(obj));
}

function isCheckedToday(id) {
  return getPrayerChecked()[id] === todayStr();
}

function getPrayerRemoved() {
  const r = localStorage.getItem('harvest_prayer_removed');
  return r ? JSON.parse(r) : [];
}

function savePrayerRemoved(arr) {
  localStorage.setItem('harvest_prayer_removed', JSON.stringify(arr));
}

function syncPrayerList() {
  let list = getPrayerList();
  const people = getPeople();
  const ids = people.map(p => p.id);
  const removed = getPrayerRemoved();

  if (!list) {
    list = ids.filter(id => !removed.includes(id));
    savePrayerList(list);
    return list;
  }

  let changed = false;
  ids.forEach(id => {
    if (!list.includes(id) && !removed.includes(id)) {
      list.push(id);
      changed = true;
    }
  });

  const cleaned = list.filter(id => ids.includes(id));
  if (cleaned.length !== list.length) changed = true;

  const final = cleaned.length !== list.length ? cleaned : list;
  if (changed) savePrayerList(final);
  return getPrayerList();
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(s) {
  if (!s) return '';
  return new Date(s + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function daysDiff(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T12:00:00');
  const t = new Date();
  t.setHours(12, 0, 0, 0);
  return Math.round((d - t) / 86400000);
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
