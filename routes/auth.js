const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const { JWT_SECRET } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    
    const passwordHash = await bcrypt.hash(password, 10)
    
    const user = await prisma.user.create({
      data: { name, email, passwordHash }
    })
    
    const token = jwt.sign(
      { userId: user.id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    )
    
    const { passwordHash: _, ...userResponse } = user
    res.json({ user: userResponse, token })
    
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Email already exists' })
    } else {
      res.status(500).json({ error: 'Failed to create user' })
    }
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    const user = await prisma.user.findUnique({ where: { email } })
    
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    )
    
    const { passwordHash: _, ...userResponse } = user
    res.json({ user: userResponse, token })
    
  } catch (error) {
    res.status(500).json({ error: 'Login failed' })
  }
})

module.exports = router