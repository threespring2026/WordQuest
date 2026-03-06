/**
 * 欢迎页：首次打开时显示，再进入登录
 */

const WELCOME_STORAGE_KEY = 'wordquest_welcome_shown';

const WelcomeModule = (function() {
  let container = null;

  function render() {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center flex-1 px-6">
        <h1 class="text-2xl font-bold text-gray-800 pixel-font mb-8">欢迎页面</h1>
        <button id="welcome-enter" class="btn-3d btn-green px-8 py-3">进入</button>
      </div>
      <div class="app-footer text-center text-gray-400 text-xs py-2">「TriSpring互娱」版权所有</div>
    `;
    document.getElementById('welcome-enter').addEventListener('click', () => {
      try { sessionStorage.setItem(WELCOME_STORAGE_KEY, '1'); } catch (_) {}
      Router.go('auth');
    });
  }

  return {
    name: 'welcome',
    mount() {
      container = UI.getContainer();
      render();
    },
    unmount() {
      container = null;
    }
  };
})();
