const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseCode: {
        type: String,
        required: [true, 'Course code is required'],
        unique: true,
        trim: true,
        uppercase: true,
        maxlength: [10, 'Course code cannot exceed 10 characters']
    },
    courseName: {
        type: String,
        required: [true, 'Course name is required'],
        trim: true,
        maxlength: [200, 'Course name cannot exceed 200 characters']
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: {
            values: ['cse', 'eee', 'bba', 'eco', 'eng', 'mat', 'phy'],
            message: 'Please select a valid department'
        }
    },
    credits: {
        type: Number,
        required: [true, 'Credits are required'],
        min: [1, 'Credits must be at least 1'],
        max: [6, 'Credits cannot exceed 6']
    },
    description: {
        type: String,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    prerequisites: [{
        type: String,
        trim: true,
        uppercase: true
    }],
    learningOutcomes: [{
        type: String,
        maxlength: [300, 'Learning outcome cannot exceed 300 characters']
    }],
    syllabus: [{
        week: {
            type: Number,
            required: true
        },
        topic: {
            type: String,
            required: true
        },
        description: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    isCore: {
        type: Boolean,
        default: true
    },
    trimester: {
        type: Number,
        required: [true, 'Trimester is required'],
        min: [1, 'Trimester must be at least 1'],
        max: [12, 'Trimester cannot exceed 12']
    },
    year: {
        type: Number,
        required: [true, 'Year is required'],
        min: [2020, 'Year must be at least 2020']
    },
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        required: [true, 'Faculty mentor is required']
    },
    maxStudents: {
        type: Number,
        default: 50,
        min: [1, 'Maximum students must be at least 1']
    },
    enrolledStudents: {
        type: Number,
        default: 0
    },
    gradingPolicy: {
        assignments: {
            type: Number,
            default: 30,
            min: [0, 'Assignment weight cannot be negative'],
            max: [100, 'Assignment weight cannot exceed 100']
        },
        midterm: {
            type: Number,
            default: 30,
            min: [0, 'Midterm weight cannot be negative'],
            max: [100, 'Midterm weight cannot exceed 100']
        },
        final: {
            type: Number,
            default: 40,
            min: [0, 'Final weight cannot be negative'],
            max: [100, 'Final weight cannot exceed 100']
        }
    },
    schedule: [{
        day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        },
        startTime: String,
        endTime: String,
        room: String,
        type: {
            type: String,
            enum: ['Lecture', 'Lab', 'Tutorial'],
            default: 'Lecture'
        }
    }],
    studyGroups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }],
    materials: [{
        title: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['syllabus', 'textbook', 'slides', 'assignment', 'other'],
            default: 'other'
        },
        url: String,
        filePath: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for department name
courseSchema.virtual('departmentName').get(function() {
    const departments = {
        'cse': 'Computer Science & Engineering',
        'eee': 'Electrical & Electronic Engineering',
        'bba': 'Business Administration',
        'eco': 'Economics',
        'eng': 'English',
        'mat': 'Mathematics',
        'phy': 'Physics'
    };
    return departments[this.department] || this.department;
});

// Virtual for trimester name
courseSchema.virtual('trimesterName').get(function() {
    const j = this.trimester % 10;
    const k = this.trimester % 100;
    let suffix = 'th';
    if (j === 1 && k !== 11) suffix = 'st';
    if (j === 2 && k !== 12) suffix = 'nd';
    if (j === 3 && k !== 13) suffix = 'rd';
    
    return `${this.trimester}${suffix} Trimester`;
});

// Virtual for enrollment status
courseSchema.virtual('enrollmentStatus').get(function() {
    if (this.enrolledStudents >= this.maxStudents) {
        return 'Full';
    } else if (this.enrolledStudents >= this.maxStudents * 0.8) {
        return 'Almost Full';
    } else {
        return 'Available';
    }
});

// Virtual for available spots
courseSchema.virtual('availableSpots').get(function() {
    return Math.max(0, this.maxStudents - this.enrolledStudents);
});

// Index for search functionality
courseSchema.index({ 
    courseCode: 'text', 
    courseName: 'text', 
    description: 'text' 
});

// Index for efficient queries
courseSchema.index({ department: 1, trimester: 1, year: 1 });
courseSchema.index({ faculty: 1, isActive: 1 });

// Pre-save middleware to validate grading policy
courseSchema.pre('save', function(next) {
    const total = this.gradingPolicy.assignments + this.gradingPolicy.midterm + this.gradingPolicy.final;
    if (total !== 100) {
        return next(new Error('Grading policy weights must sum to 100'));
    }
    next();
});

// Method to check if course is full
courseSchema.methods.isFull = function() {
    return this.enrolledStudents >= this.maxStudents;
};

// Method to enroll student
courseSchema.methods.enrollStudent = function() {
    if (this.isFull()) {
        throw new Error('Course is full');
    }
    this.enrolledStudents += 1;
    return this.save();
};

// Method to unenroll student
courseSchema.methods.unenrollStudent = function() {
    if (this.enrolledStudents > 0) {
        this.enrolledStudents -= 1;
        return this.save();
    }
    return Promise.resolve(this);
};

// Static method to find active courses
courseSchema.statics.findActive = function() {
    return this.find({ isActive: true }).populate('faculty', 'fullName department');
};

// Static method to find courses by department and trimester
courseSchema.statics.findByDepartmentAndTrimester = function(department, trimester, year) {
    return this.find({
        department,
        trimester,
        year,
        isActive: true
    }).populate('faculty', 'fullName department');
};

// Static method to find courses by faculty
courseSchema.statics.findByFaculty = function(facultyId) {
    return this.find({
        faculty: facultyId,
        isActive: true
    }).populate('faculty', 'fullName department');
};

module.exports = mongoose.model('Course', courseSchema); 