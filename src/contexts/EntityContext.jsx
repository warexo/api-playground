import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { buildEntityIndex, groupByBundle } from '../utils/entityUtils';

const ENTITIES_URL = 'https://warexo.github.io/entity-docs/data/entities.json';

const EntityContext = createContext(null);

export function EntityProvider({ children }) {
  const [state, setState] = useState({
    entityIndex: null,    // { byFqn, byShortName, list }
    bundleGroups: null,   // { WAWIBundle: [...], ... }
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchEntities() {
      try {
        const res = await fetch(ENTITIES_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        const entityIndex = buildEntityIndex(raw);
        const bundleGroups = groupByBundle(entityIndex.list);

        if (!cancelled) {
          setState({
            entityIndex,
            bundleGroups,
            isLoading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            isLoading: false,
            error: `Failed to load entity definitions: ${err.message}`,
          }));
        }
      }
    }

    fetchEntities();
    return () => { cancelled = true; };
  }, []);

  const getEntity = useCallback(
    (classNameOrFqn) => {
      if (!state.entityIndex) return null;
      return (
        state.entityIndex.byShortName[classNameOrFqn] ||
        state.entityIndex.byFqn[classNameOrFqn] ||
        null
      );
    },
    [state.entityIndex]
  );

  const value = {
    ...state,
    getEntity,
  };

  return <EntityContext.Provider value={value}>{children}</EntityContext.Provider>;
}

export function useEntities() {
  const ctx = useContext(EntityContext);
  if (!ctx) throw new Error('useEntities must be used within EntityProvider');
  return ctx;
}
