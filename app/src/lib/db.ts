/**
 * Acceso a Firestore. Todo vive bajo users/{uid}/… y solo lo lee su dueño (ver firestore.rules).
 * Cada registro es su propio documento con id propio: no hay documentos gigantes que choquen con el
 * límite de 1 MiB, ni enlaces por nombre.
 */
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc, type Unsubscribe } from 'firebase/firestore'
import { firebase } from './firebase'

export type Collection = 'routines' | 'sessions' | 'bodyLog' | 'coachLog' | 'programs' | 'settings'

const col = (uid: string, name: Collection) => collection(firebase().db, 'users', uid, name)

/** Quita los `undefined` (Firestore no los acepta). */
function clean<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
}

export function saveRecord<T extends { id: string }>(uid: string, name: Collection, record: T): Promise<void> {
  return setDoc(doc(col(uid, name), record.id), clean(record))
}

export function deleteRecord(uid: string, name: Collection, id: string): Promise<void> {
  return deleteDoc(doc(col(uid, name), id))
}

/** Escucha una colección en vivo (también sin conexión, desde la caché local). */
export function watchRecords<T>(
  uid: string,
  name: Collection,
  onData: (rows: T[]) => void,
  opts: { orderByField?: string; descending?: boolean } = {},
  onError?: (e: Error) => void,
): Unsubscribe {
  const q = opts.orderByField ? query(col(uid, name), orderBy(opts.orderByField, opts.descending ? 'desc' : 'asc')) : col(uid, name)
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => d.data() as T)), onError)
}

export function watchSetting<T>(uid: string, key: string, onData: (v: T | null) => void): Unsubscribe {
  return onSnapshot(doc(col(uid, 'settings'), key), (s) => onData(s.exists() ? (s.data() as T) : null))
}

export function saveSetting<T extends object>(uid: string, key: string, value: T): Promise<void> {
  return setDoc(doc(col(uid, 'settings'), key), clean(value))
}
