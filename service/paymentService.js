const pagamentosProcessados = new Map();

export function processarPagamento(idempotencyKey, body) {
  if (pagamentosProcessados.has(idempotencyKey)) {
    const resultadoOriginal = pagamentosProcessados.get(idempotencyKey);

    return {
      isReplay: true,
      resultado: { ...resultadoOriginal, replay: true },
    };
  }

  const resultado = {
    status: 'processed',
    eventId: body.eventId,
    result: {
      charged: true,
      amount: body.amount,
    },
    processedAt: new Date().toISOString(),
  };

  pagamentosProcessados.set(idempotencyKey, resultado);

  return {
    isReplay: false,
    resultado,
  };
}
