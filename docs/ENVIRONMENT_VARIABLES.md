# Variáveis de Ambiente - LeakerFlow AI Worker Platform

Este documento lista todas as variáveis de ambiente utilizadas no projeto LeakerFlow, organizadas por categoria, com suas finalidades e configurações recomendadas.

## Índice

1. [Configurações Gerais](#configurações-gerais)
2. [Banco de Dados e Supabase](#banco-de-dados-e-supabase)
3. [Provedores de LLM](#provedores-de-llm)
4. [APIs de Busca e Web Scraping](#apis-de-busca-e-web-scraping)
5. [Sandboxing e Desenvolvimento](#sandboxing-e-desenvolvimento)
6. [Webhooks e Integrações](#webhooks-e-integrações)
7. [Segurança e Criptografia](#segurança-e-criptografia)
8. [Serviços Opcionais](#serviços-opcionais)
9. [Infraestrutura](#infraestrutura)
10. [Frontend](#frontend)

---

## Configurações Gerais

### ENV_MODE
- **Finalidade**: Define o modo de execução do ambiente
- **Valores**: `local`, `development`, `production`, `staging`
- **Padrão**: `local`
- **Exemplo**: `ENV_MODE=local`
- **Responsabilidade**: Controla comportamentos específicos do ambiente como logging, debug e configurações de segurança

### NEXT_PUBLIC_ENV_MODE
- **Finalidade**: Versão pública da variável ENV_MODE para o frontend
- **Valores**: `LOCAL`, `DEVELOPMENT`, `PRODUCTION`, `STAGING`
- **Padrão**: `LOCAL`
- **Exemplo**: `NEXT_PUBLIC_ENV_MODE=LOCAL`
- **Responsabilidade**: Permite ao frontend ajustar comportamentos baseados no ambiente

### NEXT_PUBLIC_URL
- **Finalidade**: URL base pública da aplicação frontend
- **Padrão**: `http://localhost:3000`
- **Exemplo**: `NEXT_PUBLIC_URL=http://localhost:3000`
- **Responsabilidade**: Define a URL base para redirecionamentos e links absolutos no frontend

### NEXT_PUBLIC_BACKEND_URL
- **Finalidade**: URL da API backend acessível pelo frontend
- **Padrão**: `http://localhost:8000/api`
- **Exemplo**: `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000/api`
- **Responsabilidade**: Define o endpoint base para todas as chamadas de API do frontend

---

## Banco de Dados e Supabase

### SUPABASE_URL
- **Finalidade**: URL do projeto Supabase
- **Formato**: `https://[project-id].supabase.co`
- **Exemplo**: `SUPABASE_URL=https://xyz123.supabase.co`
- **Responsabilidade**: Conecta a aplicação ao banco de dados PostgreSQL hospedado no Supabase
- **Configuração**: Obtida no dashboard do Supabase em Project Settings > API

### SUPABASE_ANON_KEY
- **Finalidade**: Chave anônima do Supabase para acesso público
- **Formato**: String JWT longa
- **Exemplo**: `SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Responsabilidade**: Permite acesso de leitura/escrita com base nas políticas RLS (Row Level Security)
- **Configuração**: Obtida no dashboard do Supabase em Project Settings > API

### SUPABASE_SERVICE_ROLE_KEY
- **Finalidade**: Chave de serviço do Supabase com privilégios administrativos
- **Formato**: String JWT longa
- **Exemplo**: `SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Responsabilidade**: Permite bypass das políticas RLS para operações administrativas
- **Segurança**: NUNCA expor no frontend, apenas no backend
- **Configuração**: Obtida no dashboard do Supabase em Project Settings > API

### NEXT_PUBLIC_SUPABASE_URL
- **Finalidade**: Versão pública da URL do Supabase para o frontend
- **Valor**: Mesmo valor de SUPABASE_URL
- **Exemplo**: `NEXT_PUBLIC_SUPABASE_URL=https://xyz123.supabase.co`
- **Responsabilidade**: Permite ao frontend conectar-se diretamente ao Supabase

### NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Finalidade**: Versão pública da chave anônima do Supabase para o frontend
- **Valor**: Mesmo valor de SUPABASE_ANON_KEY
- **Exemplo**: `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Responsabilidade**: Permite autenticação e operações de banco de dados no frontend

---

## Provedores de LLM

### OPENAI_API_KEY
- **Finalidade**: Chave de API para acessar modelos da OpenAI
- **Formato**: `sk-...` (chave secreta)
- **Exemplo**: `OPENAI_API_KEY=sk-1234567890abcdef...`
- **Responsabilidade**: Permite acesso aos modelos GPT-4, GPT-3.5, etc.
- **Configuração**: Obtida em https://platform.openai.com/api-keys

### ANTHROPIC_API_KEY
- **Finalidade**: Chave de API para acessar modelos da Anthropic (Claude)
- **Formato**: `sk-ant-...`
- **Exemplo**: `ANTHROPIC_API_KEY=sk-ant-1234567890abcdef...`
- **Responsabilidade**: Permite acesso aos modelos Claude Sonnet, Haiku, etc.
- **Configuração**: Obtida em https://console.anthropic.com/

### GEMINI_API_KEY
- **Finalidade**: Chave de API para acessar modelos Google Gemini
- **Formato**: String alfanumérica
- **Exemplo**: `GEMINI_API_KEY=AIzaSyD1234567890abcdef...`
- **Responsabilidade**: Permite acesso aos modelos Gemini Pro, Ultra, etc.
- **Configuração**: Obtida em https://makersuite.google.com/app/apikey

### OPENROUTER_API_KEY
- **Finalidade**: Chave de API para acessar múltiplos modelos via OpenRouter
- **Formato**: `sk-or-...`
- **Exemplo**: `OPENROUTER_API_KEY=sk-or-1234567890abcdef...`
- **Responsabilidade**: Acesso unificado a diversos modelos de LLM
- **Configuração**: Obtida em https://openrouter.ai/keys

### MORPH_API_KEY
- **Finalidade**: Chave de API para MorphLLM (edição de código especializada)
- **Formato**: String alfanumérica
- **Exemplo**: `MORPH_API_KEY=morph_1234567890abcdef...`
- **Responsabilidade**: Habilita edição de código com IA especializada
- **Configuração**: Obtida em https://morphllm.com/api-keys
- **Nota**: Opcional, fallback para OpenRouter se não configurado

### MODEL_TO_USE
- **Finalidade**: Define o modelo padrão a ser utilizado
- **Valores**: `openai/gpt-5`, `anthropic/claude-sonnet-4-20250514`, `gemini/gemini-2.5-pro`, `openrouter/google/gemini-2.5-pro`
- **Exemplo**: `MODEL_TO_USE=openai/gpt-5`
- **Responsabilidade**: Determina qual modelo LLM será usado por padrão
- **Configuração**: Definido automaticamente baseado nas chaves disponíveis

---

## APIs de Busca e Web Scraping

### TAVILY_API_KEY
- **Finalidade**: Chave de API para busca na web via Tavily
- **Formato**: `tvly-...`
- **Exemplo**: `TAVILY_API_KEY=tvly-1234567890abcdef...`
- **Responsabilidade**: Permite busca inteligente na web para agentes
- **Configuração**: Obtida em https://tavily.com

### FIRECRAWL_API_KEY
- **Finalidade**: Chave de API para web scraping via Firecrawl
- **Formato**: `fc-...`
- **Exemplo**: `FIRECRAWL_API_KEY=fc-1234567890abcdef...`
- **Responsabilidade**: Permite extração estruturada de conteúdo web
- **Configuração**: Obtida em https://firecrawl.dev

### FIRECRAWL_URL
- **Finalidade**: URL base da API Firecrawl
- **Padrão**: `https://api.firecrawl.dev`
- **Exemplo**: `FIRECRAWL_URL=https://api.firecrawl.dev`
- **Responsabilidade**: Define o endpoint para chamadas da API Firecrawl
- **Nota**: Pode ser alterado para instâncias self-hosted

---

## Sandboxing e Desenvolvimento

### DAYTONA_API_KEY
- **Finalidade**: Chave de API para sandboxing via Daytona
- **Formato**: String alfanumérica
- **Exemplo**: `DAYTONA_API_KEY=daytona_1234567890abcdef...`
- **Responsabilidade**: Permite criação e gerenciamento de ambientes de desenvolvimento isolados
- **Configuração**: Obtida em https://app.daytona.io/ no menu 'Keys'

### DAYTONA_SERVER_URL
- **Finalidade**: URL do servidor Daytona
- **Padrão**: `https://app.daytona.io/api`
- **Exemplo**: `DAYTONA_SERVER_URL=https://app.daytona.io/api`
- **Responsabilidade**: Define o endpoint para comunicação com o Daytona

### DAYTONA_TARGET
- **Finalidade**: Região alvo para criação de workspaces
- **Padrão**: `us`
- **Exemplo**: `DAYTONA_TARGET=us`
- **Responsabilidade**: Define a região geográfica para otimização de latência

---

## Webhooks e Integrações

### WEBHOOK_BASE_URL
- **Finalidade**: URL base pública para recebimento de webhooks
- **Formato**: URL HTTPS pública
- **Exemplo**: `WEBHOOK_BASE_URL=https://your-domain.ngrok.io`
- **Responsabilidade**: Permite que serviços externos enviem callbacks para a aplicação
- **Configuração**: Para desenvolvimento local, usar ngrok ou localtunnel
- **Nota**: Deve ser publicamente acessível

### TRIGGER_WEBHOOK_SECRET
- **Finalidade**: Segredo compartilhado para autenticação de webhooks
- **Formato**: String hexadecimal de 64 caracteres
- **Exemplo**: `TRIGGER_WEBHOOK_SECRET=a1b2c3d4e5f6...`
- **Responsabilidade**: Valida a autenticidade dos webhooks recebidos
- **Configuração**: Gerado automaticamente pelo script de setup

---

## Segurança e Criptografia

### MCP_CREDENTIAL_ENCRYPTION_KEY
- **Finalidade**: Chave de criptografia para credenciais MCP
- **Formato**: String base64 de 44 caracteres
- **Exemplo**: `MCP_CREDENTIAL_ENCRYPTION_KEY=abcd1234efgh5678...==`
- **Responsabilidade**: Criptografa credenciais sensíveis do MCP no banco de dados
- **Configuração**: Gerada automaticamente pelo script de setup
- **Segurança**: Manter segura e fazer backup

### KORTIX_ADMIN_API_KEY
- **Finalidade**: Chave de API administrativa para LeakerFlow
- **Formato**: String hexadecimal de 64 caracteres
- **Exemplo**: `KORTIX_ADMIN_API_KEY=1234567890abcdef...`
- **Responsabilidade**: Permite acesso a funções administrativas do LeakerFlow
- **Configuração**: Gerada automaticamente pelo script de setup
- **Segurança**: Acesso apenas para administradores

---

## Serviços Opcionais

### RAPID_API_KEY
- **Finalidade**: Chave de API para serviços RapidAPI
- **Formato**: String alfanumérica
- **Exemplo**: `RAPID_API_KEY=rapid_1234567890abcdef...`
- **Responsabilidade**: Habilita ferramentas extras como scraping do LinkedIn
- **Configuração**: Obtida em https://rapidapi.com/
- **Nota**: Opcional, pode ser configurado posteriormente

### SLACK_CLIENT_ID
- **Finalidade**: ID do cliente para integração com Slack
- **Formato**: String alfanumérica
- **Exemplo**: `SLACK_CLIENT_ID=1234567890.1234567890`
- **Responsabilidade**: Identifica a aplicação no Slack
- **Configuração**: Obtida ao criar app em https://api.slack.com/apps

### SLACK_CLIENT_SECRET
- **Finalidade**: Segredo do cliente para integração com Slack
- **Formato**: String alfanumérica
- **Exemplo**: `SLACK_CLIENT_SECRET=abcd1234efgh5678...`
- **Responsabilidade**: Autentica a aplicação no Slack
- **Configuração**: Obtida ao criar app em https://api.slack.com/apps
- **Segurança**: Manter confidencial

### SLACK_REDIRECT_URI
- **Finalidade**: URI de redirecionamento para OAuth do Slack
- **Padrão**: `http://localhost:3000/api/integrations/slack/callback`
- **Exemplo**: `SLACK_REDIRECT_URI=http://localhost:3000/api/integrations/slack/callback`
- **Responsabilidade**: Define onde o Slack redireciona após autorização

### PIPEDREAM_PROJECT_ID
- **Finalidade**: ID do projeto Pipedream
- **Formato**: String alfanumérica
- **Exemplo**: `PIPEDREAM_PROJECT_ID=proj_1234567890abcdef...`
- **Responsabilidade**: Identifica o projeto para automações Pipedream
- **Configuração**: Obtida em https://pipedream.com/connect

### PIPEDREAM_CLIENT_ID
- **Finalidade**: ID do cliente Pipedream
- **Formato**: String alfanumérica
- **Exemplo**: `PIPEDREAM_CLIENT_ID=client_1234567890abcdef...`
- **Responsabilidade**: Identifica a aplicação no Pipedream
- **Configuração**: Obtida em https://pipedream.com/connect

### PIPEDREAM_CLIENT_SECRET
- **Finalidade**: Segredo do cliente Pipedream
- **Formato**: String alfanumérica
- **Exemplo**: `PIPEDREAM_CLIENT_SECRET=secret_1234567890abcdef...`
- **Responsabilidade**: Autentica a aplicação no Pipedream
- **Configuração**: Obtida em https://pipedream.com/connect
- **Segurança**: Manter confidencial

### PIPEDREAM_X_PD_ENVIRONMENT
- **Finalidade**: Ambiente Pipedream
- **Valores**: `development`, `production`
- **Padrão**: `development`
- **Exemplo**: `PIPEDREAM_X_PD_ENVIRONMENT=development`
- **Responsabilidade**: Define o ambiente para execução de workflows

---

## Infraestrutura

### REDIS_HOST
- **Finalidade**: Hostname do servidor Redis
- **Valores**: `redis` (Docker), `localhost` (local)
- **Padrão**: `redis` para Docker, `localhost` para setup manual
- **Exemplo**: `REDIS_HOST=redis`
- **Responsabilidade**: Define onde conectar ao cache Redis

### REDIS_PORT
- **Finalidade**: Porta do servidor Redis
- **Padrão**: `6379`
- **Exemplo**: `REDIS_PORT=6379`
- **Responsabilidade**: Define a porta para conexão Redis

---

## Frontend

Todas as variáveis `NEXT_PUBLIC_*` são expostas ao frontend e podem ser acessadas no código JavaScript/TypeScript.

### Variáveis Específicas do Frontend

- **NEXT_PUBLIC_SUPABASE_URL**: URL do Supabase para conexão direta
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Chave anônima para autenticação
- **NEXT_PUBLIC_BACKEND_URL**: URL da API backend
- **NEXT_PUBLIC_URL**: URL base da aplicação
- **NEXT_PUBLIC_ENV_MODE**: Modo do ambiente

---

## Configuração e Setup

### Script de Setup Automático

O projeto inclui um script `setup.py` que:

1. **Carrega configurações existentes** de `backend/.env` e `frontend/.env.local`
2. **Coleta informações do usuário** para cada serviço
3. **Valida chaves de API** e URLs
4. **Gera chaves de segurança** automaticamente
5. **Cria arquivos .env** com as configurações
6. **Configura banco de dados** Supabase
7. **Instala dependências** Python

### Execução do Setup

```bash
python setup.py
```

### Arquivos de Configuração Gerados

- `backend/.env`: Variáveis para o servidor backend
- `frontend/.env.local`: Variáveis para a aplicação Next.js

### Validações Implementadas

- **URLs**: Formato válido e acessibilidade
- **Chaves de API**: Comprimento mínimo e formato
- **Ambientes**: Valores permitidos (development/production)

---

## Segurança e Boas Práticas

### Variáveis Sensíveis

As seguintes variáveis contêm informações sensíveis e devem ser protegidas:

- Todas as chaves de API (`*_API_KEY`)
- Chaves de serviço (`*_SERVICE_ROLE_KEY`)
- Segredos de cliente (`*_CLIENT_SECRET`)
- Chaves de criptografia (`*_ENCRYPTION_KEY`)
- Segredos de webhook (`*_WEBHOOK_SECRET`)

### Recomendações

1. **Nunca commitar** arquivos `.env` no controle de versão
2. **Usar diferentes chaves** para desenvolvimento e produção
3. **Rotacionar chaves** periodicamente
4. **Monitorar uso** das APIs para detectar abusos
5. **Fazer backup** das chaves de criptografia
6. **Restringir acesso** às variáveis de produção

### Variáveis por Ambiente

#### Desenvolvimento Local
- URLs apontam para `localhost`
- Chaves de desenvolvimento/teste
- Logs verbosos habilitados

#### Produção
- URLs públicas configuradas
- Chaves de produção
- Logs otimizados
- Monitoramento habilitado

---

## Troubleshooting

### Problemas Comuns

1. **Erro de conexão Supabase**: Verificar URL e chaves
2. **Falha na autenticação LLM**: Validar chaves de API
3. **Webhooks não funcionam**: Verificar URL pública e segredo
4. **Redis não conecta**: Verificar se o serviço está rodando
5. **Daytona falha**: Verificar chave e criar snapshot necessário

### Comandos de Diagnóstico

```bash
# Verificar status dos serviços
docker compose ps

# Verificar logs
docker compose logs -f

# Testar conexão Redis
docker compose exec redis redis-cli ping

# Verificar configuração Supabase
supabase status
```

---

## Referências

- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Daytona](https://docs.daytona.io/)
- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Docker Compose](https://docs.docker.com/compose/)
- [Guia de Segurança para APIs](https://owasp.org/www-project-api-security/)

---

*Documento gerado automaticamente baseado na análise do código-fonte do projeto LeakerFlow AI Worker Platform.*