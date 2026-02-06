import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distPath = join(__dirname, '..', 'dist', 'web');

let mainWindow;
let serverInstance;

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

async function startServer() {
  // Dynamically import the Express app
  const { default: expressApp } = await import('../server/index.js');

  return new Promise((resolve) => {
    // Find a free port
    const tempServer = createServer();
    tempServer.listen(0, () => {
      const port = tempServer.address().port;
      tempServer.close(() => {
        process.env.PORT = port;
        serverInstance = expressApp.listen(port, () => {
          console.log(`Express server running on port ${port}`);
          resolve(port);
        });
      });
    });
  });
}

async function createWindow() {
  let url;

  if (isDev) {
    // In dev mode, use the Vite dev server (started separately via concurrently)
    url = 'http://localhost:5173';
  } else {
    // In production, start our own Express server serving the built files
    const port = await startServer();
    url = `http://localhost:${port}`;
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    title: 'Warexo API Playground',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#030712', // gray-950
  });

  mainWindow.loadURL(url);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (serverInstance) serverInstance.close();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
