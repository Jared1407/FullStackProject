// Minimal dashboard (vanilla JS) to avoid heavy Angular scaffolding here.
// It demonstrates auth + basic task CRUD using the API, storing JWT in localStorage.

const API = localStorage.getItem('API_BASE') || 'http://localhost:3500';

const $ = (sel) => document.querySelector(sel);
const app = document.getElementById('app');

function setView(html) { app.innerHTML = html; }

function token() { return localStorage.getItem('token'); }

async function api(path, opts={}) {
  const headers = opts.headers || {};
  if (token()) headers['Authorization'] = 'Bearer ' + token();
  headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${res.status} ${t}`);
  }
  return res.json();
}

function loginView() {
  setView(`
    <div class="container">
      <div class="card">
        <h1>Login</h1>
        <p>Use seeded accounts after running <code>POST /auth/seed</code>:</p>
        <ul>
          <li><b>owner@acme.com</b> / Password123!</li>
          <li><b>admin@acme.com</b> / Password123!</li>
          <li><b>viewer@acme.com</b> / Password123!</li>
        </ul>
        <div style="margin-top:1rem"></div>
        <label>Email</label><input id="email" value="owner@acme.com"/>
        <label>Password</label><input id="password" type="password" value="Password123!"/>
        <div style="margin-top:1rem"></div>
        <button class="btn primary" id="loginBtn">Login</button>
      </div>
    </div>
  `);
  $('#loginBtn').onclick = async () => {
    try {
      const body = { email: $('#email').value, password: $('#password').value };
      const data = await api('/auth/login', { method:'POST', body: JSON.stringify(body) });
      localStorage.setItem('token', data.access_token);
      await dashboardView();
    } catch (e) { alert(e.message); }
  };
}

async function dashboardView() {
  const tasks = await api('/tasks');
  setView(`
    <div class="container">
      <div class="header">
        <h1>Tasks</h1>
        <div>
          <button class="btn" id="seed">Seed</button>
          <button class="btn" id="audit">Audit Log</button>
          <button class="btn" id="logout">Logout</button>
        </div>
      </div>
      <div class="card" style="margin-bottom:1rem">
        <h3>Create Task</h3>
        <div class="row">
          <input id="title" placeholder="Title"/>
          <select id="status">
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="DONE">DONE</option>
          </select>
          <button class="btn primary" id="create">Add</button>
        </div>
        <label>Description</label><textarea id="desc"></textarea>
        <label>Category</label><input id="cat" placeholder="Work/Personal"/>
      </div>
      <div class="card">
        <h3>My Accessible Tasks</h3>
        <div class="list" id="list"></div>
      </div>
    </div>
  `);
  $('#logout').onclick = () => { localStorage.removeItem('token'); loginView(); };
  $('#seed').onclick = async () => { await api('/auth/seed', { method:'POST' }); alert('Seeded users/orgs'); };
  $('#audit').onclick = async () => {
    try{
      const data = await api('/audit-log');
      alert(data.lines.slice(-20).join('\n'));
    } catch(e) { alert(e.message); }
  };

  $('#create').onclick = async () => {
    try {
      const body = {
        title: $('#title').value,
        description: $('#desc').value,
        category: $('#cat').value,
        status: $('#status').value
      };
      await api('/tasks', { method:'POST', body: JSON.stringify(body) });
      await dashboardView();
    } catch (e) { alert(e.message); }
  };

  const list = $('#list');
  for (const t of tasks) {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <div>
        <b>${t.title}</b>
        <div class="badge">${t.status}</div>
        <div style="font-size:12px;color:#666">${t.category || ''}</div>
        <div style="font-size:12px;color:#666">${t.description || ''}</div>
      </div>
      <button class="btn" data-id="${t.id}" data-act="edit">Edit</button>
      <button class="btn" data-id="${t.id}" data-act="del">Delete</button>
    `;
    list.appendChild(row);
  }

  list.onclick = async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const act = btn.getAttribute('data-act');
    if (act === 'del') {
      if (!confirm('Delete task?')) return;
      try {
        await api('/tasks/' + id, { method:'DELETE' });
        await dashboardView();
      } catch (e) { alert(e.message); }
    } else if (act === 'edit') {
      const title = prompt('New title:');
      if (!title) return;
      try {
        await api('/tasks/' + id, { method:'PUT', body: JSON.stringify({ title }) });
        await dashboardView();
      } catch (e) { alert(e.message); }
    }
  };
}

(function init() {
  if (token()) dashboardView();
  else loginView();
})();
