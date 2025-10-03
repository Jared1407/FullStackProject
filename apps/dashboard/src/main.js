// Minimal dashboard (vanilla JS) to avoid heavy Angular scaffolding here.
// It demonstrates auth + basic task CRUD using the API, storing JWT in localStorage.

const API = localStorage.getItem('API_BASE') || 'http://localhost:3500';

const $ = (sel) => document.querySelector(sel);
const app = document.getElementById('app');

function setView(html) { app.innerHTML = html; }
function token() { return localStorage.getItem('token'); }

async function api(path, opts = {}) {
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

function setupModalEventListeners() {
    const modal = $('#update-modal');
    if (!modal) {
        console.error("Update modal not found in the DOM!");
        return;
    }
    const closeModal = () => { modal.style.display = 'none'; };

    $('#cancel-update-btn').onclick = closeModal;

    $('#save-update-btn').onclick = async () => {
        const id = $('#update-task-id').value;
        try {
            const body = {
                title: $('#update-title').value,
                description: $('#update-desc').value,
                category: $('#update-cat').value,
                status: $('#update-status').value,
            };
            await api('/tasks/' + id, { method: 'PUT', body: JSON.stringify(body) });
            closeModal();
            await refreshTasks();
        } catch (e) {
            console.error('Failed to update task:', e);
            alert(e.message);
        }
    };
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
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify(body) });
      localStorage.setItem('token', data.access_token);
      await dashboardView();
    } catch (e) { alert(e.message); }
  };
}

async function refreshTasks() {
    const tasks = await api('/tasks');
    const list = $('#list');
    if (!list) return; // Guard against element not being found
    list.innerHTML = ''; // Clear the list before adding new items

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
        <button class="btn" data-id="${t.id}" data-act="update">Update</button>
        <button class="btn" data-id="${t.id}" data-act="del">Delete</button>
        `;
        list.appendChild(row);
    }
}


/**
 * Renders the dashboard view for managing tasks, including UI for creating, listing, updating, and deleting tasks.
 * Sets up event listeners for task operations, audit log, seeding data, and logout functionality.
 * Initializes and manages a modal for updating tasks.
 * 
 * @async
 * @function
 * @returns {Promise<void>} Resolves when the dashboard view is rendered and event listeners are set up.
 */
async function dashboardView() {
  setView(`
    <div class="container">
      <div class="header">
        <h1>Tasks</h1>
        <div>
          <button class="btn" id="refresh-button">Refresh</button>
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
    <!-- Modal for updating a task -->
    <div id="update-modal" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;align-items:center;justify-content:center;z-index:100;background:rgba(0,0,0,0.3)">
      <div style="background:#fff;padding:2rem;min-width:300px;max-width:90vw;box-shadow:0 2px 12px #0002;display:flex;flex-direction:column;gap:1rem">
        <input type="hidden" id="update-task-id"/>
        <label>Title</label>
        <input id="update-title"/>
        <label>Description</label>
        <textarea id="update-desc"></textarea>
        <label>Category</label>
        <input id="update-cat"/>
        <label>Status</label>
        <select id="update-status">
          <option value="TODO">TODO</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="DONE">DONE</option>
        </select>
        <div style="display:flex;gap:1rem;justify-content:flex-end">
          <button class="btn" id="cancel-update-btn" type="button">Cancel</button>
          <button class="btn primary" id="save-update-btn" type="button">Save</button>
        </div>
      </div>
    </div>
  `);

  // --- All event listeners are set up here, once the view is rendered ---

  $('#logout').onclick = () => { localStorage.removeItem('token'); loginView(); };
  $('#seed').onclick = async () => { await api('/auth/seed', { method: 'POST' }); alert('Seeded users/orgs'); };
  
  $('#audit').onclick = async () => {
    try {
      const data = await api('/audit-log');
      alert(data.lines.slice(-20).join('\n'));
    } catch(e) { alert(e.message); }
  };

  $('#refresh-button').onclick = async () => { await refreshTasks(); };

  $('#create').onclick = async () => {
    try {
      const body = {
        title: $('#title').value,
        description: $('#desc').value,
        category: $('#cat').value,
        status: $('#status').value
      };
      await api('/tasks', { method: 'POST', body: JSON.stringify(body) });
      await refreshTasks();
    } catch (e) {
        console.error("Failed to create task:", e);
        alert(e.message);
    }
  };

  $('#list').onclick = async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const act = btn.getAttribute('data-act');
    const modal = $('#update-modal');

    if (act === 'del') {
      if (!confirm('Delete task?')) return;
      try {
        await api('/tasks/' + id, { method: 'DELETE' });
        await refreshTasks();
      } catch (e) { alert(e.message); }
    } else if (act === 'update') {
        try {
            const task = await api('/tasks/' + id, { method: 'PUT' });
            if (!task || !task.id) {
                alert('Task not found or already deleted.');
                await refreshTasks();
                return;
            }
            $('#update-task-id').value = task.id;
            $('#update-title').value = task.title;
            $('#update-desc').value = task.description || '';
            $('#update-cat').value = task.category || '';
            $('#update-status').value = task.status;
            
            modal.style.display = 'flex';
        } catch (e) {
            if (e.message.startsWith('404')) {
                alert('Task not found or already deleted.');
                console.log('Task not found during update attempt:', e);
                await refreshTasks();
            } else {
                console.error('Failed to fetch task for update:', e);
                alert(e.message);
            }
        }
    }
  };

  // Insert the modal HTML into the DOM
  setupModalEventListeners();


  await refreshTasks();
}

(function init() {
  if (token()) dashboardView();
  else loginView();
})();