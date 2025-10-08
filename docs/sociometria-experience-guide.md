# Sociometria MVP - Guia Comercial e Jornada do Usuario

## Visao geral
Sociometria MVP e a plataforma que integra organizacao de equipes, avaliacoes psicometricas e leitura sociometrica em um unico fluxo. O objetivo e entregar seguranca operacional ao gestor de campo e dados acionaveis para a diretoria, reduzindo o tempo gasto com planilhas desconectadas e decisoes baseadas apenas na intuicao.

## Principais entregas da plataforma
- **Orquestracao de equipes em tempo real**: monte e ajuste times com recomendacoes automatizadas ou curadoria manual, equilibrando perfis de colaboradoras e exigencia de cada cliente.
- **Base unica de colaboradoras e casas**: cadastre, edite e filtre informacoes com status operacionais, tags de comportamento e necessidades de cada residencia.
- **Biblioteca de testes psicometricos**: mantenha instrumentos alinhados a boas praticas, com versionamento e interpretacoes padronizadas.
- **Motor de avaliacoes combinadas**: orquestre campanhas multilingues, controle convites e acompanhe a jornada de cada colaboradora do disparo a conclusao.
- **Sociometria viva**: visualize lacos de afinidade, conflitos e papeis naturais dentro da equipe para apoiar alocacao inteligente.
- **Relatorios executivos**: acompanhe indicadores, exporte evidencias e comunique resultados com clareza para stakeholders.

## Jornada completa do usuario
1. **Preparar a base operacional**  
   - Importe ou cadastre colaboradoras no modulo dedicado (`client/src/pages/Funcionarias.tsx`) e defina o papel de cada uma.  
   - Cadastre casas e tipos de servico em `client/src/pages/Casas.tsx`, garantindo aderencia entre demanda e competencias do time.
2. **Construir o mix de avaliacao**  
   - Utilize o construtor de testes (`client/src/pages/TestEditor.tsx`) para criar instrumentos de 10 questoes com quatro alternativas ponderadas (pesos 1 a 4) e bandas de interpretacao customizaveis.  
   - Publique ou arquive rapidamente na lista de testes (`client/src/pages/Testes.tsx`).
3. **Engajar a equipe com avaliacoes guiadas**  
   - Agrupe testes em campanhas completas no modulo de avaliacoes (`client/src/pages/Avaliacoes.tsx`).  
   - Gere links unicos, distribua para colaboradoras e acompanhe status (pendente, em andamento, pausado, concluido) sem sair da pagina.
4. **Ler o clima social com sociometria**  
   - Gerencie convites e respostas no painel sociometrico (`client/src/pages/Sociometria.tsx`).  
   - Identifique pares ideais, conflitos potenciais e liderancas informais a partir do snapshot visual.
5. **Decidir e comunicar com dados**  
   - Consolide evidencias nos relatorios (`client/src/pages/Relatorios.tsx`) e exporte para PDF sempre que precisar sustentar uma decisao.

## Experiencia por modulo
### Dashboard inteligente
Visao inicial com indicadores de pessoas, casas e testes (`client/src/pages/Dashboard.tsx`). O gestor pode gerar times automaticamente em segundos ou montar combinacoes manualmente com validacao de regras (minimo e maximo de membros). Justificativas de recomendacao ajudam a explicar escolhas ao cliente.

### Colaboradoras
Catalogo completo (`client/src/pages/Funcionarias.tsx`) com busca fonetica, alternancia carta/lista e acoes rapidas: edicao, exclusao, disparo de sociometria e acesso direto as avaliacoes. Cada linha destaca o status do ultimo convite sociometrico, evitando follow-up manual.

### Casas
Modulo de clientes residenciais (`client/src/pages/Casas.tsx`) com filtros por tipo de limpeza, tamanho e endereco. Suporta tanto visual em cards quanto tabela para operacoes maiores, mantendo coerencia com a nomenclatura usada no dashboard e nas recomendacoes de time.

### Testes psicometricos
Biblioteca de instrumentos (`client/src/pages/Testes.tsx`) alimentada por mock data robusto (`client/src/lib/mock/test-data.ts`). O editor (`client/src/pages/TestEditor.tsx`) aplica regras de negocio: exatamente 10 questoes, bandas obrigatorias e versionamento automatico, preservando historico e idiomas disponiveis.

### Avaliacoes combinadas
Centraliza campanhas (`client/src/pages/Avaliacoes.tsx`), permitindo duplicar configuracoes, renovar ou expirar links e acompanhar atribuicoes por colaboradora. O hook `client/src/hooks/useAssessments.ts` garante clones profundos para evitar efeitos colaterais e suporta funcoes como `generateLink`, `updateAssignmentStatus` e `renewLink`.

### Portal da colaboradora para avaliacoes
Experiencia dedicada (`client/src/pages/AssessmentPortal.tsx`) com timer, modo pausa, salvamento incremental e navegacao por testes. O participante visualiza progresso global, instrucoes em lista e consegue retomar onde parou sem suporte tecnico.

### Sociometria
Painel analitico (`client/src/pages/Sociometria.tsx`) alimentado pelo contexto `client/src/hooks/useSociometry.tsx`. Destaca filtros por status, grafo de preferencia versus evitacao (`client/src/components/SociometryGraph.tsx`), top pares, papeis espontaneos e indicadores de neutralidade.

### Portal de sociometria
Formularios orientados (`client/src/pages/SociometriaPortal.tsx`) trazem conteudo introdutorio, validacao de minimo e maximo e confirmacao de envio. O estado local protege contra duplicidade e `markLinkStatus` atualiza o painel administrativo em tempo real mockado.

### Relatorios executivos
Visualizacoes prontas (`client/src/pages/Relatorios.tsx`) combinam graficos de desempenho individual, distribuicao de status e ranking de combinacoes eficientes, com botoes de exportacao para compartilhar insights fora do sistema.

## Diferenciais que encantam diretoria e campo
- **Multi idioma nativo**: alternancia imediata PT/ES/EN via `client/src/components/LanguageToggle.tsx`, com textos traduzidos em `client/src/lib/i18n.ts`.
- **Tema adaptavel**: toggle claro/escuro em `client/src/components/ThemeToggle.tsx`, melhorando adesao de quem atua em campo ou em escritorio.
- **Feedback imediato**: notificacoes de toast (`client/src/hooks/use-toast.ts`) confirmam criacao de links, salvamento e erros de forma discreta.
- **Arquitetura preparada para backend**: o `server/` ja expoe escopo para integracao Express e Drizzle ORM, facilitando migracao do mock para bases reais.
- **Componentes acessiveis e responsivos**: uso consistente da biblioteca shadcn/ui personalizada em `client/src/components/ui/` garante consistencia visual e suporte a teclado e leitores de tela.

## Checklist para o go-live
- Validar nomenclaturas de colaboradoras e clientes para bater com dados legados antes da migracao.
- Definir politica de idiomas e textos de comunicacao (convites, instrucoes, mensagens de conclusao).
- Alinhar responsavel por acompanhar o dashboard diariamente e reagir a alertas sociometricos.
- Planejar integracao com banco definitivo (por exemplo, Supabase ou Postgres) reutilizando contratos definidos em `shared/schema.ts`.
- Ensaiar o envio de convites e o preenchimento completo nos portais antes de abrir para todo o time.

Com estes pilares, Sociometria MVP entrega eficiencia operacional, leitura profunda de relacionamentos e narrativa de valor para clientes finais.