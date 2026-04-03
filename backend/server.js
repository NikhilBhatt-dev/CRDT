import express from 'express'
import { Server } from 'socket.io'
import { createServer } from 'http'
import {YSocketIO} from "y-socket.io/dist/server"
import path from 'path'
import { fileURLToPath } from 'url'



const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendDistPath = path.resolve(__dirname, "../frontend/vite-project/dist")

app.use(express.static(frontendDistPath))
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
    res.sendFile(path.join(frontendDistPath, "index.html"))
})


httpServer.listen(3000, () => {
    console.log('server is running on port 3000')
})
