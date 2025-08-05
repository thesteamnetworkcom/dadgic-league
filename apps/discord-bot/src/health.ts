import express from 'express'

const app = express()
const PORT = Number(process.env.PORT) || 10000

app.get('/', (req, res) => {
  res.json({ 
    status: 'online',
    service: 'dadgic-discord-bot',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Health endpoint running on port ${PORT}`)
})