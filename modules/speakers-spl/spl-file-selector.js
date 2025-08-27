class SPLFileSelector extends HTMLElement {
  static get observedAttributes() {
    return ['position', 'mode', 'user-id'];
  }

  constructor() {
    super();
    this.uploadService = null;
    this.selectedFiles = new Map();
    this.uploadedFiles = [];
    this.userId = 'spa_user';
    this.position = 'sidebar'; // 'sidebar' or 'content'
    this.mode = 'local'; // 'local', 'server', or 'both'

    this.render();
    this.setupEventListeners();
    this.initializeUploadService();
  }

  connectedCallback() {
    this.loadUserFiles();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      switch (name) {
        case 'position':
          this.position = newValue || 'sidebar';
          this.render();
          break;
        case 'mode':
          this.mode = newValue || 'local';
          this.render();
          break;
        case 'user-id':
          this.userId = newValue || 'spa_user';
          this.loadUserFiles();
          break;
      }
    }
  }

  async initializeUploadService() {
    if (typeof UploadService !== 'undefined') {
      this.uploadService = new UploadService();
      const isHealthy = await this.uploadService.checkHealth();
      if (!isHealthy) {
        console.warn('Upload service not available - using local mode only');
        this.mode = 'local';
        this.render();
      }
    } else {
      console.warn('UploadService not available - using local mode only');
      this.mode = 'local';
      this.render();
    }
  }

  render() {
    const isCompact = this.position === 'sidebar';

    this.innerHTML = `
            <div class="card mt-2">
                <div class="card-header py-2">
                    <h6 class="mb-0">SPL Data Files</h6>
                </div>
                
                <div class="card-body py-2">
                    <div class="file-input-wrapper" style="position: relative; margin-bottom: 8px;">
                        <input 
                            type="file" 
                            id="file-input" 
                            style="position: absolute; opacity: 0; width: 0; height: 0;" 
                            accept=".csv" 
                            multiple
                        >
                        <label for="file-input" class="btn btn-sm py-1 w-100" style="background: var(--success); border-color: var(--success); color: white; cursor: pointer;">
                            Select CSV Files
                        </label>
                    </div>

                    <div class="file-actions d-grid gap-1" style="display: ${this.mode === 'local' ? 'none' : 'flex'}">
                        <button class="btn btn-sm py-1" id="upload-btn" disabled style="background: var(--freq-tweeter); border-color: var(--freq-tweeter); color: white;">
                            Upload
                        </button>
                        <button class="btn btn-sm py-1" id="clear-btn" style="background: var(--aluminum-light); border-color: var(--aluminum-light); color: white;">
                            Clear
                        </button>
                    </div>

                    <div id="status-area"></div>

                    <div class="file-list" id="file-list" style="max-height: ${isCompact ? '150px' : '200px'}; overflow-y: auto; border: 1px solid; border-radius: 2px; font-family: var(--font-mono); font-size: var(--font-size-xs, 0.7rem); margin-top: 8px;">
                        <div class="spacing-test" style="text-align: center; padding: 8px; color: var(--aluminum-light, #6c757d); font-size: var(--font-size-sm, 0.8rem);">
                            No SPL data files selected
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  setupEventListeners() {
    this.addEventListener('change', e => {
      if (e.target.id === 'file-input') {
        this.handleFileSelection(e.target.files);
      }
    });

    this.addEventListener('click', e => {
      if (e.target.id === 'upload-btn') {
        this.handleUpload();
      } else if (e.target.id === 'clear-btn') {
        this.clearSelection();
      } else if (
        e.target.classList.contains('file-checkbox') ||
        e.target.closest('.file-item')
      ) {
        this.toggleFileSelection(e.target.closest('.file-item'));
      }
    });
  }

  async handleFileSelection(files) {
    if (files.length === 0) return;

    this.showStatus(`${files.length} file(s) selected`, 'info');

    for (const file of files) {
      if (this.validateCSVFile(file)) {
        const fileData = await this.parseCSVFile(file);
        this.selectedFiles.set(file.name, {
          file: file,
          data: fileData,
          source: 'local',
          selected: false,
          uploaded: false,
        });
      }
    }

    this.updateFileList();
    this.updateUploadButton();
  }

  validateCSVFile(file) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.showStatus(`${file.name} is not a CSV file`, 'error');
      return false;
    }

    if (file.size > 16 * 1024 * 1024) {
      this.showStatus(`${file.name} is too large (max 16MB)`, 'error');
      return false;
    }

    return true;
  }

  async parseCSVFile(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target.result;
        const lines = content.trim().split('\n');
        const data = [];

        for (let i = 0; i < Math.min(lines.length, 3); i++) {
          const line = lines[i].trim();
          if (line) {
            data.push(line);
          }
        }

        resolve({
          preview: data.join('\n'),
          lineCount: lines.length,
          size: file.size,
        });
      };
      reader.readAsText(file);
    });
  }

  async handleUpload() {
    if (!this.uploadService || this.selectedFiles.size === 0) return;

    const filesToUpload = Array.from(this.selectedFiles.values()).filter(
      item => !item.uploaded
    );

    if (filesToUpload.length === 0) {
      this.showStatus('No new files to upload', 'info');
      return;
    }

    this.showStatus(`Uploading ${filesToUpload.length} file(s)...`, 'info');

    try {
      for (const fileItem of filesToUpload) {
        const result = await this.uploadService.uploadFile(
          fileItem.file,
          this.userId
        );
        fileItem.uploaded = true;
        fileItem.fileId = result.file_id;

        this.uploadedFiles.push({
          ...result,
          source: 'server',
          selected: false,
        });
      }

      this.showStatus(
        `Successfully uploaded ${filesToUpload.length} file(s)`,
        'success'
      );
      this.updateFileList();
      this.loadUserFiles();
    } catch (error) {
      this.showStatus(`Upload failed: ${error.message}`, 'error');
    }
  }

  async loadUserFiles() {
    if (!this.uploadService) return;

    try {
      const serverFiles = await this.uploadService.listUserFiles(this.userId);
      this.uploadedFiles = serverFiles.map(file => ({
        ...file,
        source: 'server',
        selected: false,
      }));

      this.updateFileList();
    } catch (error) {
      console.warn('Could not load server files:', error.message);
    }
  }

  toggleFileSelection(fileElement) {
    const fileName = fileElement.dataset.fileName;
    const source = fileElement.dataset.source;
    const checkbox = fileElement.querySelector('.file-checkbox');

    // Toggle selection state
    if (source === 'local') {
      const fileItem = this.selectedFiles.get(fileName);
      if (fileItem) {
        fileItem.selected = !fileItem.selected;
        checkbox.checked = fileItem.selected;

        if (fileItem.selected) {
          fileElement.classList.add('selected');
        } else {
          fileElement.classList.remove('selected');
        }
      }
    } else {
      const fileItem = this.uploadedFiles.find(
        f => f.original_filename === fileName
      );
      if (fileItem) {
        fileItem.selected = !fileItem.selected;
        checkbox.checked = fileItem.selected;

        if (fileItem.selected) {
          fileElement.classList.add('selected');
        } else {
          fileElement.classList.remove('selected');
        }
      }
    }

    // Dispatch event with all selected files
    this.dispatchMultipleFilesSelectedEvent();
  }

  dispatchMultipleFilesSelectedEvent() {
    const selectedFiles = [];

    // Collect selected local files
    this.selectedFiles.forEach((fileItem, fileName) => {
      if (fileItem.selected) {
        selectedFiles.push({
          fileName: fileItem.file.name,
          source: 'local',
          data: fileItem.file,
          fileId: null,
          preview: fileItem.data.preview,
        });
      }
    });

    // Collect selected server files
    this.uploadedFiles.forEach(fileItem => {
      if (fileItem.selected) {
        selectedFiles.push({
          fileName: fileItem.original_filename,
          source: 'server',
          data: null,
          fileId: fileItem.file_id,
          preview: null,
        });
      }
    });

    const event = new CustomEvent('files-selected', {
      detail: {
        selectedFiles: selectedFiles,
        count: selectedFiles.length,
      },
      bubbles: true,
    });

    this.dispatchEvent(event);
  }

  updateFileList() {
    const fileList = this.querySelector('#file-list');
    const hasFiles =
      this.selectedFiles.size > 0 || this.uploadedFiles.length > 0;

    if (!hasFiles) {
      fileList.innerHTML =
        '<div class="spacing-test" style="text-align: center; padding: 8px; color: var(--aluminum-light, #6c757d); font-size: var(--font-size-sm, 0.8rem);">No SPL data files selected</div>';
      return;
    }

    let html = '';

    // Local files
    this.selectedFiles.forEach((fileItem, fileName) => {
      const sizeText = this.formatFileSize(fileItem.file.size);
      html += `
                <div class="file-item ${fileItem.selected ? 'selected' : ''} ${fileItem.uploaded ? 'uploaded' : ''}" 
                     data-file-name="${fileName}" data-source="local">
                    <input type="checkbox" class="file-checkbox" ${fileItem.selected ? 'checked' : ''}>
                    <div class="file-content">
                        <div class="file-name">${fileName}</div>
                        <div class="file-meta">
                            <span>${sizeText} • ${fileItem.data.lineCount} lines</span>
                            <span class="file-source source-local">LOCAL</span>
                        </div>
                        <div class="preview-data">${fileItem.data.preview}</div>
                    </div>
                </div>
            `;
    });

    // Server files
    this.uploadedFiles.forEach(fileItem => {
      const sizeText = this.formatFileSize(fileItem.file_size);
      const date = new Date(fileItem.upload_timestamp).toLocaleDateString();
      html += `
                <div class="file-item ${fileItem.selected ? 'selected' : ''}" 
                     data-file-name="${fileItem.original_filename}" data-source="server">
                    <input type="checkbox" class="file-checkbox" ${fileItem.selected ? 'checked' : ''}>
                    <div class="file-content">
                        <div class="file-name">${fileItem.original_filename}</div>
                        <div class="file-meta">
                            <span>${sizeText} • ${date}</span>
                            <span class="file-source source-server">SERVER</span>
                        </div>
                    </div>
                </div>
            `;
    });

    fileList.innerHTML = html;
  }

  updateUploadButton() {
    const uploadBtn = this.querySelector('#upload-btn');
    if (uploadBtn) {
      const hasUnuploadedFiles = Array.from(this.selectedFiles.values()).some(
        item => !item.uploaded
      );
      uploadBtn.disabled = !hasUnuploadedFiles;
    }
  }

  clearSelection() {
    this.selectedFiles.clear();
    this.querySelector('#file-input').value = '';
    this.updateFileList();
    this.updateUploadButton();
    this.showStatus('Selection cleared', 'info');
  }

  showStatus(message, type = 'info') {
    const statusArea = this.querySelector('#status-area');
    if (!statusArea) return;

    statusArea.innerHTML = `
            <div class="alert alert-${type === 'info' ? 'primary' : type} py-1" style="font-size: var(--font-size-xs); margin-bottom: 8px;">
                ${message}
            </div>
        `;

    setTimeout(() => {
      statusArea.innerHTML = '';
    }, 5000);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Public API methods
  getSelectedFiles() {
    const selectedFiles = [];

    // Collect selected local files
    this.selectedFiles.forEach((fileItem, fileName) => {
      if (fileItem.selected) {
        selectedFiles.push({
          source: 'local',
          fileName: fileItem.file.name,
          file: fileItem.file,
          data: fileItem.data,
        });
      }
    });

    // Collect selected server files
    this.uploadedFiles.forEach(fileItem => {
      if (fileItem.selected) {
        selectedFiles.push({
          source: 'server',
          fileName: fileItem.original_filename,
          fileId: fileItem.file_id,
          file: null,
          data: null,
        });
      }
    });

    return selectedFiles;
  }

  // Backward compatibility - returns first selected file
  getSelectedFile() {
    const selectedFiles = this.getSelectedFiles();
    return selectedFiles.length > 0 ? selectedFiles[0] : null;
  }

  async downloadServerFile(fileId) {
    if (!this.uploadService) return null;

    try {
      const blob = await this.uploadService.downloadFile(fileId);
      return blob;
    } catch (error) {
      this.showStatus(`Download failed: ${error.message}`, 'error');
      return null;
    }
  }
}

// Register the custom element
customElements.define('spl-file-selector', SPLFileSelector);
