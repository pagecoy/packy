#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import ignore from 'ignore';
import { program } from 'commander';
import { execSync } from 'child_process';

/**
 * Recursively walks through a directory and logs file paths.
 * @param dirPath The absolute or relative path to scan.
 */

// Commander CLI config
program
  .name('packy')
  .description('Pack your codebase into an optimized markdown context file')
  .version('1.0.0')
  .option('-c, --copy', 'Automatically copy the output directly to your system clipboard', false)
  .option('-s, --strip-comments', 'Strip comments out of source code files for token optimization', false)
  .parse(process.argv);

const ig = ignore();

const DEFAULT_IGNORES = [
  'node_modules', '.git', 'dist', 'build', 
  '.next', '.nuxt', '.output', '.cache',
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'llm_context.md',
  'venv', '.venv', 'env', '.env',
  '__pycache__', '.pytest_cache', 
  '.env', '.env.local', '.env.development',
  '.vscode', '.idea',
  '*.log', '*.pyc', '*.sqlite3', '*.db',
];
ig.add(DEFAULT_IGNORES);

const targetDir = process.cwd();
const gitignorePath = path.join(targetDir, '.gitignore')

if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    ig.add(gitignoreContent)
    console.log('Successfully loaded rules from .gitignore.\n')
} else {
    console.log('No .gitignore found. Using default fallback filters.\n');
}

let outputBuffer = "";

function writeToBuffer(text: string): void {
    outputBuffer += text + "\n";
}

/**
 * Recursively scans a directory and maps out a visual ASCII structure tree. 
 */
function buildTree(dirPath: string, rootDir: string, prefix: string = ""): void {
    const files = fs.readdirSync(dirPath);

    /*const validFiles = files.filter(file => {
        const fullPath = path.join(dirPath, file);
        const relativePath = path.relative(rootDir, fullPath);
        console.log("Ignoring file")
        return !ig.ignores(relativePath);
    });*/

    files.forEach((file, index) => {
        const fullPath = path.join(dirPath, file);
        const relativePath = path.relative(rootDir, fullPath);
        
        const isIgnored = ig.ignores(relativePath);
        const isDirectory = fs.statSync(fullPath).isDirectory();
        
        const isLast = index === files.length - 1;
        const marker = isLast ? "└── " : "├── ";

        // Always print the file/folder name
        // Append [ignored] if it's a folder we aren't allowed to enter
        const label = (isIgnored && isDirectory) ? `${file} [ignored]` : file;
        console.log('Building tree...')
        writeToBuffer(`${prefix}${marker}${label}`);

        // Only recurse if it's NOT ignored and IS a directory
        if (isDirectory && !isIgnored) {
            const nextPrefix = prefix + (isLast ? "    " : "│   ");
            buildTree(fullPath, rootDir, nextPrefix);
        }
    });
}
/**
 * Recursively reads file source code, compresses vertical whitespace, and wraps them in markdown tags.
 * Supports universal comment stripping across C-style, Hash-style, and Markup-style languages.
 */
function appendFileContents(dirPath: string, rootDir: string, stripComments: boolean): void {
    const files = fs.readdirSync(dirPath);

    const validFiles = files.filter(file => {
        const fullPath = path.join(dirPath, file);
        const relativePath = path.relative(rootDir, fullPath);
        return !ig.ignores(relativePath);
    });

    for (const file of validFiles) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            appendFileContents(fullPath, rootDir, stripComments);
        } else {
            const relativePath = path.relative(rootDir, fullPath);
            const ext = path.extname(file).substring(1).toLowerCase() || "text";

            let content = fs.readFileSync(fullPath, 'utf-8');

            if (stripComments) {
                const cStyle = ['ts', 'tsx', 'js', 'jsx', 'json', 'css', 'scss', 'go', 'rs', 'java', 'c', 'cpp', 'cs', 'php'];
                const hashStyle = ['py', 'sh', 'bash', 'yaml', 'yml', 'toml', 'ini', 'dockerfile', 'rb', 'pl'];
                const markupStyle = ['html', 'xhtml', 'xml', 'md', 'vue', 'svelte'];

                if (cStyle.includes(ext)) {
                    if (['tsx', 'jsx'].includes(ext)) {
                        content = content.replace(new RegExp('\\{\\/\\*[\\s\\S]*?\\*\\/\\}', 'g'), "");
                    }
                    content = content.replace(new RegExp('\\/\\*[\\s\\S]*?\\*\\/', 'g'), "");
                    content = content.replace(/(^|[^:])\/\/.*$/gm, "");
                } 
                else if (hashStyle.includes(ext)) {
                    if (ext === 'py') {
                        content = content.replace(new RegExp('"""[\\s\\S]*?"""', 'g'), "");
                        content = content.replace(new RegExp("'''[\\s\\S]*?'''", 'g'), "");
                    }
                       content = content.replace(/(^|[^#])#.*$/gm, (match, p1) => p1 === ' ' || p1 === '' ? '' : p1);
                    content = content.replace(/^\s*#.*$/gm, "");
                } 
                else if (markupStyle.includes(ext)) {
                    
                    content = content.replace(new RegExp('', 'g'), "");
                }
            }

            // Squeeze out empty vertical lines to save token density
            const compressedContent = content.replace(/^\s*[\r\n]/gm, "");

            console.log('Compressing content...')
            writeToBuffer(`\n### File: ${relativePath}`);
            writeToBuffer(`\`\`\`${ext}`);
            writeToBuffer(compressedContent.trim());
            writeToBuffer(`\`\`\`\n---`);
        }
    }
}

/**
 * Universal Clipboard Router
 * Injects text data natively into OS system layers without external npm packages.
 */
function copyToClipboard(text: string): void {
    const platform = process.platform;

    try {
        if (platform === 'darwin') {
            // macOS 
            execSync('pbcopy', { input: text });
        } else if (platform === 'win32') {
            // windows 
            execSync('clip', { input: text });
        } else if (platform === 'linux') {
            // linux requires xsel dependency
            try {
                execSync('xsel -bi', { input: text });
            } catch {
                // If xsel isn't installed, use xclip with background-forking routing redirect
                execSync('xclip -selection clipboard -loops 1', { input: text, stdio: 'ignore' });
            }
        } else {
            throw new Error(`Unsupported platform execution target: ${platform}`);
        }
        console.log(`\nPacky: I copied the data to your clipboard.`);
    } catch (err) {
        if (platform === 'linux') {
            console.log(`\nPacky: Clipboard fail. Run 'sudo apt install xsel' to fix.`);
        } else {
            console.log(`\nPacky: Could not copy to system clipboard natively.`);
        }
    }
}

const options = program.opts();

// Main runner
writeToBuffer("# Project Context and Source Code");
writeToBuffer("## Project Directory Tree\n```text");
writeToBuffer(path.basename(targetDir) + "/");

buildTree(targetDir, targetDir, "");
writeToBuffer("```\n");
writeToBuffer("## Source File Contents\n");
appendFileContents(targetDir, targetDir, options.stripComments);

const outputPath = path.join(targetDir, 'llm_context.md');
fs.writeFileSync(outputPath, outputBuffer, 'utf-8');

console.log(`Success! Context file generated at: ${outputPath}`);

// Token Calcuation
// Math rule: Calculate total string length and evaluate baseline 4-char boundaries
const charCount = outputBuffer.length;
const estimatedTokens = Math.ceil(charCount / 4);

console.log(`\nSize Report:`);
console.log(`   └─ Character Count: ${charCount.toLocaleString()}`);
console.log(`   └─ Estimated Weight: ~${estimatedTokens.toLocaleString()} tokens`);
console.log(`   Note: This is an approximation based on character density. Actual AI model values will vary.\n`);

if (options.copy) {
    copyToClipboard(outputBuffer)
}

if (options.stripComments) {
    console.log(`Packy: I didn't include your comments in packing.`);
}