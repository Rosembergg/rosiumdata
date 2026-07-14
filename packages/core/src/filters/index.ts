import type { ColumnType } from '../columns'

export const OPERADORES_PADRAO: Record<ColumnType, string[]> = {
  texto: ['contem', 'igual', 'comeca_com', 'termina_com'],
  numero: ['=', '>', '<', '>=', '<=', 'entre'],
  data: ['entre', 'antes', 'depois', 'igual'],
  'data-hora': ['entre', 'antes', 'depois', 'igual'],
  booleano: ['igual'],
  selecao: ['igual'],
  acao: [],
}

export const OPERADOR_PADRAO: Record<ColumnType, string> = {
  texto: 'contem',
  numero: '=',
  data: 'entre',
  'data-hora': 'entre',
  booleano: 'igual',
  selecao: 'igual',
  acao: '',
}
