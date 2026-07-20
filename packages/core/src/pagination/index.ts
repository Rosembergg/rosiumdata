import type { Row } from '../adapter'

export function calculateTotalPages(total: number, pageSize: number): number {
  if (total <= 0 || pageSize <= 0) return 0
  return Math.ceil(total / pageSize)
}

export function validatePage(page: number, totalPages: number): number {
  if (totalPages <= 0) return 1
  if (page < 1) return 1
  if (page > totalPages) return totalPages
  return page
}

export function paginateArray(rows: Row[], page: number, pageSize: number): Row[] {
  const safePage = page < 1 ? 1 : page
  const offset = (safePage - 1) * pageSize
  return rows.slice(offset, offset + pageSize)
}
