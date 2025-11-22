const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let pythonProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, '../sha.png'),
        title: "Student Performance Analyzer",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    // In development, load the Vite dev server URL
    // In production, we would load the built index.html
    mainWindow.loadURL('http://localhost:5173');

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

function startPythonBackend() {
    const pythonScript = path.join(__dirname, '../python_backend/main.py');
    console.log(`Starting Python backend: ${pythonScript}`);

    pythonProcess = spawn('python', [pythonScript]);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python Backend: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Backend Error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python backend exited with code ${code}`);
    });
}

app.on('ready', () => {
    startPythonBackend();
    // Wait a bit for backend to start? Or just start frontend immediately
    // The frontend will retry connection if backend isn't ready instantly

    // We need to wait for the Vite server to be ready if we are launching it via concurrently
    // But for the Electron window, we just point it to the URL.
    // If we run "npm run electron:start", we assume the dev server is started by concurrently

    setTimeout(createWindow, 2000); // Give a small buffer
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});

app.on('will-quit', () => {
    if (pythonProcess) {
        pythonProcess.kill();
    }
});
