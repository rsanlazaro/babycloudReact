// src/components/AppSidebarNav.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';

import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';

import { CBadge, CNavLink, CSidebarNav } from '@coreui/react';
import { useUser } from '../context/AuthContext';

/**
 * Permission Levels:
 * 0 = Hidden (not visible in menu)
 * 1 = Visible but disabled (can see but can't click)
 * 2 = Visible and enabled (full access)
 */

export const AppSidebarNav = ({ items }) => {
  const { getPermissionLevel } = useUser();

  /**
   * Get effective permission level for a nav item
   * Returns: 0 (hidden), 1 (read-only), or 2 (full access)
   */
  const getItemPermissionLevel = (item) => {
    // No permission defined - full access by default
    if (!item.permission && !item.permissionsAny) {
      return 2;
    }

    // Single permission
    if (item.permission) {
      return getPermissionLevel(item.permission);
    }

    // Multiple permissions (any) - return highest level
    if (item.permissionsAny && Array.isArray(item.permissionsAny)) {
      let maxLevel = 0;
      for (const perm of item.permissionsAny) {
        const level = getPermissionLevel(perm);
        if (level > maxLevel) maxLevel = level;
      }
      return maxLevel;
    }

    return 2;
  };

  /**
   * Check if nav group should be visible
   * A group is visible if at least one child has permission level >= 1
   */
  const isGroupVisible = (group) => {
    if (!group.items || group.items.length === 0) return false;
    
    // Check group's own permission first
    if (group.permission) {
      const level = getPermissionLevel(group.permission);
      if (level === 0) return false;
    }
    
    // Check if any child is visible
    return group.items.some((item) => getItemPermissionLevel(item) >= 1);
  };

  const navLink = (name, icon, badge, indent = false) => {
    return (
      <>
        {icon
          ? icon
          : indent && (
              <span className="nav-icon">
                <span className="nav-icon-bullet"></span>
              </span>
            )}
        {name && name}
        {badge && (
          <CBadge color={badge.color} className="ms-auto" size="sm">
            {badge.text}
          </CBadge>
        )}
      </>
    );
  };

  const navItem = (item, index, indent = false) => {
    const { component, name, badge, icon, state, permission, permissionsAny, ...rest } = item;
    const Component = component;
    
    // Get permission level for this item
    const permLevel = getItemPermissionLevel(item);
    
    // Level 0 = hidden (don't render)
    if (permLevel === 0) {
      return null;
    }
    
    // Level 1 = visible but disabled
    // Level 2 = full access
    const isDisabled = permLevel === 1 || state === 'disabled';
    
    return (
      <Component as="div" key={index}>
        {rest.to || rest.href ? (
          <CNavLink
            {...(rest.to && !isDisabled && { as: NavLink })}
            {...(rest.href && !isDisabled && { target: '_blank', rel: 'noopener noreferrer' })}
            {...rest}
            className={isDisabled ? 'disabled' : ''}
            onClick={isDisabled ? (e) => e.preventDefault() : undefined}
            tabIndex={isDisabled ? -1 : undefined}
            aria-disabled={isDisabled}
            style={isDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            title={permLevel === 1 ? 'Solo lectura - No tienes permiso para acceder' : undefined}
          >
            {navLink(name, icon, badge, indent)}
          </CNavLink>
        ) : (
          navLink(name, icon, badge, indent)
        )}
      </Component>
    );
  };

  const navGroup = (item, index) => {
    const { component, name, icon, items: subItems, to, permission, permissionsAny, ...rest } = item;
    const Component = component;
    
    // Check if group should be visible
    if (!isGroupVisible(item)) {
      return null;
    }
    
    // Filter out hidden items (level 0)
    const visibleItems = subItems?.filter((subItem) => getItemPermissionLevel(subItem) >= 1);
    
    if (!visibleItems || visibleItems.length === 0) {
      return null;
    }
    
    return (
      <Component 
        compact 
        as="div" 
        key={index} 
        toggler={navLink(name, icon)} 
        {...rest}
      >
        {visibleItems.map((subItem, subIndex) =>
          subItem.items ? navGroup(subItem, subIndex) : navItem(subItem, subIndex, true),
        )}
      </Component>
    );
  };

  return (
    <CSidebarNav as={SimpleBar}>
      {items &&
        items.map((item, index) =>
          item.items ? navGroup(item, index) : navItem(item, index),
        )}
    </CSidebarNav>
  );
};

AppSidebarNav.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
};

export default AppSidebarNav;