import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useLogin } from '../hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export const Route = createLazyFileRoute('/login')({
  component: Login,
})

function Login() {
  const navigate = useNavigate()
  const loginMutation = useLogin()
  const [showPassword, setShowPassword] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      await loginMutation.mutateAsync(data)
      // Navigate to dashboard after successful login
      navigate({ to: '/dashboard' })
    } catch (error: any) {
      console.error('Login error:', error)
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '400px', margin: '0 auto', marginTop: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2rem', fontWeight: 'bold' }}>
          Sign in to your account
        </h2>
        
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }} htmlFor="email">
              Email address
            </label>
            <input
              {...register('email')}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="form-input"
              placeholder="Enter your email address"
            />
            {errors.email && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444' }}>
                {errors.email.message}
              </p>
            )}
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }} htmlFor="password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="form-input"
                placeholder="Password"
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  padding: '0.25rem'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444' }}>
                {errors.password.message}
              </p>
            )}
          </div>

          {loginMutation.error && (
            <div style={{ color: '#ef4444', fontSize: '0.875rem', textAlign: 'center' }}>
              {loginMutation.error?.response?.data?.error || 'Login failed. Please try again.'}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || loginMutation.isPending}
            className="btn-primary"
            style={{ 
              width: '100%',
              opacity: (isSubmitting || loginMutation.isPending) ? '0.5' : '1',
              cursor: (isSubmitting || loginMutation.isPending) ? 'not-allowed' : 'pointer'
            }}
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.875rem', opacity: '0.7' }}>
              Don't have an account?{' '}
              <a href="/register" style={{ color: '#ffffff', fontWeight: '500', textDecoration: 'underline' }}>
                Sign up here
              </a>
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}