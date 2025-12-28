import { Navigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

const PublicOnlyRoute = ({ children }) => {
  const { user } = useUser()

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default PublicOnlyRoute
