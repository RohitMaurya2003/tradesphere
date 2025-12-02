const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['upcoming', 'active', 'completed'],
        default: 'upcoming'
    },
    initialBalance: {
        type: Number,
        default: 100000, // ₹1,00,000 virtual money
        required: true
    },
    prizePool: {
        type: String,
        default: 'Virtual Badges & Glory'
    },
    maxParticipants: {
        type: Number,
        default: null // null = unlimited
    },
    contestType: {
        type: String,
        enum: ['weekly', 'monthly', 'custom'],
        default: 'weekly'
    },
    rules: [{
        type: String
    }],
    participantCount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Update status based on dates
contestSchema.methods.updateStatus = function() {
    const now = new Date();
    if (now < this.startDate) {
        this.status = 'upcoming';
    } else if (now >= this.startDate && now <= this.endDate) {
        this.status = 'active';
    } else {
        this.status = 'completed';
    }
    return this.status;
};

module.exports = mongoose.model('Contest', contestSchema);
