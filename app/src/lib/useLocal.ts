import { useCallback, useState } from 'react'

/** Ajuste guardado solo en este dispositivo (nunca viaja a la nube). */
export function useLocal(key: string, fallback = ''): [string, (v: string) => void] {
  const read = () => {
    try {
      return localStorage.getItem(key) ?? fallback
    } catch {
      return fallback
    }
  }
  const [value, setValue] = useState(read)
  const set = useCallback(
    (v: string) => {
      setValue(v)
      try {
        if (v) localStorage.setItem(key, v)
        else localStorage.removeItem(key)
      } catch {
        /* modo privado: queda solo en memoria */
      }
    },
    [key],
  )
  return [value, set]
}

export const KEY_STORAGE = 'gymai.geminiKey'
export const MODEL_STORAGE = 'gymai.geminiModel'
