import { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import {
  loadEnvironments,
  saveEnvironments,
  loadActiveEnvId,
  saveActiveEnvId,
} from '../utils/storage';

const EnvironmentContext = createContext(null);

function generateId() {
  return `env_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const initialState = {
  environments: [],
  activeEnvId: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return { ...state, environments: action.environments, activeEnvId: action.activeEnvId };

    case 'ADD_ENV': {
      const newEnv = { id: generateId(), ...action.env };
      const envs = [...state.environments, newEnv];
      return {
        ...state,
        environments: envs,
        activeEnvId: state.activeEnvId || newEnv.id,
      };
    }

    case 'UPDATE_ENV': {
      const envs = state.environments.map((e) =>
        e.id === action.id ? { ...e, ...action.updates } : e
      );
      return { ...state, environments: envs };
    }

    case 'DELETE_ENV': {
      const envs = state.environments.filter((e) => e.id !== action.id);
      const activeEnvId =
        state.activeEnvId === action.id ? (envs[0]?.id || null) : state.activeEnvId;
      return { ...state, environments: envs, activeEnvId };
    }

    case 'SET_ACTIVE':
      return { ...state, activeEnvId: action.id };

    case 'IMPORT_ENVS': {
      // Merge imported envs, skip duplicates by id
      const existingIds = new Set(state.environments.map((e) => e.id));
      const newEnvs = action.environments
        .map((e) => ({ ...e, id: e.id || generateId() }))
        .filter((e) => !existingIds.has(e.id));
      return { ...state, environments: [...state.environments, ...newEnvs] };
    }

    default:
      return state;
  }
}

export function EnvironmentProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [initialized, setInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const environments = loadEnvironments();
    const activeEnvId = loadActiveEnvId();
    dispatch({
      type: 'INIT',
      environments,
      activeEnvId: activeEnvId || environments[0]?.id || null,
    });
    setInitialized(true);
  }, []);

  // Persist changes – only after initial load to avoid overwriting with empty state
  useEffect(() => {
    if (!initialized) return;
    saveEnvironments(state.environments);
  }, [state.environments, initialized]);

  useEffect(() => {
    if (!initialized) return;
    saveActiveEnvId(state.activeEnvId);
  }, [state.activeEnvId, initialized]);

  const activeEnv = state.environments.find((e) => e.id === state.activeEnvId) || null;

  const addEnvironment = useCallback((env) => dispatch({ type: 'ADD_ENV', env }), []);
  const updateEnvironment = useCallback(
    (id, updates) => dispatch({ type: 'UPDATE_ENV', id, updates }),
    []
  );
  const deleteEnvironment = useCallback((id) => dispatch({ type: 'DELETE_ENV', id }), []);
  const setActiveEnvironment = useCallback((id) => dispatch({ type: 'SET_ACTIVE', id }), []);
  const importEnvironments = useCallback(
    (environments) => dispatch({ type: 'IMPORT_ENVS', environments }),
    []
  );

  const value = {
    environments: state.environments,
    activeEnvId: state.activeEnvId,
    activeEnv,
    addEnvironment,
    updateEnvironment,
    deleteEnvironment,
    setActiveEnvironment,
    importEnvironments,
  };

  return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>;
}

export function useEnvironment() {
  const ctx = useContext(EnvironmentContext);
  if (!ctx) throw new Error('useEnvironment must be used within EnvironmentProvider');
  return ctx;
}
