import express from 'express';
import axios from 'axios';
const router = express.Router();
const API = process.env.PWN_API_URL;

router.get('/v1/data', async (req, res, next) => {
  try {
    const resp = await axios.get(`${API}/api/v1/data`);
    res.json(resp.data);
  } catch (err) { next(err); }
});

router.post('/v1/data', async (req, res, next) => {
  try {
    const resp = await axios.post(`${API}/api/v1/data`, req.body);
    res.status(resp.status).json(resp.data);
  } catch (err) { next(err); }
});

router.get('/v1/units', async (req, res, next) => {
  try {
    const resp = await axios.get(`${API}/api/v1/units`, { params: req.query });
    res.json(resp.data);
  } catch (err) { next(err); }
});

router.post('/v1/report/ap', async (req, res, next) => {
  try {
    const resp = await axios.post(`${API}/api/v1/report/ap`, req.body);
    res.status(resp.status).json(resp.data);
  } catch (err) { next(err); }
});

export default router;
