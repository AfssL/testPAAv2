const API_BASE = 'http://localhost:5000';
//const API_SOLVE = '/api/solve'; 
//const API_CURRICULUM = '/api/curriculum';
//const API_URL = '/api/solve';
//const response = await fetch('/api/curriculum');

let curriculum = {};
let selected = new Set();

// ─── Init ────────────────────────────────────────────────────────────────────

async function init() {
  try {
    const res = await fetch(`${API_BASE}/api/curriculum`);
    if (!res.ok) throw new Error();
    curriculum = await res.json();
    renderCourses();
    updateUI();
  } catch {
    showError('Failed to load curriculum. Make sure the backend is running on <code>localhost:5000</code>.');
  }
}

// ─── Render course catalog ────────────────────────────────────────────────────

function renderCourses() {
  const list = document.getElementById('course-list');
  const query = document.getElementById('search-input').value.trim().toLowerCase();

  const bySemester = {};
  for (const [code, info] of Object.entries(curriculum)) {
    const sem = info.semester || 1;
    if (!bySemester[sem]) bySemester[sem] = [];
    bySemester[sem].push({ code, ...info });
  }

  list.innerHTML = '';
  let anyVisible = false;

  for (const sem of Object.keys(bySemester).sort((a, b) => Number(a) - Number(b))) {
    const courses = bySemester[sem].filter(c =>
      !query || c.code.toLowerCase().includes(query) || c.name.toLowerCase().includes(query)
    );
    if (courses.length === 0) continue;
    anyVisible = true;

    const group = document.createElement('div');
    group.className = 'semester-group';

    const label = document.createElement('h3');
    label.className = 'semester-label';
    label.textContent = `Semester ${sem}`;
    group.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'course-grid';
    for (const course of courses) grid.appendChild(createCourseCard(course));
    group.appendChild(grid);
    list.appendChild(group);
  }

  if (!anyVisible) {
    list.innerHTML = '<p class="no-results">No courses match your search.</p>';
  }
}

function createCourseCard(course) {
  const { code, name, sks, req } = course;
  const isSelected = selected.has(code);

  const card = document.createElement('label');
  card.className = `course-card${isSelected ? ' selected' : ''}`;
  card.dataset.code = code;

  const prereqHTML = req && req.length > 0
    ? `<div class="course-prereqs">
        <span class="prereq-label">Requires:</span>
        ${req.map(r => `<span class="prereq-tag">${curriculum[r]?.name || r}</span>`).join('')}
       </div>`
    : `<div class="course-prereqs no-prereqs">No prerequisites</div>`;

  card.innerHTML = `
    <input type="checkbox" value="${code}" ${isSelected ? 'checked' : ''}>
    <div class="course-body">
      <div class="course-top">
        <span class="course-code">${code}</span>
        <span class="course-sks">${sks} SKS</span>
      </div>
      <div class="course-name">${name}</div>
      ${prereqHTML}
    </div>
  `;

  card.querySelector('input').addEventListener('change', e => {
    if (e.target.checked) selected.add(code);
    else selected.delete(code);
    updateUI();
  });

  return card;
}

// ─── UI state ─────────────────────────────────────────────────────────────────

function updateUI() {
  renderCourses();
  const totalSks = [...selected].reduce((sum, c) => sum + (curriculum[c]?.sks || 0), 0);
  document.getElementById('selected-count').textContent =
    `${selected.size} course${selected.size !== 1 ? 's' : ''} selected`;
  document.getElementById('sks-total').textContent = `${totalSks} SKS total`;
  document.getElementById('generate-btn').disabled = selected.size === 0;
}

// ─── Generate schedule (delegates entirely to backend) ───────────────────────

async function generateSchedule() {
  const btn = document.getElementById('generate-btn');
  btn.disabled = true;
  btn.textContent = 'Generating…';
  hideError();
  document.getElementById('results-section').classList.add('hidden');

  const coursesPayload = {};
  for (const code of selected) {
    if (curriculum[code]) coursesPayload[code] = curriculum[code];
  }

  try {
    const res = await fetch(`${API_BASE}/api/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courses: coursesPayload }),
    });

    const data = await res.json();
    if (!res.ok) renderApiError(data);
    else renderResults(data);
  } catch {
    showError('Network error. Make sure the backend is running on <code>localhost:5000</code>.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Generate Schedule';
  }
}

// ─── Render results ───────────────────────────────────────────────────────────

function renderResults(data) {
  const section = document.getElementById('results-section');
  const container = document.getElementById('schedule-container');
  const stats = document.getElementById('results-stats');

  stats.innerHTML = `
    <span class="stat">${data.total_semesters} semester${data.total_semesters !== 1 ? 's' : ''}</span>
    <span class="stat">${data.total_sks} SKS</span>
    <span class="stat">${selected.size} courses</span>
  `;

  container.innerHTML = data.semesters
    .map((sem, i) => {
      if (sem.length === 0) return '';
      const semSks = sem.reduce((s, c) => s + (c.sks || 0), 0);
      return `
        <div class="result-semester">
          <div class="result-sem-header">
            <h3>Semester ${i + 1}</h3>
            <span class="sem-sks">${semSks} SKS</span>
          </div>
          <div class="result-courses">
            ${sem.map(c => `
              <div class="result-course">
                <span class="result-code">${c.code}</span>
                <span class="result-name">${c.name}</span>
                <span class="result-sks">${c.sks} SKS</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    })
    .filter(Boolean)
    .join('');

  section.classList.remove('hidden');
  section.scrollIntoView({ behavior: 'smooth' });
}

// ─── Error display ────────────────────────────────────────────────────────────

function renderApiError(data) {
  let msg = `<strong>${data.error || 'An error occurred.'}</strong>`;

  if (data.missing_prerequisites && data.missing_prerequisites.length > 0) {
    msg += '<ul class="error-list">' +
      data.missing_prerequisites.map(m => {
        const prereqNames = m.missing_prereqs.map(r =>
          `${curriculum[r]?.name || r} (${r})`
        ).join(', ');
        return `<li><strong>${m.course_name}</strong> (${m.course}) requires: ${prereqNames}</li>`;
      }).join('') + '</ul>';
  }

  if (data.cycles && data.cycles.length > 0) {
    msg += `Circular prerequisites detected:<ul class="error-list">` +
      data.cycles.map(c => `<li>${c}</li>`).join('') + `</ul>`;
  }

  showError(msg);
}

function showError(html) {
  const banner = document.getElementById('error-banner');
  banner.innerHTML = `<span class="error-icon">&#10060;</span> ${html}`;
  banner.classList.remove('hidden');
  banner.scrollIntoView({ behavior: 'smooth' });
}

function hideError() {
  document.getElementById('error-banner').classList.add('hidden');
}

// ─── Event listeners ──────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  init();

  document.getElementById('search-input').addEventListener('input', renderCourses);

  document.getElementById('select-all-btn').addEventListener('click', () => {
    for (const code of Object.keys(curriculum)) selected.add(code);
    updateUI();
  });

  document.getElementById('clear-all-btn').addEventListener('click', () => {
    selected.clear();
    updateUI();
  });

  document.getElementById('generate-btn').addEventListener('click', generateSchedule);
});
