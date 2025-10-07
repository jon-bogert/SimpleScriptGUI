const { Project } = require('./project');

let proj = null;
let sceneIndex = -1;
let editIndex = -1;

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

    const insertParentTop = document.createElement('div');
    insertParentTop.className = 'insertparent';
    insertParentTop.addEventListener('click', () => {
        addLine(0);
    });
    const insertLineTop = document.createElement('div');
    insertLineTop.className = 'insertline';
    insertParentTop.appendChild(insertLineTop);
    editorDiv.appendChild(insertParentTop);

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
                }
                else
                {
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
                });

                charField.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter')
                    {
                        event.preventDefault();
                    }
                });

                setDiv.appendChild(charField);
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
            });

            lineDiv.appendChild(lineContent);

            // Move and Delete Buttons
            const delButton = document.createElement('div');
            delButton.className = 'line-settings-button';
            delButton.textContent = 'x';
            delButton.style.color = 'red';
            delButton.addEventListener('click', () => {
                removeBlockAt(i);
            });
            const upButton = document.createElement('div');
            upButton.className = 'line-settings-button';
            upButton.textContent = '^';
            upButton.addEventListener('click', () => {
                swapBlocks(i, i-1);
            });
            const downButton = document.createElement('div');
            downButton.className = 'line-settings-button';
            downButton.textContent = 'v';
            downButton.addEventListener('click', () => {
                swapBlocks(i, i+1);
            });

            const buttonParent = document.createElement('div');
            buttonParent.className = 'line-settings-button-parent';
            buttonParent.appendChild(delButton);
            buttonParent.appendChild(upButton);
            buttonParent.appendChild(downButton);
            lineDiv.appendChild(buttonParent);
            
            editorDiv.appendChild(lineDiv);
            
            // Insert Line
            const insertParent = document.createElement('div');
            insertParent.className = 'insertparent';
            insertParent.addEventListener('click', () => {
                addLine(i + 1);
            });

            const insertLine = document.createElement('div');
            insertLine.className = 'insertline';
            insertParent.appendChild(insertLine);
            editorDiv.appendChild(insertParent);

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

        const insertParent = document.createElement('div');
        insertParent.className = 'insertparent';
        insertParent.addEventListener('click', () => {
            addLine(i + 1);
        });

        const insertLine = document.createElement('div');
        insertLine.className = 'insertline';
        insertParent.appendChild(insertLine);
        editorDiv.appendChild(insertParent);
    }
}

function renderSidebar()
{
    const seqDiv = document.getElementById('sequence-list');
    seqDiv.innerHTML = '';

    if (proj === null)
        return;

    const seqCount = proj.getNumberOfSequences();
    for (let i = 0; i < seqCount; ++i)
    {
        const p = document.createElement('p');

        if (sceneIndex === i)
        {
            p.textContent = '> ' + proj.getSequence(i).name;
            p.className = "sequence-entry-selected";
        }
        else
        {
            p.textContent = proj.getSequence(i).name;
            p.className = "sequence-entry";
        }


        p.addEventListener('click', () => {
            loadSequence(i, -1);
        });

        seqDiv.appendChild(p);
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
    loadSequence(sceneIndex, indexB);
}

function addLine(index)
{
    if (proj === null || sceneIndex < 0)
        return;

    let seq = proj.getSequence(sceneIndex);

    seq.blocks.splice(index, 0, { type: 'Unassigned', character: '', content: '', slugCount: 1 });
    loadSequence(sceneIndex, index);
}

function loadSequence(index, lineIndex)
{
    sceneIndex = index;
    editIndex = lineIndex;
    renderSidebar();
    renderEditor();
}

async function displayProjects(path)
{
    proj = new Project();
    
    await proj.load(path);
        
    const background = document.getElementById('editor');
    background.addEventListener('click', (event) => {
        if (event.target === background)
        {
            loadSequence(sceneIndex, -1);
        }
    });

    renderSidebar();
    renderEditor();
}

window.addEventListener('DOMContentLoaded', () => {
    displayProjects('D:\\repos\\documentation\\ProjectEden_Script');
});