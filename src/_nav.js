// src/_nav.js
import React from 'react';
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react';
import PERMISSIONS from './config/permissions';

import adminIcon from 'src/assets/dashboard/babySite-admin.png';
import recruitIcon from 'src/assets/dashboard/babySite-recluta.png';
import uploadIcon from 'src/assets/dashboard/babySite-upload.png';
import userIcon from 'src/assets/dashboard/babySite-user.png';

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
        to: '/progestor/admin',
        className: 'sidebar-component',
        state: 'enabled',
        permission: PERMISSIONS.GENERATE_REPORTS, // access_20
      },
      {
        component: CNavItem,
        name: 'Listado de usuarios',
        to: '/progestor/users',
        className: 'sidebar-component',
        state: 'enabled',
        permission: PERMISSIONS.LIST_USERS, // access_8
      },
      {
        component: CNavItem,
        name: 'Listado de externos',
        to: '/progestor/guests',
        className: 'sidebar-component',
        state: 'enabled',
        permission: PERMISSIONS.LIST_GUESTS, // access_14
      },
      {
        component: CNavItem,
        name: 'Listado de pagos',
        to: '/progestor/payments',
        className: 'sidebar-component',
        state: 'disabled',
        permission: PERMISSIONS.LIST_PAYMENTS, // access_5
      },
      {
        component: CNavItem,
        name: 'Listado de notas',
        to: '/progestor/notes',
        className: 'sidebar-component',
        state: 'disabled',
        permission: PERMISSIONS.LIST_ATTENTION_NOTES, // access_1
      },
      {
        component: CNavItem,
        name: 'Dashboard',
        to: '/progestor/dashboard',
        className: 'sidebar-component',
        state: 'disabled',
        permission: PERMISSIONS.VIEW_DASHBOARDS, // access_26
      },
      {
        component: CNavItem,
        name: 'Historial de actividad',
        to: '/activity-history',
        className: 'sidebar-component',
        state: 'enabled',
        permission: PERMISSIONS.ACTIVITY_HISTORY, // access_83
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
        state: 'disabled',
        permission: PERMISSIONS.LIST_SORT_GES, // access_27
      },
      {
        component: CNavItem,
        name: 'Listado Sort_IPS',
        to: '/babysite/ips',
        className: 'sidebar-component',
        state: 'disabled',
        permission: PERMISSIONS.LIST_SORT_IP, // access_33
      },
      {
        component: CNavItem,
        name: 'Listado Sort_DON',
        to: '/babysite/donant',
        className: 'sidebar-component',
        state: 'disabled',
        permission: PERMISSIONS.LIST_EGG_DONOR, // access_68
      },
      {
        component: CNavItem,
        name: 'Programas',
        to: '/babysite/programs',
        className: 'sidebar-component',
        state: 'disabled',
        permission: PERMISSIONS.VIEW_PROGRAMS, // access_40
      },
      {
        component: CNavItem,
        name: 'Dashboard',
        to: '/babysite/dashboard',
        className: 'sidebar-component',
        state: 'disabled',
        permission: PERMISSIONS.EGG_DONOR_DASHBOARDS, // access_69
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
        state: 'disabled',
        permission: PERMISSIONS.RECLUTA_HOME, // access_70
      },
      {
        component: CNavItem,
        name: 'Nueva Donante',
        to: '/reclute/donant',
        className: 'sidebar-component',
        state: 'disabled',
        permission: PERMISSIONS.RECLUTA_HOME, // access_70
      },
      {
        component: CNavItem,
        name: 'Mi listado',
        to: '/reclute/list',
        className: 'sidebar-component',
        state: 'disabled',
        permission: PERMISSIONS.RECLUTA_HOME, // access_70
      },
      {
        component: CNavItem,
        name: 'Dashboard',
        to: '/reclute/dashboard',
        className: 'sidebar-component',
        state: 'disabled',
        permission: PERMISSIONS.RECLUTA_HOME, // access_70
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
        state: 'disabled',
        permission: PERMISSIONS.ADD_STAGE, // access_71
      },
      {
        component: CNavItem,
        name: 'Cloud GES_upload',
        to: '/babycloud/gestant',
        className: 'sidebar-component',
        state: 'disabled',
        permission: PERMISSIONS.ADD_STAGE, // access_71
      },
      {
        component: CNavItem,
        name: 'Dashboard',
        to: '/babycloud/dashboard',
        className: 'sidebar-component',
        state: 'disabled',
        permission: PERMISSIONS.ENABLE_STAGE_VIEW, // access_82
      },
    ],
  },
];

export default _nav;