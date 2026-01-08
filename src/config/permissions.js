// src/config/permissions.js

/**
 * Permission constants that map to access_1 through access_83
 * These are used throughout the application to reference permissions
 * 
 * Permission Levels:
 * 0 = Hidden (not visible)
 * 1 = Visible but not editable (read-only)
 * 2 = Visible and editable (full access)
 */

const PERMISSIONS = {
  // ===== PROGESTOR =====
  
  // Notas de atención (access_1 to access_4)
  LIST_ATTENTION_NOTES: 'access_1',
  CREATE_ATTENTION_NOTE: 'access_2',
  EDIT_ATTENTION_NOTE: 'access_3',
  DELETE_ATTENTION_NOTE: 'access_4',
  
  // Pagos (access_5 to access_7)
  LIST_PAYMENTS: 'access_5',
  REGISTER_PAYMENT: 'access_6',
  EDIT_PAYMENTS: 'access_7',
  
  // Usuarios (access_8 to access_13)
  LIST_USERS: 'access_8',
  CREATE_USER: 'access_9',
  EDIT_USER: 'access_10',
  USER_PASSWORD: 'access_11',
  USER_PERMISSIONS: 'access_12',
  DELETE_USER: 'access_13',
  
  // Externos / Guests (access_14 to access_19)
  LIST_GUESTS: 'access_14',
  CREATE_GUEST: 'access_15',
  EDIT_GUEST: 'access_16',
  GUEST_PASSWORD: 'access_17',
  GUEST_PERMISSIONS: 'access_18',
  DELETE_GUEST: 'access_19',
  
  // Reportes y Facturas (access_20 to access_25)
  GENERATE_REPORTS: 'access_20',
  GENERATE_MEDICAL_REPORT: 'access_21',
  GENERATE_ITINERARY: 'access_22',
  GENERATE_INVOICE_TMC: 'access_23',
  GENERATE_INVOICE_NEXA: 'access_24',
  GENERATE_INVOICE_BABYMEDIC: 'access_25',
  
  // Dashboard (access_26)
  VIEW_DASHBOARDS: 'access_26',
  
  // ===== BABYSITE =====
  
  // Sort_GES (access_27 to access_32)
  LIST_SORT_GES: 'access_27',
  CREATE_SORT_GES: 'access_28',
  EDIT_SORT_GES: 'access_29',
  DELETE_SORT_GES: 'access_30',
  VIEW_SORT_GES_DETAILS: 'access_31',
  EXPORT_SORT_GES: 'access_32',
  
  // Sort_IP (access_33 to access_39)
  LIST_SORT_IP: 'access_33',
  CREATE_SORT_IP: 'access_34',
  EDIT_SORT_IP: 'access_35',
  DELETE_SORT_IP: 'access_36',
  VIEW_SORT_IP_DETAILS: 'access_37',
  EXPORT_SORT_IP: 'access_38',
  SORT_IP_EXTRA: 'access_39',
  
  // Programas (access_40 to access_45)
  VIEW_PROGRAMS: 'access_40',
  CREATE_PROGRAM: 'access_41',
  EDIT_PROGRAM: 'access_42',
  DELETE_PROGRAM: 'access_43',
  VIEW_PROGRAM_DETAILS: 'access_44',
  EXPORT_PROGRAMS: 'access_45',
  
  // Perfil (access_46 to access_52)
  VIEW_PROFILE: 'access_46',
  EDIT_PROFILE_BASIC: 'access_47',
  EDIT_PROFILE_CONTACT: 'access_48',
  EDIT_PROFILE_MEDICAL: 'access_49',
  EDIT_PROFILE_DOCUMENTS: 'access_50',
  EDIT_PROFILE_PHOTOS: 'access_51',
  DELETE_PROFILE: 'access_52',
  
  // Citas (access_53 to access_56)
  VIEW_APPOINTMENTS: 'access_53',
  CREATE_APPOINTMENT: 'access_54',
  EDIT_APPOINTMENT: 'access_55',
  DELETE_APPOINTMENT: 'access_56',
  
  // ACO (access_57 to access_60)
  VIEW_ACO: 'access_57',
  CREATE_ACO: 'access_58',
  EDIT_ACO: 'access_59',
  DELETE_ACO: 'access_60',
  
  // Gestación (access_61 to access_66)
  VIEW_GESTATION: 'access_61',
  CREATE_GESTATION: 'access_62',
  EDIT_GESTATION: 'access_63',
  DELETE_GESTATION: 'access_64',
  VIEW_GESTATION_DETAILS: 'access_65',
  EXPORT_GESTATION: 'access_66',
  
  // Egg Donor (access_67 to access_69)
  VIEW_EGG_DONOR: 'access_67',
  LIST_EGG_DONOR: 'access_68',
  EGG_DONOR_DASHBOARDS: 'access_69',
  
  // ===== RECLUTA =====
  
  // Home (access_70)
  RECLUTA_HOME: 'access_70',
  
  // ===== BABYCLOUD =====
  
  // Stages (access_71 to access_83)
  ADD_STAGE: 'access_71',
  EDIT_STAGE: 'access_72',
  DELETE_STAGE: 'access_73',
  VIEW_STAGE_FILES: 'access_74',
  UPLOAD_STAGE_FILES: 'access_75',
  DELETE_STAGE_FILES: 'access_76',
  VIEW_STAGE_COMMENTS: 'access_77',
  ADD_STAGE_COMMENTS: 'access_78',
  EDIT_STAGE_COMMENTS: 'access_79',
  DELETE_STAGE_COMMENTS: 'access_80',
  SHARE_STAGE: 'access_81',
  ENABLE_STAGE_VIEW: 'access_82',
  ACTIVITY_HISTORY: 'access_83',
};

export default PERMISSIONS;