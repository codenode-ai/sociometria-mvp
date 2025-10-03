# Sociometria – Modelo de Dados (Mock)

Esta etapa descreve a estrutura temporária usada no front-end para validar UX/flows
antes da integração com o backend.

## Entidades

### SociometryForm
| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador do formulário |
| `version` | number | Controle de versão |
| `title` | string | Nome amigável |
| `description` | string? | Resumo opcional |
| `questions` | SociometryQuestion[] | Questões nominais (ver abaixo) |
| `defaultLanguage` | SupportedLanguage | Idioma base |
| `status` | `draft` | `active` | `archived` |
| `createdAt`, `updatedAt` | Date | Auditoria |

### SociometryQuestion
- `id`: `preferWorkWith`, `avoidWorkWith`, `problemSolver`, `moodKeeper`, `hardHouseFirstPick`
- `prompt`, `helperText`
- `minSelections`, `maxSelections`
- `allowSelfSelection`

### SociometryLink
Representa o convite/link enviado a uma colaboradora.

| Campo | Tipo |
| --- | --- |
| `id`, `formId`, `collaboratorId` | string |
| `code`, `url` | string |
| `status` | `pending` | `completed` | `expired` |
| `language` | SupportedLanguage |
| `createdAt`, `expiresAt?`, `completedAt?`, `lastReminderAt?` | Date |

### SociometryResponse
Cada entrada corresponde às seleções de uma pergunta.

| Campo | Tipo |
| --- | --- |
| `id`, `linkId`, `collaboratorId`, `formId` | string |
| `questionId` | SociometryQuestionKey |
| `selections` | `{ targetEmployeeId, weight?, notes? }[]` |
| `createdAt` | Date |

### SociometrySnapshot
Agregados utilizados na página administrativa.

- `preferredEdges`: forças positivas (preferWorkWith)
- `avoidanceEdges`: relações a evitar
- `roleIndicators`: pessoas reconhecidas como solucionadoras ou mantenedoras do clima

## Mocks Disponíveis (`@/lib/mock/sociometry-data`)
- `mockSociometryForm`
- `mockSociometryLinks`
- `mockSociometryResponses`
- `mockSociometrySnapshot`

## Hook (`useSociometryMocks`)
Expose clones dessas estruturas para consumo nos componentes.
Quando o backend estiver pronto, substituir por uma versão que consome API real
sem alterar a interface do hook.

