// project.js

const fs = require('fs/promises'); // For asynchronous file operations
const path = require('path');
const { exit } = require('process');

// --- C++ Struct Conversions to JavaScript Types ---

/**
 * @typedef {Object} TextBlock
 * @property {('Unassigned'|'Slug'|'Action'|'Parenthetical'|'Dialogue'|'Note')} type
 * @property {string} [character=""]
 * @property {string} content
 * @property {number} [slugCount=1]
 */

/**
 * @typedef {Object} CharacterColor
 * @property {number} r - Red component (0-255)
 * @property {number} g - Green component (0-255)
 * @property {number} b - Blue component (0-255)
 * @property {number} a - Alpha component (0-255)
 */

/**
 * @typedef {Object} Character
 * @property {string} name
 * @property {string} notes
 * @property {CharacterColor} color - Equivalent to sf::Color
 */

/**
 * @typedef {Object} Sequence
 * @property {string} name
 * @property {TextBlock[]} blocks
 */

// --- Constants for TextBlock.Type Enum ---
const TextBlockType = {
    Unassigned: 'Unassigned',
    Slug: 'Slug',
    Action: 'Action',
    Parenthetical: 'Parenthetical',
    Dialogue: 'Dialogue',
    Note: 'Note'
};
// --------------------------------------------------

/**
 * A collection for managing Character objects.
 * Mimics the C++ operator[] and Contains functionality.
 */
class CharacterCollection {
    constructor() {
        /** @type {Character[]} */
        this.data = [];
    }

    /**
     * Gets or creates a Character by name.
     * @param {string} name
     * @returns {Character}
     */
    get(name) {
        let character = this.data.find(c => c.name === name);
        if (!character) {
            // Default color in C++ was sf::Color(255, 0, 0, 255) (Red)
            /** @type {Character} */
            const newEntry = {
                name: name,
                color: { r: 255, g: 0, b: 0, a: 255 },
                notes: "",
            };
            this.data.push(newEntry);
            character = newEntry;
        }
        return character;
    }

    /**
     * Finds a character by name (read-only access equivalent).
     * @param {string} name
     * @returns {Character | undefined}
     */
    find(name) {
        return this.data.find(c => c.name === name);
    }

    /**
     * Checks if a character exists.
     * @param {string} key
     * @returns {boolean}
     */
    contains(key) {
        return this.data.some(c => c.name === key);
    }
}

class Project {
    constructor() {
        /** @type {Sequence[]} */
        this.m_sequences = [];
        /** @type {CharacterCollection} */
        this.m_characters = new CharacterCollection();
        
        // Default print function equivalent to C++ std::cout
        /** @type {function(string): void} */
        this.m_print = (msg) => console.log(msg);

        /** * @type {string[]} Stores file paths for each slug. 
         * Index is slugNumber - 1. Equivalent to std::vector<std::filesystem::path>.
         */
        this.m_fileFromSlug = [];
    }

    // --- Public Interface (Translated from C++ Public Methods) ---

    /**
     * Iterates over all TextBlocks.
     * @param {function(TextBlock): void} callback
     */
    forEach(callback) {
        for (const seq of this.m_sequences) {
            for (const block of seq.blocks) {
                callback(block);
            }
        }
    }

    /**
     * Sets the message callback function.
     * @param {function(string): void} msgCallback
     */
    msgCallback(msgCallback) {
        this.m_print = msgCallback;
    }

    /**
     * Loads the project from a directory. (C++: void Load)
     * @param {string} projDirectory - The path to the project directory.
     */
    async load(projDirectory) {
        this.m_fileFromSlug = [];
        this.m_sequences = [];
        this.m_characters.data = [];

        if (!(await this._exists(projDirectory))) {
            this.Print("Project Directory does not exist");
            return;
        }

        const charPath = path.join(projDirectory, "_char.txt");
        if (await this._exists(charPath)) {
            await this._loadCharacters(charPath);
        } else {
            this.Print("Note -- '_char.txt' was not found.");
        }

        let entries;
        try {
            entries = await fs.readdir(projDirectory, { withFileTypes: true });
        } catch (e) {
            this.Print(`Error reading project directory: ${e.message}`);
            return;
        }

        for (const entry of entries) {
            // Check if it's a directory (is_regular_file() is false)
            if (!entry.isDirectory()) continue;

            const filename = entry.name;

            // Skip directories based on filename
            if (filename === ".git" || filename === ".backup" /* || filename === "int" for debug */) continue;

            const sequencePath = path.join(projDirectory, filename);
            await this._loadSequence(sequencePath);
        }
    }

    /**
     * Saves the project to a directory. (C++: void Save)
     * @param {string} projPath
     */
    async save(projPath) {
        await this._newBackup(projPath);

        await this._saveCharacters(path.join(projPath, "_char.txt"));

        let fileCounter = { value: 0 };

        for (let i = 0; i < this.m_sequences.length; ++i) {
            const seq = this.m_sequences[i];
            const name = this._twoDig(i) + "_" + seq.name;
            const sequenceDirectory = path.join(projPath, name);

            // Equivalent to std::filesystem::create_directories
            await fs.mkdir(sequenceDirectory, { recursive: true });
            await this._saveSequence(sequenceDirectory, seq, fileCounter);
        }
    }

    /** @returns {number} */
    getNumberOfSequences() {
        return this.m_sequences.length;
    }

    /** @returns {Sequence} */
    getSequence(index) {
        return this.m_sequences[index];
    }

    /** @returns {CharacterCollection} */
    characters() {
        return this.m_characters;
    }

    /** * @param {number} slugNumber 
     * @returns {string | undefined} 
     * Equivalent to const std::filesystem::path& FileFromSlug(uint32_t slugNumber)
     */
    fileFromSlug(slugNumber) {
        // C++ uses 1-based indexing for slugNumber: m_fileFromSlug[slugNumber - 1]
        return this.m_fileFromSlug[slugNumber - 1];
    }

    // --- Private Helper Methods (Translated from C++ Private Methods) ---

    /**
     * Helper for printing messages. (C++: void Print)
     * @param {string} msg
     */
    Print(msg) {
        this.m_print(msg);
    }

    /**
     * Checks if a path exists (async).
     * @param {string} pathString
     * @returns {Promise<boolean>}
     */
    async _exists(pathString) {
        try {
            await fs.access(pathString);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Loads character data from _char.txt. (C++: void LoadCharacters)
     * @param {string} charPath
     */
    async _loadCharacters(charPath) {
        let fileContent;
        try {
            fileContent = await fs.readFile(charPath, 'utf8');
        } catch (e) {
            this.Print(`Error reading character file: ${e.message}`);
            return;
        }

        const lines = fileContent.split(/\r?\n/);
        let charName = "";

        for (let line of lines) {
            line = this._trim(line);
            if (line.length === 0) continue;

            if (line.startsWith('[')) {
                const nameEnd = line.indexOf(']');
                const colBegin = line.indexOf('{');
                const colEnd = line.indexOf('}');

                let currentName = "";

                // 1. Parse Character Name
                if (nameEnd === -1) {
                    this.Print("No Character end point found for line: " + line);
                    // This logic is complex in C++, simplifying to find the name before color spec
                    currentName = line.substring(1, colBegin === -1 ? line.length : colBegin);
                } else {
                    currentName = line.substring(1, nameEnd);
                }

                charName = this._toCaps(this._trim(currentName));
                /** @type {Character} */
                const c = this.m_characters.get(charName); // Gets or creates character

                // 2. Parse Color
                if (colBegin === -1) {
                    c.color = { r: 255, g: 255, b: 255, a: 255 };
                } else {
                    let colorString;
                    if (colEnd === -1) {
                        this.Print("No Color end point found for line: " + line);
                        colorString = line.substring(colBegin + 1);
                    } else {
                        colorString = line.substring(colBegin + 1, colEnd);
                    }

                    const colCells = colorString.split(',').map(s => this._trim(s));
                    
                    // Initialize with default white
                    const newColor = { r: 255, g: 255, b: 255, a: 255 };
                    const channels = ['r', 'g', 'b', 'a'];

                    // Parse up to 4 channels
                    for (let i = 0; i < 4; i++) {
                        if (i < colCells.length) {
                            try {
                                const value = parseInt(colCells[i], 10);
                                if (!isNaN(value)) {
                                    // Clamp to 0-255 (uint8_t equivalent)
                                    newColor[channels[i]] = Math.min(255, Math.max(0, value));
                                } else {
                                    this.Print("Could not parse color integer: " + colCells[i]);
                                }
                            } catch (e) {
                                this.Print("Could not parse color integer: " + colCells[i]);
                            }
                        }
                        // If there are fewer than 4 values, the remaining channels
                        // already default to 255 from initialization, matching the C++ behavior.
                    }
                    c.color = newColor;
                }
                continue;
            }

            // If line is not a specifier, it's a note
            if (charName.length === 0) {
                this.Print("Fatal Error -- No current character name for line: " + line);
                exit(1);
            }

            const character = this.m_characters.get(charName);
            if (character.notes.length > 0) {
                character.notes += "\n" + line;
            } else {
                character.notes = line;
            }
        }
    }

    /**
     * Loads a sequence from a directory. (C++: void LoadSequence)
     * @param {string} sequencePath
     */
    async _loadSequence(sequencePath) {
        let name = path.basename(sequencePath);
        const underscoreIndex = name.indexOf('_');
        if (underscoreIndex !== -1) {
            name = name.substring(underscoreIndex + 1);
        }

        /** @type {Sequence} */
        const seq = { name: name, blocks: [] };
        this.m_sequences.push(seq);

        let entries;
        try {
            entries = await fs.readdir(sequencePath, { withFileTypes: true });
        } catch (e) {
            this.Print(`Error reading sequence directory ${sequencePath}: ${e.message}`);
            return;
        }

        // Sort entries by name to ensure scenes are loaded in order (01_scene.txt before 02_scene.txt)
        for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
            if (entry.isFile() && path.extname(entry.name) === ".txt") {
                await this._loadScene(path.join(sequencePath, entry.name), seq);
            }
        }
    }

    /**
     * Loads a scene file and populates the sequence's blocks. (C++: void LoadScene)
     * @param {string} scenePath
     * @param {Sequence} seq
     */
    async _loadScene(scenePath, seq) {
        let fileContent;
        try {
            fileContent = await fs.readFile(scenePath, 'utf8');
        } catch (e) {
            this.Print("Could not open file: " + scenePath);
            return;
        }

        let lastCharacter = "";
        const lines = fileContent.split(/\r?\n/);

        for (let line of lines) {
            line = this._trim(line);
            if (line.length === 0) continue;

            /** @type {TextBlock} */
            let block;
            const currentSlugCount = this.m_fileFromSlug.length; // Will be 1-based index if new slug is added

            if (line.startsWith('#')) {
                this.m_fileFromSlug.push(scenePath);
                
                let content = line.substring(1);
                this._toCaps(content); // C++ capitalizes the entire line *after* trimming the #
                content = this._trim(content);

                block = {
                    slugCount: this.m_fileFromSlug.length, // Updated length is the new slug count
                    type: TextBlockType.Slug,
                    content: content,
                };
                seq.blocks.push(block);
                continue;
            }

            // Character specifier [NAME]
            if (line.startsWith('[')) {
                const closeIndex = line.indexOf(']');
                if (closeIndex === -1) {
                    this.Print("Expecting close bracket for character specifier on line: " + line);
                    lastCharacter = line.substring(1);
                } else {
                    lastCharacter = line.substring(1, closeIndex);
                }
                lastCharacter = this._toCaps(this._trim(lastCharacter));
                continue;
            }

            // Action line *content
            if (line.startsWith('*')) {
                block = {
                    slugCount: currentSlugCount,
                    type: TextBlockType.Action,
                    content: this._trim(line.substring(1)),
                };
                seq.blocks.push(block);
                continue;
            }

            // Parenthetical (content)
            if (line.startsWith('(')) {
                if (lastCharacter.length === 0) {
                    this.Print("Fatal Error -- No Character assigned for parenthetical: " + line);
                    exit(1);
                }

                block = {
                    slugCount: currentSlugCount,
                    type: TextBlockType.Parenthetical,
                    character: lastCharacter,
                };

                const endIndex = line.lastIndexOf(')');
                if (endIndex === -1) {
                    this.Print("Expecting close parenthesis for character specifier on line: " + line);
                    block.content = this._trim(line.substring(1));
                } else {
                    block.content = this._trim(line.substring(1, endIndex));
                }
                seq.blocks.push(block);
                continue;
            }

            // Note //content
            if (line.length >= 2 && line.substring(0, 2) === "//") {
                const note = this._trim(line.substring(2));
                if (note.length > 0) {
                    block = {
                        slugCount: currentSlugCount,
                        type: TextBlockType.Note,
                        content: note,
                    };
                    seq.blocks.push(block);
                }
                continue;
            }

            // Dialogue (Default case)
            if (lastCharacter.length === 0) {
                this.Print("Fatal Error -- No Character assigned for dialogue: " + line);
                exit(1);
            }

            block = {
                slugCount: currentSlugCount,
                type: TextBlockType.Dialogue,
                character: lastCharacter,
                content: line, // Dialogue content is kept as the raw trimmed line
            };
            seq.blocks.push(block);
        }
    }

    /**
     * Creates a backup of the project directory. (C++: void NewBackup)
     * @param {string} projPath
     */
    async _newBackup(projPath) {
        const backupPath = path.join(projPath, ".backup");
        
        // Remove existing backup
        if (await this._exists(backupPath)) {
            // fs.rm is recursive and forceful, similar to C++ remove_all
            await fs.rm(backupPath, { recursive: true, force: true });
        }
        await fs.mkdir(backupPath, { recursive: true });

        let entries;
        try {
            entries = await fs.readdir(projPath, { withFileTypes: true });
        } catch (e) {
            this.Print(`Error reading project path for backup: ${e.message}`);
            return;
        }

        for (const entry of entries) {
            const filename = entry.name;

            if (filename === ".git" || filename === ".gitattributes" || filename === ".gitignore" || filename === ".backup") continue;
            // Assuming we don't need the _DEBUG check for "int" in JS

            const fullPath = path.join(projPath, filename);
            const destPath = path.join(backupPath, filename);

            try {
                // Copy recursively for directories, or copy files
                if (entry.isDirectory()) {
                    await fs.cp(fullPath, destPath, { recursive: true });
                } else if (entry.isFile() && (path.extname(filename) === ".txt" || !path.extname(filename))) {
                    // Only copy files that are .txt or have no extension (like .gitattributes which was skipped anyway)
                    await fs.copyFile(fullPath, destPath);
                }

                // Remove the original (only if it was copied and not a special file)
                if (entry.isDirectory() || (entry.isFile() && path.extname(filename) === ".txt")) {
                     await fs.rm(fullPath, { recursive: true, force: true });
                }

            } catch (error) {
                this.Print(`Error backing up/removing ${fullPath}: ${error.message}`);
            }
        }
    }

    /**
     * Saves character data to _char.txt. (C++: void SaveCharacters)
     * @param {string} charPath
     */
    async _saveCharacters(charPath) {
        let content = "";
        for (const c of this.m_characters.data) {
            content += `[${c.name}]{ ${c.color.r}, ${c.color.g}, ${c.color.b}, ${c.color.a} }\r\n`;

            if (c.notes.length > 0) {
                content += c.notes + "\r\n";
            }
            content += "\r\n";
        }
        await fs.writeFile(charPath, content);
    }

    /**
     * Saves a sequence's blocks into scene files. (C++: void SaveSequence)
     * Note: Node.js file handles (fs.open/fs.FileHandle) are used for sequential writing.
     * @param {string} sequencePath
     * @param {Sequence} seq
     * @param {number} fileCounter
     */
    async _saveSequence(sequencePath, seq, fileCounter) {
        let currentFileHandle = null;
        let currentContent = "";
        let lastCharName = "";

        for (const block of seq.blocks) {
            if (block.type === TextBlockType.Slug) {
                if (currentFileHandle) {
                    await currentFileHandle.write(currentContent);
                    await currentFileHandle.close();
                    currentFileHandle = null;
                    currentContent = "";
                }

                lastCharName = '';

                const filename = this._threeDig(fileCounter.value++) + "_" + this._nameFromSlug(block.content) + ".txt";
                const filePath = path.join(sequencePath, filename);

                currentFileHandle = await fs.open(filePath, 'w');

                // Write Slug line
                currentContent += `# ${block.content}\r\n\r\n`;
                continue;
            }

            if (!currentFileHandle) {
                this.Print("Fatal Error -- Sequence doesn't begin with a slug line");
                exit(1);
            }

            switch (block.type) {
                case TextBlockType.Action:
                    currentContent += `* ${block.content}\r\n\r\n`;
                    break;
                case TextBlockType.Note:
                    currentContent += `// ${block.content}\r\n\r\n`;
                    break;
                case TextBlockType.Parenthetical:
                    if (block.character !== lastCharName) {
                        currentContent += `[${block.character}]\r\n`;
                        lastCharName = block.character;
                    }
                    currentContent += `(${block.content})\r\n\r\n`;
                    break;
                case TextBlockType.Dialogue:
                    if (block.character !== lastCharName) {
                        currentContent += `[${block.character}]\r\n`;
                        lastCharName = block.character;
                    }
                    currentContent += `${block.content}\r\n\r\n`;
                    break;
                default:
                    this.Print(`Save Sequence -- 'TextBlock' type '${block.type}' not implemented`);
                    break;
            }
        }

        // Write any remaining content and close the last file
        if (currentFileHandle) {
            await currentFileHandle.write(currentContent);
            await currentFileHandle.close();
        }
    }

    // --- C++ Utility Function Equivalents ---

    /**
     * Trims leading/trailing whitespace. (C++: void Trim)
     * @param {string} str
     * @returns {string}
     */
    _trim(str) {
        return str.trim();
    }

    /**
     * Converts a string to all uppercase. (C++: void ToCaps)
     * @param {string} str
     * @returns {string}
     */
    _toCaps(str) {
        return str.toUpperCase();
    }

    /**
     * Formats a number to a two-digit string (e.g., 5 -> "05"). (C++: std::string TwoDig)
     * @param {number} val
     * @returns {string}
     */
    _twoDig(val) {
        return val.toString().padStart(2, '0');
    }

    /**
     * Formats a number to a three-digit string (e.g., 5 -> "005"). (C++: std::string ThreeDig)
     * @param {number} val
     * @returns {string}
     */
    _threeDig(val) {
        return val.toString().padStart(3, '0');
    }

    /**
     * Converts a slug line into a file-safe name (UPPERCASE_WITH_UNDERSCORES). (C++: std::string NameFromSlug)
     * @param {string} line
     * @returns {string}
     */
    _nameFromSlug(line) {
        let result = '';
        let lastWasSpecial = false;

        for (const c of line) {
            // Check for alphabetical characters
            if (/[a-zA-Z]/.test(c)) {
                lastWasSpecial = false;
                result += c.toUpperCase();
                continue;
            }

            // Non-alphanumeric characters become a single underscore
            if (!lastWasSpecial) {
                lastWasSpecial = true;
                result += '_';
            }
        }

        // Clean up leading/trailing underscores that can result from the C++ logic.
        return result.replace(/^_+|_+$/g, '');
    }
}

// Export the class and types for use in other Electron modules
module.exports = {
    Project,
    CharacterCollection,
    TextBlockType,
};