// Main application initialization

// Wait for PhotoManager to be ready
function waitForPhotoManagerReady() {
    return new Promise((resolve) => {
        const checkReady = () => {
            if (window.photoManager && window.photoManager.db) {
                resolve();
            } else {
                setTimeout(checkReady, 50);
            }
        };
        checkReady();
    });
}

// Initialize application when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize global managers
    window.modalManager = new ModalManager();
    window.photoManager = new PhotoManager();
    
    // Wait for PhotoManager to initialize its database
    await waitForPhotoManagerReady();
    
    window.seatingManager = new SeatingManager();
    window.pickOneManager = new PickOneManager();
    
    // Load all photos from IndexedDB after initialization
    if (window.seatingManager.reloadAllPhotos) {
        await window.seatingManager.reloadAllPhotos();
    }
    
    // Initialize any additional features
    initializeKeyboardShortcuts();
    initializeTooltips();
    
    console.log('Classroom Seating Manager initialized successfully');
    console.log('PhotoManager available:', !!window.photoManager);
    console.log('SeatingManager available:', !!window.seatingManager);
    console.log('ModalManager available:', !!window.modalManager);
    
    // Test function for debugging
    window.testPhotoModal = function() {
        if (window.photoManager) {
            window.photoManager.openPhotoModal('test-id', 'Test Student');
            console.log('Test modal opened');
        } else {
            console.error('PhotoManager not available for test');
        }
    };
});

// Keyboard shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + N: Add new student
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            window.modalManager.openModal('addStudent');
        }
        
        // Ctrl/Cmd + L: Add student list
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            window.modalManager.openModal('addList');
        }
        
        // Escape: Close any open modal
        if (e.key === 'Escape') {
            window.modalManager.closeModal('addStudent');
            window.modalManager.closeModal('addList');
            if (window.photoManager) {
                window.photoManager.closeModal();
            }
            if (window.pickOneManager) {
                window.pickOneManager.closeModal();
            }
        }
        
        // Ctrl/Cmd + /: Toggle sidebar
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            window.seatingManager.toggleSidebar();
        }
        
        // Ctrl/Cmd + P: Print classroom
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            window.seatingManager.printClassroom();
        }
        
        // Ctrl/Cmd + R: Pick one student (Random)
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            window.pickOneManager.openModal();
        }
    });
}

// Initialize tooltips and help text
function initializeTooltips() {
    // Add keyboard shortcut hints to buttons
    const shortcuts = {
        'openAddStudentModal': 'Ctrl+N',
        'openAddListModal': 'Ctrl+L',
        'toggleSidebar': 'Ctrl+/',
        'printClassroom': 'Ctrl+P',
        'pickOneBtn': 'Ctrl+R'
    };
    
    Object.entries(shortcuts).forEach(([id, shortcut]) => {
        const element = document.getElementById(id);
        if (element) {
            const originalTitle = element.title || '';
            element.title = originalTitle + (originalTitle ? ' | ' : '') + shortcut;
        }
    });
}

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
});

// Prevent default drag behaviors on the document
document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
});
