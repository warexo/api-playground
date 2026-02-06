import { useState, useCallback, useRef } from 'react';
import TopBar from './components/TopBar';
import EntitySelector from './components/EntitySelector';
import RequestBuilder from './components/RequestBuilder';
import ResponseViewer from './components/ResponseViewer';
import HistoryPanel, { useHistory } from './components/HistoryPanel';
import { useAuth } from './contexts/AuthContext';
import { useEnvironment } from './contexts/EnvironmentContext';

export default function App() {
  const { activeEnv } = useEnvironment();
  const { isLoggedIn } = useAuth();
  const { addToHistory } = useHistory();

  const [selectedEntity, setSelectedEntity] = useState(null);
  const [response, setResponse] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [pageRequest, setPageRequest] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const isResizing = useRef(false);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(600, Math.max(200, startWidth + (e.clientX - startX)));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [sidebarWidth]);

  const handlePageChange = useCallback((newOffset) => {
    // Use a unique timestamp so the same offset can be re-requested
    setPageRequest({ offset: newOffset, ts: Date.now() });
  }, []);

  const handleResponse = useCallback(
    (res) => {
      setResponse(res);
      addToHistory(res);
    },
    [addToHistory]
  );

  const handleLoadRequest = useCallback((item) => {
    // TODO: Restore request from history item into the builder
    // For now, just show what was stored
    console.log('Load request:', item);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
      <TopBar />

      {/* Welcome screen when no environment is set */}
      {!activeEnv ? (
        <WelcomeScreen />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar: Entity Selector (resizable) */}
          <div
            className="relative flex-shrink-0 bg-gray-900/50 border-r border-gray-800 flex flex-col overflow-hidden"
            style={{ width: sidebarWidth }}
          >
            <div className="px-3 py-2 border-b border-gray-800">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Entities
              </h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <EntitySelector
                selectedEntity={selectedEntity}
                onSelect={setSelectedEntity}
              />
            </div>
            {/* Resize handle */}
            <div
              className="resize-handle"
              onMouseDown={handleMouseDown}
            />
          </div>

          {/* Center: Request Builder */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 bg-gray-900/30">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Request Builder
                {selectedEntity && (
                  <span className="ml-2 text-indigo-400 normal-case font-normal">
                    — {selectedEntity.className}
                  </span>
                )}
              </h2>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  showHistory
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                History
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Builder area */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {selectedEntity ? (
                  <RequestBuilder entity={selectedEntity} onResponse={handleResponse} pageRequest={pageRequest} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                      <p>Select an entity from the sidebar to start building requests</p>
                    </div>
                  </div>
                )}
              </div>

              {/* History sidebar */}
              {showHistory && (
                <div className="w-72 flex-shrink-0 border-l border-gray-800 overflow-hidden">
                  <HistoryPanel onLoadRequest={handleLoadRequest} />
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Response Viewer */}
          <div className="w-[480px] flex-shrink-0 bg-gray-900/30 border-l border-gray-800 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-800">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Response
              </h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <ResponseViewer response={response} onPageChange={handlePageChange} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WelcomeScreen() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Warexo API Playground</h2>
        <p className="text-gray-400 mb-6">
          Interactively explore and test the Warexo ERP API. Create an environment to get started.
        </p>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-left space-y-3">
          <Step number={1} text='Click the environment selector in the top bar and create a new environment' />
          <Step number={2} text='Enter your API URL, username and password' />
          <Step number={3} text='Click "Connect" to authenticate' />
          <Step number={4} text='Select an entity from the sidebar and start building requests' />
        </div>
      </div>
    </div>
  );
}

function Step({ number, text }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-6 h-6 bg-indigo-600/30 rounded-full flex items-center justify-center text-xs font-bold text-indigo-400 flex-shrink-0">
        {number}
      </span>
      <span className="text-sm text-gray-300">{text}</span>
    </div>
  );
}
