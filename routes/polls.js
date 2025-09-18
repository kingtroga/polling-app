const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// Create poll (protected)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { question, options } = req.body
    
    const poll = await prisma.poll.create({
      data: {
        question,
        creatorId: req.user.userId,
        isPublished: true, // Add this line - auto-publish for testing
        options: {
          create: options.map(text => ({ text }))
        }
      },
      include: {
        options: true,
        creator: { select: { id: true, name: true } }
      }
    })
    
    res.json(poll)
  } catch (error) {
    console.error('Poll creation error:', error) // Add this for debugging
    res.status(500).json({ error: 'Failed to create poll' })
  }
})


// Get all polls (public)
router.get('/', async (req, res) => {
  try {
    const polls = await prisma.poll.findMany({
      where: { isPublished: true },
      include: {
        options: true,
        creator: { select: { id: true, name: true } },
        _count: { select: { votes: true } }
      }
    })
    
    res.json(polls)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch polls' })
  }
})

// Get poll by ID with vote counts (public)
router.get('/:id', async (req, res) => {
  try {
    const poll = await prisma.poll.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        options: {
          include: {
            _count: { select: { votes: true } }
          }
        },
        creator: { select: { id: true, name: true } }
      }
    })
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' })
    }
    
    res.json(poll)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch poll' })
  }
})

module.exports = router