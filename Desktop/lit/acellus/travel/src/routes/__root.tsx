import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { useAuth, logout } from '../hooks/useAuth'

export const Route = createRootRoute({
  component: () => {
    const { data: user } = useAuth()
    
    return (
      <>
        <div className="min-h-screen">
          <nav>
            <div className="nav-container">
              <Link to="/" className="nav-brand">
                Travel Journal
              </Link>
              <div className="nav-links">
                {user?.loggedIn && user?.username ? (
                  <>
                    <span style={{ marginRight: '1rem', color: '#cccccc' }}>
                      Welcome, {user.username}
                    </span>
                    <button 
                      onClick={logout}
                      className="btn-secondary"
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="nav-link">
                      Login
                    </Link>
                    <Link to="/register" className="btn-primary">
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>
          <main>
            <Outlet />
          </main>
        </div>
        <TanStackRouterDevtools />
      </>
    )
  },
})