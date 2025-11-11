let analysisData = null;
let extensionUsageMap = new Map();
let selectedFiles = null;

function onFolderSelected(event) {
    selectedFiles = event.target.files;
    const shaderFiles = Array.from(selectedFiles).filter(f => shouldProcessFile(f.name));

    if (shaderFiles.length > 0) {
        document.getElementById('scanBtn').style.display = 'block';
        document.getElementById('fileName').textContent = `Found ${shaderFiles.length} shader files`;
    } else {
        document.getElementById('scanBtn').style.display = 'none';
        document.getElementById('fileName').textContent = 'No shader files found';
    }
}

async function startScan() {
    if (!selectedFiles) return;

    document.getElementById('scanBtn').disabled = true;
    document.getElementById('mainContainer').classList.add('hidden');

    const progressDiv = document.getElementById('progress');

    try {
        progressDiv.textContent = '⏳ Scanning files...';

        analysisData = await scanDirectoryWithFileAPI(
            selectedFiles,
            10000,
            (processed, total) => {
                progressDiv.textContent = `⏳ Processed ${processed} shader files...`;
            }
        );

        processData();
        renderExtensionsList();
        document.getElementById('mainContainer').classList.remove('hidden');
        progressDiv.textContent = `✓ Scan complete! Found ${extensionUsageMap.size} extensions in ${analysisData.files_using_extensions} files`;

    } catch (err) {
        progressDiv.textContent = `❌ Error: ${err.message}`;
        console.error(err);
    } finally {
        document.getElementById('scanBtn').disabled = false;
    }
}

function processData() {
    extensionUsageMap.clear();

    const shaderFiles = analysisData.shader_files || analysisData.shader_files_analyzed || [];

    shaderFiles.forEach(file => {
        Object.entries(file.extensions_detected).forEach(([extName, extData]) => {
            if (!extensionUsageMap.has(extName)) {
                extensionUsageMap.set(extName, {
                    files: [],
                    definition: analysisData.extensions_database[extName]
                });
            }

            extensionUsageMap.get(extName).files.push({
                path: file.file_path,
                usage: extData
            });
        });
    });
}

function getVendorClass(extensionName) {
    if (extensionName.startsWith('GL_KHR_')) return 'vendor-khr';
    if (extensionName.startsWith('GL_EXT_')) return 'vendor-ext';
    if (extensionName.startsWith('GL_NV_')) return 'vendor-nv';
    if (extensionName.startsWith('GL_ARB_')) return 'vendor-arb';
    if (extensionName.startsWith('GL_AMD_')) return 'vendor-amd';
    return '';
}

function renderExtensionsList() {
    const listEl = document.getElementById('extensionsList');
    const extensions = Array.from(extensionUsageMap.entries())
        .sort((a, b) => b[1].files.length - a[1].files.length);

    listEl.innerHTML = extensions.map(([name, data]) => `
        <div class="extension-item" onclick="showExtensionDetails('${name}')">
            <div class="extension-name ${getVendorClass(name)}">${name}</div>
            <div class="usage-count">${data.files.length} file${data.files.length !== 1 ? 's' : ''}</div>
        </div>
    `).join('');
}

function showExtensionDetails(extensionName) {
    document.querySelectorAll('.extension-item').forEach(el => {
        el.classList.remove('active');
    });
    event.target.closest('.extension-item').classList.add('active');

    const data = extensionUsageMap.get(extensionName);
    const detailsEl = document.getElementById('detailsPanel');

    const filesHtml = data.files.map(file => {
        const sections = [];

        if (file.usage.functions && file.usage.functions.length > 0) {
            sections.push(`
                <div class="feature-section">
                    <span class="feature-label">Functions:</span>
                    <div class="feature-items">
                        ${file.usage.functions.map(fn =>
                            `<span class="feature-item">${fn}</span>`
                        ).join('')}
                    </div>
                </div>
            `);
        }

        if (file.usage.types && file.usage.types.length > 0) {
            sections.push(`
                <div class="feature-section">
                    <span class="feature-label">Types:</span>
                    <div class="feature-items">
                        ${file.usage.types.map(type =>
                            `<span class="feature-item">${type}</span>`
                        ).join('')}
                    </div>
                </div>
            `);
        }

        if (file.usage.built_in_variables && file.usage.built_in_variables.length > 0) {
            sections.push(`
                <div class="feature-section">
                    <span class="feature-label">Built-ins:</span>
                    <div class="feature-items">
                        ${file.usage.built_in_variables.map(builtin =>
                            `<span class="feature-item">${builtin}</span>`
                        ).join('')}
                    </div>
                </div>
            `);
        }

        if (file.usage.qualifiers && file.usage.qualifiers.length > 0) {
            sections.push(`
                <div class="feature-section">
                    <span class="feature-label">Qualifiers:</span>
                    <div class="feature-items">
                        ${file.usage.qualifiers.map(qual =>
                            `<span class="feature-item">${qual}</span>`
                        ).join('')}
                    </div>
                </div>
            `);
        }

        if (file.usage.constants && file.usage.constants.length > 0) {
            sections.push(`
                <div class="feature-section">
                    <span class="feature-label">Constants:</span>
                    <div class="feature-items">
                        ${file.usage.constants.map(constant =>
                            `<span class="feature-item">${constant}</span>`
                        ).join('')}
                    </div>
                </div>
            `);
        }

        if (file.usage.keywords && file.usage.keywords.length > 0) {
            sections.push(`
                <div class="feature-section">
                    <span class="feature-label">Keywords:</span>
                    <div class="feature-items">
                        ${file.usage.keywords.map(keyword =>
                            `<span class="feature-item">${keyword}</span>`
                        ).join('')}
                    </div>
                </div>
            `);
        }

        return `
            <div class="file-item">
                <div class="file-path">${file.path}</div>
                ${sections.join('')}
            </div>
        `;
    }).join('');

    detailsEl.innerHTML = `
        <h2>${extensionName}</h2>
        <div class="files-section">
            <h3>Files using this extension (${data.files.length})</h3>
            ${filesHtml}
        </div>
    `;
}
