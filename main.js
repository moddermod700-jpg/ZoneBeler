// main.js
// Gère l'affichage du catalogue, l'authentification et les commandes côté client.

let currentUser = JSON.parse(localStorage.getItem('bz_user') || 'null');
let currentToken = localStorage.getItem('bz_token') || null;

// ---------- Utilitaires ----------
function money(n) {
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 0 }) + ' FCFA';
}

function updateAuthUI() {
  const btn = document.getElementById('btn-auth');
  const navOrders = document.getElementById('nav-mes-commandes');
  if (currentUser) {
    btn.textContent = `Déconnexion (${currentUser.username})`;
    navOrders.classList.remove('hidden');
  } else {
    btn.textContent = 'Connexion';
    navOrders.classList.add('hidden');
  }
}

// ---------- Chargement du catalogue ----------
async function loadBeats() {
  const container = document.getElementById('beats-list');
  try {
    const res = await fetch(`${API_URL}/beats`);
    const beats = await res.json();

    if (beats.length === 0) {
      container.innerHTML = '<p>Aucun beat disponible pour le moment.</p>';
      return;
    }

    container.innerHTML = beats.map(beat => `
      <div class="beat-card">
        <img src="${beat.cover_url || 'https://placehold.co/300x300?text=Beat'}" alt="${beat.title}">
        <h3>${beat.title}</h3>
        <p class="genre">${beat.genre || ''}</p>
        <p class="price">${money(beat.price)}</p>
        <button class="btn-buy" data-id="${beat.id}">Acheter</button>
      </div>
    `).join('');

    document.querySelectorAll('.btn-buy').forEach(btn => {
      btn.addEventListener('click', () => buyBeat(btn.dataset.id));
    });
  } catch (err) {
    container.innerHTML = '<p>Impossible de charger le catalogue. Réessayez plus tard.</p>';
    console.error(err);
  }
}

// ---------- Achat d'un beat ----------
async function buyBeat(beatId) {
  if (!currentUser) {
    openModal('modal-auth');
    return;
  }
  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`,
      },
      body: JSON.stringify({ beat_id: beatId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur lors de la commande.');
    alert('Commande enregistrée ! Retrouvez-la dans "Mes commandes".');
  } catch (err) {
    alert(err.message);
  }
}

// ---------- Mes commandes ----------
async function loadOrders() {
  const container = document.getElementById('orders-list');
  container.innerHTML = 'Chargement...';
  try {
    const res = await fetch(`${API_URL}/orders/mine`, {
      headers: { 'Authorization': `Bearer ${currentToken}` },
    });
    const orders = await res.json();
    if (orders.length === 0) {
      container.innerHTML = '<p>Vous n\'avez pas encore de commande.</p>';
      return;
    }
    container.innerHTML = orders.map(o => `
      <div class="order-item">
        <strong>${o.title}</strong> — ${money(o.amount)} — ${o.status}
        <br><small>${new Date(o.order_date).toLocaleDateString('fr-FR')}</small>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p>Erreur de chargement des commandes.</p>';
  }
}

// ---------- Modales ----------
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

document.getElementById('close-auth').addEventListener('click', () => closeModal('modal-auth'));
document.getElementById('close-orders').addEventListener('click', () => closeModal('modal-orders'));

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('form-login').classList.toggle('hidden', btn.dataset.tab !== 'login');
    document.getElementById('form-register').classList.toggle('hidden', btn.dataset.tab !== 'register');
  });
});

// ---------- Auth: bouton principal ----------
document.getElementById('btn-auth').addEventListener('click', () => {
  if (currentUser) {
    // Déconnexion
    currentUser = null;
    currentToken = null;
    localStorage.removeItem('bz_user');
    localStorage.removeItem('bz_token');
    updateAuthUI();
  } else {
    openModal('modal-auth');
  }
});

document.getElementById('nav-mes-commandes').addEventListener('click', (e) => {
  e.preventDefault();
  openModal('modal-orders');
  loadOrders();
});

// ---------- Formulaire connexion ----------
document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  try {
    const res = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur de connexion.');

    currentUser = data.user;
    currentToken = data.token;
    localStorage.setItem('bz_user', JSON.stringify(currentUser));
    localStorage.setItem('bz_token', currentToken);
    updateAuthUI();
    closeModal('modal-auth');
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

// ---------- Formulaire inscription ----------
document.getElementById('form-register').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const errorEl = document.getElementById('register-error');

  try {
    const res = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur d\'inscription.');

    alert('Compte créé ! Vous pouvez maintenant vous connecter.');
    document.querySelector('.tab-btn[data-tab="login"]').click();
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

// ---------- Initialisation ----------
updateAuthUI();
loadBeats();
