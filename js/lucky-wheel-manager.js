// Lucky Wheel Manager - Spinning wheel for random student selection

class LuckyWheelManager {
    constructor() {
        this.isSpinning = false;
        this.students = [];
        this.colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
            '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
        ];
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.modal = document.getElementById('luckyWheelModal');
        this.wheel = document.getElementById('luckyWheel');
        this.wheelSections = document.getElementById('wheelSections');
        this.spinBtn = document.getElementById('spinLuckyWheelBtn');
        this.closeBtn = document.getElementById('closeLuckyWheelBtn');
        this.openBtn = document.getElementById('luckyWheelBtn');
        this.resultDisplay = document.getElementById('luckyWheelResult');
        this.selectedStudentDisplay = document.getElementById('luckyWheelSelectedStudent');
        this.studentCountDisplay = document.getElementById('luckyWheelStudentCount');
    }

    bindEvents() {
        this.openBtn.addEventListener('click', () => this.openModal());
        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.spinBtn.addEventListener('click', () => this.spinWheel());
        
        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
    }

    openModal() {
        this.students = this.getAllStudents();
        
        if (this.students.length === 0) {
            alert('Không có học sinh nào! Vui lòng thêm học sinh trước.');
            return;
        }

        this.updateStudentCount(this.students.length);
        this.createWheelSections();
        this.resetWheel();
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.modal.classList.remove('flex');
        this.resetWheel();
    }

    getAllStudents() {
        // Get all students (both waiting and seated)
        if (!window.seatingManager) return [];
        
        return window.seatingManager.students.filter(student => student && student.name);
    }

    updateStudentCount(count) {
        this.studentCountDisplay.textContent = `${count} học sinh tham gia`;
    }

    createWheelSections() {
        this.wheelSections.innerHTML = '';
        const studentCount = this.students.length;
        const anglePerSection = 360 / studentCount;

        this.students.forEach((student, index) => {
            const section = document.createElement('div');
            section.className = 'wheel-section';
            
            const startAngle = index * anglePerSection;
            const color = this.colors[index % this.colors.length];
            
            section.style.backgroundColor = color;
            section.style.transform = `rotate(${startAngle}deg) skewY(${90 - anglePerSection}deg)`;
            section.style.transformOrigin = '100% 100%';
            
            // Create text element
            const textElement = document.createElement('div');
            textElement.textContent = student.name;
            textElement.style.transform = `skewY(${anglePerSection - 90}deg) rotate(${anglePerSection / 2}deg)`;
            textElement.style.transformOrigin = '0 100%';
            textElement.style.width = '80%';
            textElement.style.height = '100%';
            textElement.style.display = 'flex';
            textElement.style.alignItems = 'center';
            textElement.style.paddingLeft = '10px';
            textElement.style.fontSize = studentCount > 10 ? '0.7rem' : '0.8rem';
            
            section.appendChild(textElement);
            this.wheelSections.appendChild(section);
        });
    }

    resetWheel() {
        this.wheel.style.transform = 'rotate(0deg)';
        this.wheel.classList.remove('wheel-spinning', 'wheel-final-spin');
        this.resultDisplay.classList.add('hidden');
        this.spinBtn.disabled = false;
        this.spinBtn.textContent = '🎲 Quay bánh xe!';
    }

    spinWheel() {
        if (this.isSpinning || this.students.length === 0) return;

        this.startSpinning();
    }

    startSpinning() {
        this.isSpinning = true;
        this.spinBtn.disabled = true;
        this.spinBtn.textContent = '🎰 Đang quay...';
        this.resultDisplay.classList.add('hidden');

        // Start rapid spinning
        this.wheel.classList.add('wheel-spinning');
        
        // Duration: 2-4 seconds
        const spinDuration = 2000 + Math.random() * 2000;
        
        setTimeout(() => {
            this.finishSpin();
        }, spinDuration);
    }

    finishSpin() {
        // Stop rapid spinning
        this.wheel.classList.remove('wheel-spinning');
        
        // Calculate final position
        const randomStudent = Math.floor(Math.random() * this.students.length);
        const anglePerSection = 360 / this.students.length;
        const targetAngle = (randomStudent * anglePerSection) + (anglePerSection / 2);
        
        // Add multiple full rotations for effect (3-7 rotations)
        const extraRotations = (3 + Math.random() * 4) * 360;
        const finalAngle = extraRotations + (360 - targetAngle); // 360 - targetAngle to account for pointer at top
        
        // Apply final spin with smooth animation
        this.wheel.classList.add('wheel-final-spin');
        this.wheel.style.transform = `rotate(${finalAngle}deg)`;
        
        // Show result after animation completes
        setTimeout(() => {
            this.showResult(randomStudent);
        }, 3000);
    }

    showResult(studentIndex) {
        const selectedStudent = this.students[studentIndex];
        
        // Show result
        this.selectedStudentDisplay.textContent = selectedStudent.name;
        this.resultDisplay.classList.remove('hidden');
        
        // Reset button
        this.spinBtn.disabled = false;
        this.spinBtn.textContent = '🎲 Quay lại!';
        this.isSpinning = false;
        
        // Add celebration effect
        this.playCelebrationEffect();
    }

    playCelebrationEffect() {
        // Add a glow effect to the wheel
        this.wheel.style.boxShadow = '0 0 50px rgba(255, 215, 0, 0.8)';
        
        setTimeout(() => {
            this.wheel.style.boxShadow = '';
        }, 2000);
    }
}

// Make it globally available
window.LuckyWheelManager = LuckyWheelManager;
