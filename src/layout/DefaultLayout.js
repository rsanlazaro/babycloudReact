import React, { useState, useEffect } from 'react'
import { AppContent, AppSidebar, AppFooter, AppHeader } from '../components/index'
import { Outlet, redirect, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import CIcon from '@coreui/icons-react'
import { cilMoney, cilX } from '@coreui/icons'
import api from '../services/api';
import { useBillsAuth } from '../context/BillsAuthContext'

const DefaultLayout = () => {

  const { authenticateBills, isBillsAuthenticated } = useBillsAuth();
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shouldNavigate, setShouldNavigate] = useState(false);

  const shouldShowButton = user?.hasSpecialButtonAccess === true

  useEffect(() => {
    if (shouldNavigate && isBillsAuthenticated) {
      navigate('/registers');
      setShouldNavigate(false);
    }

    const checkScrollPosition = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop

      const hasScroll = documentHeight > windowHeight

      if (!hasScroll) {
        setIsAtBottom(true)
      } else {
        const atBottom = windowHeight + scrollTop >= documentHeight - 10
        setIsAtBottom(atBottom)
      }
    }

    window.addEventListener('scroll', checkScrollPosition)
    window.addEventListener('resize', checkScrollPosition)

    const observer = new MutationObserver(() => {
      requestAnimationFrame(checkScrollPosition)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    })

    checkScrollPosition()
    const timer = setTimeout(checkScrollPosition, 100)

    return () => {
      window.removeEventListener('scroll', checkScrollPosition)
      window.removeEventListener('resize', checkScrollPosition)
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [shouldNavigate, isBillsAuthenticated, navigate])

  const handleButtonClick = () => {

    // Check sessionStorage as fallback
    const checkBillsAuth = () => {
      return isBillsAuthenticated || sessionStorage.getItem('billsAuth') === 'true'
    }

    checkBillsAuth() ? 
      navigate('/registers') :
      setShowPasswordModal(true)
      setPassword('')
      setError('')
  }

  const handleCloseModal = () => {
    setShowPasswordModal(false)
    setPassword('')
    setError('')
  }

  const handleSubmitPassword = async (e) => {
    e.preventDefault()
    setError('')

    if (!password) {
      setError('Por favor ingrese la contraseña')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/api/auth/bills', {
        password: password,
      });

      if (response.data) {
        handleCloseModal();
        authenticateBills();
        setShouldNavigate(true);
      }
    } catch (err) {
      console.error('Error verifying password:', err)
      setError(err.response?.data?.message || 'Contraseña incorrecta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="body flex-grow-1 app-container">
          <AppContent />
        </div>
        <Outlet />
        <AppFooter />
      </div>
      {/* Round button - visibility controlled by backend */}
      {shouldShowButton && (
        <button
          onClick={handleButtonClick}
          style={{
            position: 'fixed',
            bottom: isAtBottom ? '70px' : '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#eb6c9c',
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            transition: 'all 0.3s ease',
            zIndex: 1000
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
          aria-label="Special access"
          title="Acceso Especial"
        >
          <CIcon icon={cilMoney} size="lg" />
        </button>
      )}

      {/* Password Verification Modal */}
      {showPasswordModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              borderRadius: '8px',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              position: 'relative',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            }}
            className='app-modal'
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '16px',
                backgroundColor: 'transparent',
                right: '16px',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#666',
              }}
              aria-label="Cerrar"
            >
              <CIcon icon={cilX} size="lg" />
            </button>

            <h2 style={{ marginTop: 0, marginBottom: '12px', color: '#333' }}>
              Acceso Especial
            </h2>
            <p style={{ marginBottom: '24px', color: '#666', fontSize: '14px' }}>
              Ingrese la contraseña para acceder a esta sección
            </p>

            <form onSubmit={handleSubmitPassword}>
              {error && (
                <div
                  style={{
                    backgroundColor: '#fee',
                    border: '1px solid #fcc',
                    color: '#c33',
                    padding: '12px',
                    borderRadius: '4px',
                    marginBottom: '16px',
                    fontSize: '14px',
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <label
                  htmlFor="accessPassword"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500',
                    color: '#333',
                  }}
                >
                  Contraseña
                </label>
                <input
                  id="accessPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    backgroundColor: 'transparent',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    color: 'black',
                  }}
                  placeholder="Ingrese contraseña"
                  disabled={loading}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                  disabled={loading}
                  className='btn btn-outline-secondary'
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    opacity: loading ? 0.6 : 1,
                  }}
                  disabled={loading}
                  className='btn app-button'
                >
                  {loading ? 'Verificando...' : 'Acceder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DefaultLayout