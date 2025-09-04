// Confirmation Manager - Handle confirmation dialogs

class ConfirmationManager {
    constructor() {
        this.pendingAction = null;
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.modal = document.getElementById('confirmationModal');
        this.messageElement = document.getElementById('confirmationMessage');
        this.confirmBtn = document.getElementById('confirmActionBtn');
        this.cancelBtn = document.getElementById('cancelActionBtn');
    }

    bindEvents() {
        this.confirmBtn.addEventListener('click', () => this.handleConfirm());
        this.cancelBtn.addEventListener('click', () => this.handleCancel());
        
        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.handleCancel();
            }
        });

        // Handle ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.handleCancel();
            }
        });
    }

    /**
     * Show confirmation dialog
     * @param {string} message - The confirmation message to display
     * @param {Function} onConfirm - Callback function to execute on confirmation
     * @param {string} confirmText - Text for confirm button (optional)
     */
    confirm(message, onConfirm, confirmText = 'Xác nhận') {
        this.messageElement.textContent = message;
        this.confirmBtn.textContent = confirmText;
        this.pendingAction = onConfirm;
        
        this.showModal();
    }

    showModal() {
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
        
        // Focus the cancel button for safety
        this.cancelBtn.focus();
    }

    hideModal() {
        this.modal.classList.add('hidden');
        this.modal.classList.remove('flex');
        this.pendingAction = null;
    }

    handleConfirm() {
        if (this.pendingAction && typeof this.pendingAction === 'function') {
            this.pendingAction();
        }
        this.hideModal();
    }

    handleCancel() {
        this.hideModal();
    }

    // Predefined confirmation messages
    static messages = {
        clearSeats: 'Bạn có chắc chắn muốn xóa tất cả vị trí ngồi? Học sinh sẽ được chuyển về danh sách chờ.',
        clearAllStudents: 'Bạn có chắc chắn muốn xóa tất cả học sinh? Toàn bộ dữ liệu sẽ bị mất.'
    };
}

// Make it globally available
window.ConfirmationManager = ConfirmationManager;
