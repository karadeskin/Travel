import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { entriesApi } from '../lib/api'
import { useState } from 'react'

// Get API base URL for photo URLs
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export const Route = createLazyFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const { data: user } = useAuth()
  const [showPhotoGallery, setShowPhotoGallery] = useState(false)
  
  // Debug logging
  console.log('Dashboard user data:', user)
  
  // Fetch user's entries
  const { data: entries, isLoading, error } = useQuery({
    queryKey: ['entries', user?.id],
    queryFn: () => entriesApi.getByUserId(user?.id || ''),
    enabled: !!user?.id,
  })

  // Debug logging
  console.log('Entries query:', { entries, isLoading, error, userId: user?.id })

  // Ensure entries is always an array
  const safeEntries = entries || []

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`
  }
  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Your Travel Dashboard
        </h1>
        <p style={{ opacity: '0.8' }}>
          Welcome back! Here's an overview of your travel journal.
        </p>
      </div>

      <div className="stats-grid">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ opacity: '0.6' }}>
              <svg style={{ width: '24px', height: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', opacity: '0.8', marginBottom: '0.25rem' }}>Total Entries</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{safeEntries.length}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ opacity: '0.6' }}>
              <svg style={{ width: '24px', height: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', opacity: '0.8', marginBottom: '0.25rem' }}>Locations Visited</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>
                {new Set(safeEntries.filter(e => e.location).map(e => e.location)).size}
              </div>
            </div>
          </div>
        </div>

                        <div 
          className="card" 
          onClick={() => setShowPhotoGallery(true)}
          style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ opacity: '0.6' }}>
              <svg style={{ width: '24px', height: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', opacity: '0.8', marginBottom: '0.25rem' }}>Photos</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>
                {safeEntries.reduce((total, entry) => total + (entry.photos ? entry.photos.length : 0), 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
            Recent Entries
          </h3>
          <Link
            to="/entries/new"
            className="btn btn-primary"
          >
            New Entry
          </Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', opacity: '0.7' }}>Loading your entries...</div>
          ) : safeEntries.length > 0 ? (
            safeEntries.slice(0, 3).map((entry) => (
              <div key={entry.id} style={{ borderLeft: '3px solid #ffffff', paddingLeft: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #333' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>{entry.title}</h4>
                <p style={{ fontSize: '0.9rem', opacity: '0.7', marginBottom: '0.5rem' }}>
                  {entry.location && `${entry.location} • `}{formatRelativeTime(entry.created_ts)}
                </p>
                <p style={{ fontSize: '0.9rem', opacity: '0.8', lineHeight: '1.4', marginBottom: '0.5rem' }}>
                  {entry.content.length > 100 ? `${entry.content.substring(0, 100)}...` : entry.content}
                </p>
                {entry.photos && entry.photos.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {entry.photos.slice(0, 3).map((photoUrl, index) => (
                      <img
                        key={index}
                        src={`${API_BASE_URL}${photoUrl}`}
                        alt={`${entry.title} photo ${index + 1}`}
                        style={{ 
                          width: '60px', 
                          height: '60px', 
                          objectFit: 'cover', 
                          borderRadius: '4px',
                          border: '1px solid #333'
                        }}
                      />
                    ))}
                    {entry.photos.length > 3 && (
                      <div style={{ 
                        width: '60px', 
                        height: '60px', 
                        background: '#333', 
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        color: '#888'
                      }}>
                        +{entry.photos.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', opacity: '0.7', padding: '2rem' }}>
              <p style={{ marginBottom: '1rem' }}>No travel entries yet!</p>
              <p style={{ fontSize: '0.9rem' }}>Click "New Entry" to start documenting your adventures.</p>
            </div>
          )}
        </div>
      </div>

      {/* Photo Gallery Modal */}
      {showPhotoGallery && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem'
          }}
          onClick={() => setShowPhotoGallery(false)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '600' }}>Photo Gallery</h2>
            <button
              onClick={() => setShowPhotoGallery(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '2rem',
                cursor: 'pointer',
                padding: '0.5rem'
              }}
            >
              ×
            </button>
          </div>
          
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '1.5rem',
              overflowY: 'auto',
              flex: 1,
              padding: '0 1rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {safeEntries.flatMap(entry => 
              entry.photos?.map((photo, index) => (
                <div key={`${entry.id}-${index}`} style={{ 
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}>
                  <img
                    src={`${API_BASE_URL}${photo}`}
                    alt={`From ${entry.title}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
                    color: 'white',
                    padding: '1rem 0.75rem 0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    {entry.title}
                  </div>
                </div>
              )) || []
            )}
          </div>
        </div>
      )}
    </div>
  )
}