require('dotenv').config()
const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')

// Routes
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const pollRoutes = require('./routes/polls')
const voteRoutes = require('./routes/votes')

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
})

app.set('io', io) 
app.use(express.json())
app.use(express.static('public'))

// Mount routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/polls', pollRoutes)
app.use('/api/votes', voteRoutes)

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Polling API is running!' })
})

// WebSocket handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)
  
  socket.on('join-poll', (pollId) => {
    socket.join(`poll-${pollId}`)
    console.log(`Socket ${socket.id} joined poll-${pollId}`)
  })
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})