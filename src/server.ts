import express from 'express';
import { config } from 'dotenv';
import cors from 'cors'
import bodyParser from 'body-parser'
import routes from './routes/index'
import http from 'http'
import { Server, Socket } from 'socket.io';
import mainSocket from './sockets/mainSocket';
import { verifyToken } from './utils/auth';
import { ISocket } from '../types';

config();

const app = express();
const server = http.createServer(app)

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use(cors({
    origin: '*'
}))

const io = new Server(server)

io.use(async (socket: Socket, next) => {
    const token = socket.handshake.headers.authorization

    if(token) {
        const decoded: any = await verifyToken(token)

        if(decoded) {
            (socket as ISocket).user = decoded
            
            return next()
        }
    }

    return next(new Error('Authentication failed'));
})

mainSocket(io)

app.get('/', (req, res) => {
  res.json({success: true, message: 'API is running'});
});

app.use('/api', routes)

app.get('*', (req, res) => {
    res.status(404).json({success: false, message: 'Route not found'})
})

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});