import { app, BrowserWindow } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let pyProcess = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  win.loadURL(
    `${path.join(__dirname, 'dist/index.html')}`
  );
}

function startPythonSubprocess() {
  const scriptPath = path.join(__dirname, '../app.py');
  pyProcess = spawn('python', [scriptPath]);
  
  pyProcess.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
  });
  
  pyProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
  });
  
  pyProcess.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
  });
}

app.whenReady().then(() => {
  startPythonSubprocess();
  createWindow();
});

app.on('window-all-closed', () => {
  if (pyProcess != null) {
      pyProcess.kill();
  }
  if (process.platform !== 'darwin') {
      app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
  }
});
