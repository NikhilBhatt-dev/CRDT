import express from 'express'

import { Server } from 'socket.io'
import { createServer } from 'http'
import {YSocketIO} from "y-socket.io/dist/server"



const app = express()
const httpServer = createServer(app)


const io =  new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})



const ySocketIO = new YSocketIO(io)
ySocketIO.initialize()



app.get("/", (req, res) => {
    res.status(200).json({
        message:"hello",
        success:true
})
})


app.get('/health', (req,res) => {
    res.status(200).json({
        message:"ok",
        success:true
    })
})


httpServer.listen(3000, () => {
    console.log('server is running on port 3000')
})