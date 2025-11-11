require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('✅ Connected to MongoDB Atlas successfully!');
    console.log(`🏷️  Cluster: hermeticon-dbcluster`);
    console.log(`📚 Database: arcane_archives`);
})
.catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
});

// MongoDB connection events
mongoose.connection.on('connected', () => {
    console.log('📡 Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️  Mongoose disconnected from MongoDB Atlas');
});

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed through app termination');
    process.exit(0);
});

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use('/upload', uploadRoutes);

// Main routes
app.get('/', (req, res) => {
    res.render('index', { page: 'home' });
});

app.get('/library', async (req, res) => {
    const Book = require('./models/Book');
    try {
        const books = await Book.find().sort({ uploadDate: -1 });
        
        // Define legendary books and check if they're uploaded
        const legendaryBooks = [
            {
                title: 'Emerald Tablet',
                description: 'A foundational text of alchemy attributed to Hermes Trismegistus, containing the secret of the prima materia.',
                author: 'Hermes Trismegistus',
                category: 'alchemy',
                searchTerms: ['emerald', 'tablet', 'emerald tablet']
            },
            {
                title: 'Voynich Manuscript',
                description: 'An illustrated codex hand-written in an unknown writing system that has baffled cryptographers for centuries.',
                author: 'Unknown',
                category: 'other',
                searchTerms: ['voynich', 'manuscript']
            },
            {
                title: 'Book of Thoth',
                description: 'A legendary book of ancient Egyptian magic said to contain spells that can control the forces of nature.',
                author: 'Thoth',
                category: 'hermetic',
                searchTerms: ['thoth', 'book of thoth']
            },
            {
                title: 'Picatrix',
                description: 'A medieval grimoire of astrological magic that blends Arabic, Greek, and Persian occult traditions.',
                author: 'Unknown',
                category: 'qabalah',
                searchTerms: ['picatrix']
            },
            {
                title: 'Necronomicon',
                description: 'A fictional grimoire created by H.P. Lovecraft, said to contain forbidden knowledge about ancient deities and cosmic horrors.',
                author: 'Abdul Alhazred',
                category: 'other',
                searchTerms: ['necronomicon']
            },
            {
                title: 'Ripley Scroll',
                description: 'An alchemical manuscript depicting the process for creating the Philosopher\'s Stone through symbolic imagery.',
                author: 'George Ripley',
                category: 'alchemy',
                searchTerms: ['ripley', 'scroll']
            }
        ];

        // Check which legendary books have been uploaded
        const legendaryBooksWithStatus = legendaryBooks.map(legend => {
            // Find if this legendary book has been uploaded
            const uploadedBook = books.find(book => 
                legend.searchTerms.some(term => 
                    book.title.toLowerCase().includes(term.toLowerCase())
                )
            );
            
            return {
                ...legend,
                isUploaded: !!uploadedBook,
                uploadedBookId: uploadedBook ? uploadedBook._id : null
            };
        });

        res.render('library', { 
            page: 'library', 
            books,
            legendaryBooks: legendaryBooksWithStatus
        });
    } catch (error) {
        console.error('Error fetching books:', error);
        res.render('library', { 
            page: 'library', 
            books: [], 
            legendaryBooks: [] 
        });
    }
});

app.get('/societies', (req, res) => {
    res.render('societies', { page: 'societies' });
});

app.get('/contact', (req, res) => {
    res.render('contact', { page: 'contact' });
});

app.get('/upload-book', (req, res) => {
    // Get pre-fill parameters from URL
    const { title, author, category } = req.query;
    
    res.render('upload', { 
        page: 'upload',
        title: title || '',
        author: author || '',
        category: category || ''
    });
});

// Read book route - CORRECTED PDF DETECTION
app.get('/read/:id', async (req, res) => {
    const Book = require('./models/Book');
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).send('Book not found in the archives');
        }

        console.log('📖 Book details:', {
            title: book.title,
            fileType: book.fileType,
            filePath: book.filePath,
            originalName: book.originalName
        });

        // CORRECTED PDF DETECTION - Check both fileType and filename
        const fileExtension = book.fileType || path.extname(book.originalName || '').toLowerCase();
        
        const isPDF = fileExtension === '.pdf' || 
                     (book.originalName && book.originalName.toLowerCase().endsWith('.pdf')) ||
                     (book.fileName && book.fileName.toLowerCase().includes('.pdf'));
        
        const isText = fileExtension === '.txt' || 
                      (book.originalName && book.originalName.toLowerCase().endsWith('.txt'));
        
        const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(fileExtension) ||
                       (book.originalName && book.originalName.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp)$/));
        
        const isDownloadable = ['.doc', '.docx', '.epub', '.zip', '.rar'].includes(fileExtension);

        console.log('🔍 CORRECTED File type detection:', {
            fileExtension: fileExtension,
            isPDF: isPDF,
            isText: isText,
            isImage: isImage,
            isDownloadable: isDownloadable
        });

        // For text files, read the content
        let bookContent = '';
        if (isText) {
            try {
                const filePath = path.join(__dirname, 'public', book.filePath);
                if (fs.existsSync(filePath)) {
                    bookContent = fs.readFileSync(filePath, 'utf8');
                } else {
                    bookContent = 'File not found on server. Please download the file instead.';
                }
            } catch (readError) {
                console.error('Error reading text file:', readError);
                bookContent = 'Unable to read the text content. Please download the file instead.';
            }
        }

        res.render('reader', { 
            page: 'reader', 
            book,
            bookContent,
            isPDF,
            isText,
            isImage,
            isDownloadable,
            fileType: fileExtension
        });
    } catch (error) {
        console.error('Error fetching book:', error);
        res.status(500).send('Error loading the forbidden text');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🔮 Arcane Archives - Forbidden Knowledge Portal`);
    console.log(`🌐 Server running on: http://localhost:${PORT}`);
    console.log(`📚 Library: http://localhost:${PORT}/library`);
    console.log(`📤 Upload: http://localhost:${PORT}/upload-book`);
    console.log(`💫 Ready to receive esoteric knowledge...\n`);
});