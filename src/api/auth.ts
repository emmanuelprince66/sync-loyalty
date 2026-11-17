import { useMutation } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { useAuthStore, type AuthUser } from '@/stores/auth-store'

/**
 * Real Sync360 auth endpoints (same contract sink-inventory uses):
 *  POST auth/login/         { email, password }                         → { tokens: { access, refresh }, ...user }
 *  POST auth/signup/        { firstname, lastname, phone, email, password, referal? }
 *  POST auth/verify-phone/  { token, phone }
 */

export type LoginInput = { email: string; password: string }
export type SignupInput = { firstname: string; lastname: string; phone: string; email: string; password: string; referal?: string }
export type VerifyPhoneInput = { token: string; phone: string }

type LoginResponse = AuthUser & { tokens: { access: string; refresh: string } }

const login = (input: LoginInput) => apiRequest<LoginResponse>('auth/login/', { method: 'POST', body: input, auth: false })

const signup = (input: SignupInput) =>
  apiRequest<unknown>('auth/signup/', { method: 'POST', body: input, auth: false })

const verifyPhone = (input: VerifyPhoneInput) =>
  apiRequest<unknown>('auth/verify-phone/', { method: 'POST', body: input, auth: false })

/** Logs in and stores the session (token persisted to localStorage). */
export const useLogin = () => {
  const setSession = useAuthStore(state => state.setSession)
  return useMutation({
    mutationFn: login,
    onSuccess: ({ tokens, ...user }) => setSession({ accessToken: tokens.access, refreshToken: tokens.refresh, user }),
  })
}

export const useSignup = () => useMutation({ mutationFn: signup })
export const useVerifyPhone = () => useMutation({ mutationFn: verifyPhone })

export const useLogout = () => useAuthStore(state => state.logout)

/** Pulls a readable message out of any thrown error. */
export const errorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.') =>
  error instanceof Error && error.message ? error.message : fallback
