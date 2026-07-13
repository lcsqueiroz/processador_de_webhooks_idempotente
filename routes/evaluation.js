import { Router } from 'express';
import { rodarAvaliacao } from '../service/evaluationService.js';

const router = Router();

router.get('/evaluation', async (req, res) => {
  const relatorio = await rodarAvaliacao();
  return res.status(200).json(relatorio);
});

export default router;
