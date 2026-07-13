import express from 'express';
import router from './routes/payment.js';
import evaluationRouter from './routes/evaluation.js';
import payload from './script/payload.js';

const app = express();
const port = 3000;

app.use(express.json());

app.use(router);
app.use(evaluationRouter);

// remova o payload() se quiser fazer testes unitários
payload();

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
