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
        this.cardsContainer = document.getElementById('cardsContainer');
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
            alert('Không có học sinh nào! Vui lòng thêm học sinh trước.');
            return;
        }

        this.updateStudentCount(allStudents.length);
        this.createStudentCards(allStudents);
        this.resetCards();
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.modal.classList.remove('flex');
        this.stopSpinning();
        this.resetCards();
    }

    getAllStudents() {
        // Get all students (both waiting and seated)
        if (!window.seatingManager) return [];
        
        return window.seatingManager.students.filter(student => student && student.name);
    }

    updateStudentCount(count) {
        this.studentCountDisplay.textContent = `${count} học sinh có sẵn`;
    }

    createStudentCards(students) {
        this.cardsContainer.innerHTML = '';
        
        // Create multiple sets of cards for smooth infinite scrolling
        const cardSets = 4; // Duplicate cards for seamless scrolling
        for (let set = 0; set < cardSets; set++) {
            students.forEach((student, index) => {
                const card = document.createElement('div');
                card.className = 'student-card no-select';
                card.innerHTML = `
                    <div class="text-lg font-semibold text-gray-800 whitespace-nowrap">${student.name}</div>
                `;
                this.cardsContainer.appendChild(card);
            });
        }
    }

    resetCards() {
        this.currentStudentIndex = 0;
        this.resultDisplay.classList.add('hidden');
        this.spinBtn.disabled = false;
        this.spinBtn.textContent = '🎲 Quay ngẫu nhiên!';
        this.cardsContainer.style.transform = 'translateX(0px)';
        this.cardsContainer.classList.remove('cards-sliding');
        
        // Remove selected styling from all cards
        const cards = this.cardsContainer.querySelectorAll('.student-card');
        cards.forEach(card => {
            card.classList.remove('selected-card');
        });
    }

    spinWheel() {
        const allStudents = this.getAllStudents();
        
        if (allStudents.length === 0) {
            alert('Không có học sinh nào!');
            return;
        }

        if (this.isSpinning) return;

        this.startCardSliding(allStudents);
    }

    startCardSliding(students) {
        this.isSpinning = true;
        this.spinBtn.disabled = true;
        this.spinBtn.textContent = '🎲 Đang quay...';
        this.resultDisplay.classList.add('hidden');

        // Start sliding animation
        this.cardsContainer.classList.add('cards-sliding');
        
        // Slide duration: 2-4 seconds
        const slideDuration = 2000 + Math.random() * 2000;
        
        const randomStudentIndex = Math.floor(Math.random() * students.length);
        
        setTimeout(() => {
            this.stopSpinning();
            this.selectRandomStudent(students, randomStudentIndex);
        }, slideDuration);
    }

    stopSpinning() {
        if (this.spinInterval) {
            clearTimeout(this.spinInterval);
            clearInterval(this.spinInterval);
            this.spinInterval = null;
        }
        this.cardsContainer.classList.remove('cards-sliding');
        this.isSpinning = false;
    }

    selectRandomStudent(students, selectedIndex) {
        this.stopSpinning();
        
        const selectedStudent = students[selectedIndex];

        // Calculate precise positioning using container center
        const cardsContainerParent = this.cardsContainer.parentElement;
        const containerRect = cardsContainerParent.getBoundingClientRect();
        
        // Get the center position of the container
        const containerCenterX = containerRect.width / 2;
        
        // Calculate card positioning using actual DOM measurements
        const allCards = this.cardsContainer.querySelectorAll('.student-card');
        const firstCard = allCards[0];
        const secondCard = allCards[1];
        
        let cardWidth, actualCardWidth, selectedCardInSet, selectedCardLeftEdge, selectedCardCenterX;
        
        if (firstCard && secondCard) {
            // Calculate actual distance between cards (left edge to left edge)
            const firstCardRect = firstCard.getBoundingClientRect();
            const secondCardRect = secondCard.getBoundingClientRect();
            cardWidth = secondCardRect.left - firstCardRect.left;
            actualCardWidth = firstCard.offsetWidth;
        } else {
            // Fallback calculation - approximate values
            actualCardWidth = 160; // Smaller default for auto-width cards
            cardWidth = 180; // card + gap
        }
        
        // Calculate cumulative position for the selected card in the 3rd set
        selectedCardInSet = selectedIndex + students.length * 2; // Use 3rd set for positioning
        
        // For more accurate positioning with variable card widths
        if (allCards.length > selectedCardInSet) {
            const targetCard = allCards[selectedCardInSet];
            const targetCardRect = targetCard.getBoundingClientRect();
            const containerRect = this.cardsContainer.getBoundingClientRect();
            selectedCardLeftEdge = targetCardRect.left - containerRect.left;
            selectedCardCenterX = selectedCardLeftEdge + (targetCard.offsetWidth / 2);
        } else {
            // Fallback to calculated position
            selectedCardLeftEdge = selectedCardInSet * cardWidth;
            selectedCardCenterX = selectedCardLeftEdge + (actualCardWidth / 2);
        }
        
        // Calculate the exact offset needed to center the selected card in the container
        const finalOffset = containerCenterX - selectedCardCenterX;

        // Debug logging to ensure accuracy
        console.log('Auto-width card centering debug:', {
            containerCenterX,
            selectedCardCenterX,
            finalOffset,
            selectedIndex,
            selectedCardInSet,
            actualCardWidth,
            selectedCardLeftEdge,
            totalCards: allCards.length
        });

        // Animate to final position
        this.cardsContainer.style.transition = 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        this.cardsContainer.style.transform = `translateX(${finalOffset}px)`;
        
        // Show final result with animation
        setTimeout(() => {
            // Highlight the selected card (from the 3rd set)
            const allCards = this.cardsContainer.querySelectorAll('.student-card');
            const selectedCardIndex = selectedIndex + students.length * 2; // Use 3rd set
            
            // Remove any existing selected styling
            allCards.forEach(card => card.classList.remove('selected-card'));
            
            // Add selected styling to the correct card
            if (allCards[selectedCardIndex]) {
                allCards[selectedCardIndex].classList.add('selected-card');
            }
            
            // Show result display
            this.selectedStudentDisplay.textContent = selectedStudent.name;
            this.resultDisplay.classList.remove('hidden');
            
            // Reset button
            this.spinBtn.disabled = false;
            this.spinBtn.textContent = '🎲 Quay lại!';
            
            // Play celebration sound effect (if possible)
            this.playCelebrationEffect();
            
        }, 1000);
    }

    playCelebrationEffect() {
        // Add visual celebration effect to the selected card
        const selectedCard = this.cardsContainer.querySelector('.selected-card');
        if (selectedCard) {
            // The animation is handled by CSS class 'selected-card'
            // Additional celebration can be added here
            
            // Add a brief glow effect to the container
            this.cardsContainer.style.filter = 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))';
            
            setTimeout(() => {
                this.cardsContainer.style.filter = '';
            }, 1000);
        }
    }
}

// Make it globally available
window.PickOneManager = PickOneManager;
