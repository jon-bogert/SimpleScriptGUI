const { Project } = require('./project');

async function displayProjects(path)
{
    let proj = new Project();
    
        await proj.load('D:\\repos\\documentation\\ProjectEden_Script');
        
        const editorDiv = document.getElementById('editor');
        editorDiv.innerHTML = '';

        proj.forEach((textBlock) => {
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
        });
}

window.addEventListener('DOMContentLoaded', () => {
    displayProjects('');
});