const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Book = require('../models/Book');
const router = express.Router(); // ADD THIS LINE

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/';
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Keep original extension
        const fileExtension = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, fileExtension);
        const fileName = baseName + '-' + uniqueSuffix + fileExtension;
        cb(null, fileName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.epub', '.txt', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${fileExt} not allowed. Please upload PDF, EPUB, TXT, DOC, DOCX, or image files.`), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit for larger books
    },
    fileFilter: fileFilter
});

// Upload book route
router.post('/book', upload.single('bookFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).render('upload', { 
                page: 'upload', 
                error: 'No file selected or file type not allowed' 
            });
        }

        console.log('📤 Upload details:', {
            originalName: req.file.originalname,
            fileName: req.file.filename,
            fileSize: req.file.size
        });

        // CRITICAL: Get file extension properly
        const fileType = path.extname(req.file.originalname).toLowerCase();
        console.log('📄 Detected file type:', fileType);

        const newBook = new Book({
            title: req.body.title,
            description: req.body.description,
            author: req.body.author || 'Unknown Author',
            fileName: req.file.filename,
            originalName: req.file.originalname,
            filePath: '/uploads/' + req.file.filename,
            fileSize: req.file.size,
            fileType: fileType, // THIS MUST BE SET
            category: req.body.category || 'other',
            isPublic: true
        });

        await newBook.save();
        
        console.log('✅ New book uploaded:', newBook.title);
        console.log('📊 Book saved with fileType:', newBook.fileType);
        
        res.redirect('/library');
        
    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).render('upload', { 
            page: 'upload', 
            error: 'Error uploading book. Please try again.' 
        });
    }
});

// Route to serve book files
router.get('/file/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../public/uploads/', filename);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

// Delete book route
router.post('/delete/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (book) {
            // Delete the file from uploads directory
            const filePath = path.join(__dirname, '../public/uploads/', book.fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            // Delete from database
            await Book.findByIdAndDelete(req.params.id);
        }
        res.redirect('/library');
    } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).send('Error deleting book');
    }
});

module.exports = router;