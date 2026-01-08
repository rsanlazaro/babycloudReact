// src/components/PermissionGate.js
import React from 'react';
import { useUser } from '../context/AuthContext';

/**
 * Component to conditionally render children based on user permissions
 * 
 * Usage:
 * <PermissionGate permission="access_9">
 *   <CreateUserButton />
 * </PermissionGate>
 * 
 * <PermissionGate permissions={['access_9', 'access_10']} requireAll>
 *   <AdminPanel />
 * </PermissionGate>
 * 
 * <PermissionGate permission="access_13" fallback={<span>Sin permiso</span>}>
 *   <DeleteButton />
 * </PermissionGate>
 */
const PermissionGate = ({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}) => {
  const { hasPermission, hasAnyPermission } = useUser();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && Array.isArray(permissions)) {
    if (requireAll) {
      hasAccess = permissions.every((p) => hasPermission(p));
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return fallback;
};

/**
 * Component that disables children instead of hiding them
 * 
 * Usage:
 * <PermissionDisable permission="access_9">
 *   <CButton>Create User</CButton>
 * </PermissionDisable>
 */
export const PermissionDisable = ({
  children,
  permission,
  permissions,
  requireAll = false,
  disabledTitle = 'No tienes permiso para esta acción',
}) => {
  const { hasPermission, hasAnyPermission } = useUser();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && Array.isArray(permissions)) {
    hasAccess = requireAll
      ? permissions.every((p) => hasPermission(p))
      : hasAnyPermission(permissions);
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        disabled: true,
        title: disabledTitle,
        style: { ...child.props.style, cursor: 'not-allowed', opacity: 0.6 },
      });
    }
    return child;
  });
};

export default PermissionGate;