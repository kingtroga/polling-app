const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    // Create a test user
    const user = await prisma.user.create({
        data: {
            name: 'Test User',
            email: 'test@example.com',
            passwordHash: 'hashed_password_here'
        }
    })

    console.log('Created user:', user)

    // Clean up
    await prisma.user.delete({ where: {id: user.id}})
    console.log('Test passed!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())