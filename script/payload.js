import axios from 'axios';

const payloads = [
  // adicionei ID para facilitar debug
  {
    id: 1,
    description:
      'Primeira entrega de um evento de pagamento — deve ser processada normalmente (201)',
    headers: {
      'Idempotency-Key': 'evt_8f3a1c',
      'Content-Type': 'application/json',
    },
    body: {
      eventId: 'evt_8f3a1c',
      type: 'payment.confirmed',
      amount: 1000,
      customer: 'cus_4471',
    },
  },

  {
    id: 2,
    description:
      'Reenvio do mesmo evento simulando retry do provedor — mesma Idempotency-Key e mesmo corpo. Deve retornar o resultado da primeira execução (200, replay)',
    headers: {
      'Idempotency-Key': 'evt_8f3a1c',
      'Content-Type': 'application/json',
    },
    body: {
      eventId: 'evt_8f3a1c',
      type: 'payment.confirmed',
      amount: 1000,
      customer: 'cus_4471',
    },
  },

  {
    id: 3,
    description:
      'Mesmo payload válido, mas sem o header obrigatório — deve ser rejeitada (400)',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      eventId: 'evt_9d2b7f',
      type: 'payment.confirmed',
      amount: 2500,
      customer: 'cus_5182',
    },
  },

  {
    id: 4,
    description:
      "Header presente, mas payload sem o campo obrigatório 'amount' — deve ser rejeitado (422)",
    headers: {
      'Idempotency-Key': 'evt_1a4e90',
      'Content-Type': 'application/json',
    },
    body: {
      eventId: 'evt_1a4e90',
      type: 'payment.confirmed',
      customer: 'cus_2093',
    },
  },

  {
    id: 5,
    description:
      'Evento diferente (Idempotency-Key distinta) — deve ser processado normalmente e de forma independente do primeiro evento (201)',
    headers: {
      'Idempotency-Key': 'evt_c72f0e',
      'Content-Type': 'application/json',
    },
    body: {
      eventId: 'evt_c72f0e',
      type: 'payment.refunded',
      amount: 1000,
      customer: 'cus_4471',
    },
  },
];

export default async function enviarLote() {
  const promisses = payloads.map((payload) => {
    return axios
      .post('http://localhost:3000/webhooks/payment', payload.body, {
        headers: payload.headers,
      })
      .then((resposta) => {
        console.log(`Payload ${payload.id}: Sucesso: ${resposta.status}`);
      })
      .catch((erro) => {
        console.log(
          `Payload ${payload.id}: Erro: ${erro.response?.status} - ${erro.response?.data?.message}`,
        );
      });
  });

  await Promise.all(promisses);
  console.log('Todos payloads foram finalizados');
}
