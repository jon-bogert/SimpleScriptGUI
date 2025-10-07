const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');

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

    // Create application menu
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Open Project',
                    accelerator: 'CmdOrCtrl+O',
                    click: async () => {
                        const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
                            properties: ['openDirectory']
                        });

                        if (!result.canceled && result.filePaths.length > 0)
                        {
                            const projectPath = result.filePaths[0];
                            win.webContents.send('open-project', projectPath);
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectall' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

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