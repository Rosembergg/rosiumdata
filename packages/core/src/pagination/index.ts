export function calcularTotalPaginas(total: number, pageSize: number): number {
  if (total <= 0 || pageSize <= 0) return 0
  return Math.ceil(total / pageSize)
}

export function validarPagina(page: number, totalPages: number): number {
  if (totalPages <= 0) return 1
  if (page < 1) return 1
  if (page > totalPages) return totalPages
  return page
}
