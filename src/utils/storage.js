const STORAGE_KEYS = {
  ENVIRONMENTS: 'warexo_environments',
  ACTIVE_ENV: 'warexo_active_env',
  AUTH_PREFIX: 'warexo_auth_',
  HISTORY_PREFIX: 'warexo_history_',
  FAVORITES: 'warexo_favorites',
};

export function loadFromStorage(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

export function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('Failed to remove from localStorage:', e);
  }
}

// Environment persistence
export function loadEnvironments() {
  return loadFromStorage(STORAGE_KEYS.ENVIRONMENTS, []);
}

export function saveEnvironments(envs) {
  saveToStorage(STORAGE_KEYS.ENVIRONMENTS, envs);
}

export function loadActiveEnvId() {
  return loadFromStorage(STORAGE_KEYS.ACTIVE_ENV, null);
}

export function saveActiveEnvId(id) {
  saveToStorage(STORAGE_KEYS.ACTIVE_ENV, id);
}

// Auth persistence (per environment)
export function loadAuth(envId) {
  return loadFromStorage(`${STORAGE_KEYS.AUTH_PREFIX}${envId}`, null);
}

export function saveAuth(envId, auth) {
  saveToStorage(`${STORAGE_KEYS.AUTH_PREFIX}${envId}`, auth);
}

export function removeAuth(envId) {
  removeFromStorage(`${STORAGE_KEYS.AUTH_PREFIX}${envId}`);
}

// Request history (per environment)
export function loadHistory(envId) {
  return loadFromStorage(`${STORAGE_KEYS.HISTORY_PREFIX}${envId}`, []);
}

export function saveHistory(envId, history) {
  // Keep only last 100 entries to stay compact
  const trimmed = history.slice(0, 100);
  saveToStorage(`${STORAGE_KEYS.HISTORY_PREFIX}${envId}`, trimmed);
}

// Favorites (global)
export function loadFavorites() {
  return loadFromStorage(STORAGE_KEYS.FAVORITES, []);
}

export function saveFavorites(favorites) {
  saveToStorage(STORAGE_KEYS.FAVORITES, favorites);
}

// Export all environments as downloadable JSON
export function exportEnvironments(envs) {
  // Strip sensitive auth data, export only connection configs
  const exportData = envs.map(({ id, name, url, username }) => ({
    id,
    name,
    url,
    username,
  }));

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'warexo-environments.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Import environments from JSON file
export function importEnvironments(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data)) {
          reject(new Error('Invalid format: expected an array'));
          return;
        }
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export default STORAGE_KEYS;
