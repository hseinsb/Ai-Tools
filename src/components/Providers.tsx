'use client'

import FirebaseProvider from './FirebaseProvider'
import AuthProvider from './AuthProvider'
import { ReactNode } from 'react'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <FirebaseProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </FirebaseProvider>
  )
}
