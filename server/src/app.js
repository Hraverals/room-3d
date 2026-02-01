import dotenv from 'dotenv'
dotenv.config();

import express from 'express';
const app = express();
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';

import mongodbConfig from './configs/mongodb.js';
mongodbConfig();
import apiRouter from './routes/api.js';


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false, 
    cookie: {
        httpOnly: true, 
        secure: false,
        maxAge: 1000 * 60 * 60 * 24,
    },

    store: MongoStore.create({
        client: mongoose.connection.getClient()
    })
}));


app.use('/api', apiRouter);

app.use((err, req, res, next) => {
    const { message = 'oh no, Error!!', statusCode = 500 } = err;
    console.log(err);
    res.status(statusCode).json({ error: err, success: false });
})

const server = app.listen(process.env.PORT, () => {
    console.log(`Serving on port ${process.env.PORT}`);
})
server.setTimeout(1000 * 60 * 5);