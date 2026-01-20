import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CContainer, CSpinner } from '@coreui/react'
import { useBillsAuth } from '../context/BillsAuthContext'

// routes config
import routes from '../routes'

const AppContent = () => {

  const { isBillsAuthenticated } = useBillsAuth()

  // Check sessionStorage as fallback
  const checkBillsAuth = () => {
    return isBillsAuthenticated || sessionStorage.getItem('billsAuth') === 'true'
  }

  return (
    <CContainer className="px-4 mt-5 pt-5 mb-5 pb-5" fluid>
      <Suspense fallback={<CSpinner color="primary" />}>
        <Routes>
          {routes.map((route, idx) => {

            if (route.requiresBillsAuth) {
              const Element = route.element
              return (
                <Route
                  key={idx}
                  path={route.path}
                  exact={route.exact}
                  name={route.name}
                  element={
                    checkBillsAuth() ? (
                      <Element />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
              )
            }

            // Regular routes
            return (
              route.element && (
                <Route
                  key={idx}
                  path={route.path}
                  exact={route.exact}
                  name={route.name}
                  element={<route.element />}
                />
              )
            )
          })}
          <Route path="/" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </Suspense>
    </CContainer>
  )
}

export default React.memo(AppContent)
