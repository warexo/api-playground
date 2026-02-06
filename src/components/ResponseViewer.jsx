import { useState, useMemo } from 'react';
import JsonTree from './JsonTree';

export default function ResponseViewer({ response, onPageChange }) {
  const [viewMode, setViewMode] = useState('pretty'); // pretty | raw | headers

  // All hooks must be called unconditionally (before any early return)
  const formattedData = useMemo(() => {
    if (!response) return '';
    try {
      return JSON.stringify(response.data, null, 2);
    } catch {
      try {
        return String(response.data);
      } catch {
        return '[Unable to display response data]';
      }
    }
  }, [response]);

  const dataSize = useMemo(() => {
    const bytes = response?.size || 0;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, [response?.size]);

  const resultCount = useMemo(() => {
    if (Array.isArray(response?.data)) return response.data.length;
    return null;
  }, [response?.data]);

  if (!response) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>Send a request to see the response</p>
        </div>
      </div>
    );
  }

  const statusColor = response.isError || response.status >= 400
    ? 'text-red-400 bg-red-500/10 border-red-500/20'
    : response.status >= 300
    ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
    : 'text-green-400 bg-green-500/10 border-green-500/20';

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${statusColor}`}>
            {response.status} {response.statusText}
          </span>
          <span className="text-xs text-gray-500">{response.duration}ms</span>
          <span className="text-xs text-gray-500">{dataSize}</span>
          {resultCount !== null && (
            <span className="text-xs text-gray-400">{resultCount} items</span>
          )}
        </div>

        {/* View mode tabs */}
        <div className="flex gap-0.5 bg-gray-900 rounded-md p-0.5">
          {['pretty', 'raw', 'headers'].map((vm) => (
            <button
              key={vm}
              onClick={() => setViewMode(vm)}
              className={`px-2 py-1 text-xs rounded transition-colors capitalize ${
                viewMode === vm
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {vm}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'pretty' && (
          <div className="p-3">
            <JsonTree data={response.data} />
          </div>
        )}

        {viewMode === 'raw' && (
          <div className="p-3">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => navigator.clipboard.writeText(formattedData)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
            </div>
            <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-all">
              {formattedData}
            </pre>
          </div>
        )}

        {viewMode === 'headers' && (
          <div className="p-3">
            <table className="w-full text-xs">
              <tbody>
                {Object.entries(response.headers && typeof response.headers === 'object' ? response.headers : {}).map(([key, value]) => (
                  <tr key={key} className="border-b border-gray-800/50">
                    <td className="py-1.5 pr-3 text-gray-400 font-medium align-top whitespace-nowrap">
                      {key}
                    </td>
                    <td className="py-1.5 text-gray-300 break-all font-mono">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination bar */}
      {response.pagination && onPageChange && (
        <PaginationBar pagination={response.pagination} onPageChange={onPageChange} />
      )}
    </div>
  );
}

function PaginationBar({ pagination, onPageChange }) {
  const { limit, offset, resultCount } = pagination;
  const currentPage = Math.floor(offset / limit) + 1;
  const hasPrev = offset > 0;
  // If we got exactly `limit` results, there are probably more pages
  const hasNext = resultCount !== null && resultCount >= limit;
  const showingFrom = offset + 1;
  const showingTo = offset + (resultCount ?? 0);

  return (
    <div className="flex items-center justify-between px-3 py-2 border-t border-gray-800 bg-gray-900/50 flex-shrink-0">
      {/* Info text */}
      <div className="text-xs text-gray-500">
        {resultCount !== null ? (
          <>
            Showing <span className="text-gray-300 font-medium">{showingFrom}–{showingTo}</span>
            {' · '}
            Page <span className="text-gray-300 font-medium">{currentPage}</span>
          </>
        ) : (
          <span>Page {currentPage}</span>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <button
          onClick={() => onPageChange(0)}
          disabled={!hasPrev}
          className={`p-1.5 rounded transition-colors ${
            hasPrev
              ? 'text-gray-400 hover:text-white hover:bg-gray-700'
              : 'text-gray-700 cursor-not-allowed'
          }`}
          title="First page"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(Math.max(0, offset - limit))}
          disabled={!hasPrev}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
            hasPrev
              ? 'text-gray-300 hover:text-white hover:bg-gray-700'
              : 'text-gray-700 cursor-not-allowed'
          }`}
          title="Previous page"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Prev
        </button>

        {/* Page indicator */}
        <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300 font-mono min-w-[2.5rem] text-center">
          {currentPage}
        </span>

        {/* Next page */}
        <button
          onClick={() => onPageChange(offset + limit)}
          disabled={!hasNext}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
            hasNext
              ? 'text-gray-300 hover:text-white hover:bg-gray-700'
              : 'text-gray-700 cursor-not-allowed'
          }`}
          title="Next page"
        >
          Next
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
