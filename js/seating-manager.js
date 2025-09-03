// Main seating management functionality

class SeatingManager {
    constructor() {
        this.students = [];
        this.seats = this.initializeSeats();
        this.filteredStudents = [];
        this.sidebarCollapsed = false;
        this.storageKey = 'classroomSeatingData';
        this.initializeElements();
        this.bindEvents();
        this.generateSeatingGrids();
        this.loadData();
        this.updateDisplay();
    }

    initializeElements() {
        // Sidebar elements
        this.sidebar = document.getElementById('sidebar');
        this.collapsedSidebar = document.getElementById('collapsedSidebar');
        this.toggleSidebarBtn = document.getElementById('toggleSidebar');
        this.expandSidebarBtn = document.getElementById('expandSidebar');
        this.mainContent = document.getElementById('mainContent');
        
        // Button elements
        this.clearAllStudentsBtn = document.getElementById('clearAllStudents');
        this.clearSeatsBtn = document.getElementById('clearSeats');
        this.printClassroomBtn = document.getElementById('printClassroom');
        this.clearDataBtn = document.getElementById('clearData');
        
        // Display elements
        this.studentList = document.getElementById('studentList');
        this.studentCount = document.getElementById('studentCount');
        this.seatedCount = document.getElementById('seatedCount');
        this.searchInput = document.getElementById('searchStudents');
        this.leftGrid = document.getElementById('leftGrid');
        this.rightGrid = document.getElementById('rightGrid');
        this.emptyStudentState = document.getElementById('emptyStudentState');
        this.saveStatus = document.getElementById('saveStatus');
    }

    initializeSeats() {
        const seats = [];
        for (let i = 1; i <= SEAT_CONFIG.TOTAL_SEATS_PER_SIDE; i++) {
            seats.push({ 
                id: `L${i}`, 
                student: null, 
                side: 'left', 
                row: Math.ceil(i / SEAT_CONFIG.COLS), 
                col: ((i - 1) % SEAT_CONFIG.COLS) + 1 
            });
            seats.push({ 
                id: `R${i}`, 
                student: null, 
                side: 'right', 
                row: Math.ceil(i / SEAT_CONFIG.COLS), 
                col: ((i - 1) % SEAT_CONFIG.COLS) + 1 
            });
        }
        return seats;
    }

    bindEvents() {
        // Sidebar collapse events
        this.toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
        this.expandSidebarBtn.addEventListener('click', () => this.toggleSidebar());
        
        // Other events
        this.clearAllStudentsBtn.addEventListener('click', () => this.clearAllStudents());
        this.clearSeatsBtn.addEventListener('click', () => this.clearAllSeats());
        this.printClassroomBtn.addEventListener('click', () => this.printClassroom());
        this.clearDataBtn.addEventListener('click', () => this.handleClearData());
        this.searchInput.addEventListener('input', Utils.debounce((e) => this.searchStudents(e.target.value), 300));
        
        // Setup sidebar drop zone
        this.setupSidebarDropZone();
    }

    toggleSidebar() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        
        if (this.sidebarCollapsed) {
            this.sidebar.classList.add('hidden');
            this.collapsedSidebar.classList.remove('hidden');
            this.collapsedSidebar.classList.add('flex');
        } else {
            this.sidebar.classList.remove('hidden');
            this.collapsedSidebar.classList.add('hidden');
            this.collapsedSidebar.classList.remove('flex');
        }
    }

    addStudent(name) {
        this.students.push({
            id: Utils.generateId(),
            name: name,
            seated: false,
            seatId: null
        });
        this.updateDisplay();
        this.saveData();
    }

    addStudentList(names) {
        names.forEach(name => {
            this.students.push({
                id: Utils.generateId(),
                name: name,
                seated: false,
                seatId: null
            });
        });
        this.updateDisplay();
        this.saveData();
    }

    clearAllStudents() {
        this.students = [];
        this.seats.forEach(seat => seat.student = null);
        this.updateDisplay();
        this.saveData();
    }

    clearAllSeats() {
        this.students.forEach(student => {
            student.seated = false;
            student.seatId = null;
        });
        this.seats.forEach(seat => seat.student = null);
        this.updateDisplay();
        this.saveData();
    }

    searchStudents(query) {
        const lowercaseQuery = query.toLowerCase();
        this.filteredStudents = this.students.filter(student => 
            !student.seated && student.name.toLowerCase().includes(lowercaseQuery)
        );
        this.renderStudentList();
    }

    generateSeatingGrids() {
        this.generateGrid('leftGrid', 'left');
        this.generateGrid('rightGrid', 'right');
    }

    generateGrid(containerId, side) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        for (let row = 1; row <= SEAT_CONFIG.ROWS; row++) {
            for (let col = 1; col <= SEAT_CONFIG.COLS; col++) {
                const seatNumber = (row - 1) * SEAT_CONFIG.COLS + col;
                const seatId = `${side === 'left' ? 'L' : 'R'}${seatNumber}`;
                
                const seat = this.createSeatElement(seatId);
                container.appendChild(seat);
            }
        }
    }

    createSeatElement(seatId) {
        const seat = Utils.createElement('div', SEAT_CLASSES.BASE);
        seat.id = `seat-${seatId}`;
        seat.dataset.seatId = seatId;
        
        seat.innerHTML = `
            <div class="seat-photo w-4/5 aspect-square max-w-20 rounded-full overflow-hidden border border-gray-300 mx-auto mb-1 hidden">
                <img class="w-full h-full object-cover" alt="Student photo">
            </div>
            <div class="seat-content text-sm text-center font-semibold leading-tight break-words max-w-full px-2 flex-1 flex items-center justify-center"></div>
        `;
        
        // Add drop events
        seat.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            seat.classList.add(...SEAT_CLASSES.HOVER.split(' '));
        });
        
        seat.addEventListener('dragleave', (e) => {
            // Only remove highlight if not dragging over a child element
            if (!seat.contains(e.relatedTarget)) {
                seat.classList.remove(...SEAT_CLASSES.HOVER.split(' '));
            }
        });
        
        seat.addEventListener('drop', (e) => {
            e.preventDefault();
            seat.classList.remove(...SEAT_CLASSES.HOVER.split(' '));
            const studentId = e.dataTransfer.getData('text/plain');
            this.assignStudentToSeat(studentId, seatId);
        });
        
        return seat;
    }

    assignStudentToSeat(studentId, seatId) {
        const student = this.students.find(s => String(s.id) === String(studentId));
        const seat = this.seats.find(s => s.id === seatId);
        
        if (student && seat && !seat.student) {
            // Remove student from previous seat if any
            if (student.seatId) {
                const oldSeat = this.seats.find(s => s.id === student.seatId);
                if (oldSeat) oldSeat.student = null;
            }
            
            // Assign to new seat
            student.seated = true;
            student.seatId = seatId;
            seat.student = student;
            
            this.updateDisplay();
            this.saveData();
        }
    }

    removeStudentFromSeat(studentId) {
        const student = this.students.find(s => String(s.id) === String(studentId));
        if (student && student.seated) {
            const seat = this.seats.find(s => s.id === student.seatId);
            if (seat) seat.student = null;
            
            student.seated = false;
            student.seatId = null;
            
            this.updateDisplay();
            this.saveData();
        }
    }

    updateDisplay() {
        this.updateCounts();
        this.filteredStudents = this.students.filter(student => !student.seated);
        this.renderStudentList();
        this.renderSeats();
        this.toggleEmptyState();
    }

    updateCounts() {
        const waitingCount = this.students.filter(s => !s.seated).length;
        const seatedCount = this.students.filter(s => s.seated).length;
        
        this.studentCount.textContent = waitingCount;
        this.seatedCount.textContent = seatedCount;
    }

    renderStudentList() {
        this.studentList.innerHTML = '';
        
        this.filteredStudents.forEach(student => {
            const studentItem = this.createStudentListItem(student);
            this.studentList.appendChild(studentItem);
        });
    }

    createStudentListItem(student) {
        const item = Utils.createElement('div', STUDENT_CLASSES.LIST_ITEM);
        item.draggable = true;
        item.dataset.studentId = student.id;
        
        item.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center student-info cursor-pointer hover:bg-blue-50 rounded px-1" data-student-id="${student.id}" data-student-name="${student.name}">
                    <div class="${STUDENT_CLASSES.AVATAR}">
                        <span class="text-white font-bold text-sm">${student.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <span class="font-medium text-gray-800">${student.name}</span>
                </div>
                <button 
                    onclick="window.seatingManager.removeStudent('${student.id}')" 
                    class="text-red-500 hover:text-red-700 text-sm"
                    title="Remove student"
                >
                    ×
                </button>
            </div>
        `;
        
        // Add click handler for photo upload
        const studentInfo = item.querySelector('.student-info');
        studentInfo.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Student clicked:', student.name, 'PhotoManager:', !!window.photoManager);
            if (window.photoManager) {
                window.photoManager.openPhotoModal(student.id, student.name);
            } else {
                console.error('PhotoManager not available');
            }
        });
        
        // Add drag events (avoid interference with click)
        item.addEventListener('dragstart', (e) => {
            // Only allow drag if not clicking on student info
            if (!e.target.closest('.student-info')) {
                e.dataTransfer.setData('text/plain', String(student.id));
                e.dataTransfer.effectAllowed = 'move';
                item.classList.add(...STUDENT_CLASSES.DRAGGING.split(' '));
            } else {
                e.preventDefault();
            }
        });
        
        item.addEventListener('dragend', () => {
            item.classList.remove(...STUDENT_CLASSES.DRAGGING.split(' '));
        });
        
        return item;
    }

    async renderSeats() {
        for (const seat of this.seats) {
            const seatElement = document.getElementById(`seat-${seat.id}`);
            if (!seatElement) continue;
            
            const contentElement = seatElement.querySelector('.seat-content');
            const photoElement = seatElement.querySelector('.seat-photo');
            const photoImg = photoElement.querySelector('img');
            
            if (seat.student) {
                // Remove empty state classes
                seatElement.classList.remove(...SEAT_CLASSES.EMPTY.split(' '));
                // Add occupied state classes
                seatElement.classList.add(...SEAT_CLASSES.OCCUPIED.split(' '));
                
                // Try to load student photo
                let hasPhoto = false;
                if (window.photoManager) {
                    try {
                        const photoData = await window.photoManager.getPhoto(seat.student.id);
                        if (photoData && photoData.imageData) {
                            photoImg.src = photoData.imageData;
                            photoElement.classList.remove('hidden');
                            hasPhoto = true;
                        }
                    } catch (error) {
                        console.error('Error loading photo for student:', error);
                    }
                }
                
                if (!hasPhoto) {
                    // Hide photo if no photo available
                    photoElement.classList.add('hidden');
                }
                
                // Always show student name
                contentElement.classList.remove('hidden');
                contentElement.innerHTML = Utils.getStudentDisplayName(seat.student.name);
                
                contentElement.title = seat.student.name;
                
                // Add click handler for photo upload
                if (!seatElement.hasAttribute('data-click-enabled')) {
                    seatElement.setAttribute('data-click-enabled', 'true');
                    seatElement.addEventListener('click', (e) => {
                        // Only trigger if clicking on content or photo, not during drag
                        if (e.target.closest('.seat-content') || e.target.closest('.seat-photo') || e.target === seatElement) {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Seat clicked:', seat.student.name, 'PhotoManager:', !!window.photoManager);
                            if (window.photoManager) {
                                window.photoManager.openPhotoModal(seat.student.id, seat.student.name);
                            } else {
                                console.error('PhotoManager not available');
                            }
                        }
                    });
                    seatElement.style.cursor = 'pointer';
                }
                
                // Make seated student draggable back to waiting list
                seatElement.draggable = true;
                
                // Add drag functionality for removing student (only if not already added)
                if (!seatElement.hasAttribute('data-drag-enabled')) {
                    seatElement.setAttribute('data-drag-enabled', 'true');
                    
                    seatElement.addEventListener('dragstart', (e) => {
                        const currentStudent = this.seats.find(s => s.id === seat.id)?.student;
                        if (currentStudent) {
                            e.dataTransfer.setData('text/plain', currentStudent.id);
                            e.dataTransfer.effectAllowed = 'move';
                            seatElement.classList.add(...STUDENT_CLASSES.DRAGGING.split(' '));
                        }
                    });
                    
                    seatElement.addEventListener('dragend', () => {
                        seatElement.classList.remove(...STUDENT_CLASSES.DRAGGING.split(' '));
                    });
                }
            } else {
                // Remove occupied state classes
                seatElement.classList.remove(...SEAT_CLASSES.OCCUPIED.split(' '));
                // Add empty state classes
                seatElement.classList.add(...SEAT_CLASSES.EMPTY.split(' '));
                
                seatElement.draggable = false;
                contentElement.innerHTML = seat.id;
                contentElement.title = '';
                contentElement.classList.remove('hidden');
                photoElement.classList.add('hidden');
                seatElement.style.cursor = 'pointer';
                
                // Remove drag and click functionality
                seatElement.removeAttribute('data-drag-enabled');
                seatElement.removeAttribute('data-click-enabled');
            }
        }
    }



    setupSidebarDropZone() {
        const dropZones = [this.sidebar, this.studentList];
        
        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (!this.sidebarCollapsed) {
                    this.sidebar.classList.add('bg-blue-50');
                }
            });
            
            zone.addEventListener('dragleave', (e) => {
                if (!zone.contains(e.relatedTarget)) {
                    this.sidebar.classList.remove('bg-blue-50');
                }
            });
            
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                this.sidebar.classList.remove('bg-blue-50');
                const studentId = e.dataTransfer.getData('text/plain');
                this.removeStudentFromSeat(studentId);
            });
        });
    }

    removeStudent(studentId) {
        this.students = this.students.filter(s => String(s.id) !== String(studentId));
        this.seats.forEach(seat => {
            if (seat.student && String(seat.student.id) === String(studentId)) {
                seat.student = null;
            }
        });
        this.updateDisplay();
        this.saveData();
    }

    toggleEmptyState() {
        const hasWaitingStudents = this.students.some(s => !s.seated);
        this.emptyStudentState.style.display = hasWaitingStudents ? 'none' : 'block';
    }

    printClassroom() {
        // Close any open modals before printing
        if (window.modalManager) {
            window.modalManager.closeModal('addStudent');
            window.modalManager.closeModal('addList');
        }
        
        if (window.photoManager) {
            window.photoManager.closeModal();
        }
        
        // Hide any visible modals or overlays
        const modals = document.querySelectorAll('.fixed, [id*="modal"], [id*="Modal"]');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
        
        // Small delay to ensure modals are hidden and styles are applied, then print
        setTimeout(() => {
            window.print();
            
            // Restore modals after printing (in case user cancels print dialog)
            setTimeout(() => {
                modals.forEach(modal => {
                    modal.style.display = '';
                });
            }, 1000);
        }, 100);
    }

    // localStorage functionality
    saveData() {
        try {
            const data = {
                students: this.students,
                seats: this.seats.map(seat => ({
                    id: seat.id,
                    student: seat.student,
                    side: seat.side,
                    row: seat.row,
                    col: seat.col
                })),
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            
            // Show save indicator
            if (this.saveStatus) {
                const originalText = this.saveStatus.textContent;
                this.saveStatus.textContent = 'Saved ✓';
                this.saveStatus.style.color = '#16a34a';
                
                setTimeout(() => {
                    this.saveStatus.textContent = originalText;
                    this.saveStatus.style.color = '';
                }, 1000);
            }
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
            if (this.saveStatus) {
                this.saveStatus.textContent = 'Save failed ✗';
                this.saveStatus.style.color = '#dc2626';
                
                setTimeout(() => {
                    this.saveStatus.textContent = 'Auto-save enabled';
                    this.saveStatus.style.color = '';
                }, 2000);
            }
        }
    }

    loadData() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const data = JSON.parse(savedData);
                
                // Load students
                if (data.students && Array.isArray(data.students)) {
                    this.students = data.students;
                }
                
                // Load seat assignments
                if (data.seats && Array.isArray(data.seats)) {
                    data.seats.forEach(savedSeat => {
                        const seat = this.seats.find(s => s.id === savedSeat.id);
                        if (seat && savedSeat.student) {
                            seat.student = savedSeat.student;
                        }
                    });
                }
                
                console.log('Data loaded from localStorage successfully');
            }
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
        }
    }

    clearData() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('Data cleared from localStorage');
        } catch (error) {
            console.error('Error clearing data from localStorage:', error);
        }
    }

    handleClearData() {
        if (confirm('Are you sure you want to clear all saved data? This will remove all students and seating arrangements permanently.')) {
            this.clearData();
            this.students = [];
            this.seats.forEach(seat => seat.student = null);
            this.updateDisplay();
            alert('All saved data has been cleared successfully.');
        }
    }
}
