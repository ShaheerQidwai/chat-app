```markdown
# Chat App

A real-time chat application built with React.js for the frontend and Node.js + Express for the backend. Supports private messaging, group chats, and user authentication.

## Features

- User authentication (signup/login)  
- Real-time private messaging  
- Group chat functionality  
- RESTful APIs for backend operations  
- Clean and responsive UI using React  
- JWT-based authentication  

## Technologies

**Frontend:** React.js, Axios  
**Backend:** Node.js, Express, MongoDB/Mongoose, JWT, bcrypt  
**Other:** Socket.io for real-time messaging  

## Folder Structure

```

Chat App/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.js
│   └── package.json
└── .gitignore

````

## Installation

### Prerequisites

- Node.js (v16+ recommended)  
- npm or yarn  
- MongoDB (local or cloud)  

### Clone the Repository

```bash
git clone https://github.com/USERNAME/chat-app.git
cd chat-app
````

### Backend Setup

```bash
cd backend
npm install
```

### Frontend Setup

```bash
cd ../frontend
npm install
```

## Configuration

Create a `.env` file in the `backend/` folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

## Running the Application

### Backend

```bash
cd backend
npm start
```

### Frontend

```bash
cd frontend
npm start
```

* Frontend: `http://localhost:3000`
* Backend API: `http://localhost:5000`

## API Endpoints

### Auth

| Method | Endpoint         | Description         |
| ------ | ---------------- | ------------------- |
| POST   | /api/auth/signup | Register a new user |
| POST   | /api/auth/login  | Login a user        |

### Chats

| Method | Endpoint   | Description       |
| ------ | ---------- | ----------------- |
| GET    | /api/chats | Get user chats    |
| POST   | /api/chats | Create a new chat |

### Groups

| Method | Endpoint    | Description        |
| ------ | ----------- | ------------------ |
| GET    | /api/groups | Get all groups     |
| POST   | /api/groups | Create a new group |

### Messages

| Method | Endpoint              | Description             |
| ------ | --------------------- | ----------------------- |
| GET    | /api/messages/:chatId | Get messages for a chat |
| POST   | /api/messages         | Send a new message      |

