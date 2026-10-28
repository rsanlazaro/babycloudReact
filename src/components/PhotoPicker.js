// frontend/src/components/PhotoPicker.js
// Profile photo with the same behaviour as Sort_GESCA's register photo:
//   click the avatar → "Seleccionar archivo" or "Tomar foto" (live camera,
//   front/back switch; phones without camera access use the native camera),
//   preview → "Guardar foto" / "Cancelar", upload progress.
// The caller decides where it goes: getSignature() returns the signed Cloudinary
// params from the backend, onUploaded(url) saves the URL on the record.

import React, { useState, useEffect, useRef } from 'react';
import {
  CAvatar, CButton, CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CAlert, CSpinner, CProgress,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilCamera, cilFolderOpen, cilLoopCircular, cilSave } from '@coreui/icons';

const DEFAULT_AVATAR = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=150';
const MAX_SIZE = 5 * 1024 * 1024;

/**
 * @param photoUrl      current saved photo (or empty)
 * @param getSignature  async () => { timestamp, signature, publicId, assetFolder, cloudName, apiKey }
 * @param onUploaded    async (secureUrl) => void — save the URL on the record
 * @param notify        (type, message) => void
 * @param disabled      read-only (no menu)
 * @param color         border / button color
 * @param fileName      base name for photos taken with the camera
 */
const PhotoPicker = ({
  photoUrl, getSignature, onUploaded, notify, disabled = false,
  color = '#d97ea1', fileName = 'foto',
}) => {
  const [file, setFile]                 = useState(null);
  const [preview, setPreview]           = useState(null);
  const [uploading, setUploading]       = useState(false);
  const [progress, setProgress]         = useState(0);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [showCamera, setShowCamera]     = useState(false);
  const [cameraFacing, setCameraFacing] = useState('user'); // 'user' | 'environment'
  const [cameraCount, setCameraCount]   = useState(0);
  const [cameraReady, setCameraReady]   = useState(false);
  const [cameraError, setCameraError]   = useState('');
  const menuRef         = useRef(null);
  const fileInputRef    = useRef(null);
  const captureInputRef = useRef(null); // fallback: native camera on phones
  const videoRef        = useRef(null);
  const streamRef       = useRef(null);

  const handleSelected = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) { notify('danger', 'Por favor seleccione una imagen'); return; }
    if (f.size > MAX_SIZE) { notify('danger', 'La imagen no debe superar 5MB'); return; }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  // Close the small menu when clicking outside it
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [menuOpen]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  };

  // Start/restart the camera while the modal is open (and when switching front/back)
  useEffect(() => {
    if (!showCamera) return undefined;
    let cancelled = false;
    (async () => {
      setCameraError('');
      stopCamera(); // release the previous camera first (needed on many phones)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraReady(true);
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) setCameraCount(devices.filter((d) => d.kind === 'videoinput').length);
      } catch (err) {
        console.error('Camera error:', err);
        if (cancelled) return;
        setCameraError(
          err?.name === 'NotAllowedError'
            ? 'Permiso de cámara denegado. Habilítalo en la configuración del navegador.'
            : err?.name === 'NotFoundError'
              ? 'No se encontró ninguna cámara en este dispositivo.'
              : 'No se pudo abrir la cámara.'
        );
      }
    })();
    return () => { cancelled = true; };
  }, [showCamera, cameraFacing]);

  // Always release the camera and the preview when leaving the page
  useEffect(() => () => stopCamera(), []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const openFilePicker = () => { setMenuOpen(false); fileInputRef.current?.click(); };

  const openCamera = () => {
    setMenuOpen(false);
    // Camera API needs HTTPS (or localhost); if unavailable, use the phone's native camera
    if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
      captureInputRef.current?.click();
      return;
    }
    setShowCamera(true);
  };

  const closeCamera = () => { stopCamera(); setShowCamera(false); setCameraError(''); };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) { notify('danger', 'No se pudo capturar la foto'); return; }
      handleSelected(new File([blob], `${fileName}-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      closeCamera();
    }, 'image/jpeg', 0.9);
  };

  const cancelChange = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
  };

  const upload = async () => {
    if (!file) return;
    try {
      setUploading(true);
      setProgress(0);
      const { timestamp, signature, publicId, assetFolder, cloudName, apiKey } = await getSignature();
      const fd = new FormData();
      fd.append('file',           file);
      fd.append('api_key',        apiKey);
      fd.append('timestamp',      timestamp);
      fd.append('signature',      signature);
      fd.append('public_id',      publicId);
      fd.append('asset_folder',   assetFolder);
      fd.append('overwrite',      'true');
      fd.append('transformation', 'c_fill,w_300,h_300,g_face');

      const secureUrl = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round(e.loaded * 100 / e.total));
        };
        xhr.onload = () => (xhr.status === 200
          ? resolve(JSON.parse(xhr.responseText).secure_url)
          : reject(new Error(`Cloudinary upload failed (${xhr.status})`)));
        xhr.onerror = () => reject(new Error('Network error uploading to Cloudinary'));
        xhr.send(fd);
      });

      await onUploaded(secureUrl);
      cancelChange();
      notify('success', 'Foto actualizada correctamente');
    } catch (err) {
      console.error('Error uploading foto:', err);
      // Keep the preview so the user can retry with "Guardar foto"
      notify('danger', err.response?.data?.message || 'Error al guardar la foto. Intenta de nuevo con "Guardar foto".');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const toggleMenu = () => { if (!disabled) setMenuOpen((o) => !o); };

  return (
    <div className="d-flex flex-column align-items-end gap-2">
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <CAvatar
          src={preview || photoUrl || DEFAULT_AVATAR}
          style={{
            width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover',
            cursor: disabled ? 'default' : 'pointer',
            border: `3px solid ${color}`, boxShadow: '0 2px 8px rgba(217,126,161,0.3)',
          }}
          onClick={toggleMenu}
          title={disabled ? undefined : 'Cambiar foto'}
        />
        {!disabled && (
          <div
            onClick={toggleMenu}
            style={{
              position: 'absolute', bottom: 4, right: 4,
              width: 28, height: 28, borderRadius: '50%',
              backgroundColor: color, border: '2px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}
          >
            <CIcon icon={cilCamera} style={{ color: '#fff', width: 14, height: 14 }} />
          </div>
        )}
        {menuOpen && (
          <div
            ref={menuRef}
            className="shadow-sm border rounded bg-body text-start"
            style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 20, minWidth: 190, overflow: 'hidden' }}
            role="menu"
          >
            <button type="button" role="menuitem" className="dropdown-item d-flex align-items-center px-3 py-2" onClick={openFilePicker}>
              <CIcon icon={cilFolderOpen} className="me-2" />Seleccionar archivo
            </button>
            <button type="button" role="menuitem" className="dropdown-item d-flex align-items-center px-3 py-2" onClick={openCamera}>
              <CIcon icon={cilCamera} className="me-2" />Tomar foto
            </button>
          </div>
        )}
        {/* Hidden inputs: files/gallery, and native camera fallback */}
        <input
          ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => { handleSelected(e.target.files[0]); e.target.value = ''; }}
        />
        <input
          ref={captureInputRef} type="file" accept="image/*" capture="user" style={{ display: 'none' }}
          onChange={(e) => { handleSelected(e.target.files[0]); e.target.value = ''; }}
        />
      </div>

      {/* Live camera */}
      <CModal visible={showCamera} onClose={closeCamera} alignment="center" size="lg" backdrop="static">
        <CModalHeader>
          <CModalTitle>Tomar foto</CModalTitle>
        </CModalHeader>
        <CModalBody className="text-center">
          {cameraError ? (
            <CAlert color="danger" className="mb-0 text-start">{cameraError}</CAlert>
          ) : (
            <div className="position-relative bg-black rounded overflow-hidden" style={{ minHeight: 240 }}>
              <video
                ref={(el) => {
                  videoRef.current = el;
                  if (el && streamRef.current && el.srcObject !== streamRef.current) el.srcObject = streamRef.current;
                }}
                autoPlay playsInline muted
                style={{ width: '100%', maxHeight: '60vh', display: 'block', objectFit: 'contain' }}
              />
              {!cameraReady && (
                <div className="position-absolute top-50 start-50 translate-middle text-white">
                  <CSpinner size="sm" className="me-2" />Abriendo cámara...
                </div>
              )}
            </div>
          )}
        </CModalBody>
        <CModalFooter className="d-flex justify-content-between">
          <div>
            {cameraCount > 1 && !cameraError && (
              <CButton color="secondary" variant="outline"
                onClick={() => setCameraFacing((f) => (f === 'user' ? 'environment' : 'user'))}>
                <CIcon icon={cilLoopCircular} className="me-2" />Cambiar cámara
              </CButton>
            )}
          </div>
          <div className="d-flex gap-2">
            <CButton color="secondary" variant="outline" onClick={closeCamera}>Cancelar</CButton>
            <CButton
              style={{ backgroundColor: color, borderColor: color, color: '#fff' }}
              onClick={takePhoto}
              disabled={!cameraReady || !!cameraError}
            >
              <CIcon icon={cilCamera} className="me-2" />Capturar
            </CButton>
          </div>
        </CModalFooter>
      </CModal>

      {/* Save / progress — only when a new photo is selected */}
      {file && !uploading && (
        <div className="d-flex gap-2">
          <CButton size="sm" style={{ backgroundColor: color, borderColor: color, color: '#fff' }} onClick={upload}>
            <CIcon icon={cilSave} className="me-1" />Guardar foto
          </CButton>
          <CButton size="sm" color="secondary" variant="outline" onClick={cancelChange}>Cancelar</CButton>
        </div>
      )}
      {uploading && (
        <div style={{ width: '120px' }}>
          <CProgress value={progress} style={{ height: '6px' }} />
          <div className="text-muted" style={{ fontSize: '0.72rem', textAlign: 'center', marginTop: 2 }}>{progress}%</div>
        </div>
      )}
      {!file && !uploading && !disabled && (
        <div className="text-muted" style={{ fontSize: '0.72rem' }}>Click en la foto para cambiar</div>
      )}
    </div>
  );
};

export default PhotoPicker;