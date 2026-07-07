# processador_de_webhooks_idempotente
Serviço que recebe webhooks e garante que o mesmo evento, mesmo entregue múltiplas vezes, produza o efeito colateral (processamento) apenas uma vez, retornando de forma consistente o resultado da primeira execução nas entregas subsequentes.
