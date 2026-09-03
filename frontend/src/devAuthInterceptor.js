// This file intercepts localStorage calls for auth keys and redirects them to sessionStorage.
// This allows multiple browser tabs to maintain independent login sessions during development testing,
// without having to modify the 30+ files that hardcode localStorage.getItem('dentaai_user').

export function initDevAuthInterceptor() {
  if (import.meta.env.DEV) {
    console.log("🛠️ Dev Mode: Active Tab Isolation Enabled (Auth keys routed to sessionStorage)");
    
    const originalGetItem = Storage.prototype.getItem;
    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;

    Storage.prototype.getItem = function(key) {
      if (this === window.localStorage && (key === 'dentaai_user' || key === 'dentaai_token')) {
        return window.sessionStorage.getItem(key);
      }
      return originalGetItem.call(this, key);
    };

    Storage.prototype.setItem = function(key, value) {
      if (this === window.localStorage && (key === 'dentaai_user' || key === 'dentaai_token')) {
        return window.sessionStorage.setItem(key, value);
      }
      return originalSetItem.call(this, key, value);
    };

    Storage.prototype.removeItem = function(key) {
      if (this === window.localStorage && (key === 'dentaai_user' || key === 'dentaai_token')) {
        return window.sessionStorage.removeItem(key);
      }
      return originalRemoveItem.call(this, key);
    };
  }
}
