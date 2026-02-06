import { useAuth } from '../contexts/AuthContext';
import { useEnvironment } from '../contexts/EnvironmentContext';
import EnvironmentSwitcher from './EnvironmentSwitcher';

export default function TopBar() {
  const { activeEnv } = useEnvironment();
  const { isLoggedIn, isLoggingIn, user, clients, clientId, setClientId, login, logout, error } =
    useAuth();

  return (
    <header className="electron-drag bg-gray-900 border-b border-gray-800 px-4 py-3 pl-20">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Logo + Env Switcher */}
        <div className="electron-no-drag flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">W</span>
            </div>
            <h1 className="text-base font-semibold text-white hidden sm:block">
              API Playground
            </h1>
          </div>

          <div className="h-5 w-px bg-gray-700" />

          <EnvironmentSwitcher />
        </div>

        {/* Right: Auth controls */}
        <div className="electron-no-drag flex items-center gap-3">
          {error && (
            <span className="text-xs text-red-400 max-w-[200px] truncate" title={error}>
              {error}
            </span>
          )}

          {isLoggedIn && clients.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400 hidden md:block">Client:</label>
              <select
                value={clientId || ''}
                onChange={(e) => setClientId(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[180px]"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title || c.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isLoggedIn && user && (
            <span className="text-xs text-gray-400 hidden lg:flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {user.username}
            </span>
          )}

          {activeEnv && (
            <>
              {isLoggedIn ? (
                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors text-gray-300"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={login}
                  disabled={isLoggingIn || !activeEnv.url}
                  className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-400 rounded-lg transition-colors"
                >
                  {isLoggingIn ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Connecting…
                    </span>
                  ) : (
                    'Connect'
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
