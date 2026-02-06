import { useState, useMemo } from 'react';
import JsonTree from './JsonTree';

const METHOD_COLORS = {
  GET: 'bg-green-500/20 text-green-400 border-green-500/30',
  POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PATCH: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  PUT: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const CopyIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-400">Copied</span>
        </>
      ) : (
        <>
          <CopyIcon />
          {label}
        </>
      )}
    </button>
  );
}

/**
 * Structured request preview with method badge, URL, tabbed details (Body / Headers / cURL).
 * Collapsible to save vertical space.
 */
export default function RequestPreview({ requestPreview, curlCommand }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('body'); // body | headers | curl

  if (!requestPreview) return null;

  const { url, method, headers, body } = requestPreview;
  const methodColor = METHOD_COLORS[method] || METHOD_COLORS.GET;
  const hasBody = body !== null && body !== undefined;

  // Split URL into base path and query string for visual separation
  const [urlPath, urlQuery] = url.split('?');

  // Formatted body JSON for copy
  const bodyJson = useMemo(() => {
    if (!hasBody) return '';
    try {
      return typeof body === 'string' ? body : JSON.stringify(body, null, 2);
    } catch {
      return String(body);
    }
  }, [body, hasBody]);

  // Headers as copyable text
  const headersText = useMemo(() => {
    return Object.entries(headers)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
  }, [headers]);

  // Auto-select best default tab
  const effectiveTab = !hasBody && activeTab === 'body' ? 'headers' : activeTab;

  const tabs = [
    ...(hasBody ? [{ id: 'body', label: 'Body' }] : []),
    { id: 'headers', label: `Headers (${Object.keys(headers).length})` },
    { id: 'curl', label: 'cURL' },
  ];

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
      {/* Header bar: Method badge + URL + collapse toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-800/50 transition-colors text-left"
      >
        {/* Collapse chevron */}
        <svg
          className={`w-3.5 h-3.5 text-gray-500 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>

        {/* Method badge */}
        <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono border flex-shrink-0 ${methodColor}`}>
          {method}
        </span>

        {/* URL */}
        <span className="text-xs font-mono truncate min-w-0 flex-1">
          <span className="text-gray-300">{urlPath}</span>
          {urlQuery && (
            <span className="text-indigo-400/70">?{urlQuery}</span>
          )}
        </span>

        {/* Preview label */}
        <span className="text-[10px] text-gray-600 uppercase tracking-wider flex-shrink-0">
          Preview
        </span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-800">
          {/* Tabs */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800/50">
            <div className="flex gap-0.5 bg-gray-900 rounded-md p-0.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2 py-1 text-[11px] rounded transition-colors ${
                    effectiveTab === tab.id
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Context-aware copy button */}
            {effectiveTab === 'body' && hasBody && (
              <CopyButton text={bodyJson} label="Copy JSON" />
            )}
            {effectiveTab === 'headers' && (
              <CopyButton text={headersText} label="Copy" />
            )}
            {effectiveTab === 'curl' && (
              <CopyButton text={curlCommand} label="Copy cURL" />
            )}
          </div>

          {/* Tab content */}
          <div className="max-h-56 overflow-auto">
            {/* Body tab */}
            {effectiveTab === 'body' && hasBody && (
              <div className="p-3">
                {typeof body === 'object' ? (
                  <JsonTree data={body} />
                ) : (
                  <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-all">
                    {String(body)}
                  </pre>
                )}
              </div>
            )}

            {/* Headers tab */}
            {effectiveTab === 'headers' && (
              <div className="p-3">
                <table className="w-full text-xs">
                  <tbody>
                    {Object.entries(headers).map(([key, value]) => (
                      <tr key={key} className="border-b border-gray-800/50 last:border-0">
                        <td className="py-1.5 pr-3 text-indigo-400 font-medium align-top whitespace-nowrap font-mono">
                          {key}
                        </td>
                        <td className="py-1.5 text-gray-300 break-all font-mono">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* cURL tab */}
            {effectiveTab === 'curl' && (
              <div className="p-3">
                <pre className="text-xs font-mono text-gray-400 whitespace-pre-wrap break-all">
                  <span className="text-green-400">curl</span>
                  {' '}<span className="text-yellow-400">-X</span>{' '}
                  <span className="text-blue-400">{method}</span>
                  {Object.entries(headers).map(([k, v]) => (
                    <span key={k}>
                      {' \\\n  '}<span className="text-yellow-400">-H</span>{' '}
                      <span className="text-amber-300">&quot;{k}: {v}&quot;</span>
                    </span>
                  ))}
                  {hasBody && method !== 'GET' && method !== 'DELETE' && (
                    <>
                      {' \\\n  '}<span className="text-yellow-400">-d</span>{' '}
                      <span className="text-amber-300">&apos;{bodyJson}&apos;</span>
                    </>
                  )}
                  {' \\\n  '}<span className="text-green-300">&quot;{url}&quot;</span>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
