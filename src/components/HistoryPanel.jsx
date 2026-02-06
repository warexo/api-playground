import { useState, useEffect, useCallback } from 'react';
import { useEnvironment } from '../contexts/EnvironmentContext';
import { loadHistory, saveHistory, loadFavorites, saveFavorites } from '../utils/storage';

export default function HistoryPanel({ onLoadRequest }) {
  const { activeEnvId } = useEnvironment();
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [tab, setTab] = useState('history'); // history | favorites

  // Load history & favorites
  useEffect(() => {
    if (activeEnvId) {
      setHistory(loadHistory(activeEnvId));
    } else {
      setHistory([]);
    }
    setFavorites(loadFavorites());
  }, [activeEnvId]);

  const addToHistory = useCallback(
    (entry) => {
      if (!activeEnvId) return;
      const item = {
        id: `h_${Date.now()}`,
        method: entry.request?.method || 'GET',
        url: entry.request?.url || '',
        body: entry.request?.body || null,
        status: entry.status,
        timestamp: entry.timestamp,
      };
      const updated = [item, ...history].slice(0, 100);
      setHistory(updated);
      saveHistory(activeEnvId, updated);
    },
    [activeEnvId, history]
  );

  const toggleFavorite = useCallback(
    (entry) => {
      const exists = favorites.find((f) => f.id === entry.id);
      let updated;
      if (exists) {
        updated = favorites.filter((f) => f.id !== entry.id);
      } else {
        updated = [
          {
            id: `f_${Date.now()}`,
            name: `${entry.method} ${entry.url?.split('/').pop() || ''}`,
            method: entry.method,
            url: entry.url,
            body: entry.body,
            timestamp: new Date().toISOString(),
          },
          ...favorites,
        ];
      }
      setFavorites(updated);
      saveFavorites(updated);
    },
    [favorites]
  );

  const clearHistory = useCallback(() => {
    if (!activeEnvId) return;
    setHistory([]);
    saveHistory(activeEnvId, []);
  }, [activeEnvId]);

  const items = tab === 'history' ? history : favorites;

  const getMethodColor = (method) => {
    const colors = {
      GET: 'text-green-400',
      POST: 'text-blue-400',
      PATCH: 'text-yellow-400',
      DELETE: 'text-red-400',
    };
    return colors[method] || 'text-gray-400';
  };

  const getStatusColor = (status) => {
    if (status >= 400) return 'text-red-400';
    if (status >= 300) return 'text-yellow-400';
    if (status >= 200) return 'text-green-400';
    return 'text-gray-400';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <div className="flex gap-1">
          <button
            onClick={() => setTab('history')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              tab === 'history'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setTab('favorites')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              tab === 'favorites'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            ★ Favorites
          </button>
        </div>
        {tab === 'history' && history.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-xs">
            {tab === 'history'
              ? 'No request history yet'
              : 'No favorites saved'}
          </div>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              onClick={() => onLoadRequest?.(item)}
              className="w-full text-left px-3 py-2 hover:bg-gray-800 transition-colors border-b border-gray-800/50 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-xs font-mono font-bold flex-shrink-0 ${getMethodColor(item.method)}`}>
                    {item.method}
                  </span>
                  <span className="text-xs text-gray-300 truncate">
                    {item.url?.replace(/https?:\/\/[^/]+/, '') || '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.status && (
                    <span className={`text-[10px] ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  )}
                  {tab === 'history' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item);
                      }}
                      className="p-0.5 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-yellow-400 transition-all"
                      title="Save as favorite"
                    >
                      ★
                    </button>
                  )}
                  {tab === 'favorites' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item);
                      }}
                      className="p-0.5 opacity-0 group-hover:opacity-100 text-yellow-400 hover:text-red-400 transition-all"
                      title="Remove from favorites"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <div className="text-[10px] text-gray-600 mt-0.5">
                {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// Export the addToHistory function for use by parent
export function useHistory() {
  const { activeEnvId } = useEnvironment();

  const addToHistory = useCallback(
    (responseData) => {
      if (!activeEnvId) return;
      const history = loadHistory(activeEnvId);
      const item = {
        id: `h_${Date.now()}`,
        method: responseData.request?.method || 'GET',
        url: responseData.request?.url || '',
        body: responseData.request?.body || null,
        status: responseData.status,
        timestamp: responseData.timestamp,
      };
      const updated = [item, ...history].slice(0, 100);
      saveHistory(activeEnvId, updated);
    },
    [activeEnvId]
  );

  return { addToHistory };
}
