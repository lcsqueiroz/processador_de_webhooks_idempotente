import { Router } from 'express';
import validateWebhook from '../middleware/validateWebhook.js';
import { processarPagamento } from '../service/paymentService.js';

const router = Router();

router.post('/webhooks/payment', validateWebhook, (req, res) => {
  const idempotencyKey = req.get('Idempotency-Key');

  const { isReplay, resultado } = processarPagamento(idempotencyKey, req.body);

  if (isReplay) {
    res.set('Idempotency-Replay', 'true');
    return res.status(200).json(resultado);
  }

  return res.status(201).json(resultado);
});

export default router;
