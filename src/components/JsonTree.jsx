import { useState } from 'react';

/**
 * Recursive JSON tree viewer with collapsible nodes and syntax coloring.
 * Shared between ResponseViewer (response data) and RequestPreview (request body).
 */
export default function JsonTree({ data, depth = 0 }) {
  if (data === null) return <span className="text-gray-500">null</span>;
  if (data === undefined) return <span className="text-gray-500">undefined</span>;
  if (typeof data === 'boolean')
    return <span className="text-yellow-400">{data ? 'true' : 'false'}</span>;
  if (typeof data === 'number')
    return <span className="text-green-400">{data}</span>;
  if (typeof data === 'string') {
    if (data.length > 200) {
      return <span className="text-amber-300">&quot;{data.slice(0, 200)}…&quot;</span>;
    }
    return <span className="text-amber-300">&quot;{data}&quot;</span>;
  }

  if (Array.isArray(data)) {
    return <CollapsibleArray data={data} depth={depth} />;
  }

  if (typeof data === 'object') {
    return <CollapsibleObject data={data} depth={depth} />;
  }

  return <span className="text-gray-300">{String(data)}</span>;
}

function CollapsibleObject({ data, depth }) {
  const [isCollapsed, setIsCollapsed] = useState(depth > 2);
  const entries = Object.entries(data);

  if (entries.length === 0) return <span className="text-gray-500">{'{}'}</span>;

  return (
    <span className="font-mono text-xs">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="text-gray-500 hover:text-gray-300 transition-colors"
      >
        {isCollapsed ? '▶' : '▼'}
      </button>
      {isCollapsed ? (
        <span className="text-gray-500 ml-1">
          {'{'} {entries.length} keys {'}'}
        </span>
      ) : (
        <span>
          <span className="text-gray-500">{'{'}</span>
          <div className="ml-4">
            {entries.map(([key, value], i) => (
              <div key={key}>
                <span className="text-purple-400">&quot;{key}&quot;</span>
                <span className="text-gray-500">: </span>
                <JsonTree data={value} depth={depth + 1} />
                {i < entries.length - 1 && <span className="text-gray-500">,</span>}
              </div>
            ))}
          </div>
          <span className="text-gray-500">{'}'}</span>
        </span>
      )}
    </span>
  );
}

function CollapsibleArray({ data, depth }) {
  const [isCollapsed, setIsCollapsed] = useState(depth > 1 && data.length > 3);

  if (data.length === 0) return <span className="text-gray-500">[]</span>;

  return (
    <span className="font-mono text-xs">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="text-gray-500 hover:text-gray-300 transition-colors"
      >
        {isCollapsed ? '▶' : '▼'}
      </button>
      {isCollapsed ? (
        <span className="text-gray-500 ml-1">
          [{data.length} items]
        </span>
      ) : (
        <span>
          <span className="text-gray-500">[</span>
          <div className="ml-4">
            {data.map((item, i) => (
              <div key={i}>
                <JsonTree data={item} depth={depth + 1} />
                {i < data.length - 1 && <span className="text-gray-500">,</span>}
              </div>
            ))}
          </div>
          <span className="text-gray-500">]</span>
        </span>
      )}
    </span>
  );
}
