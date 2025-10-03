# Sociometria – Plano de Testes (Etapa 5)

Este documento orienta a validação manual dos fluxos mockados antes da integração real.

## 1. Portal da Colaboradora (`/sociometria/link/:code`)
- **Link válido**: acessar `/sociometria/link/SOCIO-ANA`; confirmar carregamento do formulário, preenchimento obrigatório dos campos e envio com mensagem de conclusão.
- **Link pendente**: acessar `/sociometria/link/SOCIO-MARIA`; verificar lista de colegas disponível, validação de mínimo/máximo e persistência temporária em console.
- **Link inválido/expirado**: acessar `/sociometria/link/INVALIDO`; deve exibir cartão de erro orientando pedir novo convite.
- **Duplicar submissão**: após enviar, recarregar link e checar mensagem de questionário concluído.

## 2. Página Sociometria (Admin)
- **Filtro de convites**: alternar entre "Todas", "Somente pendentes" e "Somente concluídas"; conferir contadores e lista.
- **Resumo gráfico**: validar que o grafo mostra preferências/evitações baseados no snapshot mockado.
- **Pares e papéis**: cards de “Pares preferenciais”, “Pares a evitar” e “Pessoas referência” listam dados do snapshot.
- **Atualização com portal**: responder um link (ex.: SOCIO-MARIA) e voltar à página; status do convite deve mudar para "respondida" (mock baseado em `markLinkStatus`).

## 3. Lista de Funcionárias
- **Status por colaboradora**: cards e tabela exibem rótulos de sociometria (pendente/concluída/expirada) conforme mocks.
- **Disparo de sociometria**: botão "Enviar sociometria" gera novo link (ver console) e mostra toast com URL.
- **Colaboradora sem integração**: alterar temporariamente um nome para testar toast “Colaboradora não integrada”.

## 4. Dashboard
- **Card de sociometria**: verificar contadores de pendentes/respondidas, porcentagem e botão "Ver sociometria".

## 5. Regressão rápida
- `npm run check`
- smoke nas páginas impactadas (Dashboard, Funcionárias, Sociometria, Portal).

## Observações
- Todos os dados são mockados. Logs de envio (`console.info`) devem ser removidos ou substituídos quando o backend for integrado.
- Antes da integração real, alinhar nomes de colaboradoras e IDs para evitar mismatches entre módulos.
