import express from 'express';
import { config } from 'dotenv';
import cors from 'cors'
import bodyParser from 'body-parser'
import helmet from 'helmet'
import routes from './routes/index'

config();

const app = express();

app.use(helmet({

}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use(cors({
    origin: '*'
}))

app.get('/', (req, res) => {
  res.json({success: true, message: 'API is running'});
});

app.use('/api', routes)

app.get('*', (req, res) => {
    res.status(404).json({success: false, message: 'Route not found'})
})

app.listen(process.env.PORT, () => {
    console.log(`Server listening on port ${process.env.PORT}`);
});