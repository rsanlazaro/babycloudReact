// src/hooks/usePermissions.js
import { useCallback, useMemo } from 'react';
import { useUser } from '../context/AuthContext';
import PERMISSIONS from '../config/permissions';

/**
 * Permission Levels:
 * 0 = Hidden (not visible)
 * 1 = Visible but not editable (read-only)
 * 2 = Visible and editable (full access)
 */

const usePermissions = () => {
  const { getPermissionLevel, canView, canEdit, permissions } = useUser();

  /**
   * Get raw permission level (0, 1, or 2)
   */
  const getLevel = useCallback((permission) => {
    return getPermissionLevel(permission);
  }, [getPermissionLevel]);

  /**
   * Check visibility and editability in one call
   * Returns { visible: boolean, editable: boolean, level: number }
   */
  const check = useCallback((permission) => {
    const level = getPermissionLevel(permission);
    return {
      visible: level >= 1,
      editable: level >= 2,
      level,
    };
  }, [getPermissionLevel]);

  // Pre-computed permission checks for common operations
  const computed = useMemo(() => ({
    // Users (access_8 to access_13)
    users: {
      list: check(PERMISSIONS.LIST_USERS),              // access_8
      create: check(PERMISSIONS.CREATE_USER),           // access_9
      edit: check(PERMISSIONS.EDIT_USER),               // access_10
      password: check(PERMISSIONS.USER_PASSWORD),       // access_11
      permissions: check(PERMISSIONS.USER_PERMISSIONS), // access_12
      delete: check(PERMISSIONS.DELETE_USER),           // access_13
    },
    
    // Guests (access_14 to access_19)
    guests: {
      list: check(PERMISSIONS.LIST_GUESTS),             // access_14
      create: check(PERMISSIONS.CREATE_GUEST),          // access_15
      edit: check(PERMISSIONS.EDIT_GUEST),              // access_16
      password: check(PERMISSIONS.GUEST_PASSWORD),      // access_17
      permissions: check(PERMISSIONS.GUEST_PERMISSIONS),// access_18
      delete: check(PERMISSIONS.DELETE_GUEST),          // access_19
    },
    
    // Reports (access_20 to access_25)
    reports: {
      general: check(PERMISSIONS.GENERATE_REPORTS),         // access_20
      medical: check(PERMISSIONS.GENERATE_MEDICAL_REPORT),  // access_21
      itinerary: check(PERMISSIONS.GENERATE_ITINERARY),     // access_22
      invoiceTMC: check(PERMISSIONS.GENERATE_INVOICE_TMC),  // access_23
      invoiceNexa: check(PERMISSIONS.GENERATE_INVOICE_NEXA),// access_24
      invoiceBabymedic: check(PERMISSIONS.GENERATE_INVOICE_BABYMEDIC), // access_25
    },
    
    // Payments (access_5 to access_7)
    payments: {
      list: check(PERMISSIONS.LIST_PAYMENTS),           // access_5
      register: check(PERMISSIONS.REGISTER_PAYMENT),    // access_6
      edit: check(PERMISSIONS.EDIT_PAYMENTS),           // access_7
    },

    // Notes (access_1 to access_4)
    notes: {
      list: check(PERMISSIONS.LIST_ATTENTION_NOTES),    // access_1
      create: check(PERMISSIONS.CREATE_ATTENTION_NOTE), // access_2
      edit: check(PERMISSIONS.EDIT_ATTENTION_NOTE),     // access_3
      delete: check(PERMISSIONS.DELETE_ATTENTION_NOTE), // access_4
    },

    history: {
      activity: check(PERMISSIONS.ACTIVITY_HISTORY),      // access_83
    },
    
    // Dashboard
    dashboard: check(PERMISSIONS.VIEW_DASHBOARDS),      // access_26
  }), [check]);

  return {
    // Methods
    getLevel,
    check,
    canView,
    canEdit,
    
    // Constants
    PERMISSIONS,
    permissions,
    
    // Pre-computed checks
    ...computed,
  };
};

export default usePermissions;