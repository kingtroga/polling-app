# Real-Time Polling Application

Backend service for a real-time polling application built with Node.js, Express, PostgreSQL, Prisma, and Socket.IO.

## Features

- User registration and authentication with JWT
- Create and manage polls with multiple options
- Real-time voting with instant result updates
- RESTful API endpoints for all CRUD operations
- WebSocket integration for live poll updates
- Proper database relationships and constraints

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Real-time**: Socket.IO
- **Authentication**: JWT with bcrypt

## Database Schema

The application implements the following relationships:

- **One-to-Many**: User → Polls (one user can create many polls)
- **One-to-Many**: Poll → PollOptions (one poll has many options)
- **Many-to-Many**: User ↔ PollOptions (via Vote join table)
- **Constraint**: One vote per user per poll

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd polling-app
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory:
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/polling_db"
JWT_SECRET="your-super-secret-jwt-key-here"
```

4. Create the PostgreSQL database
```bash
createdb polling_db
```

5. Run Prisma migrations
```bash
npx prisma migrate dev --name init
```

6. Start the server
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication

**POST** `/api/auth/register`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**POST** `/api/auth/login`
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Users

**GET** `/api/users/me` (requires auth)
Returns current user profile

**GET** `/api/users/:id`
Returns public user profile

### Polls

**POST** `/api/polls` (requires auth)
```json
{
  "question": "What's your favorite color?",
  "options": ["Red", "Blue", "Green", "Yellow"]
}
```

**GET** `/api/polls`
Returns all published polls with vote counts

**GET** `/api/polls/:id`
Returns specific poll with detailed vote counts

### Votes

**POST** `/api/votes` (requires auth)
```json
{
  "pollOptionId": 1
}
```

**GET** `/api/votes/my-votes` (requires auth)
Returns current user's votes

**GET** `/api/votes/poll/:pollId`
Returns all votes for a specific poll

## WebSocket Events

### Client Events

- `join-poll` - Join a poll room for real-time updates
```javascript
socket.emit('join-poll', pollId)
```

### Server Events

- `poll-update` - Broadcast when new votes are cast
```javascript
socket.on('poll-update', (updatedPoll) => {
  // Handle real-time poll results
})
```

## Testing the Application

### Using the Web Interface

1. Start the server and visit `http://localhost:3000`
2. Register a new account or login
3. Create a poll with question and comma-separated options
4. Open multiple browser tabs to test real-time voting
5. Join a poll room and vote to see live updates

### Using curl

**Register a user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

**Create a poll:**
```bash
curl -X POST http://localhost:3000/api/polls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"question":"Favorite programming language?","options":["JavaScript","Python","Go","Rust"]}'
```

**Submit a vote:**
```bash
curl -X POST http://localhost:3000/api/votes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"pollOptionId":1}'
```

## Project Structure

```
polling-app/
├── prisma/
│   └── schema.prisma          # Database schema
├── routes/
│   ├── auth.js               # Authentication routes
│   ├── users.js              # User management routes
│   ├── polls.js              # Poll CRUD routes
│   └── votes.js              # Voting routes
├── middleware/
│   └── auth.js               # JWT authentication middleware
├── public/
│   └── index.html            # Test web interface
├── server.js                 # Main server file
├── package.json              # Dependencies
└── README.md                 # This file
```

## Key Implementation Details

### Database Relationships

The Vote model serves as a join table implementing the many-to-many relationship between Users and PollOptions, with an additional constraint ensuring one vote per user per poll.

### Real-time Updates

When a vote is submitted, the server broadcasts updated poll results to all clients in that poll's Socket.IO room, enabling instant result updates without page refresh.

### Authentication

JWT tokens are used for stateless authentication. Include the token in the Authorization header as `Bearer <token>` for protected endpoints.

### Error Handling

The API includes proper error handling for common scenarios like duplicate emails, invalid credentials, voting twice on the same poll, and missing resources.

## Development

To run in development mode with auto-restart:
```bash
npm run dev
```

## Requirements Met

- **RESTful API**: Complete CRUD operations for Users, Polls, and Votes
- **Database Schema**: Proper one-to-many and many-to-many relationships using Prisma
- **WebSocket Implementation**: Real-time poll updates using Socket.IO rooms
- **Code Quality**: Clean, modular code structure with proper separation of concerns
- **Easy Setup**: Clear installation and testing instructions