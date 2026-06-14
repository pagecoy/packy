# Packy (Beta)

Packy is a lightweight, free, cross-platform CLI utility made to pack entire codebases, directories, and file structures into a single optimized Markdown file. Perfectly engineered to feed clean structural context straight into LLMs or custom AI prompts.

Instead of pasting multiple files in an LLM web face, pack it and send one file that has all.

## Features
* **File Tree Generation:** Packy makes a filetree that helps your LLM understand the structure of your project.
* **Token Squeezing:** Removes vertical whitespace that LLMs see as `\n` to reduce token count.
* **Zero Overhead:** Cross-platform clipboard integration using native OS binaries (Linux users must have `xsel` or `xclip`).
* **Token Size Estimation:** Generates character metrics and weight instantly. Outputs are just estimation, actual token usage varies by what you use.

## Installation
### Option 1: Global Local Installation
**NOTE:** Please be aware that this is in beta. I haven't tested this on other operating systems other than Linux (Ubuntu).

If you clone this repository directly to your machine, you can build and link the binary locally:

```bash
# clone and link locally
npm run build
chmod +x dist/index.js
npm link 

# alternatively, you can use the link.sh script that does the above in one go
chmod +x link.sh
./link.sh
```
### Option 2: Install via npm (ONCE PUBLISHED)
Once I published this to npm, you can run Packy anywhere without having to clone.

## Linux Dependencies
For Linux environments, ensure your system has a clipboard backend ready:

```bash
sudo apt update && sudo apt install -y xsel
```

## Usage
Run the tool from the root of any workspace you want to pack. 

**IMPORTANT NOTE:** 
* Packy is hardcoded to ignore the names in `DEFAULT_IGNORES` in `src/index.ts`. There might be things I didn't hardcode for fallbacks (if there is no `.gitignore`), just be aware.

```bash
packy-cli [options]
```

### Options
| Flag | Full Option | Description |
| --- | --- | --- |
| `-c` | `--copy` | Stream the output context directly to your system clipboard. |
| `-s` | `--strip-comments` | Ignore inline comments out of source code components. |
| `-m` | `--map-only` | Generate only the file tree without source file contents |
| `-V` | `--version` | Display current package version details. |
| `-h` | `--help` | Pull up CLI tool parameters and configuration help. |

### Example
Pack your project workspace, strip out developer comments, and copy the whole payload straight to your clipboard:

```bash
packy -s -c
```

## Generated Output Structure
Packy creates an `llm_context.md` file formatted like this:
1. **Project Directory Tree:** A visual clean map layout of your files.
2. **Source File Contents:** Your actual code segments neatly organized into standard Markdown code-blocks matching their original file extensions.