import { createLazyFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../hooks/useAuth'
import { useEffect } from 'react'

export const Route = createLazyFileRoute('/')({
  component: Index,
})

function Index() {
  const { data: user } = useAuth()
  const navigate = useNavigate()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user?.loggedIn) {
      navigate({ to: '/dashboard' })
    }
  }, [user, navigate])

  // Don't render the homepage if user is logged in (will redirect)
  if (user?.loggedIn) {
    return <div>Redirecting...</div>
  }
  return (
    <div className="container">
      <div className="text-center">
        <h1 className="hero-title">
          Your Travel Journal
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: '400', 
            marginTop: '0.5rem', 
            color: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            Created by Kara
            <svg 
              width="24" 
              height="24" 
              fill="#ef4444" 
              viewBox="0 0 24 24"
              style={{ animation: 'heartbeat 1.5s ease-in-out infinite' }}
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        </h1>
        <p className="hero-description">
          Capture your adventures, memories, and discoveries from around the world.
          Keep track of your journeys with photos, stories, and locations.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '4rem' }}>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
          <Link to="/login" className="btn btn-secondary">Sign In</Link>
        </div>
      </div>
      
      <div className="grid grid-3">
        <div className="card">
          <div className="card-icon">
            <svg style={{ width: '32px', height: '32px' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <h3 className="card-title">Track Locations</h3>
          <p className="card-description">
            Record where you've been and discover new places to explore on your next adventure.
          </p>
        </div>
        
        <div className="card">
          <div className="card-icon">
            <svg style={{ width: '32px', height: '32px' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 2l1.17 5L12 3.67 13.83 7l5 1.17L16.33 12l2.5 3.83L12 17.17l-6.83 2.5L7.67 12l-2.5-3.83L9 7V2zm3 10c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3z"/>
            </svg>
          </div>
          <h3 className="card-title">Capture Memories</h3>
          <p className="card-description">
            Upload photos and write about your experiences to preserve your travel memories forever.
          </p>
        </div>
        
        <div className="card">
          <div className="card-icon">
            <svg style={{ width: '32px', height: '32px' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <h3 className="card-title">Organize Trips</h3>
          <p className="card-description">
            Group your journal entries by trips and create a beautiful timeline of your adventures.
          </p>
        </div>
      </div>
    </div>
  )
}
