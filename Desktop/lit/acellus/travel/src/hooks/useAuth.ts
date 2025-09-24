import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

// Simple API instance
const api = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Simple types
interface LoginData {
  email: string
  password: string
}

interface RegisterData {
  username: string
  email: string
  password: string
}

// Hook for login
export const useLogin = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await api.post('/login', data)
      return response.data
    },
    onSuccess: (data) => {
      console.log('Login response:', data) // Debug log
      // Store user info in localStorage
      const userData = { 
        id: data.user_id,
        username: data.username,
        loggedIn: true 
      }
      localStorage.setItem('user', JSON.stringify(userData))
      console.log('Stored user data:', userData) // Debug log
      
      // Force React Query to refetch the auth state
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      queryClient.setQueryData(['auth'], userData)
    },
    onError: (error: any) => {
      console.error('Login failed:', error)
    }
  })
}

// Hook for registration
export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await api.post('/register', data)
      return response.data
    },
    onSuccess: (data) => {
      console.log('Registration successful:', data)
    },
    onError: (error: any) => {
      console.error('Registration failed:', error)
    }
  })
}

// Hook to check if user is authenticated
export const useAuth = () => {
  return useQuery({
    queryKey: ['auth'],
    queryFn: () => {
      const user = localStorage.getItem('user')
      console.log('useAuth queryFn - localStorage user:', user) // Debug log
      const parsedUser = user ? JSON.parse(user) : null
      console.log('useAuth queryFn - parsed user:', parsedUser) // Debug log
      return parsedUser
    },
    staleTime: 0, // Allow refetching
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  })
}

// Helper function to logout
export const logout = () => {
  localStorage.removeItem('user')
  // Redirect to home page after logout
  window.location.href = '/'
}