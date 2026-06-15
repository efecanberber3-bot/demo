(() => {
  async function showPanelReturn() {
    try {
      const session = await Bercant.getSession();
      if (!session?.user) return;
      const profile = session.profile || await Bercant.getProfile(session.user.id);
      const panelUrl = ['admin', 'coach'].includes(profile?.role) ? 'admin.html' : 'dashboard.html';

      const entry = document.getElementById('member-entry');
      if (entry) { entry.href = panelUrl; entry.textContent = 'Koçluk Paneline Dön'; }
      const hero = document.getElementById('hero-primary-cta');
      if (hero) { hero.href = panelUrl; hero.innerHTML = 'Panelime Dön <span>→</span>'; }

      if (!document.querySelector('.panel-return-fab')) {
        const fab = document.createElement('a');
        fab.className = 'btn btn-primary panel-return-fab';
        fab.href = panelUrl;
        fab.textContent = 'Panele Dön →';
        document.body.appendChild(fab);
      }
    } catch (error) {
      console.warn('Oturum kontrolü yapılamadı:', error);
    }
  }
  showPanelReturn();
})();
