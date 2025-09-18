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
    
    // Get the poll option to find the poll ID
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
    
    // Check if user already voted on this poll
    const existingVote = await prisma.vote.findUnique({
      where: { 
        userId_pollId: { 
          userId: userId, 
          pollId: pollOption.pollId 
        } 
      }
    })
    
    if (existingVote) {
      return res.status(400).json({ error: 'You have already voted on this poll' })
    }
    
    // Create the vote
    const vote = await prisma.vote.create({
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
    
    // Get updated poll results for real-time broadcast
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
    
    const io = req.app.get('io')
io.to(`poll-${pollOption.pollId}`).emit('poll-update', updatedPoll)
    res.json(vote)
    
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'You have already voted on this poll' })
    } else {
      res.status(500).json({ error: 'Failed to submit vote' })
    }
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