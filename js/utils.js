// Utility functions and constants

const SEAT_CONFIG = {
    ROWS: 6,
    COLS: 4,
    TOTAL_SEATS_PER_SIDE: 24
};

const SEAT_CLASSES = {
    BASE: 'seat-base min-h-36 w-full flex flex-col items-center justify-start cursor-pointer p-3',
    OCCUPIED: 'seat-occupied',
    HOVER: 'hover:border-blue-400',
    EMPTY: 'border-gray-300'
};

const STUDENT_CLASSES = {
    LIST_ITEM: 'student-item cursor-move',
    AVATAR: 'w-8 h-8 rounded-full flex items-center justify-center mr-3',
    DRAGGING: 'opacity-50'
};

// Utility functions
const Utils = {
    generateId() {
        return String(Date.now()) + String(Math.random()).substr(2);
    },

    getStudentDisplayName(name) {
        return name.trim();
    },

    formatNameForTwoLines(name) {
        const trimmedName = name.trim();
        const words = trimmedName.split(' ');
        
        if (words.length <= 2) {
            return trimmedName;
        }
        
        // Try to split into roughly equal halves
        const midPoint = Math.ceil(words.length / 2);
        const firstLine = words.slice(0, midPoint).join(' ');
        const secondLine = words.slice(midPoint).join(' ');
        
        return `${firstLine}<br>${secondLine}`;
    },

    createElement(tag, className, innerHTML = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    },

    toggleClass(element, className, condition) {
        if (condition) {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Remove Vietnamese accents/diacritics
    removeAccents(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    },

    // Search with accent-insensitive matching
    searchMatch(text, query) {
        const normalizedText = this.removeAccents(text);
        const normalizedQuery = this.removeAccents(query);
        return normalizedText.includes(normalizedQuery);
    }
};
