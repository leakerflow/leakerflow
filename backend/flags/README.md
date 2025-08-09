# Feature Flags — Guia de Configuração (Redis)

Este documento descreve como gerenciar as feature flags do projeto usando Redis, incluindo a lista de flags disponíveis, estrutura de armazenamento, comandos prontos (redis-cli/Upstash), endpoints de API e a ferramenta de CLI.

## Visão Geral

- Sistema baseado em Redis para ligar/desligar funcionalidades sem deploy
- Cada flag é armazenada como um hash `feature_flag:{nome}`
- Todas as flags conhecidas ficam listadas em um set `feature_flags:list`
- O backend e o frontend consultam as flags em tempo de execução

## Lista de Feature Flags

As seguintes flags são suportadas/consumidas atualmente pelo código:

- `custom_agents` — habilita criação/gestão de agentes customizados
- `agent_marketplace` — habilita funcionalidades do marketplace de agentes
- `mcp_module` — habilita módulo MCP
- `templates_api` — habilita API de templates
- `triggers_api` — habilita API de triggers
- `workflows_api` — habilita API de workflows
- `knowledge_base` — habilita base de conhecimento
- `pipedream` — habilita integração com Pipedream
- `credentials_api` — habilita API de credenciais
- `suna_default_agent` — habilita o agente padrão Suna

Observação: Algumas flags podem ainda não existir no Redis em ambientes novos; basta criá-las seguindo as instruções abaixo.

## Estrutura no Redis

- Set com todos os nomes de flags: `feature_flags:list`
- Hash por flag: `feature_flag:{nome}`
  - Campos do hash:
    - `enabled`: string `"true"` ou `"false"` (minúsculo)
    - `description`: texto livre (opcional)
    - `updated_at`: timestamp ISO (opcional; o backend preenche quando usa a CLI/API)

## Comandos (redis-cli / Upstash console)

### Criar/Ativar com descrição

```bash
SADD feature_flags:list custom_agents
HSET feature_flag:custom_agents enabled true description "Controls custom agent creation and management"

SADD feature_flags:list agent_marketplace
HSET feature_flag:agent_marketplace enabled true description "Agent marketplace functionality"

SADD feature_flags:list mcp_module
HSET feature_flag:mcp_module enabled true description "MCP module"

SADD feature_flags:list templates_api
HSET feature_flag:templates_api enabled true description "Templates API"

SADD feature_flags:list triggers_api
HSET feature_flag:triggers_api enabled true description "Triggers API"

SADD feature_flags:list workflows_api
HSET feature_flag:workflows_api enabled true description "Workflows API"

SADD feature_flags:list knowledge_base
HSET feature_flag:knowledge_base enabled true description "Knowledge base"

SADD feature_flags:list pipedream
HSET feature_flag:pipedream enabled true description "Pipedream integration"

SADD feature_flags:list credentials_api
HSET feature_flag:credentials_api enabled true description "Credentials API"

SADD feature_flags:list suna_default_agent
HSET feature_flag:suna_default_agent enabled true description "Suna default agent"
```

### Desativar uma flag

```bash
HSET feature_flag:{nome} enabled false
```

### Consultar status/detalhes

```bash
SMEMBERS feature_flags:list
HGETALL feature_flag:{nome}
HGET feature_flag:{nome} enabled
```

### Remover uma flag (opcional)

```bash
DEL feature_flag:{nome}
SREM feature_flags:list {nome}
```

## Uso via API (Backend)

- Listar todas: `GET /feature-flags`
- Detalhe de uma flag: `GET /feature-flags/{flag_name}`

Respostas de exemplo:

```json
{
  "flags": {
    "custom_agents": true,
    "knowledge_base": false
  }
}
```

```json
{
  "flag_name": "custom_agents",
  "enabled": true,
  "details": {
    "enabled": "true",
    "description": "Controls custom agent creation and management",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

Observações de comportamento:

- Em erro/indisponibilidade do Redis, o backend retorna `enabled: false` por padrão
- Os campos do hash são strings; `enabled` deve ser `"true"`/`"false"` em minúsculo

## Uso via CLI

Ferramenta: `backend/flags/setup.py`

```bash
cd backend/flags
python setup.py enable custom_agents "Controls custom agent creation and management"
python setup.py disable custom_agents
python setup.py list
python setup.py status custom_agents
python setup.py toggle custom_agents "Toggle"
python setup.py delete custom_agents
```

## Integração no Código

Backend (Python):

- Módulo: `backend/flags/flags.py`
- Funções principais assíncronas: `is_enabled`, `set_flag`, `enable_flag`, `disable_flag`, `list_flags`, `get_flag_details`

Frontend (Next.js):

- Módulo: `frontend/src/lib/feature-flags.ts`
- Hooks: `useFeatureFlag`, `useFeatureFlags`, `useAllFeatureFlags`

## Boas Práticas

- Padronize descrições curtas e claras
- Use apenas `true`/`false` minúsculos em `enabled`
- Mantenha `feature_flags:list` sincronizado ao criar novas flags (use `SADD`)
- Prefira gerenciar via CLI/endpoint para garantir `updated_at`
- Evite deletar flags em produção; prefira desativar


