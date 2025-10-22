const { Project, CharacterCollection } = require('./project');
const { ipcRenderer } = require('electron');

let proj = null;
let sceneIndex = -1;
let editIndex = -1;
let charIndex = -1;
let isEditingTitle = false;

let insertHovered = -1;
let setCursorCharacter = false;
let setCursorContents = false;

let projectPath = '';
let hasChanges = false;

let sidebarWidthLeft = 0;
let isSidebarCollapsedLeft = false;

function rgbaToHex(r, g, b, a = 1)
{
    const toHex = (n) => Math.round(n).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgba(hex)
{
    hex = hex.replace(/^#/, '');
    if (hex.length === 3 || hex.length === 4)
    {
        hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const a = 255;

    return { r, g, b, a };
}

function setHasChanges(v)
{
    if (v !== hasChanges)
    {
        ipcRenderer.send('on-saved-change', v);
        const title = document.getElementById('title');
        title.textContent = (v === true) ? 'Simple Script - Unsaved' : 'Simple Script';
    }
    hasChanges = v;
}

function initializeSidebarControlsLeft()
{
    isSidebarCollapsedLeft = false;
    sidebarWidthLeft = 300;

    const sidebar = document.getElementById('sidebar-left');
    const resizeHande = document.getElementById('resize-handle-left');
    const collapseButton = document.getElementById('collapse-sidebar-left');

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    collapseButton.addEventListener('click', () => {
        collapseSidebarLeft();
    });

    resizeHande.addEventListener('mousedown', (event) => {
        if (isSidebarCollapsedLeft)
            return;

        isResizing = true;
        startX = event.clientX;
        startWidth = sidebar.offsetWidth;
        document.body.style.userSelect = 'none';
    });

    resizeHande.addEventListener('click', (event) => {
        if (!isSidebarCollapsedLeft)
            return;
        
        expandSidebarLeft();
    });

    document.addEventListener('mousemove', (event) => {
        if (!isResizing)
            return;

        const newWidth = Math.max(200, Math.min(600, startWidth + (event.clientX - startX)));
        setSidebarWidthLeft(newWidth);
    });

    document.addEventListener('mouseup', () => {
        if (isResizing)
        {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });

    window.addEventListener('resize', () => {
        if (isSidebarCollapsedLeft)
        {
            sidebar.style.display = 'none';
        }
    });
}

function setSidebarWidthLeft(width)
{
    const sidebar = document.getElementById('sidebar-left');

    sidebarWidthLeft = width;
    sidebar.style.width = `${width}px`;
}

function collapseSidebarLeft()
{
    const sidebar = document.getElementById('sidebar-left');
    const resizeHandle = document.getElementById('resize-handle-left');

    isSidebarCollapsedLeft = true;
    sidebar.style.display = 'none';
    resizeHandle.style.width = '5px';
    resizeHandle.style.cursor = 'pointer';
}

function expandSidebarLeft()
{
    const sidebar = document.getElementById('sidebar-left');
    const resizeHandle = document.getElementById('resize-handle-left');

    isSidebarCollapsedLeft = false;
    sidebar.style.display = 'flex';
    resizeHandle.style.width = '3px';
    resizeHandle.style.cursor = 'ew-resize';
    setSidebarWidthLeft(sidebarWidthLeft);
}

function initializeSidebarControlsRight()
{
    isSidebarCollapsedRight = false;
    sidebarWidthRight = 300;

    const sidebar = document.getElementById('sidebar-right');
    const resizeHande = document.getElementById('resize-handle-right');
    const collapseButton = document.getElementById('collapse-sidebar-right');

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    collapseButton.addEventListener('click', () => {
        collapseSidebarRight();
    });

    resizeHande.addEventListener('mousedown', (event) => {
        if (isSidebarCollapsedRight)
            return;

        isResizing = true;
        startX = event.clientX;
        startWidth = sidebar.offsetWidth;
        document.body.style.userSelect = 'none';
    });

    resizeHande.addEventListener('click', (event) => {
        if (!isSidebarCollapsedRight)
            return;
        
        expandSidebarRight();
    });

    document.addEventListener('mousemove', (event) => {
        if (!isResizing)
            return;

        const newWidth = Math.max(200, Math.min(600, startWidth - (event.clientX - startX)));
        setSidebarWidthRight(newWidth);
    });

    document.addEventListener('mouseup', () => {
        if (isResizing)
        {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });

    window.addEventListener('resize', () => {
        if (isSidebarCollapsedRight)
        {
            sidebar.style.display = 'none';
        }
    });
}

function setSidebarWidthRight(width)
{
    const sidebar = document.getElementById('sidebar-right');

    sidebarWidthRight = width;
    sidebar.style.width = `${width}px`;
}

function collapseSidebarRight()
{
    const sidebar = document.getElementById('sidebar-right');
    const resizeHandle = document.getElementById('resize-handle-right');

    isSidebarCollapsedRight = true;
    sidebar.style.display = 'none';
    resizeHandle.style.width = '5px';
    resizeHandle.style.cursor = 'pointer';
}

function expandSidebarRight()
{
    const sidebar = document.getElementById('sidebar-right');
    const resizeHandle = document.getElementById('resize-handle-right');

    isSidebarCollapsedRight = false;
    sidebar.style.display = 'flex';
    resizeHandle.style.width = '3px';
    resizeHandle.style.cursor = 'ew-resize';
    setSidebarWidthRight(sidebarWidthRight);
}

function createInsertLine(index)
{
    const insertParent = document.createElement('div');
    insertParent.className = 'insertparent';
    insertParent.addEventListener('click', () => {
        addLine(index);
        setHasChanges(true);
    });
    insertParent.addEventListener('mouseenter', () => {
        insertHovered = index;
    });
    insertParent.addEventListener('mouseleave', () => {
        if (insertHovered != index)
            return;
        insertHovered = -1;
    });

    const insertLine = document.createElement('div');
    insertLine.className = 'insertline';
    insertParent.appendChild(insertLine);

    return insertParent;
}

function renderEditor()
{
    const editorDiv = document.getElementById('editor');
    editorDiv.innerHTML = '';

    const pageTitle = document.getElementById('page-title');
    if (proj === null || sceneIndex < 0)
    {
        pageTitle.innerText = "Select or Add a Sequence";
        return;
    }

    let seq = proj.getSequence(sceneIndex);
    pageTitle.innerText = seq.name;

    let lastCharacter = "";
    let wasLastBlockDialogue = false;

    const insertDiv = createInsertLine(0);
    editorDiv.appendChild(insertDiv);

    // Text Block Loop
    for (let i = 0; i < seq.blocks.length; ++i)
    {
        let textBlock = seq.blocks[i];

        // Character Names
        if (textBlock.type === 'Parenthetical' || textBlock.type === 'Dialogue')
        {
            if (!wasLastBlockDialogue || textBlock.character !== lastCharacter)
            {
                const charPara = document.createElement('p');
                if (textBlock.character === '')
                {
                    charPara.textContent = '<UNASSIGNED>';
                    charPara.style.color = 'red';
                }
                else
                {
                    if (textBlock.character === "JESSA")
                    {
                        console.log('bang');
                    }
                    charPara.textContent = (textBlock.character === lastCharacter) ? textBlock.character + ' (CONT\'D)' : textBlock.character;
                }
                charPara.className = 'character-name';
                if (proj.characters().contains(textBlock.character))
                {
                    const col = proj.characters().find(textBlock.character).color;
                    const a = (col.a ?? 255) / 255;
                    charPara.style.color = `rgba(${col.r}, ${col.g}, ${col.b}, ${a})`;
                }
                editorDiv.appendChild(charPara);
            }
            wasLastBlockDialogue = true;
            lastCharacter = textBlock.character;
        }
        else
        {
            wasLastBlockDialogue = false;
        }

        // Editing block
        if (i === editIndex)
        {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'line-selected';

            const setDiv = document.createElement('div');
            setDiv.className = 'line-settings';
            
            // Dropdown
            const lineTypeLabel = document.createElement('p');
            lineTypeLabel.className = 'line-settings-label';
            lineTypeLabel.textContent = 'Type:';
            setDiv.appendChild(lineTypeLabel);

            const lineType = document.createElement('select');
            lineType.className = 'line-settings-type';
            const typeOptions = ['Unassigned', 'Slug', 'Action', 'Parenthetical', 'Dialogue', 'Note'];
            for (const text of typeOptions)
            {
                const option = document.createElement('option');
                option.value = text;
                option.textContent = text;
                lineType.appendChild(option);
            }

            lineType.value = textBlock.type;
            lineType.addEventListener('change', (newType) => {
                console.log('set value to ' + newType.target.value);
                textBlock.type = newType.target.value;
                loadSequence(sceneIndex, editIndex);
            }); 
            setDiv.appendChild(lineType);

            // Character Assign
            if (textBlock.type === 'Parenthetical' || textBlock.type === 'Dialogue')
            {
                const charFieldLabel = document.createElement('p');
                charFieldLabel.className = 'line-settings-label';
                charFieldLabel.textContent = "Character:";
                setDiv.appendChild(charFieldLabel);

                const charField = document.createElement('div');
                charField.className = 'character-field';
                charField.contentEditable = true;
                charField.textContent = textBlock.character;

                charField.addEventListener('input', () => {
                    textBlock.character = charField.textContent.toUpperCase();
                    setHasChanges(true);
                });

                charField.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter')
                    {
                        event.preventDefault();
                    }
                });

                setDiv.appendChild(charField);

                if (setCursorCharacter)
                {
                    requestAnimationFrame(() => charField.focus());
                    setCursorCharacter = false;
                }
            }

            lineDiv.appendChild(setDiv);

            // Line Itself
            const lineContent = document.createElement('div');
            lineContent.className = 'line-selected-content';
            lineContent.contentEditable = true;
            lineContent.spellcheck = true;
            lineContent.textContent = textBlock.content;
            let oldContent = textBlock.content;

            lineContent.addEventListener('keydown', (event) => {
                if (event.key === 'Enter')
                {
                    event.preventDefault();
                    loadSequence(sceneIndex, -1);
                }
                else if (event.key === "Escape")
                {
                    textBlock.content = oldContent;
                    loadSequence(sceneIndex, -1);
                }
            });

            lineContent.addEventListener('input', () => {
                textBlock.content = lineContent.textContent;
                setHasChanges(true);
            });

            lineDiv.appendChild(lineContent);

            if (setCursorContents)
            {
                requestAnimationFrame(() => lineContent.focus());
                setCursorContents = false;
            }

            const buttonSize = 20;

            const underline = document.createElement('div');
            underline.className = 'line-selected-underline';
            lineDiv.appendChild(underline);

            // Move and Delete Buttons
            const delButton = document.createElement('div');
            delButton.className = 'line-settings-button';
            const delButtonImg = document.createElement('img');
            delButtonImg.src = 'assets/delete-icon.png';
            delButtonImg.alt = 'Delete Line';
            delButtonImg.color = 'red';
            delButtonImg.width = buttonSize;
            delButtonImg.height = buttonSize;
            delButton.appendChild(delButtonImg);
            delButton.addEventListener('click', () => {
                removeBlockAt(i);
                setHasChanges(true);
            });
            const upButton = document.createElement('div');
            upButton.className = 'line-settings-button';
            const upButtonImg = document.createElement('img');
            upButtonImg.src = 'assets/up-icon.png';
            upButtonImg.alt = 'Move Line Up';
            upButtonImg.width = buttonSize;
            upButtonImg.height = buttonSize;
            upButton.appendChild(upButtonImg);
            upButton.addEventListener('click', () => {
                swapBlocks(i, i-1);
                setHasChanges(true);
            });
            const downButton = document.createElement('div');
            downButton.className = 'line-settings-button';
            const downButtonImg = document.createElement('img');
            downButtonImg.src = 'assets/down-icon.png';
            downButtonImg.alt = 'Move Line Down';
            downButtonImg.width = buttonSize;
            downButtonImg.height = buttonSize;
            downButton.appendChild(downButtonImg);
            downButton.addEventListener('click', () => {
                swapBlocks(i, i+1);
                setHasChanges(true);
            });

            const buttonParent = document.createElement('div');
            buttonParent.className = 'line-settings-button-parent';
            buttonParent.appendChild(delButton);
            buttonParent.appendChild(upButton);
            buttonParent.appendChild(downButton);
            lineDiv.appendChild(buttonParent);
            
            editorDiv.appendChild(lineDiv);
            
            // Insert Line
            const insertLine = createInsertLine(i + 1);
            editorDiv.appendChild(insertLine);

            continue;
        }

        // Regular Rendering

        if (textBlock.content === '')
        {
            removeBlockAt(i);
            continue;
        }

        const p = document.createElement('p');
        // Text
        if (textBlock.type === 'Parenthetical')
        {
            p.textContent = '(' + textBlock.content + ')';
        }
        else if (textBlock.type === 'Note')
        {
            p.textContent = '// ' + textBlock.content;
        }
        else
        {
            p.textContent = textBlock.content;
        }
        
        // Assign Styling
        if (textBlock.type === 'Slug')
        {
            p.className = "slug-line";
        }
        else if (textBlock.type === 'Action')
        {
            p.className = "action-line";
        }
        else if (textBlock.type === 'Parenthetical')
        {
            p.className = 'parenthetical'
        }
        else if (textBlock.type === 'Dialogue')
        {
            p.className = 'dialogue'
        }
        else if (textBlock.type === 'Note')
        {
            p.className = 'note';
        }
        else
        {
            p.style.color = 'red';
        }
        p.addEventListener('click', () => {
            setEditLine(i);
        });
        editorDiv.appendChild(p);

        const insertLine = createInsertLine(i + 1);
        editorDiv.appendChild(insertLine);
    }
}

function renderSequenceSidebar()
{
    const seqDiv = document.getElementById('sequence-list');
    seqDiv.innerHTML = '';

    if (proj === null)
        return;

    const seqCount = proj.getNumberOfSequences();
    for (let i = 0; i < seqCount; ++i)
    {
        const outerEntry = document.createElement('div');
        const labelText = document.createElement('p');
        outerEntry.appendChild(labelText);

        if (sceneIndex === i)
        {
            outerEntry.className = "sequence-entry-selected";

            const buttonSize = 15;

            // Move and Delete Buttons
            const delButton = document.createElement('div');
            delButton.className = 'line-settings-button';
            const delButtonImg = document.createElement('img');
            delButtonImg.src = 'assets/delete-icon.png';
            delButtonImg.alt = 'Delete Sequence';
            delButtonImg.color = 'red';
            delButtonImg.width = buttonSize;
            delButtonImg.height = buttonSize;
            delButton.appendChild(delButtonImg);
            delButton.addEventListener('click', () => {
                removeSequenceAt(i);
                setHasChanges(true);
            });
            const upButton = document.createElement('div');
            upButton.className = 'line-settings-button';
            const upButtonImg = document.createElement('img');
            upButtonImg.src = 'assets/up-icon.png';
            upButtonImg.alt = 'Move Sequence Up';
            upButtonImg.width = buttonSize;
            upButtonImg.height = buttonSize;
            upButton.appendChild(upButtonImg);
            upButton.addEventListener('click', () => {
                swapSequences(i, i-1);
                setHasChanges(true);
            });
            const downButton = document.createElement('div');
            downButton.className = 'line-settings-button';
            const downButtonImg = document.createElement('img');
            downButtonImg.src = 'assets/down-icon.png';
            downButtonImg.alt = 'Move Sequence Down';
            downButtonImg.width = buttonSize;
            downButtonImg.height = buttonSize;
            downButton.appendChild(downButtonImg);
            downButton.addEventListener('click', () => {
                swapSequences(i, i+1);
                setHasChanges(true);
            });

            const buttonParent = document.createElement('div');
            buttonParent.className = 'line-settings-button-parent';
            buttonParent.appendChild(delButton);
            buttonParent.appendChild(upButton);
            buttonParent.appendChild(downButton);
            outerEntry.appendChild(buttonParent);
        }
        else
        {
            outerEntry.className = "sequence-entry";

            outerEntry.addEventListener('click', () => {
            loadSequence(i, -1);
        });
        }

        labelText.textContent = proj.getSequence(i).name;

        seqDiv.appendChild(outerEntry);
    }
}

function renderCharacterSidebar()
{
    const listDiv = document.getElementById('character-list');
    listDiv.innerHTML = '';

    const charSidebar = document.getElementById('sidebar-right');
    charSidebar.addEventListener('click', (event) => {
        if (event.target === charSidebar)
        {
            charIndex = -1;
            loadSequence(sceneIndex, editIndex);
        }
    })

    if (proj === null)
        return;

    const characters = proj.characters().data;

    if (characters === null)
        return;

    for (let i = 0; i < characters.length; ++i)
    {
        const charDiv = document.createElement('div');
        // Edit Character
        if (i === charIndex)
        {
            charDiv.className = 'char-entry-selected';

            // Character Name
            const charFieldLabel = document.createElement('p');
            charFieldLabel.className = 'line-settings-label';
            charFieldLabel.textContent = "Name:";
            charDiv.appendChild(charFieldLabel);

            const nameField = document.createElement('div');
            nameField.className = 'character-field';
            nameField.contentEditable = true;
            nameField.textContent = characters[i].name;

            nameField.addEventListener('input', () => {
                characters[i].name = nameField.textContent.toUpperCase();
                setHasChanges(true);
            });

            nameField.addEventListener('keydown', (event) => {
                if (event.key === 'Enter')
                {
                    event.preventDefault();
                }
            });

            charDiv.appendChild(nameField);
            charDiv.appendChild(document.createElement('br'));
            
            // Color Picker
            
            const colorLabel = document.createElement('p');
            colorLabel.className = 'line-settings-label';
            colorLabel.textContent = 'Color:';
            
            const colorPicker = document.createElement('input');
            colorPicker.type = 'color';
            const col = characters[i].color;
            colorPicker.value = rgbaToHex(col.r, col.g, col.b);
            colorPicker.addEventListener('input', (event) => {
                characters[i].color = hexToRgba(event.target.value);
                setHasChanges(true);
            });
            
            const colorRow = document.createElement('p');
            colorRow.style.display = 'flex';
            
            colorRow.appendChild(colorLabel);
            colorRow.appendChild(colorPicker);
            charDiv.appendChild(colorRow);
            charDiv.appendChild(document.createElement('br'));
            
            // Description

            const descLabel = document.createElement('p');
            descLabel.className = 'line-settings-label';
            descLabel.textContent = 'Description:';
            charDiv.appendChild(descLabel);

            const descField = document.createElement('div');
            descField.className = 'line-selected-content';
            descField.contentEditable = true;
            descField.spellcheck = true;
            descField.textContent = characters[i].notes;
            descField.addEventListener('input', () => {
                characters[i].notes = descField.textContent;
                setHasChanges(true);
            });

            descField.addEventListener('keydown', (event) => {
                if (event.key === 'Enter')
                {
                    event.preventDefault();
                    charIndex = -1;
                    loadSequence(sceneIndex, editIndex);
                }
            });

            charDiv.appendChild(descField);

            const underline = document.createElement('div');
            underline.className = 'line-selected-underline';
            charDiv.appendChild(underline);

            
            // Move and Delete Buttons
            const buttonSize = 15;
            const delButton = document.createElement('div');
            delButton.className = 'line-settings-button';
            const delButtonImg = document.createElement('img');
            delButtonImg.src = 'assets/delete-icon.png';
            delButtonImg.alt = 'Delete Sequence';
            delButtonImg.color = 'red';
            delButtonImg.width = buttonSize;
            delButtonImg.height = buttonSize;
            delButton.appendChild(delButtonImg);
            delButton.addEventListener('click', () => {
                removeCharacterAt(i);
                setHasChanges(true);
            });
            const upButton = document.createElement('div');
            upButton.className = 'line-settings-button';
            const upButtonImg = document.createElement('img');
            upButtonImg.src = 'assets/up-icon.png';
            upButtonImg.alt = 'Move Sequence Up';
            upButtonImg.width = buttonSize;
            upButtonImg.height = buttonSize;
            upButton.appendChild(upButtonImg);
            upButton.addEventListener('click', () => {
                swapCharacters(i, i-1);
                setHasChanges(true);
            });
            const downButton = document.createElement('div');
            downButton.className = 'line-settings-button';
            const downButtonImg = document.createElement('img');
            downButtonImg.src = 'assets/down-icon.png';
            downButtonImg.alt = 'Move Sequence Down';
            downButtonImg.width = buttonSize;
            downButtonImg.height = buttonSize;
            downButton.appendChild(downButtonImg);
            downButton.addEventListener('click', () => {
                swapCharacters(i, i+1);
                setHasChanges(true);
            });

            const buttonParent = document.createElement('div');
            buttonParent.className = 'line-settings-button-parent';
            buttonParent.appendChild(delButton);
            buttonParent.appendChild(upButton);
            buttonParent.appendChild(downButton);
            charDiv.appendChild(buttonParent);
        }
        else
        {
            charDiv.className = 'char-entry';
            charDiv.textContent = characters[i].name;
            const col = characters[i].color;
            charDiv.style.color = rgbaToHex(col.r, col.g, col.b);

            charDiv.addEventListener('click', () => {
                charIndex = i;
                loadSequence(sceneIndex, editIndex);
            });
        }

        listDiv.appendChild(charDiv);
    }
}

function setEditLine(lineIndex)
{
    loadSequence(sceneIndex, lineIndex)
}

function removeBlockAt(index)
{
    if (proj === null || sceneIndex < 0)
        return;

    let seq = proj.getSequence(sceneIndex);
    seq.blocks.splice(index, 1);
    setHasChanges(true);
    loadSequence(sceneIndex, editIndex);
}

function swapBlocks(indexA, indexB)
{
    if (proj === null || sceneIndex < 0)
        return;
    let seq = proj.getSequence(sceneIndex);

    if (indexA >= seq.blocks.length || indexA < 0
        || indexB >= seq.blocks.length || indexB < 0)
    {
        return;
    }

    [seq.blocks[indexA], seq.blocks[indexB]] = [seq.blocks[indexB], seq.blocks[indexA]];
    setHasChanges(true);
    loadSequence(sceneIndex, indexB);
}

function addLine(index, startType = 'Unassigned')
{
    if (proj === null || sceneIndex < 0)
        return;

    let seq = proj.getSequence(sceneIndex);

    if (startType == 'Parenthetical' || startType == 'Dialogue')
    {
        setCursorCharacter = true;
    }
    else
    {
        setCursorContents = true;
    }

    seq.blocks.splice(index, 0, { type: startType, character: '', content: '', slugCount: 1 });
    setHasChanges(true);
    loadSequence(sceneIndex, index);
}

function loadSequence(index, lineIndex, overrideTitleAbort = false)
{
    if (isEditingTitle && !overrideTitleAbort)
    {
        abortTitle();
    }
    sceneIndex = index;
    editIndex = lineIndex;

    renderCharacterSidebar();
    renderSequenceSidebar();
    renderEditor();
}

function editTitle()
{
    if (isEditingTitle || proj == null || sceneIndex < 0)
        return;

    const title = document.getElementById('page-title');
    title.className = 'page-title-editing';
    isEditingTitle = true;
    title.contentEditable = true;
    title.spellcheck = true;

    loadSequence(sceneIndex, -1, true);
}

function saveTitle()
{
    if (!isEditingTitle || proj == null || sceneIndex < 0 )
        return;

    const title = document.getElementById('page-title');
    const seq = proj.getSequence(sceneIndex);
    seq.name = title.textContent;
    isEditingTitle = false;
    title.className = '';
    title.contentEditable = false;
    title.spellcheck = false;
    setHasChanges(true);
    renderSequenceSidebar();
}

function abortTitle()
{
    if (!isEditingTitle || proj == null || sceneIndex < 0 )
        return;

    const title = document.getElementById('page-title');
    const seq = proj.getSequence(sceneIndex);
    title.textContent = seq.name;
    isEditingTitle = false;
    title.className = '';
    title.contentEditable = false;
    title.spellcheck = false;
}

function addNewSequence()
{
    if (proj == null)
        return;

    proj.m_sequences.push({name: 'Untitled', blocks: []});
    sceneIndex = proj.m_sequences.length - 1;
    setHasChanges(true);
    loadSequence(sceneIndex, -1);
}

function removeSequenceAt(index)
{
    if (proj === null || sceneIndex < 0)
        return;

    if (index < 0 || index >= proj.m_sequences.length)
        return;

    proj.m_sequences.splice(index, 1);
    setHasChanges(true);
    loadSequence(-1, -1);
}

function swapSequences(indexA, indexB)
{
    if (proj === null || sceneIndex < 0)
        return;

    if (indexA >= proj.m_sequences.length || indexA < 0
        || indexB >= proj.m_sequences.length || indexB < 0)
    {
        return;
    }

    [proj.m_sequences[indexA], proj.m_sequences[indexB]] = [proj.m_sequences[indexB], proj.m_sequences[indexA]];
    setHasChanges(true);
    loadSequence(indexB, editIndex);
}

function removeCharacterAt(index)
{
    if (proj === null || charIndex < 0)
        return;

    if (index < 0 || index >= proj.characters().data.length)
        return;

    proj.characters().data.splice(index, 1);
    charIndex = -1;
    setHasChanges(true);
    loadSequence(sceneIndex, editIndex);
}

function swapCharacters(indexA, indexB)
{
    if (proj === null || charIndex < 0)
        return;

    if (indexA >= proj.characters().data.length || indexA < 0
        || indexB >= proj.characters().data.length || indexB < 0)
    {
        return;
    }

    [proj.characters().data[indexA], proj.characters().data[indexB]] = [proj.characters().data[indexB], proj.characters().data[indexA]];
    charIndex = indexB;
    setHasChanges(true);
    loadSequence(sceneIndex, editIndex);
}

async function displayProject(path)
{
    proj = new Project();
    setHasChanges(false);

    if (path !== '')
    {
        await proj.load(path);
    }

    projectPath = path;
        
    const background = document.getElementById('editor');
    background.addEventListener('click', (event) => {
        if (event.target === background)
        {
            loadSequence(sceneIndex, -1);
        }
    });

    const title = document.getElementById('page-title');
    title.addEventListener('click', () => {
        editTitle();
    });
    title.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            saveTitle();
        }
        else if (event.key === "Escape") {
            abortTitle();
        }
    });

    const newPageButton = document.getElementById('new-sequence-button');
    newPageButton.addEventListener('click', () => {
        addNewSequence();
    });

    initializeSidebarControlsLeft();
    initializeSidebarControlsRight();

    renderCharacterSidebar();
    renderSequenceSidebar();
    renderEditor();
}

window.addEventListener('DOMContentLoaded', async () => {
    document.addEventListener('keydown', (event) => {
        if (insertHovered < 0)
            return;

        const key = event.key;
        if (key < "1" || key > "5")
            return;

        event.preventDefault();

        switch (key)
        {
            case "1":
                addLine(insertHovered, 'Slug');
                break;
            case "2":
                addLine(insertHovered, 'Action');
                break;
            case "3":
                addLine(insertHovered, 'Parenthetical');
                break;
            case "4":
                addLine(insertHovered, 'Dialogue');
                break;
            case "5":
                addLine(insertHovered, 'Note');
                break;
        }
    });

    await displayProject('');
});

ipcRenderer.on('open-project', async (event, projPath) => {
    await displayProject(projPath);
});

ipcRenderer.on('save-project', async (event, overridePath) => {
    if (proj === null)
        return;
    
    if (projectPath === '' || overridePath)
    {
        ipcRenderer.send('get-new-folder');
        return;
    }

    setHasChanges(false);
    await proj.save(projectPath);
    ipcRenderer.send('save-complete');
});

ipcRenderer.on('new-folder-result', async (event, projPath) => {
    
    if (projPath === '')
            return;

    projectPath = projPath;
    setHasChanges(false);
    await proj.save(projectPath);
    ipcRenderer.send('save-complete');
});

ipcRenderer.on('check-unsaved', (event) => {
    event.sender.send('unsaved-status', hasChanges);
});