const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/bookbank', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    
});

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    category: { type: String, required: true },
    copies: { type: Number, required: true, min: 0 },
    requestedAt: { type: Date }, // Field to store the date when the book was requested
    daysAvailable: { type: Number, default: 15 } // Number of days remaining before the book is available again
});

const User = mongoose.model('User', userSchema);
const Book = mongoose.model('Book', bookSchema);
const initializeBooks = async () => {
    const initialBooks = [
        { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Fiction', copies: 5 },
        { title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', category: 'Non-Fiction', copies: 3 },
        { title: 'A Brief History of Time', author: 'Stephen Hawking', category: 'Science', copies: 4 },
        { title: 'The Innovators', author: 'Walter Isaacson', category: 'Technology', copies: 2 }
    ];

    for (const book of initialBooks) {
        const exists = await Book.findOne({ title: book.title });
        if (!exists) {
            await new Book(book).save();
        }
    }
};

// Call the initialization function
initializeBooks();

// Register Route
app.post('/register', async (req, res) => {
    const { username, password, email, phone } = req.body;

    // Validate the input
    if (!username || !password || !email || !phone) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const newUser = new User({ username, password, email, phone });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        if (error.code === 11000) {
            res.status(409).json({ error: 'Username or email already exists' });
        } else {
            res.status(500).json({ error: 'Server error' });
        }
    }
});

// Login Route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username, password });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Fetch all books from the database
        const books = await Book.find({});
        res.json({ message: 'Login successful', user, books });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a Book by Title
app.delete('/deleteBook', async (req, res) => {
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Book title is required' });
    }

    try {
        const result = await Book.deleteOne({ title });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }

        res.json({ message: `Book "${title}" has been deleted successfully.` });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/resetPassword', async (req, res) => {
    const { username, email } = req.body;

    // Validate input
    if (!username || !email) {
        return res.status(400).json({ error: 'Username and email are required' });
    }

    try {
        // Find the user by username and email
        const user = await User.findOne({ username, email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate a new random password
        const newPassword = generateRandomPassword(8);

        // Update the user's password
        user.password = newPassword;
        await user.save();

        // Send the new password in the response
        res.json({ message: 'Password reset successful', newPassword });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Add Book Route
app.post('/addBook', async (req, res) => {
    const { title, author, category, copies } = req.body;

    // Validate input
    if (!title || !author || !category || copies == null || copies < 1) {
        return res.status(400).json({ error: 'All fields are required, and copies must be at least 1' });
    }

    try {
        // Check if the book already exists
        const existingBook = await Book.findOne({ title });
        if (existingBook) {
            // Increment the number of copies for the existing book
            existingBook.copies += copies;
            await existingBook.save();
            return res.status(200).json({ message: 'Book copies updated successfully', book: existingBook });
        }

        // If the book doesn't exist, create a new one
        const newBook = new Book({ title, author, category, copies });
        await newBook.save();
        res.status(201).json({ message: 'Book added successfully', book: newBook });
    } catch (error) {
        console.error('Error adding book:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Request Book Route
app.post('/requestBook', async (req, res) => {
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Book title is required' });
    }

    try {
        const book = await Book.findOne({ title });
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        // If the book has no copies left
        if (book.copies <= 0) {
            const now = new Date();

            // Check if `requestedAt` exists and calculate hours passed since the last decrement
            if (book.requestedAt) {
                const hoursPassed = (now - book.requestedAt) / (1000 * 60 * 60);

                if (hoursPassed >= 24) {
                    // Decrement daysAvailable and reset `requestedAt`
                    book.daysAvailable = Math.max(book.daysAvailable - 1, 0); // Prevent going below 0
                    book.requestedAt = now; // Update the timestamp
                    await book.save();

                    return res.status(200).json({
                        message: `Your book "${book.title}" will be available in ${book.daysAvailable} days.`,
                    });
                } else {
                    const remainingHours = 24 - hoursPassed;
                    return res.status(200).json({
                        message: `Your book "${book.title}" will be available in ${book.daysAvailable} days. `,
                    });
                }
            } else {
                // If `requestedAt` doesn't exist, initialize it
                book.requestedAt = now;
                book.daysAvailable = 15; // Set default days
                await book.save();

                return res.status(200).json({
                    message: `Your book "${book.title}" will be available in ${book.daysAvailable} days.`,
                });
            }
        }

        // If the book is available, decrement the copies
        book.copies--;
        await book.save();
        res.json({ message: `You have successfully requested "${book.title}".`, book });
    } catch (error) {
        console.error('Error requesting book:', error);
        res.status(500).json({ error: 'Server error' });
    }
});




function generateRandomPassword(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
