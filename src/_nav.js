import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilCalculator,
  cilChartPie,
  cilCursor,
  cilDescription,
  cilDrop,
  cilExternalLink,
  cilNotes,
  cilPencil,
  cilPuzzle,
  cilSpeedometer,
  cilStar,
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

import adminIcon from 'src/assets/dashboard/babySite-admin.png'
import recruitIcon from 'src/assets/dashboard/babySite-recluta.png'
import uploadIcon from 'src/assets/dashboard/babySite-upload.png'
import userIcon from 'src/assets/dashboard/babySite-user.png'

const _nav = [
  {
    component: CNavGroup,
    name: 'Pro gestor',
    to: '/progestor',
    icon: (
      <img
        src={adminIcon}
        alt="Modules"
        className="nav-icon sidebar-icon"
        style={{ width: '1.25rem', height: '1.25rem' }}
      />
    ),
    items: [
      {
        component: CNavItem,
        name: 'Reportes y facturas',
        to: '/progestor/reports',
        className: 'sidebar-component',
      },
      {
        component: CNavItem,
        name: 'Listado de usuarios',
        to: '/progestor/users',
        className: 'sidebar-component',
      },
      {
        component: CNavItem,
        name: 'Listado de externos',
        to: '/progestor/guests',
        className: 'sidebar-component',
      },
      {
        component: CNavItem,
        name: 'Listado de pagos',
        to: '/progestor/payments',
        className: 'sidebar-component',
      },
      {
        component: CNavItem,
        name: 'Listado de notas',
        to: '/progestor/notes',
        className: 'sidebar-component',
      },
      {
        component: CNavItem,
        name: 'Dashboard',
        to: '/progestor/dashboard',
        className: 'sidebar-component',
      },
    ],
  },
  {
    component: CNavGroup,
    name: 'Baby site',
    to: '/babysite',
    icon: (
      <img
        src={userIcon}
        alt="Modules"
        className="nav-icon sidebar-icon"
        style={{ width: '1.25rem', height: '1.25rem' }}
      />
    ),
    items: [
      {
        component: CNavItem,
        name: 'Listado Sort_GES',
        to: '/babysite/gestant',
        className: 'sidebar-component',
      },
      {
        component: CNavItem,
        name: 'Listado Sort_IPS',
        to: '/babysite/ips',
        className: 'sidebar-component',
      },
      {
        component: CNavItem,
        name: 'Listado Sort_DON',
        to: '/babysite/donant',
        className: 'sidebar-component',
      },
      {
        component: CNavItem,
        name: 'Programas',
        to: '/babysite/programs',
        className: 'sidebar-component',
      },
      {
        component: CNavItem,
        name: 'Dashboard',
        to: '/babysite/dashboard',
        className: 'sidebar-component',
      },
    ],
  },
  {
    component: CNavGroup,
    name: 'Recluta',
    to: '/reclute',
    icon: (
      <img
        src={recruitIcon}
        alt="Modules"
        className="nav-icon sidebar-icon"
        style={{ width: '1.25rem', height: '1rem' }}
      />
    ),
    items: [
      {
        component: CNavItem,
        name: 'Nueva Candidata',
        to: '/reclute/candidate',
        className: 'sidebar-component',
      },
      {
        component: CNavItem,
        name: 'Nueva Donante',
        to: '/reclute/donant',
        className: 'sidebar-component',
      },
      {
        component: CNavItem,
        name: 'Mi listado',
        to: '/reclute/list',
        className: 'sidebar-component',
      },
      {
        component: CNavItem,
        name: 'Dashboard',
        to: '/reclute/dashboard',
        className: 'sidebar-component',
      },
    ],
  },
  {
    component: CNavGroup,
    name: 'Baby cloud',
    to: '/babycloud',
    icon: (
      <img
        src={uploadIcon}
        alt="Modules"
        className="nav-icon sidebar-icon"
        style={{ width: '1.25rem', height: '1.1rem' }}
      />
    ),
    items: [
      {
        component: CNavItem,
        name: 'Cloud IPS_upload',
        to: '/babycloud/ips',
        className: 'sidebar-component',
      },
      {
        component: CNavItem,
        name: 'Cloud GES_upload',
        to: '/babycloud/gestant',
        className: 'sidebar-component',
      },
      {
        component: CNavItem,
        name: 'Dashboard',
        to: '/babycloud/dashboard',
        className: 'sidebar-component',
      },
    ],
  },
]

export default _nav
