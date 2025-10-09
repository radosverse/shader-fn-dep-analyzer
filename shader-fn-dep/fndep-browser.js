// ============================================================================
// Function Dependency Analyzer - Browser Version
// Core Logic - Matching Node.js fndep-server.js structure
// ============================================================================

// GLSL and code keywords to ignore - matching Node.js version
const GLSL_KEYWORDS = new Set([
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break',
    'continue', 'return', 'discard', 'struct', 'uniform', 'varying', 'attribute',
    'const', 'in', 'out', 'inout', 'float', 'int', 'void', 'bool', 'vec2', 'vec3',
    'vec4', 'mat2', 'mat3', 'mat4', 'sampler2D', 'samplerCube', 'gl_Position',
    'gl_FragColor', 'texture2D', 'texture', 'normalize', 'length', 'dot', 'cross',
    'pow', 'exp', 'log', 'exp2', 'log2', 'sqrt', 'inversesqrt', 'abs', 'sign',
    'floor', 'ceil', 'fract', 'mod', 'min', 'max', 'clamp', 'mix', 'step',
    'smoothstep', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'radians', 'degrees',
    'console', 'window', 'document', 'function', 'var', 'let', 'const', 'class',
    'new', 'this', 'super', 'typeof', 'instanceof', 'delete', 'async', 'await',
    'try', 'catch', 'finally', 'throw', 'import', 'export', 'require', 'module'
]);

const CODE_EXTENSIONS = new Set([
    '.js', '.ts', '.jsx', '.tsx', '.c', '.cpp', '.cc', '.h', '.hpp',
    '.glsl', '.vert', '.frag', '.comp', '.geom', '.tesc', '.tese',
    '.rchit', '.rgen', '.rmiss', '.slang', '.py', '.java', '.cs', '.go', '.rust', '.rs'
]);

// FunctionCache class - matching Node.js structure
class FunctionCache {
    constructor() {
        this.functions = {}; // {funcName: {filePath, body}}
        this.filesProcessed = 0;
        this.functionsFound = 0;
    }

    addFunction(name, filePath, body) {
        if (!this.functions[name]) {
            this.functions[name] = { filePath, body };
            this.functionsFound++;
        }
    }

    getFunction(name) {
        return this.functions[name];
    }

    hasFunction(name) {
        return name in this.functions;
    }
}

// Remove comments from code - matching Node.js version
function removeComments(content) {
    // Remove multi-line comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove single-line comments
    const lines = content.split('\n');
    const cleanLines = lines.map(line => {
        const commentPos = line.indexOf('//');
        return commentPos >= 0 ? line.substring(0, commentPos) : line;
    });

    return cleanLines.join('\n');
}

// Extract function body using bracket counting - matching Node.js version
function extractBracketedBlock(content, start) {
    const openPos = content.indexOf('{', start);
    if (openPos === -1) return '';

    let count = 0;
    for (let i = openPos; i < content.length; i++) {
        if (content[i] === '{') count++;
        else if (content[i] === '}') {
            count--;
            if (count === 0) {
                return content.substring(start, i + 1);
            }
        }
    }
    return content.substring(start);
}

// Extract Python function using indentation - matching Node.js version
function extractIndentedBlock(content, start) {
    const lines = content.substring(start).split('\n');
    const result = [lines[0]];

    if (lines.length < 2) return lines[0];

    // Find base indent
    let baseIndent = null;
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim()) {
            baseIndent = line.length - line.trimStart().length;
            break;
        }
    }

    if (baseIndent === null) return result[0];

    // Collect indented lines
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() && line.length - line.trimStart().length < baseIndent) {
            break;
        }
        result.push(line);
    }

    return result.join('\n');
}

// Helper to escape regex special characters - matching Node.js version
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Find function body by name - matching Node.js version
function findFunctionBody(content, functionName) {
    const patterns = [
        { regex: new RegExp(`\\b${escapeRegex(functionName)}\\s*\\([^)]*\\)\\s*\\{`, 'i'), type: 'bracket' },
        { regex: new RegExp(`def\\s+${escapeRegex(functionName)}\\s*\\([^)]*\\)\\s*:`, 'i'), type: 'python' },
        { regex: new RegExp(`function\\s+${escapeRegex(functionName)}\\s*\\([^)]*\\)\\s*\\{`, 'i'), type: 'bracket' },
        { regex: new RegExp(`${escapeRegex(functionName)}\\s*=\\s*function\\s*\\([^)]*\\)\\s*\\{`, 'i'), type: 'bracket' },
        { regex: new RegExp(`${escapeRegex(functionName)}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*\\{`, 'i'), type: 'bracket' }
    ];

    for (const { regex, type } of patterns) {
        const match = regex.exec(content);
        if (match) {
            const start = match.index;
            return type === 'python'
                ? extractIndentedBlock(content, start)
                : extractBracketedBlock(content, start);
        }
    }
    return null;
}

// Extract all functions from content - matching Node.js version
function extractAllFunctionsFromContent(content) {
    const functions = [];

    const patterns = [
        // C/C++/GLSL: return_type function_name(params) {
        /\b(\w+)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*\{/g,
        // JavaScript: function function_name(params) {
        /function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*\{/g,
        // JavaScript: name = function(params) {
        /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*function\s*\([^)]*\)\s*\{/g,
        // Python: def function_name(params):
        /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*:/g,
        // Arrow functions: name = (params) => {
        /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*\([^)]*\)\s*=>\s*\{/g
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            let funcName;
            // match.length includes full match at index 0
            // So: 1 capturing group = length 2, 2 capturing groups = length 3
            if (match.length === 2) {
                // Pattern with 1 capturing group (function, def, arrow functions)
                funcName = match[1];
            } else if (match.length >= 3) {
                // Pattern with 2 capturing groups (C/C++/GLSL: return_type function_name)
                // If first group is a type keyword, use second group as function name
                const returnType = match[1];
                const isPrimitiveType = ['void', 'int', 'float', 'double', 'bool', 'uint',
                                        'vec2', 'vec3', 'vec4', 'ivec2', 'ivec3', 'ivec4',
                                        'uvec2', 'uvec3', 'uvec4', 'mat2', 'mat3', 'mat4',
                                        'sampler2D', 'samplerCube'].includes(returnType);
                funcName = isPrimitiveType ? match[2] : match[1];
            }

            if (!funcName) continue;

            // Skip keywords and very short names
            if (GLSL_KEYWORDS.has(funcName.toLowerCase()) || funcName.length < 2) {
                continue;
            }

            // Extract function body
            const funcBody = findFunctionBody(content, funcName);
            if (funcBody && funcBody.trim().length > 10) {
                functions.push({ name: funcName, body: funcBody });
            }
        }
    }

    return functions;
}

// Extract function calls from function body - matching Node.js version
function extractFunctionCalls(functionBody) {
    const cleanBody = removeComments(functionBody);

    // Extract only the body content (after first opening brace)
    const firstBrace = cleanBody.indexOf('{');
    const bodyOnly = firstBrace !== -1 ? cleanBody.substring(firstBrace) : cleanBody;

    // Match function calls (name immediately followed by parenthesis)
    const pattern = /\b([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*(?:::[a-zA-Z_][a-zA-Z0-9_]*)*)\s*\(/g;
    const matches = [];
    let match;

    while ((match = pattern.exec(bodyOnly)) !== null) {
        matches.push(match[1]);
    }

    const seen = new Set();
    const result = [];

    for (const match of matches) {
        // Extract base name and full name
        const names = [match];
        if (match.includes('.')) {
            names.push(match.split('.').pop());
        } else if (match.includes('::')) {
            names.push(match.split('::').pop());
        }

        for (const name of names) {
            if (!seen.has(name) && !GLSL_KEYWORDS.has(name.toLowerCase()) && name.length > 1) {
                seen.add(name);
                result.push(name);
            }
        }
    }

    return result;
}

// Check if file should be processed - matching Node.js version
function shouldProcessFile(fileName) {
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    if (ext === '.json') return false;
    return CODE_EXTENSIONS.has(ext) || ext === '';
}

// Build dependency tree from cache - matching Node.js version
function buildDependencyTreeFromCache(cache, rootFunction, maxDepth = 10) {
    const tree = {};
    let toProcess = [rootFunction];
    const processed = new Set();
    let depth = 0;

    console.log(`Building dependency tree for: ${rootFunction}`);

    while (toProcess.length > 0 && depth < maxDepth) {
        const currentBatch = [...toProcess];
        toProcess = [];
        depth++;

        console.log(`  Level ${depth}: Processing ${currentBatch.length} functions...`);

        for (const funcName of currentBatch) {
            if (processed.has(funcName)) continue;
            processed.add(funcName);

            const cached = cache.getFunction(funcName);
            if (cached) {
                const calls = extractFunctionCalls(cached.body);
                tree[funcName] = {
                    filePath: cached.filePath,
                    body: cached.body,
                    calls: new Set(calls)
                };

                console.log(`    ✓ ${funcName} -> ${calls.length} calls: [${calls.join(', ')}]`);

                // Add new functions to process
                let addedCount = 0;
                for (const call of calls) {
                    if (!processed.has(call) && !toProcess.includes(call)) {
                        if (cache.hasFunction(call)) {
                            toProcess.push(call);
                            addedCount++;
                        } else {
                            console.log(`      - ${call} not in cache`);
                        }
                    }
                }
                if (addedCount > 0) {
                    console.log(`      Added ${addedCount} new functions to process`);
                }
            } else {
                tree[funcName] = {
                    filePath: null,
                    body: null,
                    calls: new Set()
                };
                console.log(`    ✗ ${funcName} not found in cache`);
            }
        }
    }

    console.log(`Tree built with ${Object.keys(tree).length} total functions`);
    return tree;
}

// Topological sort for dependency ordering - matching Node.js version
function topologicalSort(dependencies) {
    const result = [];
    const visited = new Set();
    const tempMark = new Set();

    function visit(n) {
        if (tempMark.has(n)) return; // Cycle detected
        if (visited.has(n)) return;

        tempMark.add(n);
        const deps = dependencies[n] || new Set();
        for (const m of deps) {
            if (m in dependencies) { // Only visit if it's in our dependency graph
                visit(m);
            }
        }
        tempMark.delete(n);
        visited.add(n);
        result.push(n);
    }

    for (const node in dependencies) {
        if (!visited.has(node)) {
            visit(node);
        }
    }

    return result;
}

// ============================================================================
// Browser-specific File API handling
// ============================================================================

let selectedFiles = null;
let fileColorMap = new Map();

// Generate light, easy-on-eyes colors for files - matching Node.js version
function generateFileColor(filePath) {
    if (fileColorMap.has(filePath)) {
        return fileColorMap.get(filePath);
    }

    // Hash the file path to get a consistent color
    let hash = 0;
    for (let i = 0; i < filePath.length; i++) {
        hash = ((hash << 5) - hash) + filePath.charCodeAt(i);
        hash = hash & hash;
    }

    // Generate 40 perceptually distinct colors using HSL
    // Distribute across hue spectrum with varying lightness/saturation for maximum distinction
    const colors = [];
    const hueSteps = 20; // 20 base hues
    const lightnessLevels = [68, 75]; // 2 lightness levels

    for (let l of lightnessLevels) {
        for (let i = 0; i < hueSteps; i++) {
            const hue = (i * 360 / hueSteps) % 360;
            // Vary saturation slightly to add more distinction
            const saturation = 55 + (i % 3) * 8; // 55%, 63%, 71%
            colors.push(`hsl(${hue}, ${saturation}%, ${l}%)`);
        }
    }

    const color = colors[Math.abs(hash) % colors.length];
    fileColorMap.set(filePath, color);
    return color;
}

// Scan directory and build cache using File API
async function scanDirectoryWithFileAPI(files, maxFiles = 5000) {
    const cache = new FunctionCache();
    let filesSearched = 0;

    console.log(`Scanning ${files.length} files for functions...`);
    updateProgress(`Scanning ${files.length} files...`);

    for (const file of files) {
        if (filesSearched >= maxFiles) break;

        filesSearched++;

        // Progress update
        if (filesSearched % 100 === 0) {
            updateProgress(`Processed ${filesSearched}/${files.length} files, found ${cache.functionsFound} functions...`);
        }

        if (!shouldProcessFile(file.name)) continue;

        try {
            const content = await file.text();
            const functions = extractAllFunctionsFromContent(content);

            if (functions.length > 0) {
                const relPath = file.webkitRelativePath;
                console.log(`    ${relPath}: found ${functions.length} functions: [${functions.map(f => f.name).join(', ')}]`);
            }

            for (const { name, body } of functions) {
                cache.addFunction(name, file.webkitRelativePath, body);
            }

            cache.filesProcessed++;
        } catch (err) {
            console.error(`Error reading ${file.name}: ${err.message}`);
        }
    }

    console.log(`\nScan complete: ${cache.filesProcessed} files processed, ${cache.functionsFound} unique functions found`);
    console.log(`Sample functions in cache: [${Object.keys(cache.functions).slice(0, 10).join(', ')}]`);

    return cache;
}

// Update progress info
function updateProgress(message) {
    document.getElementById('progressInfo').textContent = message;
}

// Main analyze function
async function analyzeFunction() {
    const functionName = document.getElementById('functionName').value.trim();

    if (!selectedFiles || selectedFiles.length === 0) {
        showError('Please select a folder first using the "Select Folder" button');
        return;
    }

    if (!functionName) {
        showError('Please enter a function name');
        return;
    }

    // Save function name for next time
    localStorage.setItem('fndep_functionName', functionName);

    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';
    document.getElementById('results').classList.remove('active');
    document.getElementById('analyzeBtn').disabled = true;

    try {
        // Scan directory and build cache
        const cache = await scanDirectoryWithFileAPI(selectedFiles);
        console.log(`Found ${cache.functionsFound} functions in ${cache.filesProcessed} files`);

        // Build dependency tree
        const tree = buildDependencyTreeFromCache(cache, functionName);

        if (!tree[functionName] || !tree[functionName].filePath) {
            showError(`Function '${functionName}' not found`);
            showStats({
                filesProcessed: cache.filesProcessed,
                functionsFound: cache.functionsFound
            });
            return;
        }

        // Build dependency graph for sorting
        const dependencies = {};
        for (const [func, data] of Object.entries(tree)) {
            if (data.filePath) {
                const validCalls = new Set();
                for (const call of data.calls) {
                    if (tree[call] && tree[call].filePath) {
                        validCalls.add(call);
                    }
                }
                dependencies[func] = validCalls;
            }
        }

        // Sort functions by dependencies
        const sortedFuncs = topologicalSort(dependencies);

        // Get root folder name
        const rootFolder = document.getElementById('folderPath').value;

        // Format results - matching Node.js structure
        const results = {
            rootFunction: functionName,
            folderPath: rootFolder,
            stats: {
                filesProcessed: cache.filesProcessed,
                functionsFound: cache.functionsFound,
                dependenciesFound: Object.keys(tree).length
            },
            tree: {},
            sortedFunctions: [],
            flattenedCode: []
        };

        // Group by file
        const fileGroups = {};
        const notFound = [];

        for (const func of sortedFuncs) {
            if (tree[func]) {
                const { filePath, body, calls } = tree[func];
                if (filePath) {
                    // Extract relative path from webkitRelativePath
                    const relPath = filePath.substring(filePath.indexOf('/') + 1);

                    if (!fileGroups[relPath]) {
                        fileGroups[relPath] = [];
                    }
                    fileGroups[relPath].push({
                        name: func,
                        isRoot: func === functionName,
                        calls: Array.from(dependencies[func] || [])
                    });

                    // Add to sorted functions list
                    results.sortedFunctions.push({
                        name: func,
                        file: relPath,
                        calls: Array.from(calls),
                        isRoot: func === functionName
                    });

                    // Add to flattened code
                    results.flattenedCode.push({
                        name: func,
                        file: relPath,
                        body: body,
                        calls: Array.from(calls),
                        isRoot: func === functionName
                    });
                } else {
                    notFound.push(func);
                }
            }
        }

        results.tree = { fileGroups, notFound };

        displayResults(results);
    } catch (err) {
        showError(`Error: ${err.message}`);
        console.error(err);
    } finally {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('analyzeBtn').disabled = false;
    }
}

// Display functions - matching Node.js version
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function showStats(stats) {
    const statsDiv = document.getElementById('stats');
    statsDiv.innerHTML = `
        <span class="stat-item">Files processed: ${stats.filesProcessed}</span>
        <span class="stat-item">Functions found: ${stats.functionsFound}</span>
        ${stats.dependenciesFound ? `<span class="stat-item">Dependencies: ${stats.dependenciesFound}</span>` : ''}
    `;
}

function displayResults(data) {
    // Show stats
    showStats(data.stats);

    // Show results section
    document.getElementById('results').classList.add('active');

    // Display tree
    displayTree(data);

    // Display code
    displayCode(data);
}

function displayTree(data) {
    const treeOutput = document.getElementById('tree-output');
    fileColorMap.clear(); // Reset color map for new analysis
    let html = '';

    html += `╔═ Dependency Tree ═══════════════════════════════════════════════════════╗\n`;
    html += `Root function: ${data.rootFunction}\n`;
    html += `\n`;

    // Group by file
    for (const [filePath, functions] of Object.entries(data.tree.fileGroups)) {
        const fileColor = generateFileColor(filePath);
        html += `📄 <span style="color: ${fileColor}; font-weight: bold;">${filePath}</span>\n`;

        for (const func of functions) {
            if (func.isRoot) {
                html += `  ★ <span style="color: ${fileColor}; font-weight: bold;">${func.name}()</span> [ROOT]\n`;
            } else {
                html += `  ├─ <span style="color: ${fileColor};">${func.name}()</span>\n`;
            }

            if (func.calls && func.calls.length > 0) {
                func.calls.forEach((call, i) => {
                    const isLast = i === func.calls.length - 1;
                    const prefix = isLast ? '└──' : '├──';

                    // Find which file this called function belongs to
                    let callColor = '#808080'; // default gray for not found
                    for (const [fp, funcs] of Object.entries(data.tree.fileGroups)) {
                        if (funcs.some(f => f.name === call)) {
                            callColor = generateFileColor(fp);
                            break;
                        }
                    }

                    html += `    ${prefix} calls: <span style="color: ${callColor};">${call}()</span>\n`;
                });
            }
        }
        html += '\n';
    }

    // Show not found functions
    if (data.tree.notFound && data.tree.notFound.length > 0) {
        html += `✗ Not found:\n`;
        for (const func of data.tree.notFound) {
            html += `  ├─ <span style="color: #808080;">${func}()</span>\n`;
        }
        html += '\n';
    }

    html += `╚═══════════════════════════════════════════════════════════════════════════╝\n`;

    const foundCount = data.sortedFunctions.length;
    const notFoundCount = data.tree.notFound ? data.tree.notFound.length : 0;
    html += `Total: ${foundCount} functions found, ${notFoundCount} not found`;

    treeOutput.innerHTML = html;
}

function displayCode(data) {
    const codeOutput = document.getElementById('code-output');
    let text = '';

    text += `// Function definitions with dependencies\n`;
    text += `// Search path: ${data.folderPath}\n`;
    text += `// Ordered bottom-up by dependencies (leaf functions first)\n`;
    text += `// Total unique functions: ${data.flattenedCode.length}\n\n`;

    // Display functions in dependency order
    for (const func of data.flattenedCode) {
        text += `// ${'='.repeat(76)}\n`;
        text += `// Function: ${func.name}\n`;
        text += `// Source: ${func.file}\n`;
        if (func.calls && func.calls.length > 0) {
            text += `// Calls: ${func.calls.join(', ')}\n`;
        }
        if (func.isRoot) {
            text += `// [ROOT FUNCTION]\n`;
        }
        text += `// ${'='.repeat(76)}\n\n`;
        text += func.body;
        text += '\n\n';
    }

    // Add not found section
    const notFound = data.tree.notFound;
    if (notFound && notFound.length > 0) {
        text += `\n// ${'='.repeat(76)}\n`;
        text += `// NOT FOUND FUNCTIONS\n`;
        text += `// ${'='.repeat(76)}\n`;
        for (const func of notFound) {
            text += `// - ${func}\n`;
        }
    }

    // Set as plain text (textContent automatically escapes any HTML)
    codeOutput.textContent = text;
}

function switchTab(tab, event) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`${tab}-tab`).classList.add('active');
}

// ============================================================================
// Event handlers and initialization
// ============================================================================

// Handle folder selection
document.getElementById('folderPicker').addEventListener('click', async () => {
    try {
        // Using File API to select directory
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.multiple = true;

        input.onchange = (e) => {
            selectedFiles = Array.from(e.target.files);
            if (selectedFiles.length > 0) {
                // Get the root folder name from the first file's path
                const firstPath = selectedFiles[0].webkitRelativePath;
                const rootFolder = firstPath.split('/')[0];
                document.getElementById('folderPath').value = rootFolder;

                // Save to localStorage
                localStorage.setItem('fndep_lastFolder', rootFolder);
            }
        };

        input.click();
    } catch (err) {
        showError(`Error selecting folder: ${err.message}`);
    }
});

// Load saved values on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedFunction = localStorage.getItem('fndep_functionName');
    if (savedFunction) {
        document.getElementById('functionName').value = savedFunction;
    }
});

// Allow Enter key to trigger analysis
document.getElementById('functionName').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        analyzeFunction();
    }
});