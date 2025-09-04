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
    window.confirmationManager = new ConfirmationManager();
    window.photoManager = new PhotoManager();
    
    // Wait for PhotoManager to initialize its database
    await waitForPhotoManagerReady();
    
    window.seatingManager = new SeatingManager();
    window.pickOneManager = new PickOneManager();
    window.luckyWheelManager = new LuckyWheelManager();
    window.importExportManager = new ImportExportManager();
    
    // Load all photos from IndexedDB after initialization
    if (window.seatingManager.reloadAllPhotos) {
        await window.seatingManager.reloadAllPhotos();
    }
    
    // Initialize any additional features
    initializeKeyboardShortcuts();
    initializeTooltips();
    
    // Delay offcanvas initialization to ensure DOM is fully ready
    setTimeout(() => {
        initializeOffcanvasMenu();
    }, 100);
    
    console.log('Classroom Seating Manager initialized successfully');
    console.log('PhotoManager available:', !!window.photoManager);
    console.log('SeatingManager available:', !!window.seatingManager);
    console.log('ModalManager available:', !!window.modalManager);
    console.log('ConfirmationManager available:', !!window.confirmationManager);
    console.log('PickOneManager available:', !!window.pickOneManager);
    console.log('LuckyWheelManager available:', !!window.luckyWheelManager);
    console.log('ImportExportManager available:', !!window.importExportManager);
    
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
            if (window.luckyWheelManager) {
                window.luckyWheelManager.closeModal();
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
        
        // Ctrl/Cmd + W: Lucky Wheel
        if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
            e.preventDefault();
            window.luckyWheelManager.openModal();
        }
        
        // Ctrl/Cmd + M: More Options (Offcanvas)
        if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
            e.preventDefault();
            const moreOptionsBtn = document.getElementById('moreOptionsBtn');
            if (moreOptionsBtn) {
                moreOptionsBtn.click();
            }
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
        'pickOneBtn': 'Ctrl+R',
        'luckyWheelBtn': 'Ctrl+W',
        'exportDataBtn': 'Xuất dữ liệu và hình ảnh',
        'importDataBtn': 'Nhập dữ liệu từ file .zip',
        'moreOptionsBtn': 'Ctrl+M'
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

// Initialize offcanvas menu functionality
function initializeOffcanvasMenu() {
    const moreOptionsBtn = document.getElementById('moreOptionsBtn');
    const offcanvasMenu = document.getElementById('offcanvasMenu');
    const offcanvasPanel = document.getElementById('offcanvasPanel');
    const closeOffcanvas = document.getElementById('closeOffcanvas');

    function openOffcanvasMenu() {
        if (offcanvasMenu) {
            offcanvasMenu.classList.remove('hidden');
            setTimeout(() => {
                if (offcanvasPanel) {
                    offcanvasPanel.classList.add('offcanvas-open');
                }
            }, 10);
        }
    }

    function closeOffcanvasMenuFunc() {
        offcanvasPanel.classList.remove('offcanvas-open');
        setTimeout(() => {
            offcanvasMenu.classList.add('hidden');
        }, 300);
    }

    // Make closeOffcanvasMenu globally available for onclick handlers
    window.closeOffcanvasMenu = closeOffcanvasMenuFunc;

    if (moreOptionsBtn) {
        moreOptionsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openOffcanvasMenu();
        });
    }

    if (closeOffcanvas) {
        closeOffcanvas.addEventListener('click', closeOffcanvasMenuFunc);
    }

    // Close when clicking overlay
    if (offcanvasMenu) {
        offcanvasMenu.addEventListener('click', (e) => {
            if (e.target === offcanvasMenu) {
                closeOffcanvasMenuFunc();
            }
        });
    }

    // Enhanced sidebar toggle for mobile
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');

    if (toggleSidebarBtn && sidebar) {
        toggleSidebarBtn.addEventListener('click', () => {
            // On mobile, use show class for full overlay
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('show');
            }
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && 
                sidebar.classList.contains('show') && 
                !sidebar.contains(e.target) && 
                !toggleSidebarBtn.contains(e.target)) {
                sidebar.classList.remove('show');
            }
        });
    }

    // ESC key to close offcanvas
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !offcanvasMenu.classList.contains('hidden')) {
            closeOffcanvasMenuFunc();
        }
    });
}
