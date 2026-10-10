export const UNITS = ['kg', 'lb', 'kg_db', 'lb_db'] as const
export type Unit = (typeof UNITS)[number]

export const UNIT_LABEL: Record<Unit, string> = {
  kg: 'kg',
  lb: 'lb',
  kg_db: 'kg por mancuerna',
  lb_db: 'lb por mancuerna',
}

const LB_TO_KG = 0.453592

/** Peso total en kg. Las unidades `*_db` son por mancuerna, así que se multiplican por 2. */
export function toKgTotal(weight: number, unit: Unit): number {
  const perUnit = unit === 'lb' || unit === 'lb_db' ? weight * LB_TO_KG : weight
  return unit === 'kg_db' || unit === 'lb_db' ? perUnit * 2 : perUnit
}

/** 1RM estimado con Epley: peso × (1 + reps/30). Poco fiable con más de ~10 repeticiones. */
export function epley(weight: number, reps: number): number {
  return weight * (1 + reps / 30)
}
