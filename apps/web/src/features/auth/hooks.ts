import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchCurrentUser, login } from './api'
import { useSession } from './session-store'

export const currentUserKey = ['auth', 'me'] as const

export function useLogin() {
  const setToken = useSession((s) => s.setToken)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
    onSuccess: (result) => {
      setToken(result.accessToken)
      queryClient.setQueryData(currentUserKey, result.user)
    },
  })
}

export function useLogout() {
  const clear = useSession((s) => s.clear)
  const queryClient = useQueryClient()
  return () => {
    clear()
    queryClient.clear()
  }
}

export function useCurrentUser() {
  const token = useSession((s) => s.token)
  return useQuery({
    queryKey: currentUserKey,
    queryFn: ({ signal }) => fetchCurrentUser(signal),
    enabled: token !== null,
    staleTime: 5 * 60_000,
  })
}
