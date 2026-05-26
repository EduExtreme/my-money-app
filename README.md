# My Money App

App de gestao financeira pessoal com Next.js, NeonDB/Postgres e Drizzle ORM.

## Funcionalidades

- Dashboard dark/neon com KPIs mensais e anuais.
- Cadastro de contas: cartao de credito, debito, Pix, banco e dinheiro.
- Cadastro de categorias para entradas e saidas.
- Lancamento de entradas e saidas.
- Parcelamento automatico de saidas a partir do mes da compra.
- Relatorios por ano, categoria e conta.
- Dados monetarios salvos em centavos.

## Setup

Crie `.env.local` com a URL do NeonDB:

```bash
DATABASE_URL="postgresql://user:password@host.neon.tech/database?sslmode=require"
```

Instale e rode:

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Abra `http://localhost:3000`.

## Scripts

- `npm run dev`: inicia o app em desenvolvimento.
- `npm run build`: gera build de producao.
- `npm run lint`: roda ESLint.
- `npm run db:generate`: gera migrations a partir do schema Drizzle.
- `npm run db:migrate`: aplica migrations no NeonDB.
- `npm run db:push`: sincroniza schema diretamente no banco.
- `npm run db:studio`: abre Drizzle Studio.
- `npm run db:seed`: cria contas e categorias iniciais.

## Regra De Parcelas

Ao cadastrar uma saida de `R$ 1.200,00` em `12x`, o app cria 12 transacoes mensais de `R$ 100,00`. A primeira parcela cai no mes da compra e as proximas nos meses seguintes.

Quando a divisao gera centavos, todas as parcelas ficam iguais com arredondamento para centavos. Nao ha ajuste especial na ultima parcela.

## WhatsApp Com Evolution API E Gemini

O app tem um webhook em `POST /api/integrations/evolution/webhook` para receber mensagens da Evolution API. A IA interpreta texto em linguagem natural, cria uma proposta e sempre pede confirmacao antes de registrar.

Variaveis necessarias:

```bash
GOOGLE_GENERATIVE_AI_API_KEY=""
GEMINI_MODEL="gemini-2.5-flash"

EVOLUTION_API_URL="http://localhost:8080"
EVOLUTION_API_KEY="change-me"
EVOLUTION_INSTANCE_NAME="my-money"
EVOLUTION_WEBHOOK_SECRET="change-me-too"
WHATSAPP_ALLOWED_PHONE="55DDDNUMERO"
```

Setup local minimo da Evolution API:

```yaml
version: "3.9"

services:
  evolution-api:
    container_name: evolution_api
    image: atendai/evolution-api:v2.1.1
    restart: always
    ports:
      - "8080:8080"
    environment:
      - AUTHENTICATION_API_KEY=change-me
    volumes:
      - evolution_instances:/evolution/instances

volumes:
  evolution_instances:
```

Suba com `docker compose up -d`. O valor de `AUTHENTICATION_API_KEY` e o mesmo usado em `EVOLUTION_API_KEY`.

Crie a instancia:

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "my-money",
    "integration": "WHATSAPP-BAILEYS",
    "qrcode": true,
    "groupsIgnore": true,
    "readMessages": true
  }'
```

Conecte o WhatsApp:

```bash
curl http://localhost:8080/instance/connect/my-money \
  -H "apikey: change-me"
```

Configure o webhook usando uma URL publica do app, por exemplo ngrok:

```bash
curl -X POST http://localhost:8080/webhook/set/my-money \
  -H "apikey: change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "url": "https://SEU-NGROK.ngrok-free.app/api/integrations/evolution/webhook?secret=change-me-too",
    "webhookByEvents": false,
    "webhookBase64": false,
    "events": ["MESSAGES_UPSERT"]
  }'
```

Exemplo de uso no WhatsApp:

```text
gastei 89,90 no mercado hoje no pix
```

O app responde com um resumo. Responda `SIM` para registrar ou `NAO` para cancelar.
# my-money-app
