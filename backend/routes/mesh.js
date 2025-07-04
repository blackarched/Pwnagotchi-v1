import express from 'express';
import axios from 'axios';
const router = express.Router();
const API = process.env.PWN_API_URL;

async function proxy(req, res, next) {
  try {
    const url = `${API}${req.originalUrl}`;
    const resp = await axios({ method: req.method, url, data: req.body });
    res.status(resp.status).json(resp.data);
  } catch (err) {
    next(err);
  }
}

router.get('/:status', proxy);
router.get('/peers', proxy);
router.get('/data', proxy);
router.post('/data', proxy);
router.get('/memory', proxy);
router.get('/memory/:fingerprint', proxy);

export default router;
