const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    author: {
        type: String,
        default: 'Unknown'
    },
    fileName: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    category: {
        type: String,
        enum: ['alchemy', 'hermetic', 'qabalah', 'societies', 'other'],
        default: 'other'
    },
    isPublic: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Book', bookSchema);