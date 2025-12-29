Global Connect - Professional Social Networking Platform
A full-stack social networking application built with the MERN stack, featuring real-time messaging, video calls, job boards, and AI-powered assistance.
📋 Table of Contents

Features
Tech Stack
Prerequisites
Installation
Configuration
Running the Application
Project Structure
API Documentation
Contributing
License

✨ Features
Core Functionality

User Authentication: Email-based OTP verification for signup and login
Profile Management: Customizable profiles with skills, education, and work experience
Social Feed: Create, like, comment, and share posts
Connections: Send and manage connection requests
Real-time Messaging: Chat with connections using Socket.io
Video Calling: Built-in video call functionality using Agora SDK
Job Board: Post and apply for jobs with resume uploads
Stories: 24-hour ephemeral content sharing
Bookmarks: Save posts for later viewing
Analytics: Track engagement metrics and profile performance
Live Status: Set temporary status updates
Trending Hashtags: Discover popular topics
AI Assistant: ChatGPT-powered help for platform navigation

Advanced Features

Post reactions (like, love, haha, wow, sad, angry)
Repost functionality
Image and video uploads via Cloudinary
Search users by name or username
Suggested connections
Notification system
Mobile-responsive design

🛠 Tech Stack
Frontend

React 19.2 - UI library
React Router - Client-side routing
Axios - HTTP client
Socket.io Client - Real-time communication
Tailwind CSS - Styling
Lucide React - Icon library
Date-fns - Date formatting
React Toastify - Notifications
Agora RTC SDK - Video calling

Backend

Node.js - Runtime environment
Express - Web framework
MongoDB - Database
Mongoose - ODM
Socket.io - WebSocket server
JWT - Authentication
Bcrypt - Password hashing
Multer - File uploads
Cloudinary - Media storage
Nodemailer + Brevo - Email service
Google Generative AI - AI assistant

📦 Prerequisites
Before you begin, ensure you have the following installed:

Node.js (v18 or higher)
npm or yarn
MongoDB (local or Atlas)
Git

You'll also need accounts for:

Cloudinary (image/video storage)
Brevo (email service)
Google AI Studio (optional, for AI assistant)
Agora (optional, for video calls)

🚀 Installation
1. Clone the Repository
bashgit clone https://github.com/yourusername/global-connect.git
cd global-connect
2. Install Backend Dependencies
bashcd backend
npm install
3. Install Frontend Dependencies
bashcd ../frontend
npm install
⚙️ Configuration
Backend Environment Variables
Create a .env file in the backend directory:
env# Server
PORT=8000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URL=mongodb://localhost:27017/global-connect

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Brevo)
BREVO_API_KEY=your-brevo-api-key
EMAIL_FROM=noreply@globalconnect.com

# Google AI (Optional)
GOOGLE_GEMINI_KEY=your-gemini-api-key

# Agora (Optional)
AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERTIFICATE=your-agora-certificate

# Cookie Settings (for production)
COOKIE_DOMAIN=.yourdomain.com
Frontend Environment Variables
Create a .env file in the frontend directory:
envVITE_SERVER_URL=http://localhost:8000
Production Environment Variables
For production, update:
env# Backend
NODE_ENV=production
CLIENT_URL=https://yourdomain.com
COOKIE_DOMAIN=.yourdomain.com

# Frontend
VITE_SERVER_URL=https://api.yourdomain.com
🎮 Running the Application
Development Mode
Terminal 1 - Backend:
bashcd backend
npm run dev
Terminal 2 - Frontend:
bashcd frontend
npm run dev
The application will be available at:

Frontend: http://localhost:5173
Backend: http://localhost:8000

Production Build
Build Frontend:
bashcd frontend
npm run build
Start Backend:
bashcd backend
npm start
```

## 📁 Project Structure
```
global-connect/
├── backend/
│   ├── config/          # Database, Cloudinary, JWT configs
│   ├── controllers/     # Route controllers
│   ├── middlewares/     # Auth, upload middlewares
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic (AI service)
│   ├── utils/           # Helper functions
│   └── index.js         # Server entry point
│
├── frontend/
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── context/     # React Context providers
│   │   ├── pages/       # Page components
│   │   ├── utils/       # Helper functions
│   │   ├── App.jsx      # Main app component
│   │   └── main.jsx     # Entry point
│   └── index.html
│
└── README.md
🔌 API Documentation
Authentication
Send Signup OTP
httpPOST /api/auth/send-signup-otp
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "userName": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
Verify Signup OTP
httpPOST /api/auth/verify-signup-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
Send Login OTP
httpPOST /api/auth/send-login-otp
Content-Type: application/json

{
  "email": "john@example.com"
}
Verify Login OTP
httpPOST /api/auth/verify-login-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
Posts
Create Post
httpPOST /api/post/create
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "description": "Hello World!",
  "image": <file>
}
Get All Posts
httpGET /api/post/getpost
Authorization: Bearer {token}
Like Post
httpPOST /api/post/like/:id
Authorization: Bearer {token}
Comment on Post
httpPOST /api/post/comment/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Great post!"
}
Connections
Send Connection Request
httpPOST /api/connection/send/:userId
Authorization: Bearer {token}
Accept Connection
httpPUT /api/connection/accept/:connectionId
Authorization: Bearer {token}
Get Connection Requests
httpGET /api/connection/requests
Authorization: Bearer {token}
Chat
Get Chat History
httpGET /api/chat/history/:userId?page=1&limit=30
Authorization: Bearer {token}
Get Inbox
httpGET /api/chat/inbox
Authorization: Bearer {token}
Jobs
Post Job
httpPOST /api/jobs/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Software Engineer",
  "company": "Tech Corp",
  "location": "Remote",
  "description": "We are hiring..."
}
Apply for Job
httpPOST /api/jobs/apply
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "jobId": "job-id-here",
  "name": "John Doe",
  "email": "john@example.com",
  "resume": <pdf-file>
}
Stories
Create Story
httpPOST /api/stories/create
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "media": <image-or-video>,
  "text": "Check this out!"
}
Get Stories
httpGET /api/stories
Authorization: Bearer {token}
🔐 Security Features

Password Hashing: Bcrypt with salt rounds
JWT Tokens: 7-day expiration
HTTP-only Cookies: Secure token storage
CORS: Configured for trusted origins
Input Validation: Server-side validation for all inputs
File Upload Restrictions: Type and size validation
Rate Limiting: Protection against spam/abuse

🎨 UI/UX Features

Responsive Design: Mobile-first approach
Dark Theme: Eye-friendly interface
Loading States: Skeleton screens and spinners
Error Handling: User-friendly error messages
Toast Notifications: Real-time feedback
Infinite Scroll: Efficient content loading
Image Optimization: Cloudinary transformations
Accessibility: ARIA labels and keyboard navigation

🐛 Known Issues

Video calls require HTTPS in production
File uploads limited to 10MB
Socket.io may disconnect on slow networks
Mobile video calls need camera permissions

🚧 Future Enhancements

 Group messaging
 Voice messages
 Video posts
 Advanced search filters
 Email notifications
 Mobile app (React Native)
 Admin dashboard
 Content moderation
 Multi-language support
 Dark/Light theme toggle

🤝 Contributing
Contributions are welcome! Please follow these steps:

Fork the repository
Create a feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request

Code Style

Use ESLint configuration
Follow React best practices
Write meaningful commit messages
Add comments for complex logic
Update documentation as needed

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
👥 Authors

Your Name - Initial work - YourGitHub

🙏 Acknowledgments

React team for the amazing framework
MongoDB team for the database
Cloudinary for media storage
Agora for video call SDK
Google for Generative AI
All open-source contributors

📞 Support
For support, email support@globalconnect.com or open an issue on GitHub.
📊 Project Status
This project is actively maintained. Last updated: December 2024

Made with ❤️ by the Global Connect Team
