import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import api from '../services/api'  // Fix path if needed

import routes from '../routes'

import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react'

const AppBreadcrumb = () => {
  const { user, setUser } = useUser()  // Get user AND setUser

  // Fetch user data on mount if not already loaded
  useEffect(() => {
    const fetchUser = async () => {
      // Skip if user is already loaded
      if (user) return

      try {
        const res = await api.get('/api/users/me', { withCredentials: true })
        setUser(res.data)
      } catch (error) {
        console.error('Error fetching user data in AppBreadcrumb:', error)
        setUser(null)
      }
    }

    fetchUser()
  }, [user, setUser])

  return (
    <CBreadcrumb className="my-0">
      <CBreadcrumbItem>
        Bienvenido{user?.username ? `, ${user.username}` : ''}
      </CBreadcrumbItem>
    </CBreadcrumb>
  )
}

export default React.memo(AppBreadcrumb)