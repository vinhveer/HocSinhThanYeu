// Photo management with IndexedDB storage

class PhotoManager {
    constructor() {
        console.log('PhotoManager constructor called');
        this.dbName = 'StudentPhotosDB';
        this.dbVersion = 1;
        this.storeName = 'photos';
        this.db = null;
        this.currentStudentId = null;
        this.currentPhotoData = null;
        
        this.initializeDB();
        this.initializeElements();
        this.bindEvents();
        console.log('PhotoManager initialized');
    }

    async initializeDB() {
        try {
            this.db = await this.openDB();
            console.log('Photo database initialized successfully');
        } catch (error) {
            console.error('Error initializing photo database:', error);
        }
    }

    openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'studentId' });
                    store.createIndex('studentId', 'studentId', { unique: true });
                }
            };
        });
    }

    initializeElements() {
        this.photoModal = document.getElementById('photoModal');
        this.photoStudentName = document.getElementById('photoStudentName');
        this.currentPhoto = document.getElementById('currentPhoto');
        this.noPhotoText = document.getElementById('noPhotoText');
        this.photoFileInput = document.getElementById('photoFileInput');
        this.pasteArea = document.getElementById('pasteArea');
        this.savePhotoBtn = document.getElementById('savePhoto');
        this.removePhotoBtn = document.getElementById('removePhoto');
        this.cancelPhotoBtn = document.getElementById('cancelPhoto');
    }

    bindEvents() {
        // File input change
        this.photoFileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Paste area events
        this.pasteArea.addEventListener('click', () => this.pasteArea.focus());
        this.pasteArea.addEventListener('paste', (e) => this.handlePaste(e));
        
        // Make paste area focusable
        this.pasteArea.setAttribute('tabindex', '0');
        
        // Button events
        this.savePhotoBtn.addEventListener('click', () => this.savePhoto());
        this.removePhotoBtn.addEventListener('click', () => this.removePhoto());
        this.cancelPhotoBtn.addEventListener('click', () => this.closeModal());
        
        // Modal background click
        this.photoModal.addEventListener('click', (e) => {
            if (e.target === this.photoModal) this.closeModal();
        });
        
        // Global paste event when modal is open
        document.addEventListener('paste', (e) => {
            if (!this.photoModal.classList.contains('hidden')) {
                this.handlePaste(e);
            }
        });
    }

    async openPhotoModal(studentId, studentName) {
        this.currentStudentId = studentId;
        this.photoStudentName.textContent = studentName;
        
        // Load existing photo if any
        const photoData = await this.getPhoto(studentId);
        this.displayPhoto(photoData);
        
        // Show modal
        this.photoModal.classList.remove('hidden');
        this.photoModal.classList.add('flex');
        
        // Focus paste area
        setTimeout(() => this.pasteArea.focus(), 100);
    }

    closeModal() {
        this.photoModal.classList.add('hidden');
        this.photoModal.classList.remove('flex');
        this.currentStudentId = null;
        this.currentPhotoData = null;
        this.photoFileInput.value = '';
        this.displayPhoto(null);
    }

    displayPhoto(photoData) {
        if (photoData && photoData.imageData) {
            this.currentPhoto.src = photoData.imageData;
            this.currentPhoto.classList.remove('hidden');
            this.noPhotoText.classList.add('hidden');
            this.currentPhotoData = photoData;
        } else {
            this.currentPhoto.classList.add('hidden');
            this.noPhotoText.classList.remove('hidden');
            this.currentPhotoData = null;
        }
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.processImageFile(file);
        }
    }

    handlePaste(event) {
        const items = event.clipboardData.items;
        
        for (let item of items) {
            if (item.type.startsWith('image/')) {
                event.preventDefault();
                const file = item.getAsFile();
                this.processImageFile(file);
                break;
            }
        }
    }

    processImageFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const resizedImageData = this.resizeImage(img, 150, 150);
                this.displayPhoto({ imageData: resizedImageData });
            };
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    }

    resizeImage(img, maxWidth, maxHeight) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        
        if (width > height) {
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
        } else {
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);
        
        return canvas.toDataURL('image/jpeg', 0.8);
    }

    async savePhoto() {
        if (!this.currentStudentId || !this.currentPhotoData) {
            alert('Please select an image first');
            return;
        }

        try {
            await this.storePhoto(this.currentStudentId, this.currentPhotoData.imageData);
            
            // Update the seating display
            if (window.seatingManager) {
                window.seatingManager.updateDisplay();
            }
            
            this.closeModal();
            alert('Photo saved successfully!');
        } catch (error) {
            console.error('Error saving photo:', error);
            alert('Error saving photo. Please try again.');
        }
    }

    async removePhoto() {
        if (!this.currentStudentId) return;

        if (confirm('Are you sure you want to remove this photo?')) {
            try {
                await this.deletePhoto(this.currentStudentId);
                
                // Update the seating display
                if (window.seatingManager) {
                    window.seatingManager.updateDisplay();
                }
                
                this.closeModal();
                alert('Photo removed successfully!');
            } catch (error) {
                console.error('Error removing photo:', error);
                alert('Error removing photo. Please try again.');
            }
        }
    }

    async storePhoto(studentId, imageData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const photoData = {
                studentId: studentId,
                imageData: imageData,
                timestamp: new Date().toISOString()
            };
            
            const request = store.put(photoData);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getPhoto(studentId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(studentId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deletePhoto(studentId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(studentId);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getAllPhotos() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}
