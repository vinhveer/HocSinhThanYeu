// PickOne Manager - Random student selector with spinning wheel

class PickOneManager {
    constructor() {
        this.isSpinning = false;
        this.currentStudentIndex = 0;
        this.spinInterval = null;
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.modal = document.getElementById('pickOneModal');
        this.wheelContainer = document.getElementById('wheelContainer');
        this.studentWheel = document.getElementById('studentWheel');
        this.currentStudentDisplay = document.getElementById('currentStudent');
        this.resultDisplay = document.getElementById('resultDisplay');
        this.selectedStudentDisplay = document.getElementById('selectedStudent');
        this.spinBtn = document.getElementById('spinWheelBtn');
        this.closeBtn = document.getElementById('closePickOneBtn');
        this.pickOneBtn = document.getElementById('pickOneBtn');
        this.studentCountDisplay = document.getElementById('pickOneStudentCount');
    }

    bindEvents() {
        this.pickOneBtn.addEventListener('click', () => this.openModal());
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
        const allStudents = this.getAllStudents();
        
        if (allStudents.length === 0) {
            alert('No students available! Please add some students first.');
            return;
        }

        this.updateStudentCount(allStudents.length);
        this.resetWheel();
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.modal.classList.remove('flex');
        this.stopSpinning();
        this.resetWheel();
    }

    getAllStudents() {
        // Get all students (both waiting and seated)
        if (!window.seatingManager) return [];
        
        return window.seatingManager.students.filter(student => student && student.name);
    }

    updateStudentCount(count) {
        this.studentCountDisplay.textContent = `${count} students available`;
    }

    resetWheel() {
        this.currentStudentIndex = 0;
        this.currentStudentDisplay.textContent = 'Ready?';
        this.currentStudentDisplay.className = 'text-2xl font-bold text-white bg-black bg-opacity-30 rounded-lg px-4 py-2 min-h-16 flex items-center justify-center';
        this.resultDisplay.classList.add('hidden');
        this.spinBtn.disabled = false;
        this.spinBtn.textContent = '🎲 Spin the Wheel!';
        this.wheelContainer.style.transform = 'rotate(0deg)';
        this.wheelContainer.style.transition = '';
        this.wheelContainer.classList.add('no-select');
    }

    spinWheel() {
        const allStudents = this.getAllStudents();
        
        if (allStudents.length === 0) {
            alert('No students available!');
            return;
        }

        if (this.isSpinning) return;

        this.startSpinning(allStudents);
    }

    startSpinning(students) {
        this.isSpinning = true;
        this.spinBtn.disabled = true;
        this.spinBtn.textContent = '🎲 Spinning...';
        this.resultDisplay.classList.add('hidden');

        // Add spinning animation to wheel container
        this.wheelContainer.style.transition = 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
        
        // Random number of rotations (3-7 full rotations)
        const randomRotations = 3 + Math.random() * 4;
        const finalRotation = randomRotations * 360;
        this.wheelContainer.style.transform = `rotate(${finalRotation}deg)`;

        // Cycle through student names rapidly
        let speed = 50; // Start fast
        let iterations = 0;
        this.currentStudentIndex = 0;

        const updateSpeed = () => {
            if (this.spinInterval) {
                clearInterval(this.spinInterval);
            }
            
            this.currentStudentDisplay.textContent = students[this.currentStudentIndex].name;
            this.currentStudentIndex = (this.currentStudentIndex + 1) % students.length;
            iterations++;
            
            // Gradually slow down after 20 iterations
            if (iterations > 20) {
                speed += Math.floor(iterations / 4);
            }
            
            if (speed > 300 || iterations > 60) {
                this.stopSpinning();
                this.selectRandomStudent(students);
                return;
            }
            
            this.spinInterval = setTimeout(updateSpeed, speed);
        };

        this.spinInterval = setTimeout(updateSpeed, speed);

        // Also stop after 3 seconds regardless
        setTimeout(() => {
            if (this.isSpinning) {
                this.stopSpinning();
                this.selectRandomStudent(students);
            }
        }, 3000);
    }

    stopSpinning() {
        if (this.spinInterval) {
            clearTimeout(this.spinInterval);
            clearInterval(this.spinInterval);
            this.spinInterval = null;
        }
        this.isSpinning = false;
    }

    selectRandomStudent(students) {
        this.stopSpinning();
        
        // Select random student
        const randomIndex = Math.floor(Math.random() * students.length);
        const selectedStudent = students[randomIndex];

        // Show final result with animation
        setTimeout(() => {
            this.currentStudentDisplay.textContent = selectedStudent.name;
            this.currentStudentDisplay.className = 'text-2xl font-bold text-yellow-300 bg-red-500 bg-opacity-80 rounded-lg px-4 py-2 min-h-16 flex items-center justify-center animate-pulse';
            
            // Show result display
            this.selectedStudentDisplay.textContent = selectedStudent.name;
            this.resultDisplay.classList.remove('hidden');
            
            // Reset button
            this.spinBtn.disabled = false;
            this.spinBtn.textContent = '🎲 Spin Again!';
            
            // Play celebration sound effect (if possible)
            this.playCelebrationEffect();
            
        }, 500);
    }

    playCelebrationEffect() {
        // Add visual celebration effect
        this.wheelContainer.style.transition = 'transform 0.5s ease-in-out';
        this.wheelContainer.style.transform += ' scale(1.1)';
        
        setTimeout(() => {
            this.wheelContainer.style.transform = this.wheelContainer.style.transform.replace(' scale(1.1)', '');
        }, 500);
    }
}

// Make it globally available
window.PickOneManager = PickOneManager;
