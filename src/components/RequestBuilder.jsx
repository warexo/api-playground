import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEnvironment } from '../contexts/EnvironmentContext';
import { getEntitySlug } from '../utils/entityUtils';
import RelationTreePicker from './RelationTreePicker';
import FilterBuilder from './FilterBuilder';
import RequestPreview from './RequestPreview';

const REQUEST_MODES = [
  { id: 'get-list', label: 'GET List', method: 'GET', description: 'Fetch entity list' },
  { id: 'get-single', label: 'GET Single', method: 'GET', description: 'Fetch single entity by ID' },
  { id: 'search', label: 'Search', method: 'POST', description: 'Search with filters' },
  { id: 'create', label: 'POST Create', method: 'POST', description: 'Create entity' },
  { id: 'update', label: 'PATCH Update', method: 'PATCH', description: 'Update entity' },
  { id: 'delete', label: 'DELETE', method: 'DELETE', description: 'Delete entity by ID' },
];

export default function RequestBuilder({ entity, onResponse, pageRequest }) {
  const { getApiClient, isLoggedIn, clientId } = useAuth();
  const { activeEnv } = useEnvironment();

  const [mode, setMode] = useState('get-list');
  const [entityId, setEntityId] = useState('');
  const [selectedFields, setSelectedFields] = useState([]);
  const [limit, setLimit] = useState('10');
  const [offset, setOffset] = useState('0');
  const [filters, setFilters] = useState([]);
  const [rawBody, setRawBody] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [fieldSearch, setFieldSearch] = useState('');

  const currentMode = REQUEST_MODES.find((m) => m.id === mode);
  const entitySlug = entity ? getEntitySlug(entity) : '';

  const toggleField = useCallback((fieldPath) => {
    setSelectedFields((prev) =>
      prev.includes(fieldPath)
        ? prev.filter((f) => f !== fieldPath)
        : [...prev, fieldPath]
    );
  }, []);

  // Build the request preview
  const requestPreview = useMemo(() => {
    if (!entitySlug) return null;

    const baseUrl = activeEnv?.url || 'https://your-api.example.com';
    let url = '';
    let method = currentMode.method;
    let body = null;
    const headers = {
      'Authorization': 'Bearer <token>',
      'Content-Type': 'application/json',
    };
    if (clientId) headers['X-Client-Id'] = clientId;

    switch (mode) {
      case 'get-list': {
        const params = new URLSearchParams();
        selectedFields.forEach((f) => params.append('fields[]', f));
        if (limit) params.set('limit', limit);
        if (offset && offset !== '0') params.set('offset', offset);
        const qs = params.toString();
        url = `${baseUrl}/api/v1/entity/${entitySlug}${qs ? '?' + qs : ''}`;
        break;
      }
      case 'get-single':
        url = `${baseUrl}/api/v1/entity/${entitySlug}/${entityId || '<id>'}`;
        break;
      case 'search': {
        const params = new URLSearchParams();
        if (limit) params.set('limit', limit);
        if (offset && offset !== '0') params.set('offset', offset);
        const qs = params.toString();
        url = `${baseUrl}/api/v1/searchentity/${entitySlug}${qs ? '?' + qs : ''}`;
        body = {};
        if (selectedFields.length > 0) body.fields = selectedFields;
        if (filters.length > 0) {
          body.filter = filters
            .filter((f) => f.field)
            .map((f) => {
              const out = { field: f.field, operator: f.operator, value: f.value };
              if (f.conjunction && f.conjunction !== 'AND') out.conjunction = f.conjunction;
              // BETWEENINCL expects [from, to] array
              if (f.operator === 'BETWEENINCL' && typeof f.value === 'string') {
                out.value = f.value.split(',').map((v) => v.trim());
              }
              return out;
            });
        }
        break;
      }
      case 'create':
        url = `${baseUrl}/api/v1/entity/${entitySlug}`;
        try {
          body = rawBody ? JSON.parse(rawBody) : {};
        } catch {
          body = rawBody;
        }
        break;
      case 'update':
        url = `${baseUrl}/api/v1/entity/${entitySlug}/${entityId || '<id>'}`;
        try {
          body = rawBody ? JSON.parse(rawBody) : {};
        } catch {
          body = rawBody;
        }
        break;
      case 'delete':
        url = `${baseUrl}/api/v1/entity/${entitySlug}/${entityId || '<id>'}`;
        delete headers['Content-Type'];
        break;
    }

    return { url, method, headers, body };
  }, [mode, entitySlug, entityId, selectedFields, limit, offset, filters, rawBody, clientId, activeEnv]);

  // Generate cURL command
  const curlCommand = useMemo(() => {
    if (!requestPreview) return '';
    const { url, method, headers, body } = requestPreview;
    let cmd = `curl -X ${method}`;
    for (const [key, val] of Object.entries(headers)) {
      cmd += ` \\\n  -H "${key}: ${val}"`;
    }
    if (body && method !== 'GET' && method !== 'DELETE') {
      cmd += ` \\\n  -d '${JSON.stringify(body, null, 2)}'`;
    }
    cmd += ` \\\n  "${url}"`;
    return cmd;
  }, [requestPreview]);

  // Execute the request (accepts optional overrides for programmatic page changes)
  const executeRequest = async (overrides = {}) => {
    if (!entitySlug || !isLoggedIn) return;

    const effectiveLimit = overrides.limit ?? limit;
    const effectiveOffset = overrides.offset ?? offset;

    setIsExecuting(true);
    const startTime = Date.now();

    try {
      const apiClient = getApiClient();
      let response;
      const params = new URLSearchParams();

      switch (mode) {
        case 'get-list': {
          selectedFields.forEach((f) => params.append('fields[]', f));
          if (effectiveLimit) params.set('limit', effectiveLimit);
          if (effectiveOffset && effectiveOffset !== '0') params.set('offset', effectiveOffset);
          response = await apiClient.get(`/api/v1/entity/${entitySlug}?${params.toString()}`);
          break;
        }
        case 'get-single':
          response = await apiClient.get(`/api/v1/entity/${entitySlug}/${entityId}`);
          break;
        case 'search': {
          if (effectiveLimit) params.set('limit', effectiveLimit);
          if (effectiveOffset && effectiveOffset !== '0') params.set('offset', effectiveOffset);
          const searchBody = {};
          if (selectedFields.length > 0) searchBody.fields = selectedFields;
          if (filters.length > 0) {
            searchBody.filter = filters
              .filter((f) => f.field)
              .map((f) => {
                const out = { field: f.field, operator: f.operator, value: f.value };
                if (f.conjunction && f.conjunction !== 'AND') out.conjunction = f.conjunction;
                if (f.operator === 'BETWEENINCL' && typeof f.value === 'string') {
                  out.value = f.value.split(',').map((v) => v.trim());
                }
                return out;
              });
          }
          response = await apiClient.post(
            `/api/v1/searchentity/${entitySlug}?${params.toString()}`,
            searchBody
          );
          break;
        }
        case 'create': {
          const createBody = rawBody ? JSON.parse(rawBody) : {};
          response = await apiClient.post(`/api/v1/entity/${entitySlug}`, createBody);
          break;
        }
        case 'update': {
          const updateBody = rawBody ? JSON.parse(rawBody) : {};
          response = await apiClient.patch(`/api/v1/entity/${entitySlug}/${entityId}`, updateBody);
          break;
        }
        case 'delete':
          response = await apiClient.delete(`/api/v1/entity/${entitySlug}/${entityId}`);
          break;
      }

      const duration = Date.now() - startTime;
      // Safely extract headers (axios uses a special AxiosHeaders object)
      let resHeaders = {};
      try {
        if (response.headers && typeof response.headers.toJSON === 'function') {
          resHeaders = response.headers.toJSON();
        } else if (response.headers) {
          resHeaders = { ...response.headers };
        }
      } catch { /* ignore */ }

      // Build pagination metadata for paginated modes
      const isPaginated = ['get-list', 'search'].includes(mode);
      const resultCount = Array.isArray(response.data) ? response.data.length : null;
      const pagination = isPaginated ? {
        limit: parseInt(effectiveLimit, 10) || 10,
        offset: parseInt(effectiveOffset, 10) || 0,
        resultCount,
      } : null;

      onResponse({
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: resHeaders,
        duration,
        size: JSON.stringify(response.data).length,
        request: requestPreview,
        timestamp: new Date().toISOString(),
        pagination,
      });
    } catch (err) {
      const duration = Date.now() - startTime;
      let errHeaders = {};
      try {
        const h = err.response?.headers;
        if (h && typeof h.toJSON === 'function') {
          errHeaders = h.toJSON();
        } else if (h) {
          errHeaders = { ...h };
        }
      } catch { /* ignore */ }
      onResponse({
        status: err.response?.status || 0,
        statusText: err.response?.statusText || err.message,
        data: err.response?.data || { error: err.message },
        headers: errHeaders,
        duration,
        size: JSON.stringify(err.response?.data || '').length,
        request: requestPreview,
        timestamp: new Date().toISOString(),
        isError: true,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Keep a ref to the latest executeRequest so the pageRequest effect always calls the current version
  const executeRef = useRef(executeRequest);
  executeRef.current = executeRequest;

  // Handle page change requests from ResponseViewer (via App)
  useEffect(() => {
    if (pageRequest) {
      const newOffset = String(pageRequest.offset);
      setOffset(newOffset);
      // Execute with the override since setState is async
      executeRef.current({ offset: newOffset });
    }
  }, [pageRequest]);

  const needsId = ['get-single', 'update', 'delete'].includes(mode);
  const needsBody = ['create', 'update'].includes(mode);
  const needsFields = ['get-list', 'search'].includes(mode);
  const needsFilters = mode === 'search';
  const needsPagination = ['get-list', 'search'].includes(mode);

  return (
    <div className="flex flex-col h-full">
      {/* Mode selector */}
      <div className="flex gap-1 p-3 border-b border-gray-800 flex-wrap">
        {REQUEST_MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              mode === m.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
            title={m.description}
          >
            <span className="font-mono mr-1 opacity-70">{m.method}</span>
            {m.id === 'get-list' ? 'List' : m.id === 'get-single' ? 'Single' : m.label.split(' ').pop()}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Entity info & ID field */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-900/50 rounded-lg px-3 py-2 border border-gray-800">
            <span className="text-xs text-gray-500">Endpoint:</span>
            <span className="text-sm font-mono ml-2 text-gray-300">
              {mode === 'search' ? '/searchentity/' : '/entity/'}
              <span className="text-indigo-400">{entitySlug || '…'}</span>
              {needsId && (
                <span className="text-gray-500">/{entityId || '<id>'}</span>
              )}
            </span>
          </div>
        </div>

        {/* Entity ID input */}
        {needsId && (
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1">
              Entity ID
            </label>
            <input
              type="text"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="UUID of the entity"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600 font-mono"
            />
          </div>
        )}

        {/* Pagination */}
        {needsPagination && (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1">
                Limit
              </label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="1"
                max="1000"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1">
                Offset
              </label>
              <input
                type="number"
                value={offset}
                onChange={(e) => setOffset(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="0"
              />
            </div>
          </div>
        )}

        {/* Field picker */}
        {needsFields && entity && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Fields ({selectedFields.length} selected)
              </label>
              <div className="flex items-center gap-2">
                {selectedFields.length > 0 && (
                  <button
                    onClick={() => setSelectedFields([])}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowFieldPicker(!showFieldPicker)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {showFieldPicker ? 'Hide picker' : 'Show picker'}
                </button>
              </div>
            </div>

            {/* Selected fields as tags */}
            {selectedFields.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedFields.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-600/20 text-indigo-300 text-xs rounded-full"
                  >
                    {f}
                    <button
                      onClick={() => toggleField(f)}
                      className="hover:text-white transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Tree picker */}
            {showFieldPicker && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg max-h-72 overflow-hidden flex flex-col">
                <div className="sticky top-0 bg-gray-900/80 backdrop-blur p-2 border-b border-gray-800 z-10">
                  <input
                    type="text"
                    value={fieldSearch}
                    onChange={(e) => setFieldSearch(e.target.value)}
                    placeholder="Search fields…"
                    className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto p-2">
                  <RelationTreePicker
                    entity={entity}
                    selectedFields={selectedFields}
                    onToggleField={toggleField}
                    searchQuery={fieldSearch}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter builder */}
        {needsFilters && (
          <FilterBuilder
            entity={entity}
            filters={filters}
            onFiltersChange={setFilters}
          />
        )}

        {/* Raw body editor */}
        {needsBody && (
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1">
              Request Body (JSON)
            </label>
            <textarea
              value={rawBody}
              onChange={(e) => setRawBody(e.target.value)}
              placeholder={`{\n  "field": "value"\n}`}
              className="w-full h-48 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600 resize-y"
              spellCheck={false}
            />
            <div className="mt-1 text-xs text-gray-500">
              Tip: Use <code className="text-gray-400">__customPrimaryKey</code>,{' '}
              <code className="text-gray-400">__collectionBehavior</code>, or{' '}
              <code className="text-gray-400">__foreignKeys</code> for advanced operations.
              Send an array for bulk operations.
            </div>
          </div>
        )}

        {/* Upload media info */}
        {mode === 'create' && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">
            <strong>ℹ Media Upload:</strong> To upload files, use{' '}
            <code className="bg-blue-500/20 px-1 py-0.5 rounded">POST /api/v1/uploadmedia?filename=name.jpg</code>{' '}
            with the raw file content as request body. PHP files are blocked.
          </div>
        )}

        {/* Request Preview */}
        <RequestPreview requestPreview={requestPreview} curlCommand={curlCommand} />
      </div>

      {/* Execute button */}
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={executeRequest}
          disabled={!isLoggedIn || !entitySlug || isExecuting}
          className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
            isLoggedIn && entitySlug && !isExecuting
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isExecuting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Executing…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Send Request
            </>
          )}
        </button>
        {!isLoggedIn && (
          <p className="text-xs text-gray-500 text-center mt-1.5">
            Connect to an environment first
          </p>
        )}
      </div>
    </div>
  );
}
