# SimpleScriptGUI - Readme

### Description
*SimpleScriptGUI* is a cross-platform app for writing and editing film scripts. This new version uses the [Electron](https://www.electronjs.org) framework for a more natural workflow over the previous versions of this project ([SimpleScript](https://github.com/jon-bogert/SimpleScript) & [SimpleScriptCMD](https://github.com/jon-bogert/SimpleScriptCMD)).

### Features
The following features are provided with this application
- Add, Remove or Change the order of *Sequences*
- Add, Remove or Change the order of *Characters*
    - Not all characters need to be added to the project.
    - Added characters include descriptions and custom colors to make it easier to spot them in the editor
- Add, Remove, or Change the order of *Script Blocks*
    - Scripts blocks include: *Slug Lines*, *Action Lines*, *Parentheticals*, *Dialogue Lines*, and *Notes*
    - *Notes* only appear in the editor and will not be exported

### Missing features
The following features are not yet implemented in the application and we would like to add them as soon as we can.
- Export to file format
    - Scripts are compatible with the `ss-export` tool from [SimpleScriptCMD](https://github.com/jon-bogert/SimpleScriptCMD) which will give you a `.docx` file. Unfortunately this is only currently available for Windows.
- Spellcheck suggestions
    - While red underlines appear under misspelled words, a context menu is not currently available for suggesting replacements

## This Repository

### Disclaimer
This is the author's first Node.JS project. They are aware that the project structure is not the most ideal or *safe*. There are plans to refactor the project to move most of the functionality to the backend and provide proper context isolation in the future.

### Requirements
[Node.JS](https://nodejs.org/en) is required for this repository.

The following packages are required:
 - [Electron](https://www.electronjs.org), Run: `npm install electron`
 - Electron Builder, Run: `npm install electron-builder`

 You can start the app through: `npm start`. A `launch.json` file for VS Code is also provided for debugging both the front and backend.

 ### Building
 *Windows*, *macOS* and *Linux* configurations are already defined, run `npm run dist:win`, `npm run dist:mac`, or `npm run dist:linux` for your desired platform. Take note that the linux version tries to build `.AppImage`, `.deb`, and `.pacman`. You may want to remove unwanted options (or add `rpm`) as needed.