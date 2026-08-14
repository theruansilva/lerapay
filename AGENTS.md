# AGENTS.md

## Regras de Execução & Convenções

### 1. Padrão de Commits
- **Gitmoji obrigatório**: Todos os commits devem seguir a convenção de Gitmoji + Conventional Commits.
  - Exemplo: `✨ feat(wallet): add transfer endpoint with balance check`
  - Exemplo: `🐛 fix(pix): handle webhook timeout gracefully`
  - Exemplo: `✅ test(gateway): add integration tests for card charge`
  - Exemplo: `📝 docs(api): update swagger schema for transactions`
  - Exemplo: `♻️ refactor(fees): extract fee calculation strategy`
- **Commits Atômicos**: 
  - Exatamente um commit por tarefa concluída.
  - O commit deve conter a implementação, o teste/gate correspondente e o update do rastreamento no arquivo de tasks.
  - Nunca agrupar múltiplas tarefas não relacionadas no mesmo commit.

### 2. Metodologia de Desenvolvimento
- Framework principal: **`tlc-spec-driven`** (Specify → Design → Tasks → Execute).
- Nível de complexidade inicial do BaaS: **Complex** (Requisitos implícitos de pagamentos, concorrência de saldo, integração externa, idempotência e webhooks).
- Estrutura de artefatos sob `.specs/`:
  - `.specs/STATE.md` para decisões de arquitetura e log.
  - `.specs/features/baas-core/` para as especificações, design, tasks e validações do sistema.

### 3. Contexto do Projeto (BaaS - Lera Pay)
- **Domínio**: Banking as a Service (BaaS) com gateway simulado.
- **Módulos Core**:
  - Checkout Pix & Cartão de Crédito.
  - Carteira Digital (Wallet, Saldo, Ledger / Débito & Crédito).
  - Extrato de movimentações com filtros.
  - Saques / Transferências.
  - Webhooks (recebimento e despacho assíncrono com idempotência).
  - Tarifação e split de taxas configurável.
  - Documentação OpenAPI / Swagger completa.
