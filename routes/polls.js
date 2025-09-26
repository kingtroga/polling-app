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
        isPublished: true, 
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
    console.error('Poll creation error:', error) 
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

// Delete poll (protected - only creator)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const pollId = parseInt(req.params.id)
    
    // First check if poll exists and user is the creator
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      select: { id: true, creatorId: true, question: true }
    })
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' })
    }
    
    if (poll.creatorId !== req.user.userId) {
      return res.status(403).json({ error: 'Only poll creator can delete this poll' })
    }
    
    // Delete the poll (CASCADE will handle votes and options)
    await prisma.poll.delete({
      where: { id: pollId }
    })
    
    res.json({ message: 'Poll deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete poll' })
  }
})

// Update poll (protected - only creator)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const pollId = parseInt(req.params.id)
    const { question } = req.body
    
    if (!question || question.trim() === '') {
      return res.status(400).json({ error: 'Question is required' })
    }
    
    // Check if poll exists and user is creator
    const existingPoll = await prisma.poll.findUnique({
      where: { id: pollId },
      select: { id: true, creatorId: true }
    })
    
    if (!existingPoll) {
      return res.status(404).json({ error: 'Poll not found' })
    }
    
    if (existingPoll.creatorId !== req.user.userId) {
      return res.status(403).json({ error: 'Only poll creator can edit this poll' })
    }
    
    // Update the poll
    const updatedPoll = await prisma.poll.update({
      where: { id: pollId },
      data: { 
        question: question.trim(),
        updatedAt: new Date()
      },
      include: {
        options: {
          include: {
            _count: { select: { votes: true } }
          }
        },
        creator: { select: { id: true, name: true } }
      }
    })
    
    res.json(updatedPoll)
  } catch (error) {
    console.error('Poll update error:', error)
    res.status(500).json({ error: 'Failed to update poll' })
  }
})

module.exports = router