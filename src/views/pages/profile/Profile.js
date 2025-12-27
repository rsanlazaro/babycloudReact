// src/views/pages/profile/Profile.js
import React, { useState, useEffect } from 'react';
import { useUser } from '../../../context/UserContext';

import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CRow,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CButton,
  CAvatar,
  CInputGroup,
  CInputGroupText,
  CFormFeedback,
  CAlert,
  CSpinner,
  CProgress,
  CImage
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilUser,
  cilEnvelopeOpen,
  cilLockLocked,
  cilPhone,
  cilCamera,
  cilPeople
} from '@coreui/icons';

import axios from 'axios';
import api from '../../../services/api';

const getUploadSignature = async () => {
  const res = await api.get('http://babycloud.netlify.app/api/upload/cloudinary-signature');
  return res.data;
};

const Profile = () => {

  const { setUser } = useUser();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: '',
    photo: null,
    photoUrl: '',
    photoVersion: null, // Store the Cloudinary URL
  });

  const [photoPreview, setPhotoPreview] = useState('https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=150');
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState('success');
  const [alertMessage, setAlertMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Photo upload states
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Simulate loading existing user data
  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await api.get(
          'http://babycloud.netlify.app/api/users/me',
          { withCredentials: true }
        );

        console.log('USER DATA', res.data);

        const imageUrl =
          res.data.profileImage?.url ??
          'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=150';

        setPhotoPreview(imageUrl);
      } catch (err) {
        console.error('USER LOAD ERROR', err);
      }
    };

    loadUser();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoadingData(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Set mock data - replace with actual API call
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john.doe@example.com',
        password: '',
        confirmPassword: '',
        phone: '+1 (555) 123-4567',
        role: 'user',
        photo: null,
        photoUrl: 'user_1',
        photoVersion: 1766630000 // from DB
      };

      setFormData(userData);
      // setPhotoPreview(userData.photoUrl);
    } catch (error) {
      showNotification('error', 'Hubo un error al cargar el perfil del usuario.');
    } finally {
      setLoadingData(false);
    }
  };

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) {
          error = `${name === 'firstName' ? 'El nombre' : 'El apellido'} es obligatorio`;
        } else if (value.length < 2) {
          error = 'Debe contener al menos 2 caracteres';
        }
        break;

      case 'username':
        if (!value.trim()) {
          error = 'El nombre de usuario es obligatorio';
        } else if (value.length < 3) {
          error = 'El nombre de usuario debe tener al menos 3 caracteres';
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          error = 'El nombre de usuario solo puede contener letras, números y guiones bajos';
        }
        break;

      case 'email':
        if (!value.trim()) {
          error = 'El correo electrónico es obligatorio';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Ingresa una dirección de correo electrónico válida';
        }
        break;

      case 'password':
        if (value && value.length < 6) {
          error = 'La contraseña debe tener al menos 6 caracteres';
        } else if (value && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          error = 'La contraseña debe contener una letra mayúscula, otra minúscula y un número';
        }
        break;

      case 'confirmPassword':
        if (value && value !== formData.password) {
          error = 'Las contraseñas no coinciden';
        }
        break;

      case 'phone':
        if (value && !/^[\d\s()+-]+$/.test(value)) {
          error = 'Ingresa un número de teléfono válido';
        }
        break;

      case 'role':
        if (!value) {
          error = 'Seleccionar un rol';
        }
        break;
    }

    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));

    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Por favor, cargue una imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showNotification('error', 'La foto excede el tamaño máximo de 5MB');
      return;
    }

    setFormData(prevState => ({
      ...prevState,
      photo: file
    }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    handleFileSelect(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const uploadToCloudinary = async () => {
    if (!formData.photo) return formData.photoUrl;

    setUploadingPhoto(true);
    setUploadProgress(0);

    const signatureResponse = await getUploadSignature();

    console.log('SIGNATURE RESPONSE:', signatureResponse);

    const {
      timestamp,
      signature,
      publicId,
      cloudName,
      apiKey,
    } = signatureResponse;

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', formData.photo);
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('timestamp', timestamp);
    cloudinaryFormData.append('signature', signature);
    cloudinaryFormData.append('public_id', publicId);
    cloudinaryFormData.append('overwrite', 'true');
    cloudinaryFormData.append('transformation', 'c_fill,w_300,h_300,g_face');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open(
        'POST',
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
      );

      console.log('USING CLOUD NAME:', cloudName);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded * 100) / e.total));
        }
      };

      xhr.onload = () => {
        if (xhr.status !== 200) {
          reject(new Error(`Cloudinary upload failed: ${xhr.responseText}`));
          return;
        }
        const response = JSON.parse(xhr.responseText);
        setUploadingPhoto(false);
        setUploadProgress(0);
        const { public_id, version, secure_url } = response;

        // const versionedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/v${version}/${public_id}.jpg`;

        resolve({
          publicId: public_id,
          version,
          url: secure_url,
        });

      };

      xhr.onerror = () => {
        setUploadingPhoto(false);
        setUploadProgress(0);
        reject(new Error('Upload failed'));
      };

      xhr.send(cloudinaryFormData);
    });
  };



  const showNotification = (type, message) => {
    setAlertType(type);
    setAlertMessage(message);
    setShowAlert(true);

    setTimeout(() => {
      setShowAlert(false);
    }, 5000);
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['firstName', 'lastName', 'username', 'email', 'role'];

    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    if (formData.password) {
      const passwordError = validateField('password', formData.password);
      if (passwordError) newErrors.password = passwordError;

      const confirmError = validateField('confirmPassword', formData.confirmPassword);
      if (confirmError) newErrors.confirmPassword = confirmError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const touchedFields = {};
    Object.keys(formData).forEach(key => {
      touchedFields[key] = true;
    });
    setTouched(touchedFields);

    if (!validateForm()) {
      showNotification('error', 'Por favor, corrija los errores antes de realizar el envío');
      return;
    }

    try {
      setLoading(true);

      let photoUrl = formData.photoUrl;
      let photoVersion = formData.photoVersion;

      // Upload photo to Cloudinary if a new photo was selected
      if (formData.photo) {
        try {
          const uploadResult = await uploadToCloudinary();

          photoUrl = uploadResult.url;
          photoVersion = uploadResult.version;

          console.log('UPLOAD RESULT:', uploadResult);

          // 1️⃣ Save image info in session (backend)
          await api.put(
            'http://babycloud.netlify.app/api/users/profile-image',
            {
              publicId: uploadResult.publicId,
              version: uploadResult.version,
              profileUrl: uploadResult.url,
            },
            { withCredentials: true }
          );

          // 2️⃣ Refresh global user (for header, breadcrumb, etc.)
          const me = await api.get(
            'http://babycloud.netlify.app/api/users/me',
            { withCredentials: true }
          );

          // 3️⃣ Update global context (if using UserContext)
          setUser(me.data);

        } catch (error) {
          console.error(error);
          showNotification('error', 'Hubo un error al cargar la foto. Intente de nuevo');
          setLoading(false);
          return;
        }
      }


      // Prepare data for API call
      const dataToSubmit = {
        ...formData,
        photoUrl,
        photo: undefined // Don't send the file object to your backend
      };

      // Simulate API call - replace with your actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update local state with new photo URL
      setFormData(prev => ({
        ...prev,
        photoUrl,
        photo: null
      }));

      showNotification('success', 'Foto cargada exitosamente!');
    } catch (error) {
      showNotification('error', 'Hubo un error al cargar la foto. Intente de nuevo');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <CContainer className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <CSpinner color="primary" />
      </CContainer>
    );
  }

  const profileImageSrc =
    photoPreview
      ? photoPreview
      : formData.photoUrl && formData.photoVersion
        ? `https://res.cloudinary.com/dyund4efw/image/upload/v${formData.photoVersion}/${formData.photoUrl}.jpg`
        : null;


  return (
    <CContainer lg>
      <CRow className="justify-content-center">
        <CCol xs={12} md={10} lg={8}>
          {showAlert && (
            <CAlert color={alertType} dismissible onClose={() => setShowAlert(false)}>
              {alertMessage}
            </CAlert>
          )}

          <CCard className="mb-4">
            <CCardHeader>
              <strong>Perfil del usuario</strong>
            </CCardHeader>
            <CCardBody>
              <CForm onSubmit={handleSubmit} noValidate>
                {/* Photo Upload Section with Drag & Drop */}
                <CRow className="mb-4">
                  <CCol xs={12}>
                    <CFormLabel>Foto de perfil</CFormLabel>
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={() => setIsDragging(false)}
                      onClick={() => document.getElementById('photoUploadInput').click()}
                      style={{
                        borderRadius: '10px',
                        padding: '40px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        backgroundColor: isDragging ? '#e9ecef' : '#f8f9fa',
                        border: `2px dashed ${isDragging ? '#0066ff' : '#dee2e6'}`,
                        position: 'relative'
                      }}
                    >
                      {photoPreview ? (
                        <>
                          <CImage
                            src={profileImageSrc}
                            style={{
                              maxHeight: '200px',
                              maxWidth: '200px',
                              borderRadius: '10px',
                              marginBottom: '10px'
                            }}
                          />
                          <div className="mt-3">
                            <CButton className='app-button' size="sm">
                              <CIcon icon={cilCamera} className="me-2" />
                              Cambiar foto
                            </CButton>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Upload icon */}
                          <div className="mb-3">
                            <svg
                              width="48"
                              height="48"
                              fill="none"
                              stroke="#6c757d"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 5 17 10" />
                              <line x1="12" y1="5" x2="12" y2="15" />
                            </svg>
                          </div>

                          <p className="mb-2 text-muted">
                            <strong>Arrastra la foto</strong>
                          </p>
                          <p className="text-muted mb-3">o</p>

                          <CButton className='app-button'>
                            Selecciona foto
                          </CButton>
                        </>
                      )}

                      {/* Hidden file input */}
                      <CFormInput
                        id="photoUploadInput"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        disabled={loading || uploadingPhoto}
                      />
                    </div>

                    <div className="small text-muted mt-2 text-center">
                      Tamaño máximo: 5MB. Formatos: JPG, PNG, GIF
                    </div>

                    {/* Upload progress */}
                    {uploadingPhoto && (
                      <div className="mt-3">
                        <CProgress value={uploadProgress}>
                          {uploadProgress}%
                        </CProgress>
                      </div>
                    )}
                  </CCol>
                </CRow>

                {/* Name Fields */}
                <CRow className="mb-3">
                  <CCol md={6}>
                    <CFormLabel htmlFor="firstName">Nombre *</CFormLabel>
                    <CInputGroup className="has-validation">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        type="text"
                        id="firstName"
                        name="firstName"
                        placeholder="Ingresa tu nombre"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        invalid={touched.firstName && !!errors.firstName}
                        disabled={loading || uploadingPhoto}
                        required
                      />
                      <CFormFeedback invalid>{errors.firstName}</CFormFeedback>
                    </CInputGroup>
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="lastName">Apellido *</CFormLabel>
                    <CInputGroup className="has-validation">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        type="text"
                        id="lastName"
                        name="lastName"
                        placeholder="Ingresa tu apellido"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        invalid={touched.lastName && !!errors.lastName}
                        disabled={loading || uploadingPhoto}
                        required
                      />
                      <CFormFeedback invalid>{errors.lastName}</CFormFeedback>
                    </CInputGroup>
                  </CCol>
                </CRow>

                {/* Username and Role */}
                <CRow className="mb-3">
                  <CCol md={6}>
                    <CFormLabel htmlFor="username">Nombre de usuario *</CFormLabel>
                    <CInputGroup className="has-validation">
                      <CInputGroupText>@</CInputGroupText>
                      <CFormInput
                        type="text"
                        id="username"
                        name="username"
                        placeholder="Selecciona un nombre de usuario"
                        value={formData.username}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        invalid={touched.username && !!errors.username}
                        disabled={loading || uploadingPhoto}
                        required
                      />
                      <CFormFeedback invalid>{errors.username}</CFormFeedback>
                    </CInputGroup>
                  </CCol>

                  <CCol md={6}>
                    <CFormLabel htmlFor="role">Rol *</CFormLabel>
                    <CInputGroup className="has-validation">
                      <CInputGroupText>
                        <CIcon icon={cilPeople} />
                      </CInputGroupText>
                      <CFormSelect
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        invalid={touched.role && !!errors.role}
                        disabled={loading || uploadingPhoto}
                        required
                      >
                        <option value="">Selecciona un rol...</option>
                        <option value="admin">Administrator</option>
                        <option value="manager">Manager</option>
                        <option value="user">User</option>
                        <option value="guest">Guest</option>
                      </CFormSelect>
                      <CFormFeedback invalid>{errors.role}</CFormFeedback>
                    </CInputGroup>
                  </CCol>
                </CRow>

                {/* Email */}
                <CRow className="mb-3">
                  <CCol md={12}>
                    <CFormLabel htmlFor="email">Correo electrónico *</CFormLabel>
                    <CInputGroup className="has-validation">
                      <CInputGroupText>
                        <CIcon icon={cilEnvelopeOpen} />
                      </CInputGroupText>
                      <CFormInput
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Ingresa el correo electrónico"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        invalid={touched.email && !!errors.email}
                        disabled={loading || uploadingPhoto}
                        required
                      />
                      <CFormFeedback invalid>{errors.email}</CFormFeedback>
                    </CInputGroup>
                  </CCol>
                </CRow>

                {/* Password Fields */}
                <CRow className="mb-3">
                  <CCol md={6}>
                    <CFormLabel htmlFor="password">Nueva contraseña</CFormLabel>
                    <CInputGroup className="has-validation">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Ingresa la nueva contraseña"
                        value={formData.password}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        invalid={touched.password && !!errors.password}
                        disabled={loading || uploadingPhoto}
                      />
                      <CFormFeedback invalid>{errors.password}</CFormFeedback>
                    </CInputGroup>
                    <small className="text-muted">
                      Deja en blanco para mantener la contraseña actual
                    </small>
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="confirmPassword">Confirmar contraseña</CFormLabel>
                    <CInputGroup className="has-validation">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="Confirma la nueva contraseña"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        invalid={touched.confirmPassword && !!errors.confirmPassword}
                        disabled={loading || uploadingPhoto}
                      />
                      <CFormFeedback invalid>{errors.confirmPassword}</CFormFeedback>
                    </CInputGroup>
                  </CCol>
                </CRow>

                {/* Phone */}
                <CRow className="mb-3">
                  <CCol md={12}>
                    <CFormLabel htmlFor="phone">Número de teléfono</CFormLabel>
                    <CInputGroup className="has-validation">
                      <CInputGroupText>
                        <CIcon icon={cilPhone} />
                      </CInputGroupText>
                      <CFormInput
                        type="tel"
                        id="phone"
                        name="phone"
                        placeholder="Ingresa el número de teléfono"
                        value={formData.phone}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        invalid={touched.phone && !!errors.phone}
                        disabled={loading || uploadingPhoto}
                      />
                      <CFormFeedback invalid>{errors.phone}</CFormFeedback>
                    </CInputGroup>
                  </CCol>
                </CRow>

                {/* Submit Buttons */}
                <CRow className="mt-4">
                  <CCol xs={12} className="text-end">
                    <CButton
                      color="secondary"
                      className="me-2"
                      disabled={loading || uploadingPhoto}
                      onClick={() => window.history.back()}
                    >
                      Cancelar
                    </CButton>
                    <CButton
                      className='app-button'
                      color="primary"
                      type="submit"
                      disabled={loading || uploadingPhoto}
                    >
                      {loading ? (
                        <>
                          <CSpinner size="sm" className="me-2" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar cambios'
                      )}
                    </CButton>
                  </CCol>
                </CRow>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default Profile;