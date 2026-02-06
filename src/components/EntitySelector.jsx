import { useState, useMemo } from 'react';
import { useEntities } from '../contexts/EntityContext';
import { getEntitySlug, getTypeBadgeColor } from '../utils/entityUtils';

export default function EntitySelector({ selectedEntity, onSelect }) {
  const { entityIndex, bundleGroups, isLoading, error } = useEntities();
  const [search, setSearch] = useState('');
  const [expandedBundle, setExpandedBundle] = useState(null);

  const filteredGroups = useMemo(() => {
    if (!bundleGroups) return {};
    if (!search.trim()) return bundleGroups;

    const term = search.toLowerCase();
    const result = {};
    for (const [bundle, entities] of Object.entries(bundleGroups)) {
      const filtered = entities.filter(
        (e) =>
          e.className.toLowerCase().includes(term) ||
          (e.tableName || '').toLowerCase().includes(term)
      );
      if (filtered.length > 0) result[bundle] = filtered;
    }
    return result;
  }, [bundleGroups, search]);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">
        <svg className="w-5 h-5 animate-spin mx-auto mb-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading entity definitions…
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-center text-red-400 text-sm">{error}</div>;
  }

  const bundleKeys = Object.keys(filteredGroups).sort();

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-gray-800">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entities…"
            className="w-full pl-8 pr-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
          />
        </div>
        {entityIndex && (
          <div className="mt-2 text-xs text-gray-500">
            {entityIndex.list.length} entities
          </div>
        )}
      </div>

      {/* Entity list grouped by bundle */}
      <div className="flex-1 overflow-y-auto">
        {bundleKeys.map((bundle) => {
          const entities = filteredGroups[bundle];
          const isExpanded = expandedBundle === bundle || !!search.trim() || bundleKeys.length === 1;

          return (
            <div key={bundle}>
              <button
                onClick={() => setExpandedBundle(isExpanded && !search.trim() ? null : bundle)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:bg-gray-800/50 transition-colors"
              >
                <span>{bundle}</span>
                <span className="flex items-center gap-2">
                  <span className="text-gray-500 font-normal normal-case">{entities.length}</span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>

              {isExpanded && (
                <div>
                  {entities.map((entity) => {
                    const slug = getEntitySlug(entity);
                    const isSelected = selectedEntity?._fqn === entity._fqn;

                    return (
                      <button
                        key={entity._fqn}
                        onClick={() => onSelect(entity)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-800 transition-colors group ${
                          isSelected ? 'bg-indigo-600/20 text-indigo-300 border-r-2 border-indigo-500' : 'text-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{entity.className}</span>
                          <span className="flex-shrink-0 text-xs text-gray-500 tabular-nums">
                            {entity.columns?.length || 0}c {entity.relations?.length || 0}r
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 truncate">{slug}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
