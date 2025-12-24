import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { Link } from 'react-router-dom'

import { AppSidebarNav } from './AppSidebarNav'
import SidebarCalendar from './SideBarCalendar'
import SidebarAnalogClock from './SidebarAnalogClock'

import logo from 'src/assets/brand/babySite.png'
import { sygnet } from 'src/assets/brand/sygnet'

// sidebar nav config
import navigation from '../_nav'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)

  return (
    <CSidebar
      className="app-sidebar"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
    >
      <CSidebarHeader>
        <CSidebarBrand as={Link} to="/">
          <img
            src={logo}
            alt="Example"
            className="img-fluid rounded"
            style={{ maxWidth: '200px' }}
          />
          <CIcon customClassName="sidebar-brand-narrow" icon={sygnet} height={32} />
        </CSidebarBrand>
        <CCloseButton
          className="d-lg-none"
          dark
          onClick={() => dispatch({ type: 'set', sidebarShow: false })}
        />
      </CSidebarHeader>
      <SidebarAnalogClock />
      <AppSidebarNav items={navigation} className="app-sidebar-content" />
      <SidebarCalendar />
      <CSidebarFooter className="d-none d-lg-flex">
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
