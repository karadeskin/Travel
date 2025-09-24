import axios from 'axios'

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types for API responses
export interface User {
  id: string
  username: string
  email: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  user_id: string
}

export interface RegisterResponse {
  id: string
}

export interface JournalEntry {
  id: string
  user_id: string
  title: string
  content: string
  location: string
  photos: string[]
  created_at: string
  created_ts: string
}

export interface CreateEntryRequest {
  title: string
  content: string
  location?: string
  photos?: string[]
  user_id?: string
}

export interface CreateEntryResponse {
  id: string
  user_id: string
  created_at: string
}

// API functions
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/login', data)
    return response.data
  },
  
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post('/register', data)
    return response.data
  }
}

export const entriesApi = {
  create: async (data: CreateEntryRequest): Promise<CreateEntryResponse> => {
    const response = await api.post('/entries', data)
    return response.data
  },
  
  getById: async (id: string): Promise<JournalEntry> => {
    const response = await api.get(`/entries/${id}`)
    return response.data
  },

  getByUserId: async (userId: string): Promise<JournalEntry[]> => {
    const response = await api.get(`/users/${userId}/entries`)
    return response.data
  },

  uploadPhoto: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData()
    formData.append('photo', file)
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
}

// Add request/response interceptors for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)