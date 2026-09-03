const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'Vercel Serverless' });
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || '1234';
  if (password === ADMIN_PASS) {
    return res.json({ success: true, token: 'admin-authenticated' });
  }
  return res.status(401).json({ success: false, message: 'رمز المرور غير صحيح' });
});

module.exports = app;
