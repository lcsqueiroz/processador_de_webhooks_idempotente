import { Router } from 'express';

const router = Router();

router.post('/webhooks/payment', (req, res) => {
  return res.status(200).json({ message: 'Tudo certo' });
});

export default router;
