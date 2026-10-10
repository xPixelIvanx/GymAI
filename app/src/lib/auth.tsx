import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { firebase, isFirebaseConfigured } from './firebase'

interface AuthState {
  user: User | null
  /** true mientras Firebase decide si hay sesión guardada. */
  loading: boolean
  signIn(email: string, password: string): Promise<void>
  signUp(name: string, email: string, password: string): Promise<void>
  signInWithGoogle(): Promise<void>
  resetPassword(email: string): Promise<void>
  signOut(): Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

/** Traduce los códigos de Firebase a mensajes que dicen qué hacer. */
export function authMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? ''
  const map: Record<string, string> = {
    'auth/invalid-email': 'El correo no es válido.',
    'auth/email-already-in-use': 'Ese correo ya tiene cuenta. Inicia sesión.',
    'auth/weak-password': 'La contraseña necesita al menos 6 caracteres.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'Correo o contraseña incorrectos.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos y vuelve a intentar.',
    'auth/network-request-failed': 'Sin conexión. Revisa tu internet e inténtalo de nuevo.',
    'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de terminar.',
    'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Permite las ventanas emergentes.',
  }
  return map[code] ?? 'No se pudo completar la acción. Inténtalo de nuevo.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) return
    return onAuthStateChanged(firebase().auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      async signIn(email, password) {
        await signInWithEmailAndPassword(firebase().auth, email.trim(), password)
      },
      async signUp(name, email, password) {
        const cred = await createUserWithEmailAndPassword(firebase().auth, email.trim(), password)
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() })
      },
      async signInWithGoogle() {
        await signInWithPopup(firebase().auth, new GoogleAuthProvider())
      },
      async resetPassword(email) {
        await sendPasswordResetEmail(firebase().auth, email.trim())
      },
      signOut: () => fbSignOut(firebase().auth),
    }),
    [user, loading],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth fuera de AuthProvider')
  return v
}
