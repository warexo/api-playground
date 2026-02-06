import { useState, useRef } from 'react';
import { useEnvironment } from '../contexts/EnvironmentContext';
import { exportEnvironments, importEnvironments } from '../utils/storage';
import EnvironmentModal from './EnvironmentModal';

export default function EnvironmentSwitcher() {
  const {
    environments,
    activeEnvId,
    setActiveEnvironment,
    addEnvironment,
    deleteEnvironment,
    importEnvironments: importEnvs,
  } = useEnvironment();

  const [showModal, setShowModal] = useState(false);
  const [editEnv, setEditEnv] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const activeEnv = environments.find((e) => e.id === activeEnvId);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importEnvironments(file);
      importEnvs(data);
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
    e.target.value = '';
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        {/* Environment dropdown */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-700"
        >
          <span className={`w-2 h-2 rounded-full ${activeEnv ? 'bg-green-400' : 'bg-gray-500'}`} />
          <span className="max-w-[160px] truncate">
            {activeEnv?.name || 'No Environment'}
          </span>
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Add button */}
        <button
          onClick={() => { setEditEnv(null); setShowModal(true); }}
          className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
          title="Add Environment"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Dropdown menu */}
      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 mt-1 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
          >
            {environments.length === 0 ? (
              <div className="p-3 text-sm text-gray-400 text-center">
                No environments configured
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {environments.map((env) => (
                  <div
                    key={env.id}
                    className={`flex items-center justify-between px-3 py-2 hover:bg-gray-700 cursor-pointer group ${
                      env.id === activeEnvId ? 'bg-gray-700/50' : ''
                    }`}
                    onClick={() => {
                      setActiveEnvironment(env.id);
                      setShowDropdown(false);
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          env.id === activeEnvId ? 'bg-green-400' : 'bg-gray-500'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{env.name}</div>
                        <div className="text-xs text-gray-400 truncate">{env.url}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditEnv(env);
                          setShowModal(true);
                          setShowDropdown(false);
                        }}
                        className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-gray-200"
                        title="Edit"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${env.name}"?`)) {
                            deleteEnvironment(env.id);
                          }
                        }}
                        className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-red-400"
                        title="Delete"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer actions */}
            <div className="border-t border-gray-700 p-2 flex items-center gap-2">
              <button
                onClick={() => {
                  setEditEnv(null);
                  setShowModal(true);
                  setShowDropdown(false);
                }}
                className="flex-1 text-xs text-center py-1.5 hover:bg-gray-700 rounded text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                + New Environment
              </button>
              <button
                onClick={() => {
                  exportEnvironments(environments);
                  setShowDropdown(false);
                }}
                className="text-xs py-1.5 px-2 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors"
                title="Export"
              >
                ↓ Export
              </button>
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowDropdown(false);
                }}
                className="text-xs py-1.5 px-2 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors"
                title="Import"
              >
                ↑ Import
              </button>
            </div>
          </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />

      {showModal && (
        <EnvironmentModal
          env={editEnv}
          onClose={() => { setShowModal(false); setEditEnv(null); }}
        />
      )}
    </div>
  );
}
