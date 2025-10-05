const { app, BrowserWindow } = require('electron');

function createWindow()
{
    const win = new BrowserWindow(
        {
            width: 1920,
            height: 1080,
            webPreferences:
            {
                nodeIntegration: true,
                contextIsolation: false,
                spellcheck: true
            }
        }
    );

    win.webContents.session.setSpellCheckerEnabled(true);

    win.loadFile('index.html');
}

app.whenReady().then(async () =>
{
    createWindow();

    app.on('activate', () =>
    {
        if (BrowserWindow.getAllWindows().length === 0)
        {
            createWindow();
        }
    });
});