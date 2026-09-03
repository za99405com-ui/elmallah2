import express from 'express';

const app = express();

app.use(express.json());

app.get('/api', (req, res) => {
  res.json({ message: 'Server is running on Vercel' });
});

export default app;
