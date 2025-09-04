// Import Export Manager - Handle data import/export with images

class ImportExportManager {
    constructor() {
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.exportBtn = document.getElementById('exportDataBtn');
        this.importBtn = document.getElementById('importDataBtn');
        
        // Create hidden file input for import
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = '.zip';
        this.fileInput.style.display = 'none';
        document.body.appendChild(this.fileInput);
    }

    bindEvents() {
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => this.exportData());
        }
        if (this.importBtn) {
            this.importBtn.addEventListener('click', () => this.importData());
        }
        
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    async exportData() {
        try {
            if (!window.JSZip) {
                alert('JSZip library không được tải. Vui lòng reload trang.');
                return;
            }

            // Show loading
            this.showProgress('Đang xuất dữ liệu...');

            const zip = new JSZip();
            
            // 1. Export main data (students, seats, settings)
            const mainData = {
                students: window.seatingManager?.students || [],
                seats: window.seatingManager?.seats || [],
                printSettings: window.seatingManager?.printSettings || null,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            zip.file('data.json', JSON.stringify(mainData, null, 2));
            
            // 2. Export images from IndexedDB
            const imageFolder = zip.folder('images');
            
            if (window.photoManager?.db) {
                const images = await this.getAllImages();
                
                for (const imageData of images) {
                    if (imageData.photo) {
                        // Convert blob to base64 and save
                        const base64 = await this.blobToBase64(imageData.photo);
                        imageFolder.file(`${imageData.studentId}.jpg`, base64.split(',')[1], {base64: true});
                    }
                }
            }
            
            // 3. Generate zip file
            const content = await zip.generateAsync({type: 'blob'});
            
            // 4. Download file
            const fileName = `classroom-data-${new Date().toISOString().split('T')[0]}.zip`;
            this.downloadBlob(content, fileName);
            
            this.hideProgress();
            alert(`Xuất dữ liệu thành công! File: ${fileName}`);
            
        } catch (error) {
            console.error('Export error:', error);
            this.hideProgress();
            alert(`Lỗi khi xuất dữ liệu: ${error.message}`);
        }
    }

    async importData() {
        this.fileInput.click();
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            if (!window.JSZip) {
                alert('JSZip library không được tải. Vui lòng reload trang.');
                return;
            }

            this.showProgress('Đang nhập dữ liệu...');

            // 1. Read zip file
            const zip = await JSZip.loadAsync(file);
            
            // 2. Read main data
            const dataFile = zip.file('data.json');
            if (!dataFile) {
                throw new Error('File data.json không tìm thấy trong zip');
            }
            
            const dataText = await dataFile.async('text');
            const importData = JSON.parse(dataText);
            
            // 3. Validate data
            if (!importData.students || !Array.isArray(importData.students)) {
                throw new Error('Dữ liệu không hợp lệ: thiếu thông tin học sinh');
            }
            
            // 4. Confirm import
            const confirmMessage = `
Sẽ nhập ${importData.students.length} học sinh và ${importData.seats?.length || 0} ghế ngồi.
Dữ liệu hiện tại sẽ bị thay thế hoàn toàn.
Bạn có chắc chắn muốn tiếp tục?`;
            
            if (!confirm(confirmMessage)) {
                this.hideProgress();
                return;
            }
            
            // 5. Import images first
            const imagesFolder = zip.folder('images');
            if (imagesFolder && window.photoManager?.db) {
                await this.clearAllImages();
                
                imagesFolder.forEach(async (relativePath, file) => {
                    if (file.name.endsWith('.jpg')) {
                        const studentId = file.name.replace('images/', '').replace('.jpg', '');
                        const base64 = await file.async('base64');
                        const blob = this.base64ToBlob(base64, 'image/jpeg');
                        
                        await window.photoManager.savePhoto(studentId, blob);
                    }
                });
            }
            
            // 6. Import main data
            if (window.seatingManager) {
                window.seatingManager.students = importData.students || [];
                window.seatingManager.seats = importData.seats || window.seatingManager.seats;
                window.seatingManager.printSettings = importData.printSettings || null;
                
                // Update display
                window.seatingManager.updateDisplay();
                window.seatingManager.saveData();
                
                // Update teacher display if exists
                if (importData.printSettings?.teacherName) {
                    window.seatingManager.updateTeacherDisplay(importData.printSettings.teacherName);
                }
                
                // Reload photos
                if (window.seatingManager.reloadAllPhotos) {
                    await window.seatingManager.reloadAllPhotos();
                }
            }
            
            this.hideProgress();
            alert('Nhập dữ liệu thành công!');
            
            // Clear file input
            this.fileInput.value = '';
            
        } catch (error) {
            console.error('Import error:', error);
            this.hideProgress();
            alert(`Lỗi khi nhập dữ liệu: ${error.message}`);
            this.fileInput.value = '';
        }
    }

    async getAllImages() {
        return new Promise((resolve, reject) => {
            const transaction = window.photoManager.db.transaction(['photos'], 'readonly');
            const store = transaction.objectStore('photos');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clearAllImages() {
        return new Promise((resolve, reject) => {
            const transaction = window.photoManager.db.transaction(['photos'], 'readwrite');
            const store = transaction.objectStore('photos');
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], {type: mimeType});
    }

    downloadBlob(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showProgress(message) {
        // Create or update progress modal
        let progressModal = document.getElementById('progressModal');
        
        if (!progressModal) {
            progressModal = document.createElement('div');
            progressModal.id = 'progressModal';
            progressModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            progressModal.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-sm mx-4">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p id="progressMessage" class="text-gray-700">${message}</p>
                    </div>
                </div>
            `;
            document.body.appendChild(progressModal);
        } else {
            document.getElementById('progressMessage').textContent = message;
            progressModal.classList.remove('hidden');
        }
    }

    hideProgress() {
        const progressModal = document.getElementById('progressModal');
        if (progressModal) {
            progressModal.classList.add('hidden');
        }
    }
}

// Make it globally available
window.ImportExportManager = ImportExportManager;
