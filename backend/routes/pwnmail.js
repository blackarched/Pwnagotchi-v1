import express from 'express';
import axios from 'axios';
const router = express.Router();
const API = process.env.PWN_API_URL;

router.get('/v1/inbox', async (req, res, next) => {
  try {
    const resp = await axios.get(`${API}/api/v1/inbox`);
    res.json(resp.data);
  } catch (err) { next(err); }
});

router.get('/v1/inbox/:id', async (req, res, next) => {
  try {
    const resp = await axios.get(`${API}/api/v1/inbox/${req.params.id}`);
    res.json(resp.data);
  } catch (err) { next(err); }
});

router.get('/v1/inbox/:id/:mark', async (req, res, next) => {
  try {
    const resp = await axios.get(`${API}/api/v1/inbox/${req.params.id}/${req.params.mark}`);
    res.json(resp.data);
  } catch (err) { next(err); }
});

router.post('/v1/unit/:fingerprint/inbox', async (req, res, next) => {
  try {
    const resp = await axios.post(`${API}/api/v1/unit/${req.params.fingerprint}/inbox`, req.body);
    res.status(resp.status).json(resp.data);
  } catch (err) { next(err); }
});

export default router;
