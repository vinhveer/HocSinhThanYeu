// Modal management functionality

class ModalManager {
    constructor() {
        this.modals = {
            addStudent: document.getElementById('addStudentModal'),
            addList: document.getElementById('addListModal'),
            photo: document.getElementById('photoModal')
        };
        
        this.inputs = {
            studentName: document.getElementById('studentNameInput'),
            studentList: document.getElementById('studentListInput')
        };
        
        this.buttons = {
            openAddStudent: document.getElementById('openAddStudentModal'),
            openAddList: document.getElementById('openAddListModal'),
            confirmAddStudent: document.getElementById('confirmAddStudent'),
            cancelAddStudent: document.getElementById('cancelAddStudent'),
            confirmAddList: document.getElementById('confirmAddList'),
            cancelAddList: document.getElementById('cancelAddList')
        };
        
        this.bindEvents();
    }

    bindEvents() {
        // Open modal buttons
        this.buttons.openAddStudent.addEventListener('click', () => this.openModal('addStudent'));
        this.buttons.openAddList.addEventListener('click', () => this.openModal('addList'));
        
        // Modal action buttons
        this.buttons.confirmAddStudent.addEventListener('click', () => this.handleAddStudent());
        this.buttons.cancelAddStudent.addEventListener('click', () => this.closeModal('addStudent'));
        this.buttons.confirmAddList.addEventListener('click', () => this.handleAddList());
        this.buttons.cancelAddList.addEventListener('click', () => this.closeModal('addList'));
        
        // Enter key support
        this.inputs.studentName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddStudent();
        });
        
        // Close modals on background click
        window.addEventListener('click', (e) => {
            Object.values(this.modals).forEach(modal => {
                if (e.target === modal && modal.id !== 'photoModal') {
                    this.closeModal(this.getModalName(modal));
                }
            });
        });
    }

    openModal(modalType) {
        const modal = this.modals[modalType];
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // Focus on input
        setTimeout(() => {
            if (modalType === 'addStudent') {
                this.inputs.studentName.focus();
            } else if (modalType === 'addList') {
                this.inputs.studentList.focus();
            }
        }, 100);
    }

    closeModal(modalType) {
        const modal = this.modals[modalType];
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        
        // Clear inputs
        if (modalType === 'addStudent') {
            this.inputs.studentName.value = '';
        } else if (modalType === 'addList') {
            this.inputs.studentList.value = '';
        }
    }

    getModalName(modalElement) {
        for (const [name, modal] of Object.entries(this.modals)) {
            if (modal === modalElement) return name;
        }
        return null;
    }

    handleAddStudent() {
        const name = this.inputs.studentName.value.trim();
        if (name && window.seatingManager) {
            window.seatingManager.addStudent(name);
            this.closeModal('addStudent');
        }
    }

    handleAddList() {
        const listText = this.inputs.studentList.value.trim();
        if (listText && window.seatingManager) {
            const names = listText.split('\n')
                .map(name => name.trim())
                .filter(name => name.length > 0);
            
            window.seatingManager.addStudentList(names);
            this.closeModal('addList');
        }
    }
}
