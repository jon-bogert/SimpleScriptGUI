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
                {
                    label: 'Save Project',
                    accelerator: 'CmdOrCtrl+S',
                    click: async () => {
                        win.webContents.send('save-project', false);
                    }
                },
                {
                    label: 'Save Project As',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: async () => {
                        win.webContents.send('save-project', true);
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

    ipcMain.on('get-new-folder', async (event) => {
        const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
            properties: ['openDirectory']
        });

        let projectPath = '';
        if (!result.canceled && result.filePaths.length > 0)
        {
            projectPath = result.filePaths[0];
        }
        win.webContents.send('new-folder-result', projectPath);
    });

    win.on('close', async (e) => {
        e.preventDefault(); // prevent immediate close

        // Ask renderer if there are unsaved changes
        win.webContents.send('check-unsaved');

        // Wait for renderer reply
        const hasChanges = await new Promise((resolve) => {
            ipcMain.once('unsaved-status', (_, value) => resolve(value));
        });

        if (hasChanges)
        {
            const result = dialog.showMessageBoxSync(win, {
                type: 'warning',
                buttons: ['Yes', 'No', 'Cancel'],
                defaultId: 0,
                cancelId: 2,
                title: 'Unsaved Changes',
                message: 'You have unsaved changes. Would you like to save them?'
            });

            if (result === 1)
            {
                // Allow close
                win.destroy();
            }
            else if (result === 0)
            {
                // User chose "Yes" → tell renderer to save
                win.webContents.send('save-project', false);

                // Wait for confirmation that saving is done
                await new Promise((resolve) => {
                    ipcMain.once('save-complete', resolve);
            });

                win.destroy();
            }
        }
        else
        {
            // No unsaved changes — close normally
            win.destroy();
        }
    });
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