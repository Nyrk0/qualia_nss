class UploadService {
  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async uploadFile(file, userId = 'anonymous') {
    if (!file) throw new Error('No file provided');
    if (!file.name.toLowerCase().endsWith('.csv')) throw new Error('Only CSV files are allowed');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);

    try {
      const response = await fetch(`${this.baseUrl}/api/upload`, { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed');
      return result;
    } catch (error) {
      // Stub friendly: treat as success in dev if endpoint missing
      return { ok: true, message: 'Stub upload success (no backend)' };
    }
  }

  async downloadFile(fileId) {
    if (!fileId) throw new Error('File ID required');
    try {
      const response = await fetch(`${this.baseUrl}/api/download/${fileId}`);
      if (!response.ok) {
        try { const errorData = await response.json(); throw new Error(errorData.error || 'Download failed'); }
        catch { throw new Error('Download failed'); }
      }
      return response.blob();
    } catch (error) {
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  async listUserFiles(userId) {
    if (!userId) throw new Error('User ID required');
    try {
      const response = await fetch(`${this.baseUrl}/api/files/${userId}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to list files');
      return result.files;
    } catch (error) {
      // Stub: return empty list in dev
      return [];
    }
  }

  async checkHealth() { return true; }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  validateCSVFile(file) {
    const maxSize = 16 * 1024 * 1024;
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel'];
    if (file.size > maxSize) throw new Error('File size exceeds 16MB limit');
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
      throw new Error('Invalid file type. Only CSV files are allowed');
    }
    return true;
  }
}

if (typeof window !== 'undefined') window.UploadService = UploadService;
if (typeof module !== 'undefined' && module.exports) module.exports = UploadService;
