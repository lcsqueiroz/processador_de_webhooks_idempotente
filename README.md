# Desafio Técnico: Processador de Webhooks Idempotente

> 💡 Este é um desafio técnico auto-proposto, criado por mim ([lcsqueiroz](https://github.com/lcsqueiroz)) como parte do meu portfólio de projetos backend. A ideia é simular um problema real de integração com serviços de terceiros (gateways de pagamento, provedores de notificação), definindo as regras antes de iniciar a implementação.

---

## 📑 Sobre o Desafio

Serviços que recebem webhooks (Stripe, PagSeguro, provedores de e-mail, etc.) precisam lidar com um problema comum: o mesmo evento pode ser entregue mais de uma vez, seja por retry do provedor, timeout de rede ou falha momentânea no consumidor. Se o processamento não for idempotente, um único evento de pagamento pode gerar cobrança duplicada, envio duplicado de e-mail, ou qualquer outro efeito colateral repetido — problema com impacto financeiro e de confiabilidade real em produção.

## Objetivo

Criar um serviço em Express.js que receba webhooks e garanta que o mesmo evento, mesmo entregue múltiplas vezes, produza o efeito colateral (processamento) **apenas uma vez**, retornando de forma consistente o resultado da primeira execução nas entregas subsequentes.

- [Exemplos de respostas esperadas da API](./exemplos-respostas.json)
- [Payloads de exemplo para testar o endpoint](./payload-webhook.json)

---

## 🎯 Núcleo obrigatório

Este é o escopo que define a entrega mínima do desafio — deve ser 100% concluído.

### `POST /webhooks/payment`

- Recebe um payload simulando um evento de pagamento (ex: `{ "eventId": "...", "amount": 1000, "customer": "..." }`).
- Exige o header `Idempotency-Key` identificando unicamente a tentativa de entrega.
- Se a chave já foi processada anteriormente:
  - Não reprocessa o evento (não repete o efeito colateral).
  - Retorna o mesmo resultado da primeira execução.
  - Sinaliza que a resposta é um replay (ver seção de exemplos).
- Se a chave é nova:
  - Processa o evento (para o desafio, "processar" pode ser simulado, ex: incrementar um contador de "pagamentos confirmados" em memória).
  - Armazena o resultado associado à chave.
  - Retorna o resultado da execução.

### Validação

- Requisição sem `Idempotency-Key` deve ser rejeitada com `400 Bad Request`.
- Payload malformado (campos obrigatórios ausentes) deve ser rejeitado com `422 Unprocessable Entity`.

### Armazenamento e expiração

- Armazenamento em memória (Map), associando `Idempotency-Key` → resultado processado.
- TTL simples: chaves processadas há mais de um período configurável (ex: 24h) podem ser expiradas e limpas periodicamente, já que nenhum provedor reentrega um evento indefinidamente.

### `GET /evaluation`

Endpoint de autoavaliação, seguindo o mesmo padrão dos demais projetos: um script que envia o mesmo evento múltiplas vezes com a mesma `Idempotency-Key`, verifica se o efeito colateral (ex: contador) foi aplicado uma única vez, confirma que as respostas subsequentes retornam o resultado original, e retorna um relatório em JSON.

### Testes mínimos

- Primeira entrega de um evento é processada normalmente.
- Entregas repetidas da mesma chave não geram novo processamento (efeito colateral não se repete).
- Requisição sem `Idempotency-Key` é rejeitada.

---

## Exemplos de Resposta

### Primeira entrega — evento processado — `201 Created`

```http
HTTP/1.1 201 Created
Content-Type: application/json
```

```json
{
  "status": "processed",
  "eventId": "evt_8f3a1c",
  "result": {
    "charged": true,
    "amount": 1000
  },
  "processedAt": "2026-07-07T14:30:00.000Z"
}
```

### Entrega duplicada — mesma `Idempotency-Key` — `200 OK`

```http
HTTP/1.1 200 OK
Idempotency-Replay: true
Content-Type: application/json
```

```json
{
  "status": "processed",
  "eventId": "evt_8f3a1c",
  "result": {
    "charged": true,
    "amount": 1000
  },
  "processedAt": "2026-07-07T14:30:00.000Z",
  "replay": true
}
```

> Note que o corpo da resposta de replay é idêntico ao da primeira execução, exceto pelo campo `replay: true` e o header `Idempotency-Replay`. Isso é intencional: o cliente que reenviou o evento deve receber a mesma informação que receberia se o pedido tivesse sido processado pela primeira vez agora.

### Requisição sem `Idempotency-Key` — `400 Bad Request`

```json
{
  "error": "MissingIdempotencyKey",
  "message": "O header 'Idempotency-Key' é obrigatório para processar este webhook."
}
```

### Payload malformado — `422 Unprocessable Entity`

```json
{
  "error": "InvalidPayload",
  "message": "Campo 'amount' é obrigatório e deve ser numérico."
}
```

### Relatório do `GET /evaluation`

```json
{
  "timestamp": "2026-07-07T14:35:00.000Z",
  "results": [
    {
      "test": "Primeira entrega processa o evento corretamente",
      "passed": true,
      "responseTimeMs": 4
    },
    {
      "test": "Entrega duplicada não reprocessa o efeito colateral",
      "passed": true,
      "responseTimeMs": 2
    },
    {
      "test": "Resposta de replay é idêntica à original (exceto flag de replay)",
      "passed": true
    },
    {
      "test": "Requisição sem Idempotency-Key é rejeitada",
      "passed": true
    }
  ],
  "summary": {
    "total": 4,
    "passed": 4,
    "failed": 0
  }
}
```

---

## ⭐ Diferenciais (bônus — fazer se sobrar tempo/confiança)

- **Concorrência real**: duas requisições com a mesma `Idempotency-Key` chegando simultaneamente não devem processar o efeito colateral duas vezes (exige um estado intermediário de "processando", não só "processado").
- **Persistência externa**: trocar o Map em memória por um armazenamento durável (Redis ou banco), garantindo que a idempotência sobreviva a um restart do serviço.
- **Verificação de assinatura**: validar um header de assinatura HMAC simulando a verificação usada por provedores reais (Stripe, por exemplo), rejeitando eventos não autênticos.
- **Múltiplos tipos de evento**: suportar mais de um tipo de webhook (ex: pagamento aprovado, pagamento estornado), cada um com sua própria lógica de processamento.
- **Fila de reprocessamento (dead-letter)**: eventos que falham no processamento após N tentativas vão para uma lista separada para investigação manual.

## Critérios de avaliação (autoavaliação)

**Núcleo:**

- [ ] Primeira entrega de um evento é processada e armazenada corretamente.
- [ ] Entregas duplicadas retornam o resultado original sem reprocessar.
- [ ] Requisição sem `Idempotency-Key` é rejeitada com `400`.
- [ ] Payload malformado é rejeitado com `422`.
- [ ] Endpoint `/evaluation` roda e retorna relatório coerente.

**Diferenciais (opcional):**

- [ ] Concorrência (requisições simultâneas com mesma chave) tratada corretamente.
- [ ] Armazenamento persistente implementado.
- [ ] Verificação de assinatura HMAC implementada.
- [ ] Suporte a múltiplos tipos de evento.
- [ ] Mecanismo de dead-letter implementado.

---

## Requisitos Técnicos

- Código limpo, modular, com funções bem definidas.
- Pode usar qualquer linguagem/framework.
- Não pode usar IA.

## Stack

Node.js, Express.js
