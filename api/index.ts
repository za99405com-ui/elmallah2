import express from 'express';
import app from '../server';

const server = express();
server.use(app);

export default server;
