// admin.js
// Logique de l'interface d'administration BelerZone.

let adminToken = localStorage.getItem('bz_admin_token') || null;

function money(n) {
  return Number(n).toLocaleString('fr-FR') + ' FCFA';
}

function showPanel() {
  document.getElementById('login-gate').classList.add('hidden');
  document.getElementById('admin-panel').classList.remove('hidden');
  loadBeats();
  loadUsers();
  loadOrders();
}

// ---------- Connexion admin ----------
document.getElementById('admin-login-btn').addEventListener('click', async () => {
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;
  const errorEl = document.getElementById('admin-login-error');

  try {
    const res = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur de connexion.');
    if (!data.user.is_admin) throw new Error('Ce compte n\'est pas administrateur.');

    adminToken = data.token;
    localStorage.setItem('bz_admin_token', adminToken);
    showPanel();
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`,
  };
}

// ---------- Beats ----------
async function loadBeats() {
  const res = await fetch(`${API_URL}/beats`);
  const beats = await res.json();
  const tbody = document.querySelector('#table-beats tbody');
  tbody.innerHTML = beats.map(b => `
    <tr>
      <td>${b.title}</td>
      <td>${b.genre || '—'}</td>
      <td>${money(b.price)}</td>
      <td><button class="btn-del" data-id="${b.id}">Supprimer</button></td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.btn-del').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Supprimer ce beat ?')) return;
      await fetch(`${API_URL}/beats/${btn.dataset.id}`, { method: 'DELETE', headers: authHeaders() });
      loadBeats();
    });
  });
}

document.getElementById('form-add-beat').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    title: document.getElementById('beat-title').value,
    file_url: document.getElementById('beat-file-url').value,
    cover_url: document.getElementById('beat-cover-url').value,
    genre: document.getElementById('beat-genre').value,
    price: parseFloat(document.getElementById('beat-price').value),
  };
  const res = await fetch(`${API_URL}/beats`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (res.ok) {
    e.target.reset();
    loadBeats();
  } else {
    const data = await res.json();
    alert(data.error || 'Erreur lors de l\'ajout.');
  }
});

// ---------- Utilisateurs ----------
async function loadUsers() {
  const res = await fetch(`${API_URL}/users`, { headers: authHeaders() });
  if (!res.ok) return;
  const users = await res.json();
  const tbody = document.querySelector('#table-users tbody');
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.username}</td>
      <td>${u.email}</td>
      <td>${new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
      <td>${u.is_admin ? '' : `<button class="btn-del" data-id="${u.id}">Supprimer</button>`}</td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.btn-del').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Supprimer cet utilisateur ?')) return;
      await fetch(`${API_URL}/users/${btn.dataset.id}`, { method: 'DELETE', headers: authHeaders() });
      loadUsers();
    });
  });
}

// ---------- Commandes ----------
async function loadOrders() {
  const res = await fetch(`${API_URL}/orders`, { headers: authHeaders() });
  if (!res.ok) return;
  const orders = await res.json();
  const tbody = document.querySelector('#table-orders tbody');
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td>${o.username}</td>
      <td>${o.title}</td>
      <td>${money(o.amount)}</td>
      <td>${o.status}</td>
      <td>${new Date(o.order_date).toLocaleDateString('fr-FR')}</td>
    </tr>
  `).join('');
}

// ---------- Init ----------
if (adminToken) {
  // On tente d'afficher le panneau directement ; si le token est expiré,
  // les appels API échoueront et l'utilisateur devra se reconnecter.
  showPanel();
}
