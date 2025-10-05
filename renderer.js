const { Project } = require('./project');

let proj = null;
let sceneIndex = -1;

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

    for (const textBlock of seq.blocks)
    {
        const p = document.createElement('p');
        p.textContent = (textBlock.type === 'Parenthetical') ? '(' + textBlock.content + ')' : textBlock.content;
        
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
        editorDiv.appendChild(p);
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
            loadSequence(i);
        });

        seqDiv.appendChild(p);
    }
}

function loadSequence(index)
{
    sceneIndex = index;
    renderSidebar();
    renderEditor();
}

async function displayProjects(path)
{
    proj = new Project();
    
    await proj.load(path);
        
    renderSidebar();
    renderEditor();
}

window.addEventListener('DOMContentLoaded', () => {
    displayProjects('D:\\repos\\documentation\\ProjectEden_Script');
});