const users = [];
const books = [
    { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Fiction', copies: 5 },
    { title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', category: 'Non-Fiction', copies: 3 },
    { title: 'A Brief History of Time', author: 'Stephen Hawking', category: 'Science', copies: 4 },
    { title: 'The Innovators', author: 'Walter Isaacson', category: 'Technology', copies: 2 }
];
let currentUser = null;

document.addEventListener('DOMContentLoaded', function () {
    const phoneInput = document.getElementById('registerPhone');
    intlTelInput(phoneInput, {
        initialCountry: "us"
    });
});

function showRegisterPage() {
    fadeOutAllSections();
    const registerPage = document.getElementById('registerPage');
    registerPage.classList.add('visible');
}

function showLoginPage() {
    fadeOutAllSections();
    const loginPage = document.getElementById('loginPage');
    loginPage.classList.add('visible');
}

function showForgotPassword() {
    fadeOutAllSections();
    const forgotPasswordSection = document.getElementById('forgotPasswordSection');
    forgotPasswordSection.classList.add('visible');
}

function fadeOutAllSections() {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('visible'));
}

async function register() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('registerPhone').value;
    const phoneDigits = phone.replace(/\D/g, ''); // Remove non-digit characters
    if (password.length !== 8) {
        alert('Password must be exactly 8 characters long.');
        return;
    }
    if (phoneDigits.length !== 10) {
        alert('Phone number must be exactly 10 digits.');
        return;
    }

     if (!email.endsWith('@gmail.com')) {
        alert('Invalid email. Please enter a valid Gmail address ending with @gmail.com.');
        return;
    }

    if (users.find(user => user.username === username)) {
        alert('Username already taken');
        return;
    }

    const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email, phone })
    });

    if (response.ok) {
        alert('Registration successful!');
        showLoginPage();
    } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
    }
}
async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        const data = await response.json();
        alert('Login successful!');
        currentUser = data.user; // Save logged-in user data

        // Update the books array with books from the backend
        books.length = 0; // Clear the existing books array
        books.push(...data.books); // Add the fetched books

        showProfilePage(); // Navigate to profile page
        showBookList(); // Render the updated book list
    } else {
        alert('Invalid credentials!');
    }
}





async function resetPassword() {
    const username = document.getElementById('forgotUsername').value;
    const email = document.getElementById('forgotEmail').value;

    if (!username || !email) {
        alert('Please provide both username and email.');
        return;
    }

    // Send the request to the backend to reset the password
    const response = await fetch('http://localhost:5000/resetPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email })
    });

    if (response.ok) {
        // Get the new password from the backend response
        const data = await response.json();
        const newPassword = data.newPassword;

        // Display the new password to the user
        const resetMessage = document.getElementById('resetMessage');
        resetMessage.innerText = `Your password has been reset successfully. Your new password is: ${newPassword}`;
        resetMessage.style.display = 'block';
    } else {
        const error = await response.json();
        const resetMessage = document.getElementById('resetMessage');
        resetMessage.innerText = error.error || 'An error occurred while resetting the password.';
        resetMessage.style.display = 'block';
    }
}


// Function to generate a random password of specified length
function generateRandomPassword(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}



function showProfilePage() {
    fadeOutAllSections();
    const profileSection = document.getElementById('profileSection');
    profileSection.classList.add('visible');

    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profilePhone').textContent = currentUser.phone;
}

function showBookList() {
    fadeOutAllSections();
    const bookListSection = document.getElementById('bookListSection');
    bookListSection.classList.add('visible');

    const bookListContainer = document.getElementById('bookList');
    bookListContainer.innerHTML = ''; // Clear previous content

    books.forEach(book => {
        const bookItem = document.createElement('tr');
        bookItem.innerHTML = `
            <td>${book.author}</td>
            <td>${book.title}</td>
            <td>${book.copies}</td>
            <td><button onclick="requestBook('${book.title}')">Request Book</button></td>
        `;
        bookListContainer.appendChild(bookItem);
    });
}


// Request Book function to decrease copies and show a success message
async function requestBook(title) {
    const response = await fetch('http://localhost:5000/requestBook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
    });

    if (response.ok) {
        const result = await response.json();
        alert(result.message); // Show the message that was sent from the server
        // Update the local books array to reflect the change
        const book = books.find(b => b.title === title);
        if (book) {
            book.copies = result.book.copies; // Update local copies if necessary
        }
        openChatbot(`You have successfully requested "${result.book.title}". How can I assist you further?`);
        showBookList(); // Re-render book list
    } else {
        const error = await response.json();
        alert(error.error); // Handle error response
    }
}



function openChatbot(initialMessage) {
    const chatbot = document.getElementById('chatbot');
    chatbot.style.display = 'block'; // Show the chatbot container

    const chatbotMessages = document.getElementById('chatbotMessages');
    chatbotMessages.innerHTML += `<div class="chatbot-message">Assistant: ${initialMessage}</div>`;
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight; // Scroll to the latest message
}


function closeChatbot() {
    const chatbot = document.getElementById('chatbot');
    chatbot.style.display = 'none';
}

function sendChatMessage() {
    const chatbotInput = document.getElementById('chatbotInput');
    const userMessage = chatbotInput.value.trim();

    if (!userMessage) return;

    const chatbotMessages = document.getElementById('chatbotMessages');
    chatbotMessages.innerHTML += `<div class="chatbot-message user">You: ${userMessage}</div>`;

    // Simulate a chatbot response
    const response = generateChatbotResponse(userMessage);
    chatbotMessages.innerHTML += `<div class="chatbot-message">Assistant: ${response}</div>`;

    chatbotInput.value = ''; // Clear input
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight; // Scroll to latest
}


function generateChatbotResponse(message) {
    if (message.toLowerCase().includes('status')) {
        return 'Your book is ready for collection. Happy reading!';
    } else if (message.toLowerCase().includes('return')) {
        return 'You can return the book at the library reception.';
    } else {
        return 'I am here to help with any book-related questions!';
    }
}


// Function to show a success message after book request
function searchBooks() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const selectedCategory = document.getElementById('categoryFilter').value.toLowerCase();
    const bookList = [
        // Example book list (you can replace this with data from your backend)
        { title: 'Book One', author: 'Author One', category: 'Fiction', copies: 5 },
        { title: 'Book Two', author: 'Author Two', category: 'Science', copies: 3 },
        { title: 'Book Three', author: 'Author Three', category: 'Technology', copies: 2 }
    ];

    // Filter the books based on search criteria
    const filteredBooks = bookList.filter(book => {
        const titleMatch = book.title.toLowerCase().includes(searchQuery);
        const authorMatch = book.author.toLowerCase().includes(searchQuery);
        const categoryMatch = selectedCategory ? book.category.toLowerCase() === selectedCategory : true;
        return (titleMatch || authorMatch) && categoryMatch;
    });

    // Get the table body and clear any previous results
    const bookTableBody = document.getElementById('bookList');
    bookTableBody.innerHTML = '';

    // Hide the "No Books Found" message initially
    document.getElementById('noBooksMessage').style.display = 'none';

    // If no books match, show the message
    if (filteredBooks.length === 0) {
        document.getElementById('noBooksMessage').style.display = 'block';
    } else {
        // If books are found, display them in the table
        filteredBooks.forEach(book => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${book.author}</td>
                <td>${book.title}</td>
                <td>${book.copies}</td>
                <td><button onclick="someAction()">Action</button></td>
            `;
            bookTableBody.appendChild(row);
        });
    }
}





function viewBookDetails(title) {
    const book = books.find(b => b.title === title);

    // Decrease copies if there are available ones
    if (book.copies > 0) {
        book.copies--;  // Decrease the number of copies
        document.getElementById('bookTitle').textContent = book.title;
        document.getElementById('bookAuthor').textContent = book.author;
        document.getElementById('bookCategory').textContent = book.category;
        document.getElementById('readBookModal').style.display = 'flex';

        // Re-render the book list with updated copies
        showBookList();
    } else {
       // If no copies are left, set availability days and alert the user
       book.availabilityDays = 15; // Reset availability days
       alert(`The book "${book.title}" will be available within ${book.availabilityDays} days.`);
    }
}

function closeModal() {
    document.getElementById('readBookModal').style.display = 'none';
}

function returnToProfile() {
    fadeOutAllSections();
    const profileSection = document.getElementById('profileSection');
    profileSection.classList.add('visible');
}


function showAddBookSection() {
    fadeOutAllSections();
    const addBookSection = document.getElementById('addBookSection');
    addBookSection.classList.add('visible');
}


// Existing functions (register, login, resetPassword, etc.) are here...

function showBookList() {
    // Hide other sections
    fadeOutAllSections();

    // Display the book list section in full screen
    const bookListSection = document.getElementById('bookListSection');
    bookListSection.style.display = 'block';

    // Render the book list
    const bookListContainer = document.getElementById('bookList');
    bookListContainer.innerHTML = ''; // Clear the existing book list

    books.forEach(book => {
        const bookItem = document.createElement('tr');
        bookItem.innerHTML = `
            <td>${book.author}</td>
            <td>${book.title}</td>
            <td>${book.copies}</td>
            <td><button onclick="requestBook('${book.title}')">Request Book</button></td>
        `;
        bookListContainer.appendChild(bookItem);
    });
}





// Add Book function updated to display the correct number of copies
async function addBook() {
    const title = document.getElementById('newBookTitle').value;
    const author = document.getElementById('newBookAuthor').value;
    const category = document.getElementById('newBookCategory').value;
    const copies = parseInt(document.getElementById('newBookCopies').value, 10);

    if (isNaN(copies) || copies <= 0) {
        alert('Please enter a valid number of copies.');
        return;
    }

    const response = await fetch('http://localhost:5000/addBook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author, category, copies })
    });

    if (response.ok) {
        const result = await response.json();
        alert('Book added successfully!');

        // Add the new book to the local books array
        books.push(result.book);

        // Refresh the book list to include the new book
        showBookList();
        returnToProfile();
    } else {
        alert('Failed to add book. Please try again.');
    }
}


// Updated Read Book function to decrease the number of copies when read

function closeModal() {
    document.getElementById('readBookModal').style.display = 'none';
}





function showSuccessMessage(message) {
    const successMessage = document.createElement('p');
    successMessage.style.color = 'green';
    successMessage.textContent = message;

    const bookListSection = document.getElementById('bookListSection');
    const existingMessage = document.getElementById('requestSuccessMessage');
    
    // Remove any existing success message
    if (existingMessage) {
        existingMessage.remove();
    }
    
    successMessage.id = 'requestSuccessMessage';
    bookListSection.appendChild(successMessage);
}

function returnToProfile() {
    fadeOutAllSections();
    const profileSection = document.getElementById('profileSection');
    profileSection.classList.add('visible');
}

function validatePasswordLength(password) {
    if (password.length !== 8) {
        alert('Password must be exactly 8 characters long.');
        return false;
    }
    return true;
}
function toggleMenu() {
    const menu = document.getElementById('profileMenu');
    
    // Toggle the display of the dropdown menu
    if (menu.style.display === 'block') {
        menu.style.display = 'none'; // Hide menu if it's already visible
    } else {
        menu.style.display = 'block'; // Show menu when clicked
    }
}

// Close the dropdown menu if the user clicks outside
document.addEventListener('click', function(event) {
    const menu = document.getElementById('profileMenu');
    const button = document.querySelector('.profile-menu button');
    
    // If the click is outside the menu and button, close the menu
    if (!menu.contains(event.target) && !button.contains(event.target)) {
        menu.style.display = 'none'; // Close the dropdown menu
    }
});

function showEditProfileForm() {
    // Show the form to edit the profile
    fadeOutAllSections();
    const editProfileSection = document.getElementById('editProfileSection');
    editProfileSection.classList.add('visible');

    // Populate the form with the current user's data
    document.getElementById('editUsername').value = currentUser.username;
    document.getElementById('editEmail').value = currentUser.email;
    document.getElementById('editPhone').value = currentUser.phone;
}
function saveProfile() {
    const newEmail = document.getElementById('editEmail').value;
    const newPhone = document.getElementById('editPhone').value;
    
    // Update currentUser with the new data
    currentUser.email = newEmail;
    currentUser.phone = newPhone;
    
    // Re-render the profile page with the updated info
    showProfilePage(); 
}
function logout() {
    currentUser = null; // Clear the logged-in user data
    showLoginPage(); // Redirect to login page
    alert('You have been logged out!');
}


