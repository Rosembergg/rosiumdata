export type SortDirection = 'asc' | 'desc'

export function inverterDirecao(direction: SortDirection): SortDirection {
  return direction === 'asc' ? 'desc' : 'asc'
}
