const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    studentId: {
        type: String,
        required: [true, 'Student ID is required'],
        unique: true,
        trim: true,
        maxlength: [20, 'Student ID cannot exceed 20 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: {
            values: ['cse', 'eee', 'bba', 'eco', 'eng', 'mat', 'phy'],
            message: 'Please select a valid department'
        }
    },
    trimester: {
        type: Number,
        required: [true, 'Current trimester is required'],
        min: [1, 'Trimester must be at least 1'],
        max: [12, 'Trimester cannot exceed 12']
    },
    cgpa: {
        type: Number,
        required: [true, 'CGPA is required'],
        min: [0, 'CGPA cannot be negative'],
        max: [4, 'CGPA cannot exceed 4.0']
    },
    contact: {
        type: String,
        trim: true,
        maxlength: [20, 'Contact number cannot exceed 20 characters']
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    avatar: {
        type: String,
        default: null
    },
    academicHistory: [{
        degree: {
            type: String,
            required: true
        },
        institution: {
            type: String,
            required: true
        },
        startYear: {
            type: Number,
            required: true
        },
        endYear: {
            type: Number
        },
        gpa: {
            type: Number,
            min: 0,
            max: 5
        },
        isCurrent: {
            type: Boolean,
            default: false
        }
    }],
    currentCourses: [{
        courseCode: {
            type: String,
            required: true
        },
        courseName: {
            type: String,
            required: true
        },
        grade: {
            type: String,
            enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'I', 'W']
        },
        credits: {
            type: Number,
            default: 3
        }
    }],
    studyGroups: [{
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group'
        },
        role: {
            type: String,
            enum: ['member', 'leader'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    emailVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for department name
studentSchema.virtual('departmentName').get(function() {
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
studentSchema.virtual('trimesterName').get(function() {
    return `${this.trimester}${this.getOrdinalSuffix(this.trimester)} Trimester`;
});

// Helper method for ordinal suffixes
studentSchema.methods.getOrdinalSuffix = function(num) {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
};

// Virtual for initials
studentSchema.virtual('initials').get(function() {
    return this.fullName
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
});

// Index for search functionality
studentSchema.index({ 
    fullName: 'text', 
    studentId: 'text', 
    email: 'text' 
});

// Pre-save middleware to hash password
studentSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to check password
studentSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get public profile
studentSchema.methods.getPublicProfile = function() {
    const studentObject = this.toObject();
    
    delete studentObject.password;
    delete studentObject.resetPasswordToken;
    delete studentObject.resetPasswordExpire;
    
    return studentObject;
};

// Static method to find by email or student ID
studentSchema.statics.findByEmailOrStudentId = function(identifier) {
    return this.findOne({
        $or: [
            { email: identifier },
            { studentId: identifier }
        ]
    });
};

module.exports = mongoose.model('Student', studentSchema); 