import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router'
import { clearCacheOnSignOut, createQueryClient } from './query-client'
import { router } from './router'

export function App() {
  const [queryClient] = useState(createQueryClient)
  useEffect(() => clearCacheOnSignOut(queryClient), [queryClient])
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
