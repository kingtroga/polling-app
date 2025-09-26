const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// Submit a vote (protected)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { pollOptionId } = req.body
    const userId = req.user.userId
    
    // Get the poll option
    const pollOption = await prisma.pollOption.findUnique({
      where: { id: pollOptionId },
      include: { poll: true }
    })
    
    if (!pollOption) {
      return res.status(404).json({ error: 'Poll option not found' })
    }
    
    if (!pollOption.poll.isPublished) {
      return res.status(400).json({ error: 'Cannot vote on unpublished poll' })
    }
    
    // Find existing vote using findFirst
    const existingVote = await prisma.vote.findFirst({
      where: { 
        userId: userId,
        pollId: pollOption.pollId
      }
    })
    
    let vote;
    
    if (existingVote) {
      // Update existing vote
      vote = await prisma.vote.update({
        where: { id: existingVote.id },
        data: { pollOptionId: pollOptionId },
        include: {
          pollOption: true,
          user: { select: { id: true, name: true } }
        }
      })
    } else {
      // Create new vote
      vote = await prisma.vote.create({
        data: {
          userId: userId,
          pollId: pollOption.pollId,
          pollOptionId: pollOptionId
        },
        include: {
          pollOption: true,
          user: { select: { id: true, name: true } }
        }
      })
    }
    
    // Get updated poll results
    const updatedPoll = await prisma.poll.findUnique({
      where: { id: pollOption.pollId },
      include: {
        options: {
          include: {
            _count: { select: { votes: true } }
          }
        }
      }
    })
    
    // Broadcast real-time update
    const io = req.app.get('io')
    io.to(`poll-${pollOption.pollId}`).emit('poll-update', updatedPoll)
    
    res.json(vote)
    
  } catch (error) {
    console.error('Vote error:', error)
    res.status(500).json({ error: 'Failed to submit vote' })
  }
})

// Submit a vote (protected)
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { pollOptionId } = req.body
    const userId = req.user.userId
    
    // Get the poll option
    const pollOption = await prisma.pollOption.findUnique({
      where: { id: pollOptionId },
      include: { poll: true }
    })
    
    if (!pollOption) {
      return res.status(404).json({ error: 'Poll option not found' })
    }
    
    if (!pollOption.poll.isPublished) {
      return res.status(400).json({ error: 'Cannot vote on unpublished poll' })
    }
    
    // Find existing vote
    const existingVote = await prisma.vote.findFirst({
      where: { 
        userId: userId,
        pollId: pollOption.pollId
      }
    })
    
    let vote;
    
    if (existingVote) {
      // Update existing vote
      vote = await prisma.vote.update({
        where: { id: existingVote.id },
        data: { pollOptionId: pollOptionId },
        include: {
          pollOption: true,
          user: { select: { id: true, name: true } }
        }
      })
    } else {
      // Create new vote
      vote = await prisma.vote.create({
        data: {
          userId: userId,
          pollId: pollOption.pollId,
          pollOptionId: pollOptionId
        },
        include: {
          pollOption: true,
          user: { select: { id: true, name: true } }
        }
      })
    }
    
    // Get updated poll results
    const updatedPoll = await prisma.poll.findUnique({
      where: { id: pollOption.pollId },
      include: {
        options: {
          include: {
            _count: { select: { votes: true } }
          }
        }
      }
    })
    
    // Broadcast real-time update
    const io = req.app.get('io')
    io.to(`poll-${pollOption.pollId}`).emit('poll-update', updatedPoll)
    
    res.json(vote)
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to update vote' })
  }
})

// Get user's votes (protected)
router.get('/my-votes', authenticateToken, async (req, res) => {
  try {
    const votes = await prisma.vote.findMany({
      where: { userId: req.user.userId },
      include: {
        pollOption: {
          include: {
            poll: {
              select: { id: true, question: true }
            }
          }
        }
      }
    })
    
    res.json(votes)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch votes' })
  }
})

// Get votes for a specific poll (public)
router.get('/poll/:pollId', async (req, res) => {
  try {
    const votes = await prisma.vote.findMany({
      where: { pollId: parseInt(req.params.pollId) },
      include: {
        pollOption: { select: { id: true, text: true } },
        user: { select: { id: true, name: true } }
      }
    })
    
    res.json(votes)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch poll votes' })
  }
})

module.exports = router