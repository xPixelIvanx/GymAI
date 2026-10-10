import { useEffect, useState } from 'react'
import { watchRecords, type Collection } from './db'

/** Lista en vivo de una colección del usuario (funciona sin conexión desde la caché local). */
export function useRecords<T>(uid: string | undefined, name: Collection, opts: { orderByField?: string; descending?: boolean } = {}) {
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { orderByField, descending } = opts

  useEffect(() => {
    if (!uid) return
    setLoading(true)
    return watchRecords<T>(
      uid,
      name,
      (r) => {
        setRows(r)
        setLoading(false)
      },
      { orderByField, descending },
      () => {
        setError('No se pudieron cargar tus datos. Revisa tu conexión.')
        setLoading(false)
      },
    )
  }, [uid, name, orderByField, descending])

  return { rows, loading, error }
}
