const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const facultySchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
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
    facultyId: {
        type: String,
        required: [true, 'Faculty ID is required'],
        unique: true,
        trim: true,
        maxlength: [20, 'Faculty ID cannot exceed 20 characters']
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: {
            values: ['cse', 'eee', 'bba', 'eco', 'eng', 'mat', 'phy'],
            message: 'Please select a valid department'
        }
    },
    specializations: [{
        type: String,
        trim: true,
        maxlength: [100, 'Specialization cannot exceed 100 characters']
    }],
    designation: {
        type: String,
        enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Senior Lecturer'],
        default: 'Lecturer'
    },
    contact: {
        type: String,
        trim: true,
        maxlength: [20, 'Contact number cannot exceed 20 characters']
    },
    officeLocation: {
        type: String,
        trim: true,
        maxlength: [100, 'Office location cannot exceed 100 characters']
    },
    officeHours: [{
        day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        },
        startTime: String,
        endTime: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    avatar: {
        type: String,
        default: null
    },
    bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    education: [{
        degree: {
            type: String,
            required: true
        },
        institution: {
            type: String,
            required: true
        },
        year: {
            type: Number,
            required: true
        },
        field: {
            type: String,
            required: true
        }
    }],
    experience: [{
        position: {
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
        isCurrent: {
            type: Boolean,
            default: false
        }
    }],
    mentoringGroups: [{
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group'
        },
        role: {
            type: String,
            enum: ['mentor', 'co-mentor'],
            default: 'mentor'
        },
        assignedAt: {
            type: Date,
            default: Date.now
        }
    }],
    courses: [{
        courseCode: {
            type: String,
            required: true
        },
        courseName: {
            type: String,
            required: true
        },
        trimester: {
            type: Number,
            required: true
        },
        year: {
            type: Number,
            required: true
        },
        isActive: {
            type: Boolean,
            default: true
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

// Virtual for full name
facultySchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for department name
facultySchema.virtual('departmentName').get(function() {
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

// Virtual for initials
facultySchema.virtual('initials').get(function() {
    return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase();
});

// Index for search functionality
facultySchema.index({ 
    firstName: 'text', 
    lastName: 'text', 
    facultyId: 'text', 
    email: 'text' 
});

// Pre-save middleware to hash password
facultySchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to check password
facultySchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get public profile
facultySchema.methods.getPublicProfile = function() {
    const facultyObject = this.toObject();
    
    delete facultyObject.password;
    delete facultyObject.resetPasswordToken;
    delete facultyObject.resetPasswordExpire;
    
    return facultyObject;
};

// Static method to find by email or faculty ID
facultySchema.statics.findByEmailOrFacultyId = function(identifier) {
    return this.findOne({
        $or: [
            { email: identifier },
            { facultyId: identifier }
        ]
    });
};

// Method to get active mentoring groups
facultySchema.methods.getActiveMentoringGroups = function() {
    return this.populate({
        path: 'mentoringGroups.group',
        match: { isActive: true }
    });
};

module.exports = mongoose.model('Faculty', facultySchema); 