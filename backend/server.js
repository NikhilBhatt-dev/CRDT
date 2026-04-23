import express from 'express'
import { Server } from 'socket.io'
import { createServer } from 'http'
import {YSocketIO} from "y-socket.io/dist/server"
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'



const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendDistPath = path.resolve(__dirname, "../frontend/vite-project/dist")
const publicPath = path.resolve(__dirname, "public")
const indexHtmlPath = fs.existsSync(path.join(publicPath, "index.html"))
    ? path.join(publicPath, "index.html")
    : path.join(frontendDistPath, "index.html")
const PORT = process.env.PORT || 3000

// app.use(express.static(frontendDistPath))
app.use(express.static("public"))
const httpServer = createServer(app)


const io =  new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})



const ySocketIO = new YSocketIO(io)
ySocketIO.initialize()





app.get('/health', (req,res) => {
    res.status(200).json({
        message:"ok",
        success:true
    })
})

app.use((req, res) => {
    res.sendFile(indexHtmlPath)
})


httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`server is running on port ${PORT}`)
})
