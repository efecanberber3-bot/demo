(() => {
  const tabs = document.querySelectorAll('[data-auth-tab]');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginMsg = document.getElementById('login-message');
  const registerMsg = document.getElementById('register-message');
  const next = new URLSearchParams(location.search).get('next');

  function setMessage(el, text, type = 'error') {
    el.textContent = text; el.className = `form-message show ${type}`;
  }
  function switchTab(name) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.authTab === name));
    loginForm.classList.toggle('hidden', name !== 'login');
    registerForm.classList.toggle('hidden', name !== 'register');
    history.replaceState(null, '', name === 'register' ? '#register' : location.pathname + location.search);
  }
  tabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.authTab)));
  if (location.hash === '#register') switchTab('register');

  async function redirectAfterLogin() {
    const session = await Bercant.getSession();
    const profile = session?.profile || (session?.user ? await Bercant.getProfile(session.user.id) : null);
    location.href = next || ((profile?.role === 'admin' || profile?.role === 'coach') ? 'admin.html' : 'dashboard.html');
  }

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = loginForm.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Giriş yapılıyor…';
    try {
      await Bercant.signIn(document.getElementById('login-email').value.trim(), document.getElementById('login-password').value);
      setMessage(loginMsg, 'Giriş başarılı. Panel açılıyor…', 'success');
      await redirectAfterLogin();
    } catch (err) { setMessage(loginMsg, err.message || 'Giriş yapılamadı.'); }
    finally { btn.disabled = false; btn.textContent = 'Panele Giriş Yap →'; }
  });

  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = registerForm.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Hesap oluşturuluyor…';
    try {
      const data = await Bercant.signUp({
        fullName: document.getElementById('register-name').value.trim(),
        email: document.getElementById('register-email').value.trim(),
        password: document.getElementById('register-password').value,
        gender: document.getElementById('register-gender').value,
        goal: document.getElementById('register-goal').value
      });
      setMessage(registerMsg, data.session ? 'Hesabın oluşturuldu. Panel açılıyor…' : 'Hesabın oluşturuldu. E-postandaki doğrulama bağlantısını aç.', 'success');
      if (data.session) setTimeout(() => location.href = 'dashboard.html', 700);
    } catch (err) { setMessage(registerMsg, err.message || 'Hesap oluşturulamadı.'); }
    finally { btn.disabled = false; btn.textContent = 'Hesabımı Oluştur →'; }
  });

  document.getElementById('forgot-btn').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim() || prompt('Şifre sıfırlama bağlantısının gönderileceği e-posta:');
    if (!email) return;
    try { await Bercant.resetPassword(email); setMessage(loginMsg, 'Şifre sıfırlama bağlantısı gönderildi.', 'success'); }
    catch (err) { setMessage(loginMsg, err.message); }
  });

  document.getElementById('demo-student').addEventListener('click', async () => {
    document.getElementById('login-email').value = 'student@demo.com'; document.getElementById('login-password').value = 'demo123'; loginForm.requestSubmit();
  });
  document.getElementById('demo-admin').addEventListener('click', async () => {
    document.getElementById('login-email').value = 'admin@demo.com'; document.getElementById('login-password').value = 'admin123'; loginForm.requestSubmit();
  });

  if (!Bercant.demoMode) document.getElementById('demo-box').classList.add('hidden');
  Bercant.getSession().then(s => { if (s?.user && !new URLSearchParams(location.search).has('stay')) redirectAfterLogin(); });
})();
