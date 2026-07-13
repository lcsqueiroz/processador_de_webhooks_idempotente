export default function validateWebhook(req, res, next) {
  const idempotencyKey = req.get('Idempotency-Key');

  if (!idempotencyKey) {
    return res.status(400).json({
      error: 'MissingIdempotencyKey',
      message:
        "O header 'Idempotency-Key' é obrigatório para processar este webhook.",
    });
  }

  const body = req.body ?? {};

  if (typeof body.eventId !== 'string') {
    return res.status(422).json({
      error: 'InvalidPayload',
      message: "Campo 'eventId' é obrigatório e deve ser uma string.",
    });
  }

  if (typeof body.type !== 'string') {
    return res.status(422).json({
      error: 'InvalidPayload',
      message: "Campo 'type' é obrigatório e deve ser uma string.",
    });
  }

  if (typeof body.amount !== 'number') {
    return res.status(422).json({
      error: 'InvalidPayload',
      message: "Campo 'amount' é obrigatório e deve ser numérico.",
    });
  }

  if (typeof body.customer !== 'string') {
    return res.status(422).json({
      error: 'InvalidPayload',
      message: "Campo 'customer' é obrigatório e deve ser uma string.",
    });
  }

  next();
}
