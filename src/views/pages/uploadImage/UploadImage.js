// import React from 'react'
// import { useState } from 'react'
// import { Link } from 'react-router-dom'
// import {
//   CButton,
//   CAlert,
//   CImage,
//   CProgress,
//   CCard,
//   CCardBody,
//   CCardGroup,
//   CCol,
//   CContainer,
//   CForm,
//   CFormInput,
//   CInputGroup,
//   CInputGroupText,
//   CRow,
// } from '@coreui/react'
// import CIcon from '@coreui/icons-react'
// import { cilLockLocked, cilUser } from '@coreui/icons'

// const CLOUD_NAME = 'dyund4efw'
// const UPLOAD_PRESET = 'babycloud'

// const UploadImage = () => {

//   const [file, setFile] = useState(null)
//   const [preview, setPreview] = useState(null)
//   const [uploading, setUploading] = useState(false)
//   const [progress, setProgress] = useState(0)
//   const [successUrl, setSuccessUrl] = useState(null)
//   const [isDragging, setIsDragging] = useState(false)

//   const handleFileChange = (e) => {
//     const selectedFile = e.target.files[0]
//     if (!selectedFile) return

//     setFile(selectedFile)
//     setPreview(URL.createObjectURL(selectedFile))
//     setSuccessUrl(null)
//   }

//   const uploadToCloudinary = async () => {
//     if (!file) return

//     setUploading(true)
//     setProgress(0)

//     const formData = new FormData()
//     formData.append('file', file)
//     formData.append('upload_preset', UPLOAD_PRESET)

//     const xhr = new XMLHttpRequest()
//     xhr.open(
//       'POST',
//       `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
//     )

//     xhr.upload.onprogress = (e) => {
//       if (e.lengthComputable) {
//         setProgress(Math.round((e.loaded * 100) / e.total))
//       }
//     }

//     xhr.onload = () => {
//       const response = JSON.parse(xhr.responseText)
//       setSuccessUrl(response.secure_url)
//       setUploading(false)
//     }

//     xhr.onerror = () => setUploading(false)

//     xhr.send(formData)
//   }

//   const handleDrop = (e) => {
//     e.preventDefault()
//     setIsDragging(false)


//     const droppedFile = e.dataTransfer.files[0]
//     if (!droppedFile) return

//     if (!droppedFile.type.startsWith('image/')) {
//       alert('Only image files are allowed')
//       return
//     }

//     setFile(droppedFile)
//     setPreview(URL.createObjectURL(droppedFile))
//     setSuccessUrl(null)
//   }

//   const handleDragOver = (e) => {
//     e.preventDefault()
//     setIsDragging(true)
//   }

//   return (
//     <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
//       <CContainer>
//         <CRow className="justify-content-center">
//           <CCol md={8}>
//             <CCardGroup>
//               <CCard className="p-4">
//                 <CCardBody>
//                   <h1>Upload your image</h1>
//                   <p>Load and click upload</p>

//                   <CForm>

//                     <CRow className="mb-4">
//                       <CCol>
//                         <div
//                           onDrop={handleDrop}
//                           onDragOver={handleDragOver}
//                           onDragLeave={() => setIsDragging(false)}
//                           onClick={() => document.getElementById('fileInput').click()}
//                           style={{
//                             borderRadius: '10px',
//                             padding: '40px',
//                             textAlign: 'center',
//                             cursor: 'pointer',
//                             transition: 'all 0.2s ease-in-out',

//                             // dynamic styling
//                             backgroundColor: isDragging ? '#4d5463ff' : '#2A303D',
//                             borderColor: isDragging ? '#4d5463ff' : '#2A303D',
//                           }}
//                         >
//                           {/* Upload icon */}
//                           <div className="mb-3">
//                             <svg
//                               width="48"
//                               height="48"
//                               fill="none"
//                               stroke="#6c757d"
//                               strokeWidth="2"
//                               viewBox="0 0 24 24"
//                             >
//                               <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
//                               <polyline points="7 10 12 5 17 10" />
//                               <line x1="12" y1="5" x2="12" y2="20" />
//                             </svg>
//                           </div>

//                           {/* Text */}
//                           <p className="mb-2 text-muted">
//                             <strong>Drag & Drop files here</strong>
//                           </p>
//                           <p className="text-muted mb-3">or</p>

//                           {/* Button INSIDE drop zone */}
//                           <CButton color="primary">
//                             Seleccionar archivo
//                           </CButton>

//                           {/* Hidden file input */}
//                           <CFormInput
//                             id="fileInput"
//                             type="file"
//                             accept="image/*"
//                             onChange={handleFileChange}
//                             style={{ display: 'none' }}
//                           />
//                         </div>
//                       </CCol>
//                     </CRow>


//                     {/* Preview row */}
//                     {preview && (
//                       <CRow className="mb-3">
//                         <CCol className="text-center">
//                           <CImage
//                             src={preview}
//                             fluid
//                             rounded
//                             style={{ maxHeight: '300px' }}
//                           />
//                         </CCol>
//                       </CRow>
//                     )}

//                     {/* Progress row */}
//                     {uploading && (
//                       <CRow className="mb-3">
//                         <CCol>
//                           <CProgress value={progress}>
//                             {progress}%
//                           </CProgress>
//                         </CCol>
//                       </CRow>
//                     )}

//                     {/* Success message row */}
//                     {successUrl && (
//                       <CRow className="mb-3">
//                         <CCol>
//                           <CAlert color="success">
//                             Uploaded successfully!
//                           </CAlert>
//                         </CCol>
//                       </CRow>
//                     )}

//                     {/* Button row */}
//                     <CRow>
//                       <CCol>
//                         <CButton
//                           type="button"
//                           color="primary"
//                           disabled={!file || uploading}
//                           onClick={uploadToCloudinary}
//                         >
//                           Upload
//                         </CButton>
//                       </CCol>
//                     </CRow>

//                   </CForm>
//                 </CCardBody>
//               </CCard>

//             </CCardGroup>
//           </CCol>
//         </CRow>
//       </CContainer>
//     </div>
//   )
// }

// export default UploadImage
