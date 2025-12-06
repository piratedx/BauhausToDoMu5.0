// IMPROVED: Centralized CSV utilities for better maintainability
        const CSVUtils = {
            /**
             * Escapes a field for CSV export
             * @param {any} field - The field to escape
             * @returns {string} - Escaped field suitable for CSV
             */
            escape(field) {
                if (field === null || field === undefined) return '';
                const str = String(field);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            },

            /**
             * Strips HTML tags from a string
             * @param {string} html - HTML string to strip
             * @returns {string} - Plain text without HTML tags
             */
            stripHTML(html) {
                const div = document.createElement('div');
                div.innerHTML = html;
                return div.textContent || div.innerText || '';
            },

            /**
             * Parses a CSV line handling quoted fields and commas
             * @param {string} line - CSV line to parse
             * @returns {Array<string>} - Array of field values
             */
            parseLine(line) {
                const result = [];
                let current = '';
                let inQuotes = false;
                
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    const nextChar = line[i + 1];
                    
                    if (char === '"' && inQuotes && nextChar === '"') {
                        current += '"';
                        i++;
                    } else if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        result.push(current);
                        current = '';
                    } else {
                        current += char;
                    }
                }
                result.push(current);
                return result;
            }
        };

        // IMPROVED: Centralized task schema for consistent task normalization
        const TaskSchema = {
            /**
             * Default values for task fields
             */
            defaults: {
                id: () => Date.now().toString() + Math.random().toString().substring(2),
                text: 'Untitled Task',
                description: '',
                date: (appInstance) => appInstance.getDateString(new Date()),
                section: 'home',
                workCategories: () => [],
                teamMembers: () => [],
                deadline: null,
                completed: false,
                completedAt: null,
                createdAt: () => new Date().toISOString(),
                modifiedAt: () => new Date().toISOString(),
                carriedFrom: null,
                tags: () => [],
                priority: false
            },

            /**
             * Normalizes a raw task object, applying defaults and parsing fields
             * @param {Object} rawTask - Raw task data (e.g., from CSV or user input)
             * @param {Object} appInstance - Reference to app for context-dependent defaults
             * @returns {Object} - Normalized task object
             */
            normalize(rawTask, appInstance) {
                const task = {};
                
                // Process each field with defaults and type coercion
                task.id = rawTask.id || this.defaults.id();
                task.text = rawTask.text || this.defaults.text;
                task.description = rawTask.description || this.defaults.description;
                task.date = rawTask.date || (appInstance ? this.defaults.date(appInstance) : new Date().toISOString().split('T')[0]);
                task.section = rawTask.section || this.defaults.section;
                
                // Parse arrays from semicolon-separated strings or use as-is
                task.workCategories = Array.isArray(rawTask.workCategories) 
                    ? rawTask.workCategories 
                    : (rawTask.workCategories && rawTask.workCategories.trim()) 
                        ? rawTask.workCategories.split(';').filter(Boolean)
                        : this.defaults.workCategories();
                
                task.tags = Array.isArray(rawTask.tags)
                    ? rawTask.tags
                    : (rawTask.tags && rawTask.tags.trim())
                        ? rawTask.tags.split(';').filter(Boolean)
                        : this.defaults.tags();
                
                // Handle teamMembers array (with backward compatibility)
                if (rawTask.teamMembers) {
                    if (Array.isArray(rawTask.teamMembers)) {
                        task.teamMembers = rawTask.teamMembers.filter(m => m && m.trim());
                    } else if (typeof rawTask.teamMembers === 'string' && rawTask.teamMembers.trim()) {
                        task.teamMembers = rawTask.teamMembers.split(';').map(m => m.trim()).filter(m => m);
                    } else {
                        task.teamMembers = this.defaults.teamMembers();
                    }
                } else if (rawTask.teamMember && rawTask.teamMember.trim()) {
                    task.teamMembers = [rawTask.teamMember.trim()];
                } else {
                    task.teamMembers = this.defaults.teamMembers();
                }
                
                task.deadline = (rawTask.deadline && rawTask.deadline.trim())
                    ? rawTask.deadline
                    : this.defaults.deadline;
                
                // Parse booleans
                task.completed = rawTask.completed === true || rawTask.completed === 'true';
                task.priority = rawTask.priority === true || rawTask.priority === 'true';
                
                // Handle timestamp fields
                task.completedAt = (rawTask.completedAt && rawTask.completedAt.trim())
                    ? rawTask.completedAt
                    : this.defaults.completedAt;
                
                task.createdAt = (rawTask.createdAt && rawTask.createdAt.trim())
                    ? rawTask.createdAt
                    : this.defaults.createdAt();
                
                task.modifiedAt = (rawTask.modifiedAt && rawTask.modifiedAt.trim())
                    ? rawTask.modifiedAt
                    : (rawTask.createdAt && rawTask.createdAt.trim())
                        ? rawTask.createdAt
                        : this.defaults.modifiedAt();
                
                task.carriedFrom = (rawTask.carriedFrom && rawTask.carriedFrom.trim())
                    ? rawTask.carriedFrom
                    : this.defaults.carriedFrom;
                
                // Handle deletedAt separately (only for deleted tasks)
                if (rawTask.deletedAt !== undefined) {
                    task.deletedAt = (rawTask.deletedAt && rawTask.deletedAt.trim())
                        ? rawTask.deletedAt
                        : undefined;
                }
                
                return task;
            }
        };

        // ========================================
        // DOM CACHE - Cache frequently accessed DOM elements
        // ========================================
        const DOMCache = {
            elements: {},
            
            init() {
                const elementIds = [
                    'homeInput', 'workInput', 'teamInput',
                    'homeTasks', 'workTasks', 'teamTasks',
                    'editModal', 'categoryModal', 'teamModal', 'deadlineModal',
                    'editTitle', 'editDescription', 'editDate',
                    'workCategoryCheckboxes', 'teamMemberSelect',
                    'categoryList', 'teamMemberList',
                    'newCategoryInput', 'newTeamMemberInput',
                    'workTabs', 'teamTabs',
                    'dayView', 'weekView', 'monthView',
                    'weekDays', 'monthContent',
                    'currentDate', 'undoBtn',
                    'notesEditor',
                    'dataSourceIndicator', 'saveJsonBtn'
                ];
                
                elementIds.forEach(id => {
                    const element = document.getElementById(id);
                    if (element) {
                        this.elements[id] = element;
                    } else {
                        console.warn(`DOMCache: Element not found - ${id}`);
                    }
                });
                
                return this;
            },
            
            get(elementId) {
                if (!this.elements[elementId]) {
                    // Try to get it directly if not cached
                    this.elements[elementId] = document.getElementById(elementId);
                }
                return this.elements[elementId];
            },
            
            reset() {
                this.elements = {};
                return this.init();
            }
        };

        // ========================================
        // STORAGE SERVICE - Centralized localStorage management
        // ========================================
        const StorageService = {
            save(key, data) {
                try {
                    const serialized = JSON.stringify(data);
                    localStorage.setItem(key, serialized);
                    return { success: true };
                } catch (error) {
                    console.error(`StorageService: Failed to save ${key}`, error);
                    return { success: false, error: error.message };
                }
            },
            
            load(key, defaultValue = null) {
                try {
                    const item = localStorage.getItem(key);
                    return item ? JSON.parse(item) : defaultValue;
                } catch (error) {
                    console.error(`StorageService: Failed to load ${key}`, error);
                    return defaultValue;
                }
            },
            
            remove(key) {
                try {
                    localStorage.removeItem(key);
                    return { success: true };
                } catch (error) {
                    console.error(`StorageService: Failed to remove ${key}`, error);
                    return { success: false, error: error.message };
                }
            },
            
            clear() {
                try {
                    localStorage.clear();
                    return { success: true };
                } catch (error) {
                    console.error('StorageService: Failed to clear storage', error);
                    return { success: false, error: error.message };
                }
            }
        };

        // ========================================
        // FILE STORAGE SERVICE - JSON file-based persistence
        // ========================================
        const FileStorageService = {
            dataFile: 'bauhaus-data.json',
            
            /**
             * Load all data from JSON file
             * @returns {Object|null} - Data object or null if file doesn't exist
             */
            async loadAll() {
                try {
                    const response = await fetch(this.dataFile);
                    if (!response.ok) {
                        console.log('FileStorageService: No existing data file found');
                        return null;
                    }
                    const data = await response.json();
                    console.log('FileStorageService: Loaded data from file');
                    return data;
                } catch (error) {
                    console.error('FileStorageService: Failed to load data file', error);
                    return null;
                }
            },
            
            /**
             * Save all data to JSON file (downloads to user's computer)
             * @param {Object} data - Complete data object to save
             * @returns {Object} - Success/failure result
             */
            async saveAll(data) {
                try {
                    const jsonString = JSON.stringify(data, null, 2); // Pretty print with 2 spaces
                    const blob = new Blob([jsonString], { type: 'application/json' });
                    
                    // Create a download link and trigger it
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = this.dataFile;
                    a.click();
                    URL.revokeObjectURL(url);
                    
                    console.log('FileStorageService: Data saved to file');
                    return { success: true };
                } catch (error) {
                    console.error('FileStorageService: Failed to save data file', error);
                    return { success: false, error: error.message };
                }
            },
            
            /**
             * Create a data object from current app state
             * @param {Object} app - App instance
             * @returns {Object} - Complete data object
             */
            createDataObject(app) {
                return {
                    version: '4.6',
                    lastUpdated: new Date().toISOString(),
                    tasks: app.tasks || [],
                    deletedTasks: app.deletedTasks || [],
                    notes: app.notes || '',
                    workCategories: app.workCategories || [],
                    teamMembers: app.CONFIG.TEAM_MEMBERS || [],
                    sectionOrder: app.sectionOrder || app.getDefaultSectionOrder()
                };
            },
            
            /**
             * Load data object into app state
             * @param {Object} app - App instance
             * @param {Object} data - Data object to load
             */
            loadDataIntoApp(app, data) {
                if (!data) return;
                
                if (data.tasks) {
                    app.tasks = data.tasks;
                    // Handle legacy workCategory migration
                    app.tasks.forEach(task => {
                        if (task.workCategory !== undefined && !task.workCategories) {
                            task.workCategories = task.workCategory ? [task.workCategory] : [];
                            delete task.workCategory;
                        }
                        if (!task.workCategories) {
                            task.workCategories = [];
                        }
                    });
                }
                
                if (data.deletedTasks) {
                    app.deletedTasks = data.deletedTasks;
                }
                
                if (data.notes !== undefined) {
                    // Handle both old (object) and new (string) format
                    if (typeof data.notes === 'string') {
                        app.notes = data.notes;
                    } else if (typeof data.notes === 'object') {
                        const allNotes = Object.values(data.notes).filter(n => n && n.trim());
                        app.notes = allNotes.length > 0 ? allNotes[allNotes.length - 1] : '';
                    }
                }
                
                if (data.workCategories) {
                    app.workCategories = data.workCategories;
                }
                
                if (data.teamMembers) {
                    app.CONFIG.TEAM_MEMBERS = data.teamMembers;
                }
                
                if (data.sectionOrder) {
                    app.sectionOrder = data.sectionOrder;
                }
                
                console.log('FileStorageService: Data loaded into app');
            }
        };

        // ========================================
        // VALIDATOR - Centralized validation logic
        // ========================================
        const Validator = {
            // Get reference to config (will be set by app on init)
            config: null,
            
            init(config) {
                this.config = config;
                return this;
            },
            
            // Task text validation
            taskText(text) {
                if (!text || text.trim().length === 0) {
                    return { valid: false, error: 'Task text cannot be empty' };
                }
                
                if (text.length > this.config.VALIDATION.MAX_TASK_TEXT) {
                    return { 
                        valid: false, 
                        error: `Task text too long (max ${this.config.VALIDATION.MAX_TASK_TEXT} characters)` 
                    };
                }
                
                return { valid: true };
            },
            
            // Description validation
            description(description) {
                if (description && description.length > this.config.VALIDATION.MAX_DESCRIPTION) {
                    return {
                        valid: false,
                        error: `Description too long (max ${this.config.VALIDATION.MAX_DESCRIPTION} characters)`
                    };
                }
                return { valid: true };
            },
            
            // Work categories validation
            workCategories(categories) {
                if (!Array.isArray(categories)) {
                    return { valid: false, error: 'Categories must be an array' };
                }
                
                if (categories.length > this.config.VALIDATION.MAX_CATEGORIES_PER_TASK) {
                    return {
                        valid: false,
                        error: `Too many categories (max ${this.config.VALIDATION.MAX_CATEGORIES_PER_TASK})`
                    };
                }
                
                return { valid: true };
            },
            
            // Section validation
            section(section) {
                const validSections = [this.config.SECTIONS.HOME, this.config.SECTIONS.WORK, this.config.SECTIONS.TEAM];
                if (!validSections.includes(section)) {
                    return { 
                        valid: false, 
                        error: `Invalid section: ${section}` 
                    };
                }
                return { valid: true };
            },
            
            // Team member name validation
            teamMemberName(name) {
                if (!name || name.trim().length === 0) {
                    return { valid: false, error: 'Team member name cannot be empty' };
                }
                
                if (name.length > 50) {
                    return { valid: false, error: 'Team member name too long (max 50 characters)' };
                }
                
                return { valid: true };
            },
            
            // Category name validation
            categoryName(name) {
                if (!name || name.trim().length === 0) {
                    return { valid: false, error: 'Category name cannot be empty' };
                }
                
                if (name.length > 50) {
                    return { valid: false, error: 'Category name too long (max 50 characters)' };
                }
                
                return { valid: true };
            },
            
            // Complete task validation
            task(task) {
                const textResult = this.taskText(task.text);
                if (!textResult.valid) return textResult;
                
                if (task.description) {
                    const descResult = this.description(task.description);
                    if (!descResult.valid) return descResult;
                }
                
                if (task.workCategories) {
                    const catResult = this.workCategories(task.workCategories);
                    if (!catResult.valid) return catResult;
                }
                
                const sectionResult = this.section(task.section);
                if (!sectionResult.valid) return sectionResult;
                
                return { valid: true };
            }
        };

        // ========================================
        // MAIN APPLICATION OBJECT
        // ========================================
        const app = {
            CONFIG: {
                ANIMATION: {
                    COMPLETION_DELAY: 10,
                    COMPLETION_TOTAL: 2210,
                    COMPLETION_GLOW: 600,
                    DRAG_FEEDBACK: 300,
                    WAVE_1_END: 610,
                    WAVE_2_END: 1110,
                    WAVE_3_END: 1510,
                    FADE_END: 2210,
                    GLOW_END: 2810
                },
                STORAGE: {
                    TASKS: 'bauhausTasks',
                    DELETED_TASKS: 'bauhausDeletedTasks',
                    WORK_CATEGORIES: 'bauhausWorkCategories',
                    TEAM_MEMBERS: 'bauhausTeamMembers',
                    NOTES: 'bauhausNotes',
                    SECTION_ORDER: 'bauhausSectionOrder',
                    LAST_UPDATED: 'lastUpdated'
                },
                VALIDATION: {
                    MAX_TASK_TEXT: 500,
                    MAX_DESCRIPTION: 5000,
                    MAX_TAGS: 10,
                    MAX_CATEGORIES_PER_TASK: 10,
                    MAX_WORK_CATEGORIES: 20,
                    MIN_TASK_TEXT: 1
                },
                SECTIONS: {
                    HOME: 'home',
                    WORK: 'work',
                    TEAM: 'team',
                    NOTES: 'notes'
                },
                TEAM_MEMBERS: ['Susie', 'Mungo', 'Jessica', 'Tim', 'Russell'],
                VIEWS: {
                    DAY: 'day',
                    WEEK: 'week',
                    MONTH: 'month'
                },
                HISTORY: {
                    MAX_UNDO_STATES: 5
                },
                DELETED: {
                    RETENTION_DAYS: 30
                },
                WORK_HOURS: {
                    START: 9,
                    END: 17
                },
                UI: {
                    MAX_TASKS_PREVIEW_WEEK: 5,
                    MAX_TASKS_PREVIEW_MONTH: 10,
                    ERROR_DISPLAY_DURATION: 3000,
                    SNOOZE_DAYS: 1
                },
                TIMEZONE: 'Australia/Melbourne'
            },
            
            currentDate: null,
            currentView: 'day',
            tasks: [],
            deletedTasks: [],
            notes: '', // Store persistent notes (same across all days)
            editingTaskId: null,
            draggedTask: null,
            draggedCategory: null,
            history: [],
            pendingDeleteId: null,
            pendingDeadlineTaskId: null, // Track task being edited for deadline
            justCompletedTaskId: null,
            savedSelection: null, // For task description color picker
            savedNotesSelection: null, // For notes color picker
            draggedSection: null, // For section reordering
            sectionOrder: null, // Will be set based on time or saved preference
            dataSource: 'none', // Track where data was loaded from: 'json', 'localStorage', or 'none'
            hasUnsavedChanges: false, // Track if changes have been made since last JSON save
            lastJsonSaveTime: null, // Track when we last saved to JSON
            savedDirectoryHandle: null, // Track the user's chosen save folder

            getMelbourneDate() {
                const now = new Date();
                const melbourneTime = new Date(now.toLocaleString('en-US', { timeZone: this.CONFIG.TIMEZONE }));
                return melbourneTime;
            },

            getDefaultSectionOrder() {
                // Smart default: WORK first during work hours (9am-5pm Mon-Fri Melbourne time)
                // Otherwise HOME first
                const melbourneTime = this.getMelbourneDate();
                const hour = melbourneTime.getHours();
                const dayOfWeek = melbourneTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
                
                // Check if it's a weekday (Monday-Friday)
                const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
                
                // Check if it's work hours (9am-5pm)
                const isWorkHours = hour >= this.CONFIG.WORK_HOURS.START && hour < this.CONFIG.WORK_HOURS.END;
                
                if (isWeekday && isWorkHours) {
                    // Work hours: WORK section first
                    return ['work', 'home', 'team', 'notes'];
                } else {
                    // Off hours: HOME section first
                    return ['home', 'work', 'team', 'notes'];
                }
            },
            currentWorkCategory: 'all',
            currentTeamMember: 'all', // Track current team member filter
            workCategories: [
                'digital-tech',
                'curriculum',
                'digital-design',
                'networking',
                'team-management',
                'studio'
            ],
            
            placeholders: [
                "Convince the dragon to take a day off",
                "Debug the time machine (again)",
                "Teach Shakespeare how to use emojis 🎭",
                "Negotiate peace treaty with the robot uprising",
                "Find the lost city of Atlantis (check basement first)",
                "Finish building the Death Star, but ethical this time",
                "Train a unicorn to do parkour",
                "Write a sitcom about ancient Rome",
                "Invent a new color (not blue-ish green)",
                "Convince Zeus to stop messing with mortals",
                "Build a bridge from reality to fiction",
                "Teach cavemen about cryptocurrency",
                "Organize Napoleon's comeback tour",
                "Fix the fabric of spacetime (torn near kitchen)",
                "Interview a vampire for the HR position",
                "Get Sherlock Holmes to solve the mystery of missing socks",
                "Persuade the aliens that Earth is worth visiting",
                "Write Hamlet 2: Electric Boogaloo",
                "Train the kraken in customer service",
                "Build a rocket ship out of IKEA furniture",
                "Convince Einstein that yes, God does play dice",
                "Start a boy band with historical figures",
                "Teach Gandalf how to use a smartphone",
                "Make friends with the monster under the bed",
                "Organize a flash mob in ancient Egypt"
            ],

            // ========================================
            // INITIALIZATION
            // ========================================
            
            init() {
                // Initialize utilities
                DOMCache.init();
                Validator.init(this.CONFIG);
                
                // Initialize state
                this.currentDate = this.getMelbourneDate();
                
                // Setup keyboard shortcuts
                document.addEventListener('keydown', (e) => {
                    // Ctrl+Z (Windows/Linux) or Cmd+Z (Mac) for undo
                    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                        // Don't trigger if user is typing in an input/textarea/contenteditable
                        const activeEl = document.activeElement;
                        const isTyping = activeEl && (
                            activeEl.tagName === 'INPUT' || 
                            activeEl.tagName === 'TEXTAREA' || 
                            activeEl.isContentEditable
                        );
                        
                        if (!isTyping && this.history.length > 0) {
                            e.preventDefault();
                            this.undo();
                        }
                    }
                    
                    // Ctrl+K (Windows/Linux) or Cmd+K (Mac) for link in rich text editor
                    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                        const activeEl = document.activeElement;
                        
                        // Check if we're in the edit modal description editor
                        if (activeEl && activeEl.id === 'editDescription') {
                            e.preventDefault();
                            this.createLink();
                        }
                        // Check if we're in the notes editor
                        else if (activeEl && activeEl.id === 'notesEditor') {
                            e.preventDefault();
                            this.createNotesLink();
                        }
                    }
                    
                    // Ctrl+S (Windows/Linux) or Cmd+S (Mac) to save JSON
                    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                        e.preventDefault();
                        this.saveToJSON();
                    }
                });
                
                // Load data: Try JSON first, then localStorage
                this.loadDataOnStartup();
                this.loadCategories();
                this.loadTeamMembers();
                this.loadNotes();
                this.loadSectionOrder();

                // Allow Cmd/Ctrl+click on links in notes editor while in edit mode
                const notesEditorEl = DOMCache.get('notesEditor');
                if (notesEditorEl) {
                    notesEditorEl.addEventListener('click', (e) => {
                        const link = e.target.closest && e.target.closest('a');
                        if (!link) return;
                        // Require modifier key so normal click still lets you edit text
                        if (e.metaKey || e.ctrlKey) {
                            e.preventDefault();
                            const href = link.getAttribute('href');
                            if (href) {
                                window.open(href, '_blank', 'noopener,noreferrer');
                            }
                        }
                    });
                }
                

                // Track when pointer down begins inside any rich text editor so we can block section drag
                this.dragFromRichEditor = false;
                document.addEventListener('mousedown', (e) => {
                    const inRich = e.target.closest && e.target.closest('.rich-editor');
                    this.dragFromRichEditor = !!inRich;
                });
                document.addEventListener('mouseup', () => {
                    this.dragFromRichEditor = false;
                });

                // Initialize UI
                this.renderWorkTabs();
                this.renderTeamTabs();
                this.setRandomPlaceholders();
                this.render();
                this.updateDataSourceIndicator();
            },

            setRandomPlaceholders() {
                const homeInput = DOMCache.get('homeInput');
                const workInput = DOMCache.get('workInput');
                const teamInput = DOMCache.get('teamInput');
                if (homeInput) homeInput.placeholder = this.getRandomPlaceholder();
                if (workInput) workInput.placeholder = this.getRandomPlaceholder();
                if (teamInput) teamInput.placeholder = this.getRandomPlaceholder();
            },

            getRandomPlaceholder() {
                return this.placeholders[Math.floor(Math.random() * this.placeholders.length)];
            },

            // ========================================
            // DATA PERSISTENCE - Loading and saving to localStorage
            // ========================================
            
            async loadDataOnStartup() {
                console.log('🔄 Stage 2: Attempting to load data...');
                
                // Try to load from JSON file first
                const jsonData = await FileStorageService.loadAll();
                
                if (jsonData) {
                    console.log('✅ Loaded from JSON file');
                    FileStorageService.loadDataIntoApp(this, jsonData);
                    this.dataSource = 'json';
                    this.hasUnsavedChanges = false;
                    this.lastJsonSaveTime = new Date().toISOString();
                    
                    // Also save to localStorage as backup
                    this.saveTasks();
                    this.saveCategories();
                    this.saveTeamMembers();
                    this.saveNotes();
                    this.saveSectionOrder();
                    
                    console.log('💾 Synced to localStorage as backup');
                } else {
                    console.log('📂 No JSON file found, loading from localStorage');
                    this.loadTasks();
                    this.loadCategories();
                    this.loadTeamMembers();
                    this.loadNotes();
                    this.loadSectionOrder();
                    this.dataSource = 'localStorage';
                    this.hasUnsavedChanges = true; // Encourage saving to JSON
                }
            },
            
            loadTasks() {
                const saved = StorageService.load(this.CONFIG.STORAGE.TASKS, null);
                if (saved) {
                    this.tasks = saved;
                    this.tasks.forEach(task => {
                        if (task.workCategory !== undefined && !task.workCategories) {
                            task.workCategories = task.workCategory ? [task.workCategory] : [];
                            delete task.workCategory;
                        }
                        if (!task.workCategories) {
                            task.workCategories = [];
                        }
                    });
                }
                
                const savedDeleted = StorageService.load(this.CONFIG.STORAGE.DELETED_TASKS, null);
                if (savedDeleted) {
                    this.deletedTasks = savedDeleted;
                }
            },

            loadNotes() {
                const saved = StorageService.load(this.CONFIG.STORAGE.NOTES, null);
                if (saved) {
                    // Handle both old (object) and new (string) format
                    if (typeof saved === 'string') {
                        this.notes = saved;
                    } else if (typeof saved === 'object') {
                        // Old format: combine all date-based notes into one
                        const allNotes = Object.values(saved).filter(n => n && n.trim());
                        this.notes = allNotes.length > 0 ? allNotes[allNotes.length - 1] : '';
                    }
                }
            },

            saveTasks() {
                StorageService.save(this.CONFIG.STORAGE.TASKS, this.tasks);
                StorageService.save(this.CONFIG.STORAGE.DELETED_TASKS, this.deletedTasks);
                this.markDataChanged();
            },

            saveNotes() {
                const editor = DOMCache.get('notesEditor');
                if (editor) {
                    this.notes = editor.innerHTML;
                    StorageService.save(this.CONFIG.STORAGE.NOTES, this.notes);
                    this.markDataChanged();
                }
            },

            loadNotesForCurrentDate() {
                const editor = DOMCache.get('notesEditor');
                if (editor) {
                    editor.innerHTML = this.notes || '';
                    this.fixEditorLinks(editor);
                }
            },

            getLinkAtSelection(editorId) {
                const editor = DOMCache.get(editorId);
                if (!editor) return null;
                const selection = window.getSelection && window.getSelection();
                if (!selection || selection.rangeCount === 0) return null;
                const range = selection.getRangeAt(0);
                let node = range.startContainer;
                if (!editor.contains(node)) return null;
                if (node.nodeType === Node.TEXT_NODE) {
                    node = node.parentNode;
                }
                if (!node) return null;
                if (node.tagName && node.tagName.toLowerCase() === 'a') {
                    return node;
                }
                return node.closest ? node.closest('a') : null;
            },


            saveCategories() {
                StorageService.save(this.CONFIG.STORAGE.WORK_CATEGORIES, this.workCategories);
                this.markDataChanged();
            },

            loadCategories() {
                const saved = StorageService.load(this.CONFIG.STORAGE.WORK_CATEGORIES, null);
                if (saved) {
                    this.workCategories = saved;
                }
            },

            loadSectionOrder() {
                const saved = StorageService.load(this.CONFIG.STORAGE.SECTION_ORDER, null);
                if (saved) {
                    // User has a saved preference, use it
                    this.sectionOrder = saved;
                } else {
                    // No saved preference, use smart default based on time
                    this.sectionOrder = this.getDefaultSectionOrder();
                }
            },

            saveSectionOrder() {
                StorageService.save(this.CONFIG.STORAGE.SECTION_ORDER, this.sectionOrder);
                this.markDataChanged();
            },

            // ========================================
            // HISTORY & UNDO - Managing undo states
            // ========================================
            
            saveToHistory() {
                this.history.push(JSON.parse(JSON.stringify(this.tasks)));
                if (this.history.length > this.CONFIG.HISTORY.MAX_UNDO_STATES) {
                    this.history.shift();
                }
                this.updateUndoButton();
            },

            updateUndoButton() {
                const undoBtn = DOMCache.get('undoBtn');
                if (undoBtn) {
                    undoBtn.disabled = this.history.length === 0;
                }
            },

            undo() {
                if (this.history.length > 0) {
                    this.tasks = this.history.pop();
                    this.updateUndoButton();
                    this.updateUI();
                }
            },

            // ========================================
            // DATE & TIME UTILITIES - Formatting and manipulation
            // ========================================
            
            getDateString(date) {
                return date.toISOString().split('T')[0];
            },

            formatDate(date) {
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
            },

            formatDateShort(date) {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return `${months[date.getMonth()]} ${date.getDate()}`;
            },

            formatDateTime(isoString) {
                if (!isoString) return 'Ã¢â‚¬â€';
                const date = new Date(isoString);
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const hours = date.getHours();
                const minutes = date.getMinutes().toString().padStart(2, '0');
                const ampm = hours >= 12 ? 'pm' : 'am';
                const hour12 = hours % 12 || 12;
                return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} at ${hour12}:${minutes}${ampm}`;
            },

            formatCategoryName(category) {
                if (!category) return '';
                return category.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
            },

            // ========================================
            // NAVIGATION - Date changes and view switching
            // ========================================
            
            changeDate(delta) {
                this.currentDate.setDate(this.currentDate.getDate() + delta);
                this.render();
                this.loadNotesForCurrentDate();
            },

            switchView(view) {
                this.currentView = view;
                document.querySelectorAll('.view-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                event.target.classList.add('active');

                DOMCache.get('dayView').style.display = view === 'day' ? 'grid' : 'none';
                DOMCache.get('weekView').classList.toggle('active', view === 'week');
                DOMCache.get('monthView').classList.toggle('active', view === 'month');
                if (view === 'week') this.renderWeekView();
                if (view === 'month') this.renderMonthView();
            },

            toggleSection(button) {
                const section = button.closest('.section');
                section.classList.toggle('minimized');
                // Use + when minimized (collapsed), – when expanded
                button.textContent = section.classList.contains('minimized') ? '+' : '–';
            },

            toggleSectionByHeader(event, header) {
                // Find the minimize button and trigger it
                const button = header.querySelector('.minimize-btn');
                if (button) {
                    this.toggleSection(button);
                }
            },




            // ========================================
            // TASK CRUD OPERATIONS - Create, read, update, delete tasks
            // ========================================
            
            handleInputKeypress(event, section) {
                if (event.key === 'Enter') {
                    this.addTask(section);
                }
            },

            addTask(section) {
                const input = document.getElementById(section + 'Input');
                const text = input.value.trim();
                
                const textValidation = Validator.taskText(text);
                if (!textValidation.valid) {
                    this.showError(textValidation.error, 'validation');
                    return;
                }
                
                const sectionValidation = Validator.section(section);
                if (!sectionValidation.valid) {
                    this.showError(sectionValidation.error, 'validation');
                    return;
                }

                this.saveToHistory();

                let workCategories = [];
                if (section === this.CONFIG.SECTIONS.WORK) {
                    if (this.currentWorkCategory && this.currentWorkCategory !== 'all') {
                        workCategories = [this.currentWorkCategory];
                    } else {
                        workCategories = [];
                    }
                }

                // Auto-assign team member based on current tab
                let teamMembers = [];
                if (section === this.CONFIG.SECTIONS.TEAM) {
                    if (this.currentTeamMember && this.currentTeamMember !== 'all') {
                        teamMembers = [this.currentTeamMember];
                    }
                }

                const task = {
                    id: Date.now().toString(),
                    text: text,
                    description: '',
                    date: this.getDateString(this.currentDate),
                    section: section,
                    workCategories: workCategories,
                    teamMembers: teamMembers,
                    deadline: null,
                    completed: false,
                    completedAt: null,
                    createdAt: new Date().toISOString(),
                    modifiedAt: new Date().toISOString(),
                    carriedFrom: null,
                    tags: [],
                    priority: false
                };

                this.tasks.push(task);
                this.updateUI();
                input.value = '';
                input.placeholder = this.getRandomPlaceholder();
            },

            toggleComplete(taskId) {
                this.saveToHistory();
                const task = this.tasks.find(t => t.id === taskId);
                if (task) {
                    const wasCompleted = task.completed;
                    task.completed = !task.completed;
                    task.completedAt = task.completed ? new Date().toISOString() : null;
                    task.modifiedAt = new Date().toISOString(); // Update modification timestamp
                    this.saveTasks();
                    
                    if (task.completed) {
                        this.justCompletedTaskId = taskId;
                        
                        const taskEl = document.querySelector(`[data-task-id="${taskId}"]`);
                        if (taskEl) {
                            taskEl.classList.add('completed');
                            
                            setTimeout(() => {
                                taskEl.classList.add('completing');
                            }, this.CONFIG.ANIMATION.COMPLETION_DELAY);
                        }
                        
                        setTimeout(() => {
                            this.renderDayView();
                            
                            setTimeout(() => {
                                this.justCompletedTaskId = null;
                            }, this.CONFIG.ANIMATION.COMPLETION_GLOW);
                        }, this.CONFIG.ANIMATION.COMPLETION_TOTAL);
                    } else {
                        this.renderDayView();
                    }
                }
            },

            togglePriority(taskId) {
                this.saveToHistory();
                const task = this.tasks.find(t => t.id === taskId);
                if (task) {
                    task.priority = !task.priority;
                    task.modifiedAt = new Date().toISOString(); // Update modification timestamp
                    this.updateUI();
                }
            },

            deleteTask(taskId) {
                const task = this.tasks.find(t => t.id === taskId);
                if (!task) {
                    this.log('debug', 'Task not found for deletion', { taskId });
                    return;
                }

                this.pendingDeleteId = taskId;
                
                const message = `Are you sure you want to delete "${task.text}"?`;
                DOMCache.get('confirmMessage').textContent = message;
                DOMCache.get('confirmDialog').classList.add('active');
            },

            confirmDelete() {
                if (!this.pendingDeleteId) return;
                
                const task = this.tasks.find(t => t.id === this.pendingDeleteId);
                if (!task) return;
                
                this.saveToHistory();
                
                task.deletedAt = new Date().toISOString();
                this.deletedTasks.push(task);
                
                this.tasks = this.tasks.filter(t => t.id !== this.pendingDeleteId);
                
                this.log('debug', 'Task deleted', { taskId: this.pendingDeleteId });
                
                this.updateUI();
                this.renderRecentlyDeleted();
                
                DOMCache.get('confirmDialog').classList.remove('active');
                this.pendingDeleteId = null;
            },

            cancelDelete() {
                this.log('debug', 'Delete cancelled');
                DOMCache.get('confirmDialog').classList.remove('active');
                this.pendingDeleteId = null;
            },

            snoozeTask(taskId) {
                this.saveToHistory();
                const task = this.tasks.find(t => t.id === taskId);
                if (!task) return;
                
                const currentDate = task.date;
                const taskDate = new Date(currentDate);
                taskDate.setDate(taskDate.getDate() + 1);
                const newDate = this.getDateString(taskDate);
                
                // Mark as carried from previous date
                task.carriedFrom = currentDate;
                task.date = newDate;
                task.modifiedAt = new Date().toISOString();
                
                console.log(`Snoozed task "${task.text}" from ${currentDate} to ${newDate}`);
                
                this.updateUI();
            },

            setDeadline(taskId) {
                const task = this.tasks.find(t => t.id === taskId);
                if (!task) return;
                
                // Store the task ID for later use
                this.pendingDeadlineTaskId = taskId;
                
                // Set the current deadline in the picker
                const deadlinePicker = DOMCache.get('deadlinePicker');
                deadlinePicker.value = task.deadline || '';
                
                // Show the modal
                DOMCache.get('deadlineModal').classList.add('active');
            },

            closeDeadlineModal() {
                DOMCache.get('deadlineModal').classList.remove('active');
                this.pendingDeadlineTaskId = null;
            },

            clearDeadline() {
                if (!this.pendingDeadlineTaskId) return;
                
                const task = this.tasks.find(t => t.id === this.pendingDeadlineTaskId);
                if (!task) return;
                
                this.saveToHistory();
                task.deadline = null;
                task.modifiedAt = new Date().toISOString();
                
                console.log(`Cleared deadline for task "${task.text}"`);
                
                this.updateUI();
                this.closeDeadlineModal();
            },

            saveDeadline() {
                if (!this.pendingDeadlineTaskId) return;
                
                const task = this.tasks.find(t => t.id === this.pendingDeadlineTaskId);
                if (!task) return;
                
                const newDeadline = DOMCache.get('deadlinePicker').value;
                
                if (!newDeadline) {
                    // If no date selected, just close (user should use Clear button)
                    this.closeDeadlineModal();
                    return;
                }
                
                this.saveToHistory();
                task.deadline = newDeadline;
                task.modifiedAt = new Date().toISOString();
                
                console.log(`Set deadline for task "${task.text}" to ${task.deadline}`);
                
                this.updateUI();
                this.closeDeadlineModal();
            },


            toggleDescription(taskId) {
                const descEl = document.getElementById(`desc-${taskId}`);
                const taskEl = document.querySelector(`[data-task-id="${taskId}"]`);
                const button = taskEl.querySelector('.expand-btn');
                
                if (descEl.classList.contains('collapsed')) {
                    descEl.classList.remove('collapsed');
                    button.textContent = '▲';
                } else {
                    descEl.classList.add('collapsed');
                    button.textContent = '▼';
                }
            },

            toggleRecentlyDeleted() {
                const container = DOMCache.get('deletedTasks');
                const button = DOMCache.get('deletedToggle');
                
                if (container.classList.contains('collapsed')) {
                    container.classList.remove('collapsed');
                    button.textContent = '→';
                } else {
                    container.classList.add('collapsed');
                    button.textContent = '+';
                }
            },

            // ========================================
            // WORK CATEGORY MANAGEMENT - Work section tabs and categories
            // ========================================
            
            renderWorkTabs() {
                const container = DOMCache.get('workTabs');
                const tabs = [
                    { id: 'all', label: 'All', draggable: false },
                    ...this.workCategories.map(cat => ({
                        id: cat,
                        label: this.formatCategoryName(cat),
                        draggable: true
                    }))
                ];

                container.innerHTML = tabs.map(tab => `
                    <button class="work-tab ${tab.id === this.currentWorkCategory ? 'active' : ''}" 
                            ${tab.draggable ? `draggable="true" ondragstart="app.handleCategoryDragStart(event, '${tab.id}')" ondragend="app.handleCategoryDragEnd(event)"` : ''}
                            onclick="app.filterWorkCategory('${tab.id}')">${tab.label}</button>
                `).join('') + `
                    <button class="work-tab" onclick="app.openCategorySettings()" class="settings-btn" title="Manage Categories">⋯</button>
                `;
            },

            renderTeamTabs() {
                const container = DOMCache.get('teamTabs');
                const tabs = [
                    { id: 'all', label: 'All' },
                    ...this.CONFIG.TEAM_MEMBERS.map(member => ({
                        id: member,
                        label: member
                    }))
                ];

                container.innerHTML = tabs.map(tab => `
                    <button class="work-tab ${tab.id === this.currentTeamMember ? 'active' : ''}" 
                            onclick="app.filterTeamMember('${tab.id}')">${tab.label}</button>
                `).join('') + `
                    <button class="work-tab" onclick="app.openTeamSettings()" class="settings-btn" title="Manage Team Members">⋯</button>
                `;
            },

            filterTeamMember(member) {
                this.currentTeamMember = member;
                
                // Update active tab
                const tabs = document.querySelectorAll('#teamTabs .work-tab');
                tabs.forEach(tab => tab.classList.remove('active'));
                event.target.classList.add('active');
                
                this.renderDayView();
            },

            openCategorySettings() {
                DOMCache.get('categoryModal').classList.add('active');
                this.renderCategoryList();
            },

            closeCategorySettings() {
                DOMCache.get('categoryModal').classList.remove('active');
                this.renderWorkTabs();
            },

            renderCategoryList() {
                const container = DOMCache.get('categoryList');
                container.innerHTML = this.workCategories.map((cat, index) => `
                    <div class="category-item" data-category="${cat}">
                        <div class="category-drag-handle">⋮⋮</div>
                        <input type="text" 
                               class="category-name" 
                               value="${this.formatCategoryName(cat)}" 
                               data-original="${cat}"
                               onblur="app.renameCategory('${cat}', this.value)">
                        <div class="category-actions">
                            <button class="category-action-btn delete" 
                                    onclick="app.deleteCategory('${cat}')">Delete</button>
                        </div>
                    </div>
                `).join('');

                this.initCategoryDragDrop();
            },

            initCategoryDragDrop() {
                const items = document.querySelectorAll('.category-item');
                let draggedItem = null;

                items.forEach(item => {
                    item.setAttribute('draggable', true);

                    item.addEventListener('dragstart', (e) => {
                        draggedItem = item;
                        item.style.opacity = '0.5';
                    });

                    item.addEventListener('dragend', (e) => {
                        item.style.opacity = '1';
                    });

                    item.addEventListener('dragover', (e) => {
                        e.preventDefault();
                    });

                    item.addEventListener('drop', (e) => {
                        e.preventDefault();
                        if (draggedItem !== item) {
                            const allItems = [...items];
                            const draggedIndex = allItems.indexOf(draggedItem);
                            const targetIndex = allItems.indexOf(item);

                            const newCategories = [...this.workCategories];
                            const [removed] = newCategories.splice(draggedIndex, 1);
                            newCategories.splice(targetIndex, 0, removed);

                            this.workCategories = newCategories;
                            this.saveCategories();
                            this.renderCategoryList();
                        }
                    });
                });
            },

            handleCategoryInputKeypress(event) {
                if (event.key === 'Enter') {
                    this.addCategory();
                }
            },

            addCategory() {
                const input = DOMCache.get('newCategoryInput');
                const name = input.value.trim();
                
                if (!name) return;

                const categoryId = name.toLowerCase().replace(/\s+/g, '-');

                if (this.workCategories.includes(categoryId)) {
                    alert('Category already exists!');
                    return;
                }

                this.workCategories.push(categoryId);
                this.saveCategories();
                this.renderCategoryList();
                input.value = '';
            },

            deleteCategory(categoryId) {
                if (!confirm(`Delete category "${this.formatCategoryName(categoryId)}"?\n\nTasks in this category will not be deleted.`)) {
                    return;
                }

                this.workCategories = this.workCategories.filter(c => c !== categoryId);
                this.saveCategories();
                this.renderCategoryList();
            },

            renameCategory(oldId, newName) {
                const trimmed = newName.trim();
                if (!trimmed) return;

                const newId = trimmed.toLowerCase().replace(/\s+/g, '-');
                
                if (newId === oldId) return;

                const index = this.workCategories.indexOf(oldId);
                if (index !== -1) {
                    this.workCategories[index] = newId;
                }

                this.tasks.forEach(task => {
                    if (task.workCategories && task.workCategories.includes(oldId)) {
                        const catIndex = task.workCategories.indexOf(oldId);
                        task.workCategories[catIndex] = newId;
                    }
                });

                this.saveCategories();
                this.updateUI();
                this.renderCategoryList();
                this.renderWorkTabs();
            },

            // ========================================
            // TEAM MEMBER MANAGEMENT - Team section tabs and members
            // ========================================
            
            openTeamSettings() {
                DOMCache.get('teamModal').classList.add('active');
                this.renderTeamMemberList();
            },

            closeTeamSettings() {
                DOMCache.get('teamModal').classList.remove('active');
                this.renderTeamTabs();
            },

            renderTeamMemberList() {
                const container = DOMCache.get('teamMemberList');
                container.innerHTML = this.CONFIG.TEAM_MEMBERS.map((member, index) => `
                    <div class="category-item" data-member="${member}">
                        <div class="category-drag-handle">⋮⋮</div>
                        <input type="text" 
                               class="category-name" 
                               value="${member}" 
                               data-original="${member}"
                               onblur="app.renameTeamMember('${member}', this.value)">
                        <div class="category-actions">
                            <button class="category-action-btn delete" 
                                    onclick="app.deleteTeamMember('${member}')">Delete</button>
                        </div>
                    </div>
                `).join('');

                this.initTeamMemberDragDrop();
            },

            initTeamMemberDragDrop() {
                const items = document.querySelectorAll('#teamMemberList .category-item');
                let draggedItem = null;

                items.forEach(item => {
                    item.setAttribute('draggable', true);

                    item.addEventListener('dragstart', (e) => {
                        draggedItem = item;
                        item.style.opacity = '0.5';
                    });

                    item.addEventListener('dragend', (e) => {
                        item.style.opacity = '1';
                    });

                    item.addEventListener('dragover', (e) => {
                        e.preventDefault();
                    });

                    item.addEventListener('drop', (e) => {
                        e.preventDefault();
                        if (draggedItem !== item) {
                            const allItems = [...items];
                            const draggedIndex = allItems.indexOf(draggedItem);
                            const targetIndex = allItems.indexOf(item);

                            const newMembers = [...this.CONFIG.TEAM_MEMBERS];
                            const [removed] = newMembers.splice(draggedIndex, 1);
                            newMembers.splice(targetIndex, 0, removed);

                            this.CONFIG.TEAM_MEMBERS = newMembers;
                            this.saveTeamMembers();
                            this.renderTeamMemberList();
                        }
                    });
                });
            },

            handleTeamMemberInputKeypress(event) {
                if (event.key === 'Enter') {
                    this.addTeamMember();
                }
            },

            addTeamMember() {
                const input = DOMCache.get('newTeamMemberInput');
                const name = input.value.trim();

                if (!name) {
                    alert('Please enter a team member name');
                    return;
                }

                if (this.CONFIG.TEAM_MEMBERS.includes(name)) {
                    alert('This team member already exists');
                    return;
                }

                this.CONFIG.TEAM_MEMBERS.push(name);
                this.saveTeamMembers();
                this.renderTeamMemberList();
                input.value = '';
            },

            deleteTeamMember(memberName) {
                if (!confirm(`Delete team member "${memberName}"?\n\nTasks assigned to this member will become unassigned.`)) {
                    return;
                }

                this.CONFIG.TEAM_MEMBERS = this.CONFIG.TEAM_MEMBERS.filter(m => m !== memberName);
                
                // Update tasks - remove this member from arrays
                this.tasks.forEach(task => {
                    if (task.teamMembers && task.teamMembers.includes(memberName)) {
                        task.teamMembers = task.teamMembers.filter(m => m !== memberName);
                    }
                });

                this.saveTeamMembers();
                this.renderTeamMemberList();
                this.updateUI();
            },

            renameTeamMember(oldName, newName) {
                const trimmed = newName.trim();
                if (!trimmed || trimmed === oldName) return;

                if (this.CONFIG.TEAM_MEMBERS.includes(trimmed)) {
                    alert('A team member with this name already exists');
                    this.renderTeamMemberList();
                    return;
                }

                const index = this.CONFIG.TEAM_MEMBERS.indexOf(oldName);
                if (index !== -1) {
                    this.CONFIG.TEAM_MEMBERS[index] = trimmed;
                }

                // Update tasks with the new member name
                this.tasks.forEach(task => {
                    if (task.teamMembers && task.teamMembers.includes(oldName)) {
                        task.teamMembers = task.teamMembers.map(m => m === oldName ? trimmed : m);
                    }
                });

                this.saveTeamMembers();
                this.updateUI();
                this.renderTeamMemberList();
                this.renderTeamTabs();
            },

            saveTeamMembers() {
                StorageService.save(this.CONFIG.STORAGE.TEAM_MEMBERS, this.CONFIG.TEAM_MEMBERS);
                this.markDataChanged();
            },
            
            // ========================================
            // STAGE 2: DATA CHANGE TRACKING
            // ========================================
            
            markDataChanged() {
                this.hasUnsavedChanges = true;
                this.updateDataSourceIndicator();
            },
            
            updateDataSourceIndicator() {
                const indicator = DOMCache.get('dataSourceIndicator');
                if (!indicator) return;
                
                let status = '';
                let className = '';
                
                if (this.dataSource === 'json') {
                    if (this.hasUnsavedChanges) {
                        status = '📝 JSON (unsaved changes)';
                        className = 'data-source-unsaved';
                    } else {
                        status = '✅ JSON (saved)';
                        className = 'data-source-json';
                    }
                } else if (this.dataSource === 'localStorage') {
                    status = '💾 localStorage only';
                    className = 'data-source-local';
                } else {
                    status = '🆕 New session';
                    className = 'data-source-new';
                }
                
                indicator.textContent = status;
                indicator.className = `data-source-indicator ${className}`;
                
                // Show/hide save button based on unsaved changes
                const saveBtn = DOMCache.get('saveJsonBtn');
                if (saveBtn) {
                    saveBtn.style.display = this.hasUnsavedChanges ? 'block' : 'none';
                }
            },
            
            async saveToJSON() {
                try {
                    const data = FileStorageService.createDataObject(this);
                    const jsonString = JSON.stringify(data, null, 2);
                    const filename = 'bauhaus-data.json';
                    
                    // Check if File System Access API is supported
                    if ('showSaveFilePicker' in window) {
                        // Modern browsers with File System Access API
                        try {
                            // If we have a saved directory, try to use it
                            if (this.savedDirectoryHandle) {
                                try {
                                    // Request permission if needed
                                    const permission = await this.savedDirectoryHandle.queryPermission({ mode: 'readwrite' });
                                    if (permission === 'granted' || permission === 'prompt') {
                                        // Create file in the saved directory
                                        const fileHandle = await this.savedDirectoryHandle.getFileHandle(filename, { create: true });
                                        const writable = await fileHandle.createWritable();
                                        await writable.write(jsonString);
                                        await writable.close();
                                        
                                        console.log(`✅ Saved to remembered location: ${filename}`);
                                        this.hasUnsavedChanges = false;
                                        this.lastJsonSaveTime = new Date().toISOString();
                                        this.dataSource = 'json';
                                        this.updateDataSourceIndicator();
                                        return;
                                    }
                                } catch (err) {
                                    console.log('Could not use saved location, will prompt for new one:', err.message);
                                    this.savedDirectoryHandle = null;
                                }
                            }
                            
                            // First time or saved location failed - show picker
                            const fileHandle = await window.showSaveFilePicker({
                                suggestedName: filename,
                                types: [{
                                    description: 'JSON Files',
                                    accept: { 'application/json': ['.json'] }
                                }]
                            });
                            
                            const writable = await fileHandle.createWritable();
                            await writable.write(jsonString);
                            await writable.close();
                            
                            // Remember the directory for next time
                            this.savedDirectoryHandle = await fileHandle.getParent();
                            
                            console.log(`✅ Saved to new location: ${filename}`);
                            this.hasUnsavedChanges = false;
                            this.lastJsonSaveTime = new Date().toISOString();
                            this.dataSource = 'json';
                            this.updateDataSourceIndicator();
                            
                        } catch (err) {
                            if (err.name === 'AbortError') {
                                console.log('Save cancelled by user');
                            } else {
                                console.error('Error saving with File System Access API:', err);
                                // Fall back to download
                                this.fallbackSaveToJSON(data);
                            }
                        }
                    } else {
                        // Fallback for browsers without File System Access API
                        this.fallbackSaveToJSON(data);
                    }
                } catch (error) {
                    console.error('Error in saveToJSON:', error);
                    alert('Error saving file: ' + error.message);
                }
            },
            
            fallbackSaveToJSON(data) {
                // Old-style download for browsers without File System Access API
                const jsonString = JSON.stringify(data, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const filename = 'bauhaus-data.json';
                
                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                console.log(`✅ Downloaded: ${filename}`);
                this.hasUnsavedChanges = false;
                this.lastJsonSaveTime = new Date().toISOString();
                this.dataSource = 'json';
                this.updateDataSourceIndicator();
            },
            
            // Add method to change save location
            async changeSaveLocation() {
                if (!('showDirectoryPicker' in window)) {
                    alert('Folder picker not supported in this browser. Files will download to your default Downloads folder.');
                    return;
                }
                
                try {
                    const directoryHandle = await window.showDirectoryPicker({
                        mode: 'readwrite'
                    });
                    
                    this.savedDirectoryHandle = directoryHandle;
                    console.log('✅ Save location updated');
                    alert(`New save location set. Future saves will go to this folder.`);
                } catch (err) {
                    if (err.name === 'AbortError') {
                        console.log('Folder selection cancelled');
                    } else {
                        console.error('Error selecting folder:', err);
                    }
                }
            },

            loadTeamMembers() {
                const saved = StorageService.load(this.CONFIG.STORAGE.TEAM_MEMBERS, null);
                if (saved) {
                    this.CONFIG.TEAM_MEMBERS = saved;
                }
            },

            filterWorkCategory(category) {
                this.currentWorkCategory = category;
                
                const tabs = document.querySelectorAll('.work-tab');
                tabs.forEach(tab => tab.classList.remove('active'));
                event.target.classList.add('active');
                
                this.renderDayView();
            },

            // ========================================
            // MODAL MANAGEMENT - Opening, closing, and managing modals
            // ========================================
            
            openEditModal(taskId) {
                this.editingTaskId = taskId;
                const task = this.tasks.find(t => t.id === taskId);
                if (task) {
                    DOMCache.get('editTitle').value = task.text;
                    
                    const descEditor = DOMCache.get('editDescription');
                    descEditor.innerHTML = task.description || '';
                    
                    // Set the date input
                    DOMCache.get('editDate').value = task.date;
                    
                    const sectionEl = DOMCache.get('editSection');
                    sectionEl.textContent = task.section.toUpperCase();
                    sectionEl.className = `metadata-value ${task.section}`;
                    
                    DOMCache.get('editCreated').textContent = this.formatDateTime(task.createdAt);
                    
                    const categoryGroup = DOMCache.get('workCategoryGroup');
                    const teamMemberGroup = DOMCache.get('teamMemberGroup');
                    const dateGroup = DOMCache.get('editDate').closest('.form-group');
                    
                    if (task.section === 'work') {
                        categoryGroup.style.display = 'block';
                        teamMemberGroup.style.display = 'none';
                        if (dateGroup) dateGroup.style.display = 'block';
                        this.renderWorkCategoryCheckboxes(task.workCategories || []);
                    } else if (task.section === 'team') {
                        categoryGroup.style.display = 'none';
                        teamMemberGroup.style.display = 'block';
                        if (dateGroup) dateGroup.style.display = 'none'; // Hide Move to Date for TEAM tasks
                        this.renderTeamMemberSelect(task.teamMembers || []);
                    } else {
                        categoryGroup.style.display = 'none';
                        teamMemberGroup.style.display = 'none';
                        if (dateGroup) dateGroup.style.display = 'block';
                    }
                    
                    this.renderTags(task.tags || []);
                    
                    DOMCache.get('editModal').classList.add('active');
                }
            },

            renderWorkCategoryCheckboxes(selectedCategories) {
                const container = DOMCache.get('workCategoryCheckboxes');
                container.innerHTML = this.workCategories.map(cat => {
                    const isChecked = selectedCategories.includes(cat);
                    return `
                        <label class="category-checkbox-label ${isChecked ? 'checked' : ''}" data-category="${cat}">
                            <input type="checkbox" 
                                   value="${cat}" 
                                   ${isChecked ? 'checked' : ''}
                                   onchange="app.toggleCategoryCheckbox('${cat}', this.checked)">
                            ${this.formatCategoryName(cat)}
                        </label>
                    `;
                }).join('');
            },

            renderTeamMemberSelect(selectedMembers) {
                const select = DOMCache.get('teamMemberSelect');
                if (!select) return;
                
                const membersArray = Array.isArray(selectedMembers) ? selectedMembers : 
                                    (selectedMembers ? [selectedMembers] : []);
                
                select.innerHTML = this.CONFIG.TEAM_MEMBERS.map(member => {
                    const isSelected = membersArray.includes(member) ? 'selected' : '';
                    return `<option value="${member}" ${isSelected}>${member}</option>`;
                }).join('');
            },

            toggleCategoryCheckbox(category, checked) {
                const label = document.querySelector(`label[data-category="${category}"]`);
                if (checked) {
                    label.classList.add('checked');
                } else {
                    label.classList.remove('checked');
                }
            },

            closeEditModal() {
                DOMCache.get('editModal').classList.remove('active');
                DOMCache.get('colorPicker').classList.remove('active');
                this.editingTaskId = null;
            },

            formatText(command) {
                document.execCommand(command, false, null);
                DOMCache.get('editDescription').focus();
            },

            createLink() {
                const editorId = 'editDescription';
                const existingLink = this.getLinkAtSelection(editorId);
                const currentHref = existingLink ? existingLink.getAttribute('href') || '' : '';
                const raw = prompt('Enter URL:', currentHref);
                if (raw) {
                    const url = this.normalizeUrl(raw);
                    if (existingLink) {
                        existingLink.setAttribute('href', url);
                    } else {
                        document.execCommand('createLink', false, url);
                    }
                    const editor = DOMCache.get(editorId);
                    this.fixEditorLinks(editor);
                }
                DOMCache.get(editorId).focus();
            },

            toggleColorPicker() {
                const picker = DOMCache.get('colorPicker');
                const isActive = picker.classList.contains('active');
                
                if (!isActive) {
                    // Store the current selection when opening
                    this.savedSelection = this.saveSelection();
                }
                
                picker.classList.toggle('active');
            },

            setTextColor(color) {
                // Restore the selection before applying color
                if (this.savedSelection) {
                    this.restoreSelection(this.savedSelection);
                }
                
                // Enable CSS styling mode for better color support
                document.execCommand('styleWithCSS', false, true);
                document.execCommand('foreColor', false, color);
                document.execCommand('styleWithCSS', false, false);
                
                DOMCache.get('colorPicker').classList.remove('active');
                DOMCache.get('editDescription').focus();
            },

            toggleNotesColorPicker() {
                const picker = DOMCache.get('notesColorPicker');
                const isActive = picker.classList.contains('active');
                
                if (!isActive) {
                    // Store the current selection when opening
                    this.savedNotesSelection = this.saveSelection();
                }
                
                picker.classList.toggle('active');
            },

            setNotesTextColor(color) {
                // Restore the selection before applying color
                if (this.savedNotesSelection) {
                    this.restoreSelection(this.savedNotesSelection);
                }
                
                // Enable CSS styling mode for better color support
                document.execCommand('styleWithCSS', false, true);
                document.execCommand('foreColor', false, color);
                document.execCommand('styleWithCSS', false, false);
                
                DOMCache.get('notesColorPicker').classList.remove('active');
                DOMCache.get('notesEditor').focus();
                this.saveNotes();
            },

            // Helper functions to save and restore text selection
            saveSelection() {
                if (window.getSelection) {
                    const sel = window.getSelection();
                    if (sel.getRangeAt && sel.rangeCount) {
                        return sel.getRangeAt(0);
                    }
                }
                return null;
            },

            restoreSelection(range) {
                if (range && window.getSelection) {
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            },

            // Notes editor functions
            formatNotesText(command) {
                document.execCommand(command, false, null);
                DOMCache.get('notesEditor').focus();
                this.saveNotes();
            },

            createNotesLink() {
                const editorId = 'notesEditor';
                const existingLink = this.getLinkAtSelection(editorId);
                const currentHref = existingLink ? existingLink.getAttribute('href') || '' : '';
                const raw = prompt('Enter URL:', currentHref);
                if (raw) {
                    const url = this.normalizeUrl(raw);
                    if (existingLink) {
                        existingLink.setAttribute('href', url);
                    } else {
                        document.execCommand('createLink', false, url);
                    }
                    const editor = DOMCache.get(editorId);
                    this.fixEditorLinks(editor);
                    this.saveNotes();
                }
                DOMCache.get(editorId).focus();
            },

            renderTags(tags) {
                const container = DOMCache.get('tagContainer');
                const input = DOMCache.get('tagInput');

                const existingTags = container.querySelectorAll('.tag-badge');
                existingTags.forEach(tagEl => tagEl.remove());

                tags.forEach(tag => {
                    const badge = document.createElement('div');
                    badge.className = 'tag-badge';

                    const isUrlTag = typeof tag === 'string' && tag.indexOf('url:') === 0;
                    if (isUrlTag) {
                        const url = tag.substring(4);
                        const safeUrl = app.escapeAttribute(url);
                        const label = app.escapeHtml(url);
                        badge.innerHTML = `
                            <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="tag-link">🔗 ${label}</a>
                            <span class="tag-remove" onclick="app.removeTag('${app.escapeJsString(tag)}')">×</span>
                        `;
                    } else {
                        badge.innerHTML = `
                            #${app.escapeHtml(tag)}
                            <span class="tag-remove" onclick="app.removeTag('${app.escapeJsString(tag)}')">×</span>
                        `;
                    }

                    container.insertBefore(badge, input);
                });
            },

            handleTagInput(event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    const input = DOMCache.get('tagInput');
                    let tag = input.value.trim();
                    
                    if (tag) {
                        tag = tag.replace(/^#/, '');
                        
                        const task = this.tasks.find(t => t.id === this.editingTaskId);
                        if (task) {
                            if (!task.tags) task.tags = [];
                            if (!task.tags.includes(tag)) {
                                task.tags.push(tag);
                                task.modifiedAt = new Date().toISOString(); // Update modification timestamp
                                this.renderTags(task.tags);
                                this.saveTasks();
                            }
                        }
                        input.value = '';
                    }
                }
            },

            removeTag(tag) {
                const task = this.tasks.find(t => t.id === this.editingTaskId);
                if (task && task.tags) {
                    task.tags = task.tags.filter(t => t !== tag);
                    task.modifiedAt = new Date().toISOString(); // Update modification timestamp
                    this.renderTags(task.tags);
                    this.saveTasks();
                }
            },

            saveEdit() {
                this.saveToHistory();
                const task = this.tasks.find(t => t.id === this.editingTaskId);
                if (task) {
                    const newText = DOMCache.get('editTitle').value.trim();
                    const newDescription = DOMCache.get('editDescription').innerHTML.trim();
                    const newDate = DOMCache.get('editDate').value; // This is already in YYYY-MM-DD format
                    
                    // Collect any tag still in the input field before saving
                    const tagInput = DOMCache.get('tagInput');
                    if (tagInput && tagInput.value.trim()) {
                        let remainingTag = tagInput.value.trim().replace(/^#/, '');
                        if (!task.tags) task.tags = [];
                        if (remainingTag && !task.tags.includes(remainingTag)) {
                            task.tags.push(remainingTag);
                        }
                    }
                    
                    const textValidation = Validator.taskText(newText);
                    if (!textValidation.valid) {
                        this.showError(textValidation.error, 'validation');
                        return;
                    }
                    
                    const descValidation = Validator.description(newDescription);
                    if (!descValidation.valid) {
                        this.showError(descValidation.error, 'validation');
                        return;
                    }
                    
                    let workCategories = task.workCategories || [];
                    if (task.section === this.CONFIG.SECTIONS.WORK) {
                        const checkboxes = document.querySelectorAll('#workCategoryCheckboxes input[type="checkbox"]:checked');
                        workCategories = Array.from(checkboxes).map(cb => cb.value);
                    }
                    
                    const categoriesValidation = Validator.workCategories(workCategories);
                    if (!categoriesValidation.valid) {
                        this.showError(categoriesValidation.error, 'validation');
                        return;
                    }
                    
                    // Get team member assignments (multiple)
                    let teamMembers = task.teamMembers || [];
                    if (task.section === this.CONFIG.SECTIONS.TEAM) {
                        const selectedMemberSelect = document.querySelector('#teamMemberSelect');
                        if (selectedMemberSelect) {
                            const selectedOptions = Array.from(selectedMemberSelect.selectedOptions);
                            teamMembers = selectedOptions.map(opt => opt.value).filter(val => val);
                        }
                    }
                    
                    task.text = newText;
                    task.description = newDescription;
                    task.workCategories = workCategories;
                    task.teamMembers = teamMembers;
                    task.modifiedAt = new Date().toISOString(); // Update modification timestamp
                    // Note: task.tags are already updated via handleTagInput/removeTag and persist on the task object
                    // Note: task.deadline is edited via the setDeadline() function (clicking the badge)
                    // Date is already in YYYY-MM-DD format from the input, use it directly
                    if (newDate) {
                        task.date = newDate;
                    }
                    
                    this.updateUI();
                    this.closeEditModal();
                }
            },

            getTasksForDate(date, section = null) {
                const dateStr = this.getDateString(date);
                return this.tasks.filter(t => {
                    if (t.date !== dateStr) return false;
                    if (section && t.section !== section) return false;
                    // Filter by work category if in work section
                    if (section === 'work' && this.currentWorkCategory && this.currentWorkCategory !== 'all') {
                        if (!t.workCategories || !t.workCategories.includes(this.currentWorkCategory)) return false;
                    }
                    // Filter by team member if in team section
                    if (section === 'team' && this.currentTeamMember && this.currentTeamMember !== 'all') {
                        if (!t.teamMembers || !t.teamMembers.includes(this.currentTeamMember)) return false;
                    }
                    return true;
                });
            },

            // ========================================
            // TASK RENDERING HELPERS - Breaking down complex templates
            // ========================================
            
            getTaskClasses(task) {
                const classes = ['task'];
                if (task.completed) classes.push('completed');
                if (task.id === this.justCompletedTaskId) classes.push('just-completed');
                return classes.join(' ');
            },
            
            renderTaskMeta(task, section) {
                const parts = [];
                
                // Work categories
                if (section === 'work' && this.currentWorkCategory === 'all' && task.workCategories && task.workCategories.length > 0) {
                    parts.push(task.workCategories.map(cat => 
                        `<span class="task-category-badge">${this.formatCategoryName(cat)}</span>`
                    ).join(''));
                }
                
                // Team member badges (multiple)
                if (section === 'team' && task.teamMembers && task.teamMembers.length > 0) {
                    parts.push(task.teamMembers.map(member => 
                        `<span class="task-team-badge">👤 ${this.escapeHtml(member)}</span>`
                    ).join(''));
                }
                
                // Deadline
                if (section === 'team') {
                    const isOverdue = task.deadline && new Date(task.deadline) < new Date();
                    if (task.deadline) {
                        parts.push(`<span class="task-deadline ${isOverdue ? 'overdue' : ''}" onclick="event.stopPropagation(); app.setDeadline('${task.id}')" title="Click to change deadline">📥 ${task.deadline}</span>`);
                    } else {
                        parts.push(`<span class="task-deadline" onclick="event.stopPropagation(); app.setDeadline('${task.id}')" title="Click to set deadline">📥 No deadline</span>`);
                    }
                }
                
                // Tags
                if (task.tags && task.tags.length > 0) {
                    parts.push(task.tags.map(tag => {
                        if (typeof tag === 'string' && tag.indexOf('url:') === 0) {
                            const url = tag.substring(4);
                            const safeUrl = this.escapeAttribute(url);
                            const label = this.escapeHtml(url);
                            return `<a class="task-tag task-tag-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer">🔗 ${label}</a>`;
                        }
                        return `<span class="task-tag">#${this.escapeHtml(tag)}</span>`;
                    }).join(''));
                }
                
                // Carried from yesterday
                if (task.carriedFrom) {
                    parts.push('<span class="task-carried">→ from yesterday</span>');
                }
                
                // Completion time
                if (task.completed && task.completedAt) {
                    parts.push(`<span class="task-completed-time">✓ ${this.formatDateTime(task.completedAt)}</span>`);
                }
                
                return parts.join('');
            },
            
            renderTaskActions(task, section) {
                const actions = [];
                
                // Edit button (always present)
                actions.push(`<button class="task-action-btn" onclick="event.stopPropagation(); app.openEditModal('${task.id}')">Edit</button>`);
                
                // Snooze button (home/work only, not completed)
                if ((section === 'home' || section === 'work') && !task.completed) {
                    actions.push(`<button class="task-action-btn snooze" onclick="event.stopPropagation(); app.snoozeTask('${task.id}')" title="Snooze to tomorrow">⏰</button>`);
                }
                
                // Delete button (always present)
                actions.push(`<button class="task-action-btn" onclick="event.stopPropagation(); app.deleteTask('${task.id}')">Delete</button>`);
                
                return actions.join('');
            },

            renderTaskHTML(task, section) {
                return `
                    <div class="${this.getTaskClasses(task)}" 
                         data-task-id="${task.id}"
                         data-task-section="${task.section}"
                         draggable="true"
                         ondragstart="app.handleDragStart(event)"
                         ondragover="app.handleDragOverTask(event)"
                         ondrop="app.handleDropOnTask(event)"
                         ondragend="app.handleDragEnd(event)"
                         ondragleave="app.handleDragLeaveTask(event)">
                        <div class="drag-handle">⋮⋮</div>
                        <div class="priority-flag ${task.priority ? 'flagged' : 'unflagged'}" onclick="event.stopPropagation(); app.togglePriority('${task.id}')">🚩</div>
                        <div class="checkbox" onclick="event.stopPropagation(); app.toggleComplete('${task.id}')"></div>
                        <div class="task-content" onclick="event.stopPropagation(); app.openEditModal('${task.id}')">
                            <div class="task-text">
                                ${this.escapeHtml(task.text)}
                                ${task.description ? `<button class="expand-btn ${task.completed ? 'completed' : task.section}" onclick="event.stopPropagation(); app.toggleDescription('${task.id}')">▼</button>` : ''}
                            </div>
                            ${task.description ? `<div class="task-description collapsed" id="desc-${task.id}">${task.description}</div>` : ''}
                            <div class="task-meta">
                                ${this.renderTaskMeta(task, section)}
                            </div>
                        </div>
                        <div class="task-actions">
                            ${this.renderTaskActions(task, section)}
                        </div>
                    </div>
                `;
            },

            updateSectionStats(section, tasks) {
                const completed = tasks.filter(t => t.completed).length;
                document.getElementById(section + 'Stats').textContent = 
                    `${completed} of ${tasks.length} completed`;
            },

            renderSectionTasks(section, tasks) {
                const container = document.getElementById(section + 'Tasks');
                const sortedTasks = this.sortTasks([...tasks]);
                container.innerHTML = sortedTasks.map(task => this.renderTaskHTML(task, section)).join('');
            },

            renderSection(section) {
                let tasks;
                if (section === 'team') {
                    // Team section shows ALL tasks regardless of date
                    tasks = this.tasks.filter(t => {
                        if (t.section !== 'team') return false;
                        // Filter by team member if specific member is selected
                        if (this.currentTeamMember && this.currentTeamMember !== 'all') {
                            if (!t.teamMembers || !t.teamMembers.includes(this.currentTeamMember)) return false;
                        }
                        return true;
                    });
                } else {
                    // Other sections show only today's tasks
                    tasks = this.getTasksForDate(this.currentDate, section);
                }
                this.updateSectionStats(section, tasks);
                this.renderSectionTasks(section, tasks);
            },

            // ========================================
            // UI RENDERING - Rendering day, week, and month views
            // ========================================
            
            renderDayView() {
                ['home', 'work', 'team'].forEach(section => this.renderSection(section));
            },

            handleDragStart(event) {
                const taskEl = event.target.closest('.task');
                taskEl.classList.add('dragging');
                this.draggedTask = taskEl;
                event.dataTransfer.effectAllowed = 'move';
            },

            handleDragOver(event) {
                event.preventDefault();
                const taskEl = event.target.closest('.task');
                if (taskEl && taskEl !== this.draggedTask) {
                    const container = taskEl.parentElement;
                    const draggingSection = this.draggedTask.closest('.section').dataset.section;
                    const targetSection = taskEl.closest('.section').dataset.section;
                    
                    if (draggingSection === targetSection) {
                        const rect = taskEl.getBoundingClientRect();
                        const midpoint = rect.top + rect.height / 2;
                        if (event.clientY < midpoint) {
                            container.insertBefore(this.draggedTask, taskEl);
                        } else {
                            container.insertBefore(this.draggedTask, taskEl.nextSibling);
                        }
                    }
                }
            },

            handleDrop(event) {
                event.preventDefault();
            },

            handleDragEnd(event) {
                this.draggedTask.classList.remove('dragging');
                
                const section = this.draggedTask.closest('.section').dataset.section;
                const container = document.getElementById(section + 'Tasks');
                const taskElements = Array.from(container.children);
                const newOrder = taskElements.map(el => el.dataset.taskId);
                
                const tasksForDate = this.getTasksForDate(this.currentDate, section);
                const otherTasks = this.tasks.filter(t => 
                    !(t.date === this.getDateString(this.currentDate) && t.section === section)
                );
                
                const reorderedTasks = newOrder.map(id => 
                    tasksForDate.find(t => t.id === id)
                ).filter(Boolean);
                
                this.tasks = [...otherTasks, ...reorderedTasks];
                this.updateUI();
                
                this.draggedTask = null;
            },

            handleCategoryDragStart(event, categoryId) {
                event.stopPropagation();
                this.draggedCategory = categoryId;
                event.target.classList.add('dragging-category');
                event.dataTransfer.effectAllowed = 'copy';
                event.dataTransfer.setData('text/plain', categoryId);
            },

            handleCategoryDragEnd(event) {
                event.target.classList.remove('dragging-category');
                this.draggedCategory = null;
            },

            // Section drag and drop handlers
            handleSectionDragStart(event) {
                // Do not start section drag when drag originated inside a rich-text editor container
                if (this.dragFromRichEditor) {
                    event.preventDefault();
                    return;
                }
                const section = event.currentTarget;
                this.draggedSection = section;
                section.style.opacity = '0.5';
                event.dataTransfer.effectAllowed = 'move';
            },

            handleSectionDragOver(event) {
                event.preventDefault();
                const section = event.currentTarget;
                
                if (this.draggedSection && section !== this.draggedSection) {
                    const container = section.parentElement;
                    const allSections = Array.from(container.querySelectorAll('.section'));
                    
                    const draggedIndex = allSections.indexOf(this.draggedSection);
                    const targetIndex = allSections.indexOf(section);
                    
                    if (draggedIndex < targetIndex) {
                        section.parentElement.insertBefore(this.draggedSection, section.nextSibling);
                    } else {
                        section.parentElement.insertBefore(this.draggedSection, section);
                    }
                }
            },

            handleSectionDragEnd(event) {
                event.currentTarget.style.opacity = '1';
                
                // Save the new order
                const container = DOMCache.get('dayView');
                const sections = Array.from(container.querySelectorAll('.section'));
                
                this.sectionOrder = sections.map(section => section.dataset.section);
                
                this.saveSectionOrder();
                this.draggedSection = null;
            },

            renderWeekView() {
                const startOfWeek = new Date(this.currentDate);
                const day = startOfWeek.getDay();
                const daysFromMonday = day === 0 ? 6 : day - 1;
                startOfWeek.setDate(startOfWeek.getDate() - daysFromMonday);

                const weekDays = [];
                for (let i = 0; i < 7; i++) {
                    const date = new Date(startOfWeek);
                    date.setDate(date.getDate() + i);
                    weekDays.push(date);
                }

                const weekStart = this.formatDateShort(weekDays[0]);
                const weekEnd = this.formatDateShort(weekDays[6]);
                DOMCache.get('weekHeader').textContent = `Week of ${weekStart} - ${weekEnd}`;

                // Get all team tasks (not filtered by date)
                const allTeamTasks = this.tasks.filter(t => t.section === 'team');
                
                // Group team tasks by team member
                const tasksByMember = {};
                this.CONFIG.TEAM_MEMBERS.forEach(member => {
                    tasksByMember[member] = allTeamTasks.filter(t => t.teamMembers && t.teamMembers.includes(member));
                });
                // Unassigned tasks
                tasksByMember['Unassigned'] = allTeamTasks.filter(t => !t.teamMembers || t.teamMembers.length === 0);

                const container = DOMCache.get('weekDays');
                
                // Day cards
                const dayCards = weekDays.map(date => {
                    const tasks = this.getTasksForDate(date);
                    const homeTasks = tasks.filter(t => t.section === 'home');
                    const workTasks = tasks.filter(t => t.section === 'work');
                    const completed = tasks.filter(t => t.completed).length;
                    const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

                    const isToday = this.getDateString(date) === this.getDateString(this.currentDate);

                    return `
                        <div class="day-card ${isToday ? 'day-card-today' : ''}">
                            <div class="day-card-header">
                                <div class="day-card-date">
                                    <div class="${isToday ? 'day-card-date-today' : ''}">${this.formatDate(date).split(',')[0]}</div>
                                    <div class="day-card-date-secondary">${this.formatDateShort(date)}</div>
                                </div>
                                <div class="day-card-stats">${completed} / ${tasks.length} completed (${completionRate}%)</div>
                            </div>
                            <div class="day-card-sections">
                                <div class="day-card-section home">
                                    <div class="day-card-section-title">Home</div>
                                    ${homeTasks.slice(0, this.CONFIG.UI.MAX_TASKS_PREVIEW_WEEK).map(t => `
                                        <div class="day-task-preview ${t.completed ? 'completed' : ''}">
                                            ${t.completed ? '✓' : '−'} ${this.truncate(t.text, 50)}
                                        </div>
                                    `).join('')}
                                    ${homeTasks.length === 0 ? '<div class="day-task-preview">No tasks</div>' : ''}
                                </div>
                                <div class="day-card-section work">
                                    <div class="day-card-section-title">Work</div>
                                    ${workTasks.slice(0, this.CONFIG.UI.MAX_TASKS_PREVIEW_WEEK).map(t => `
                                        <div class="day-task-preview ${t.completed ? 'completed' : ''}">
                                            ${t.completed ? '✓' : '−'} ${this.truncate(t.text, 50)}
                                        </div>
                                    `).join('')}
                                    ${workTasks.length === 0 ? '<div class="day-task-preview">No tasks</div>' : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

                // Team section grouped by member
                const teamSection = `
                    <div class="team-section">
                        <h3 class="team-section-title">👥 TEAM ASSIGNMENTS</h3>
                        <div class="team-grid">
                            ${[...this.CONFIG.TEAM_MEMBERS, 'Unassigned'].map(member => {
                                const memberTasks = tasksByMember[member] || [];
                                const completed = memberTasks.filter(t => t.completed).length;
                                const total = memberTasks.length;
                                const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
                                
                                return `
                                    <div class="team-member-card">
                                        <div class="team-member-header">
                                            <div class="team-member-name">
                                                ${member === 'Unassigned' ? '⚠️ ' : '👤 '}${member}
                                            </div>
                                            <div class="team-member-count">
                                                ${completed}/${total} (${completionRate}%)
                                            </div>
                                        </div>
                                        ${memberTasks.length === 0 ? 
                                            `<div class="no-tasks-message">No tasks assigned</div>` :
                                            memberTasks.map(t => `
                                                <div class="day-task-preview task-preview-item ${t.completed ? 'completed' : ''}">
                                                    ${t.completed ? '✓' : '−'} ${this.escapeHtml(t.text)}
                                                </div>
                                            `).join('')
                                        }
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;

                container.innerHTML = dayCards + teamSection;
            },

            renderMonthView() {
                const year = this.currentDate.getFullYear();
                const month = this.currentDate.getMonth();
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                
                DOMCache.get('monthHeader').textContent = `${monthNames[month]} ${year}`;

                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);

                const weeks = [];
                let currentWeek = [];
                
                for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
                    currentWeek.push(new Date(d));
                    if (d.getDay() === 6 || d.getTime() === lastDay.getTime()) {
                        weeks.push(currentWeek);
                        currentWeek = [];
                    }
                }

                const container = DOMCache.get('monthContent');
                
                const allMonthTasks = this.tasks.filter(t => {
                    const taskDate = new Date(t.date);
                    return taskDate.getMonth() === month && taskDate.getFullYear() === year;
                });
                const completedMonth = allMonthTasks.filter(t => t.completed).length;
                const completionRate = allMonthTasks.length > 0 ? Math.round((completedMonth / allMonthTasks.length) * 100) : 0;

                // Get all team tasks (not filtered by month)
                const allTeamTasks = this.tasks.filter(t => t.section === 'team');
                
                // Group team tasks by team member
                const tasksByMember = {};
                this.CONFIG.TEAM_MEMBERS.forEach(member => {
                    tasksByMember[member] = allTeamTasks.filter(t => t.teamMembers && t.teamMembers.includes(member));
                });
                tasksByMember['Unassigned'] = allTeamTasks.filter(t => !t.teamMembers || t.teamMembers.length === 0);

                container.innerHTML = `
                    <div class="month-summary">
                        <h3 class="month-summary-title">Month Summary</h3>
                        <div class="stats-grid">
                            <div>
                                <div class="stat-label">TOTAL TASKS</div>
                                <div class="stat-value">${allMonthTasks.length}</div>
                            </div>
                            <div>
                                <div class="stat-label">COMPLETED</div>
                                <div class="stat-value-highlight">${completedMonth}</div>
                            </div>
                            <div>
                                <div class="stat-label">COMPLETION RATE</div>
                                <div class="stat-value">${completionRate}%</div>
                            </div>
                            <div>
                                <div class="stat-label">HOME / WORK / TEAM</div>
                                <div class="stat-value-medium">
                                    ${allMonthTasks.filter(t => t.section === 'home').length} / 
                                    ${allMonthTasks.filter(t => t.section === 'work').length} /
                                    ${allMonthTasks.filter(t => t.section === 'team').length}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="team-section">
                        <h3 class="team-section-title">👥 TEAM ASSIGNMENTS</h3>
                        <div class="team-grid">
                            ${[...this.CONFIG.TEAM_MEMBERS, 'Unassigned'].map(member => {
                                const memberTasks = tasksByMember[member] || [];
                                const completed = memberTasks.filter(t => t.completed).length;
                                const total = memberTasks.length;
                                const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
                                
                                return `
                                    <div class="team-member-card">
                                        <div class="team-member-header">
                                            <div class="team-member-name">
                                                ${member === 'Unassigned' ? '⚠️ ' : '👤 '}${member}
                                            </div>
                                            <div class="team-member-count">
                                                ${completed}/${total} (${completionRate}%)
                                            </div>
                                        </div>
                                        ${memberTasks.length === 0 ? 
                                            `<div class="no-tasks-message">No tasks assigned</div>` :
                                            memberTasks.slice(0, this.CONFIG.UI.MAX_TASKS_PREVIEW_MONTH).map(t => `
                                                <div class="day-task-preview task-preview-item ${t.completed ? 'completed' : ''}">
                                                    ${t.completed ? '✓' : '−'} ${this.escapeHtml(t.text)}
                                                </div>
                                            `).join('') +
                                            (memberTasks.length > 10 ? `<div class="more-tasks-indicator">... and ${memberTasks.length - 10} more</div>` : '')
                                        }
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    
                    <div class="week-days">
                        ${weeks.map((week, weekIndex) => `
                            <h3 class="section-subtitle">
                                WEEK ${weekIndex + 1} (${this.formatDateShort(week[0])} - ${this.formatDateShort(week[week.length - 1])})
                            </h3>
                            ${week.map(date => {
                                const tasks = this.getTasksForDate(date);
                                const homeTasks = tasks.filter(t => t.section === 'home');
                                const workTasks = tasks.filter(t => t.section === 'work');
                                const completed = tasks.filter(t => t.completed).length;
                                const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

                                if (tasks.length === 0) return '';

                                return `
                                    <div class="day-card">
                                        <div class="day-card-header">
                                            <div class="day-card-date">${this.formatDate(date)}</div>
                                            <div class="day-card-stats">${completed} / ${tasks.length} (${completionRate}%)</div>
                                        </div>
                                        <div class="day-card-sections">
                                            <div class="day-card-section home">
                                                <div class="day-card-section-title">Home</div>
                                                ${homeTasks.map(t => `
                                                    <div class="day-task-preview ${t.completed ? 'completed' : ''}">
                                                        ${t.completed ? '✓' : '−'} ${this.truncate(t.text, 50)}
                                                    </div>
                                                `).join('')}
                                                ${homeTasks.length === 0 ? '<div class="day-task-preview">No tasks</div>' : ''}
                                            </div>
                                            <div class="day-card-section work">
                                                <div class="day-card-section-title">Work</div>
                                                ${workTasks.map(t => `
                                                    <div class="day-task-preview ${t.completed ? 'completed' : ''}">
                                                        ${t.completed ? '✓' : '−'} ${this.truncate(t.text, 50)}
                                                    </div>
                                                `).join('')}
                                                ${workTasks.length === 0 ? '<div class="day-task-preview">No tasks</div>' : ''}
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        `).join('')}
                    </div>
                `;
            },

            truncate(text, length) {
                return text.length > length ? text.substring(0, length) + '...' : text;
            },

            renderRecentlyDeleted() {
                const retentionDate = new Date();
                retentionDate.setDate(retentionDate.getDate() - this.CONFIG.DELETED.RETENTION_DAYS);

                const recentDeleted = this.deletedTasks.filter(t => {
                    const deletedDate = new Date(t.deletedAt);
                    return deletedDate >= retentionDate;
                });

                this.deletedTasks = recentDeleted;
                this.saveTasks();

                const container = DOMCache.get('recentlyDeleted');
                const deletedTasksContainer = DOMCache.get('deletedTasks');
                const countEl = DOMCache.get('deletedCount');

                if (recentDeleted.length === 0) {
                    container.classList.add('hidden');
                    return;
                }

                container.classList.remove('hidden');
                countEl.textContent = `${recentDeleted.length} task${recentDeleted.length === 1 ? '' : 's'}`;

                const toggleBtn = DOMCache.get('deletedToggle');
                if (toggleBtn) {
                    toggleBtn.textContent = '+';
                }

                recentDeleted.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

                deletedTasksContainer.innerHTML = recentDeleted.map(task => `
                    <div class="deleted-task">
                        <div class="deleted-task-content">
                            <div class="deleted-task-text">${this.escapeHtml(task.text)}</div>
                            <div class="deleted-task-meta">
                                ${task.section.toUpperCase()} • Deleted ${this.formatDateTime(task.deletedAt)}
                            </div>
                        </div>
                        <button class="restore-btn" onclick="app.restoreTask('${task.id}')">Restore</button>
                    </div>
                `).join('');
            },

            restoreTask(taskId) {
                const task = this.deletedTasks.find(t => t.id === taskId);
                if (task) {
                    this.saveToHistory();
                    
                    delete task.deletedAt;
                    
                    this.tasks.push(task);
                    this.deletedTasks = this.deletedTasks.filter(t => t.id !== taskId);
                    
                    this.updateUI();
                    this.renderRecentlyDeleted();
                }
            },

            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            },

            escapeAttribute(text) {
                if (text === null || text === undefined) return '';
                return String(text)
                    .replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            },

            escapeJsString(text) {
                if (text === null || text === undefined) return '';
                return String(text)
                    .replace(/\\/g, '\\\\')
                    .replace(/'/g, "\\'")
                    .replace(/\n/g, ' ')
                    .replace(/\r/g, ' ');
            },

            normalizeUrl(url) {
                if (!url) return '';
                const trimmed = url.trim();
                // Allow already absolute or special-scheme URLs
                if (/^(https?:|mailto:|ftp:)/i.test(trimmed)) return trimmed;
                if (/^\/\//.test(trimmed)) return 'https:' + trimmed;
                if (trimmed.startsWith('#')) return trimmed;
                // Fallback: treat as https URL
                return 'https://' + trimmed;
            },

            fixEditorLinks(editor) {
                if (!editor) return;
                const links = editor.querySelectorAll('a[href]');
                links.forEach(link => {
                    const href = link.getAttribute('href') || '';
                    const normalised = this.normalizeUrl(href);
                    link.setAttribute('href', normalised);
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                });
            },


            getYesterday() {
                const date = new Date(this.currentDate);
                date.setDate(date.getDate() - 1);
                return this.getDateString(date);
            },

            getTomorrow() {
                const date = new Date(this.currentDate);
                date.setDate(date.getDate() + 1);
                return this.getDateString(date);
            },

            updateUI() {
                this.saveTasks();
                this.render();
            },

            DEBUG: false,
            
            log(level, message, data = null) {
                if (!this.DEBUG && level === 'debug') return;
                
                const timestamp = new Date().toISOString();
                const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
                
                if (data) {
                    console[level === 'error' ? 'error' : 'log'](prefix, message, data);
                } else {
                    console[level === 'error' ? 'error' : 'log'](prefix, message);
                }
            },
            
            safeGetElement(id) {
                const element = document.getElementById(id);
                if (!element) {
                    console.warn(`Element not found: ${id}`);
                }
                return element;
            },
            
            showError(message, type = 'error') {
                const errorContainer = DOMCache.get('errorNotification');
                if (!errorContainer) {
                    this.createErrorContainer();
                }
                
                const notification = DOMCache.get('errorNotification');
                notification.innerHTML = `
                    <div class="error-message ${type}">
                        <span class="error-icon">âš ï¸</span>
                        <span class="error-text">${message}</span>
                        <button class="error-close" onclick="app.dismissError()">×</button>
                    </div>
                `;
                notification.classList.add('visible');
                
                setTimeout(() => {
                    this.dismissError();
                }, 5000);
            },
            
            createErrorContainer() {
                const container = document.createElement('div');
                container.id = 'errorNotification';
                container.className = 'error-notification';
                document.body.appendChild(container);
            },
            
            dismissError() {
                const notification = DOMCache.get('errorNotification');
                if (notification) {
                    notification.classList.remove('visible');
                }
            },
            
            sortTasks(tasks) {
                return tasks.sort((a, b) => {
                    if (a.completed !== b.completed) return a.completed ? 1 : -1;
                    if (a.priority !== b.priority) return b.priority ? 1 : -1;
                    return 0;
                });
            },

            render() {
                DOMCache.get('currentDate').textContent = this.formatDate(this.currentDate);
                this.reorderSections();
                this.renderDayView();
                this.renderRecentlyDeleted();
                this.loadNotesForCurrentDate();
            },

            reorderSections() {
                const container = DOMCache.get('dayView');
                const sectionMap = {
                    'home': container.querySelector('[data-section="home"]'),
                    'work': container.querySelector('[data-section="work"]'),
                    'team': container.querySelector('[data-section="team"]'),
                    'notes': container.querySelector('[data-section="notes"]')
                };

                // Reorder sections based on sectionOrder array
                this.sectionOrder.forEach((sectionId, index) => {
                    const section = sectionMap[sectionId];
                    if (section) {
                        container.appendChild(section);
                    }
                });
            },

            extractLinksFromHTML(html) {
                if (!html) return [];
                const div = document.createElement('div');
                div.innerHTML = html;
                const links = Array.from(div.querySelectorAll('a'));
                return links
                    .map(a => a.getAttribute('href'))
                    .filter(href => !!href);
            },

            // ========================================
            // JSON EXPORT/IMPORT - File-based data persistence
            // ========================================
            
            exportToJSON() {
                this.saveToJSON();
            },
            
            importFromJSON(event) {
                const file = event.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const jsonData = JSON.parse(e.target.result);
                        
                        // Validate it's a Bauhaus data file
                        if (!jsonData.tasks && !jsonData.version) {
                            throw new Error('Invalid Bauhaus data file');
                        }
                        
                        const taskCount = (jsonData.tasks || []).length;
                        const deletedCount = (jsonData.deletedTasks || []).length;
                        const hasNotes = jsonData.notes && jsonData.notes.trim();
                        
                        const message = `Import ${taskCount} active tasks, ${deletedCount} deleted tasks${hasNotes ? ', and notes' : ''}?\n\nThis will REPLACE all current data!`;
                        
                        if (confirm(message)) {
                            this.saveToHistory();
                            
                            // Load the data into the app (this sets this.notes, this.tasks, etc.)
                            FileStorageService.loadDataIntoApp(this, jsonData);
                            
                            // Save the imported notes directly to localStorage
                            StorageService.save(this.CONFIG.STORAGE.NOTES, this.notes);
                            
                            // Save other data to localStorage as well (hybrid mode)
                            this.saveCategories();
                            this.saveTeamMembers();
                            this.saveSectionOrder();
                            
                            // Mark as loaded from JSON with no unsaved changes
                            this.dataSource = 'json';
                            this.hasUnsavedChanges = false;
                            this.lastJsonSaveTime = new Date().toISOString();
                            
                            // Update UI (this calls render() which calls loadNotesForCurrentDate())
                            this.updateUI();
                            this.updateDataSourceIndicator();
                            
                            alert('Import successful!');
                            console.log('JSON import complete');
                        }
                    } catch (error) {
                        alert('Error importing JSON: ' + error.message);
                        console.error('JSON import error:', error);
                    }
                };
                
                reader.readAsText(file);
                event.target.value = '';
            },

            // ========================================
            // CSV EXPORT/IMPORT - Legacy format for spreadsheet compatibility
            // ========================================
            
            exportToCSV() {
                const allTasks = [
                    ...this.tasks,
                    ...this.deletedTasks
                ];

                const headers = [
                    'id',
                    'text',
                    'description',
                    'date',
                    'section',
                    'workCategories',
                    'teamMembers',
                    'deadline',
                    'completed',
                    'completedAt',
                    'createdAt',
                    'modifiedAt',
                    'carriedFrom',
                    'tags',
                    'priority',
                    'deletedAt'
                ];

                // Build rows with hyperlink-aware tags
                const rows = allTasks.map(task => {
                    const descriptionHTML = task.description || '';
                    // For CSV we now preserve full HTML so that hyperlinks survive import

                    // Start with existing tags
                    const tagList = Array.isArray(task.tags) ? [...task.tags] : [];

                    // Extract hyperlinks from description HTML and add as url: tags
                    const linkUrls = this.extractLinksFromHTML(descriptionHTML);
                    linkUrls.forEach(url => {
                        const tagValue = `url:${url}`;
                        if (!tagList.includes(tagValue)) {
                            tagList.push(tagValue);
                        }
                    });

                    return [
                        CSVUtils.escape(task.id),
                        CSVUtils.escape(task.text),
                        CSVUtils.escape(descriptionHTML),
                        CSVUtils.escape(task.date),
                        CSVUtils.escape(task.section),
                        CSVUtils.escape((task.workCategories || []).join(';')),
                        CSVUtils.escape((task.teamMembers || []).join(';')),
                        CSVUtils.escape(task.deadline || ''),
                        CSVUtils.escape(task.completed),
                        CSVUtils.escape(task.completedAt || ''),
                        CSVUtils.escape(task.createdAt || ''),
                        CSVUtils.escape(task.modifiedAt || ''),
                        CSVUtils.escape(task.carriedFrom || ''),
                        CSVUtils.escape(tagList.join(';')),
                        CSVUtils.escape(task.priority),
                        CSVUtils.escape(task.deletedAt || '')
                    ].join(',');
                });

                // Add single persistent notes row if notes exist
                const notesRows = [];
                if (this.notes && this.notes.trim()) {
                    const noteLinks = this.extractLinksFromHTML(this.notes);
                    const noteTags = noteLinks.map(url => `url:${url}`);

                    notesRows.push([
                        CSVUtils.escape('NOTES-PERSISTENT'),          // id
                        CSVUtils.escape('Persistent Notes'),          // text
                        CSVUtils.escape(this.notes), // description (notes HTML, including links)
                        CSVUtils.escape(''),                          // date (empty - not date-specific)
                        CSVUtils.escape('notes'),                     // section
                        '',                                           // workCategories
                        '',                                           // teamMember
                        '',                                           // deadline
                        '',                                           // completed
                        '',                                           // completedAt
                        '',                                           // createdAt
                        '',                                           // modifiedAt
                        '',                                           // carriedFrom
                        CSVUtils.escape(noteTags.join(';')),          // tags: url:… entries for notes
                        '',                                           // priority
                        ''                                            // deletedAt
                    ].join(','));
                }

                const csv = [headers.join(','), ...rows, ...notesRows].join('\n');

                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);

                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                link.setAttribute('href', url);
                link.setAttribute('download', `bauhaus-todo-export-${timestamp}.csv`);
                link.style.visibility = 'hidden';

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            },


importFromCSV(event) {
                const file = event.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const csv = e.target.result;
                        const lines = csv.split('\n');
                        
                        const dataLines = lines.slice(1).filter(line => line.trim());

                        const importedTasks = [];
                        const importedDeleted = [];
                        let importedNotes = '';

                        dataLines.forEach(line => {
                            // IMPROVED: Using centralized CSVUtils.parseLine
                            const fields = CSVUtils.parseLine(line);
                            if (fields.length < 4) return; // Need at minimum: id, text, description, date
                            
                            // Check if this is a notes row (either old date-based or new persistent)
                            if (fields[4] === 'notes' && fields[0] && fields[0].startsWith('NOTES-')) {
                                const notesContent = fields[2]; // description field contains notes
                                if (notesContent) {
                                    // If it's the persistent notes, use it; if it's old date-based, take the most recent one
                                    if (fields[0] === 'NOTES-PERSISTENT' || !importedNotes) {
                                        importedNotes = notesContent;
                                    }
                                }
                                return; // Skip adding as a task
                            }
                            
                            // IMPROVED: Using centralized TaskSchema.normalize for consistent task creation
                            const rawTask = {
                                id: fields[0],
                                text: fields[1],
                                description: fields[2],
                                date: fields[3],
                                section: fields[4],
                                workCategories: fields[5],
                                teamMembers: fields[6],
                                deadline: fields[7],
                                completed: fields[8],
                                completedAt: fields[9],
                                createdAt: fields[10],
                                modifiedAt: fields[11],
                                carriedFrom: fields[12],
                                tags: fields[13],
                                priority: fields[14],
                                deletedAt: fields[15]
                            };

                            const task = TaskSchema.normalize(rawTask, this);

                            if (task.deletedAt) {
                                importedDeleted.push(task);
                            } else {
                                delete task.deletedAt;
                                importedTasks.push(task);
                            }
                        });

                        const hasNotes = importedNotes.trim().length > 0;
                        const message = `Import ${importedTasks.length} active tasks, ${importedDeleted.length} deleted tasks${hasNotes ? ', and persistent notes' : ''}?\n\nThis will REPLACE all current data!`;
                        if (confirm(message)) {
                            this.saveToHistory();
                            this.tasks = importedTasks;
                            this.deletedTasks = importedDeleted;
                            if (hasNotes) {
                                this.notes = importedNotes;
                            }
                            this.updateUI();
                            alert('Import successful!');
                        }
                    } catch (error) {
                        alert('Error importing CSV: ' + error.message);
                        console.error('Import error:', error);
                    }
                };
                
                reader.readAsText(file);
                
                event.target.value = '';
            }
        };

        window.addEventListener('DOMContentLoaded', () => app.init());