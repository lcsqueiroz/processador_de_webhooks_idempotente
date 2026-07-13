import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

export async function rodarAvaliacao() {
  const results = [];

  const chaveTeste = `evt_evaluation_${Date.now()}`;

  const payloadValido = {
    eventId: chaveTeste,
    type: 'payment.confirmed',
    amount: 1000,
    customer: 'cus_evaluation',
  };

  const inicioPrimeiraEntrega = Date.now();
  const primeiraResposta = await axios.post(
    `${BASE_URL}/webhooks/payment`,
    payloadValido,
    {
      headers: { 'Idempotency-Key': chaveTeste },
    },
  );
  const tempoPrimeiraEntrega = Date.now() - inicioPrimeiraEntrega;

  results.push({
    test: 'Primeira entrega processa o evento corretamente',
    passed: primeiraResposta.status === 201,
    responseTimeMs: tempoPrimeiraEntrega,
  });

  const inicioEntregaDuplicada = Date.now();
  const respostaDuplicada = await axios.post(
    `${BASE_URL}/webhooks/payment`,
    payloadValido,
    {
      headers: { 'Idempotency-Key': chaveTeste },
    },
  );
  const tempoEntregaDuplicada = Date.now() - inicioEntregaDuplicada;

  const foiReplay =
    respostaDuplicada.status === 200 &&
    respostaDuplicada.headers['idempotency-replay'] === 'true';

  results.push({
    test: 'Entrega duplicada não reprocessa o efeito colateral',
    passed: foiReplay,
    responseTimeMs: tempoEntregaDuplicada,
  });

  const corpoOriginal = { ...primeiraResposta.data };
  delete corpoOriginal.replay;

  const corpoDuplicado = { ...respostaDuplicada.data };
  delete corpoDuplicado.replay;

  const corposIguais =
    JSON.stringify(corpoOriginal) === JSON.stringify(corpoDuplicado);

  results.push({
    test: 'Resposta de replay é idêntica à original (exceto flag de replay)',
    passed: corposIguais && respostaDuplicada.data.replay === true,
  });

  let requisicaoSemChaveFoiRejeitada = false;

  try {
    await axios.post(`${BASE_URL}/webhooks/payment`, payloadValido);
  } catch (erro) {
    if (erro.response && erro.response.status === 400) {
      requisicaoSemChaveFoiRejeitada = true;
    }
  }

  results.push({
    test: 'Requisição sem Idempotency-Key é rejeitada',
    passed: requisicaoSemChaveFoiRejeitada,
  });

  let totalPassou = 0;

  for (const resultado of results) {
    if (resultado.passed) {
      totalPassou = totalPassou + 1;
    }
  }

  return {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      passed: totalPassou,
      failed: results.length - totalPassou,
    },
  };
}
