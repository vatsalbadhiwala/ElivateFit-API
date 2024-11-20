# Backend Setup for Node.js Express Project

This README provides instructions on how to set up and run the backend for our Node.js Express project.

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- MongoDB (v4 or later)

## 🚀 Features

- User registration and login
- Admin authentication with OTP verification
- Secure password handling
- JWT-based authentication
- Responsive UI using Chakra UI
- MongoDB database integration
- RESTful API architecture

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or later)
- MongoDB (v4 or later)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <project-directory>
    
2. **Backend Setup**

```shellscript
cd backend
npm install
```

Create a `.env` file in the backend directory:

```plaintext
mongoUrl="mongodb://localhost:27017/"
PORT=3001
JWT_SECRET='F!tN($$^pP'
EMAIL_SERVICE='gmail'
EMAIL_USER=softwareproject476@gmail.com
EMAIL_PASS=glvo npey utbf zljx
```


3. **Start the Backend Server**

```shellscript
npm start
```

The server will run on [http://localhost:3001](http://localhost:3001)




## 🏗️ Project Structure

```plaintext
backend/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── models/         # Database models
├── routes/         # API routes
├── middleware/     # Custom middleware
├── utils/          # Utility functions
├── .env            # Environment variables
├── server.js       # Main application file
└── package.json    # Project dependencies and scripts
```

## 🔑 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/generate-otp` - Generate OTP for admin
- `POST /api/auth/verify-otp` - Verify admin OTP


## 💻 Usage

1. Register a new user account
2. Login with your credentials
3. For admin access, complete the two-factor authentication


## 🔒 Environment Variables

### Backend

- `mongoUrl` - MongoDB connection string
- `PORT` - Server port number
- `JWT_SECRET` - Secret key for JWT
- `EMAIL_SERVICE` - Email service provider


## Additional Notes

- Ensure MongoDB is running on your local machine or update the `mongoUrl` to point to your MongoDB instance.
- For production deployment, set up proper security measures and update the environment variables accordingly.
- The frontend is set up to use Chakra UI for styling. Make sure to wrap your app with the ChakraProvider in your index.js or App.js file.


## Features

- User registration and login
- Admin authentication with two-factor authentication (OTP)
- Protected routes for authenticated users
- Responsive design using Chakra UI


## 🐛 Troubleshooting

Common issues and their solutions:

1. **MongoDB Connection Issues**

    1. Ensure MongoDB is running locally
    2. Check connection string in .env file



2. **Email Service Issues**

    1. Verify email service credentials
    2. Check spam folder for OTP emails