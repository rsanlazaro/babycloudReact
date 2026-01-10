import React from 'react'

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))

// Profile 
const Profile = React.lazy(() => import('./views/pages/profile/Profile'))

// Activity History
const ActivityHistory = React.lazy(() => import('./views/pages/activityHistory/ActivityHistory'))

// Progestor 

const Admin = React.lazy(() => import('./views/babysite/progestor/Admin'))
const Reports = React.lazy(() => import('./views/babysite/progestor/Reports'))
const MedicalReport = React.lazy(() => import('./views/babysite/progestor/MedicalReport'))
const ItineraryBabymedic = React.lazy(() => import('./views/babysite/progestor/ItineraryBabymedic'))
const InvoiceBabymedic = React.lazy(() => import('./views/babysite/progestor/InvoiceBabymedic'))
const InvoiceTravelmedicalcare = React.lazy(() => import('./views/babysite/progestor/InvoiceTravelmedicalcare'))
const InvoiceNexatravel = React.lazy(() => import('./views/babysite/progestor/InvoiceNexatravel'))
const Bills = React.lazy(() => import('./views/babysite/progestor/Bills'))
const Users = React.lazy(() => import('./views/babysite/progestor/Users'))
const Guests = React.lazy(() => import('./views/babysite/progestor/Guests'))
const Roles = React.lazy(() => import('./views/babysite/progestor/Roles'))
const AccessRoles = React.lazy(() => import('./views/babysite/progestor/AccessRoles'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/profile', name: 'Profile', element: Profile },
  { path: '/activity-history', name: 'ActivityHistory', element: ActivityHistory },
  { path: '/progestor/admin', name: 'Admin', element: Admin },
  { path: '/progestor/admin/reports', name: 'Reports', element: Reports },
  { path: '/progestor/admin/reports/medical', name: 'MedicalReport', element: MedicalReport },
  { path: '/progestor/admin/reports/itinerary-babymedic', name: 'ItineraryBabymedic', element: ItineraryBabymedic },
  { path: '/progestor/admin/bills/babymedic', name: 'InvoiceBabymedic', element: InvoiceBabymedic },
  { path: '/progestor/admin/bills/nexatravel', name: 'InvoiceNexatravel', element: InvoiceNexatravel },
  { path: '/progestor/admin/bills/travelmedicalcare', name: 'InvoiceTravelmedicalcare', element: InvoiceTravelmedicalcare },
  { path: '/progestor/admin/bills', name: 'Bills', element: Bills },
  { path: '/progestor/users', name: 'Users', element: Users },
  { path: '/progestor/guests', name: 'Guests', element: Guests },
  { path: '/progestor/users/:id/roles', name: 'Roles', element: Roles },
  { path: '/progestor/users/roles', name: 'AccessRoles', element: AccessRoles },
]

export default routes
