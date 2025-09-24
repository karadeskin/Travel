import React, { useState, useRef } from 'react'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface PhotoCropperProps {
  imageFile: File
  onCropComplete: (croppedImageFile: File) => void
  onCancel: () => void
}

export const PhotoCropper: React.FC<PhotoCropperProps> = ({
  imageFile,
  onCropComplete,
  onCancel
}) => {
  const [imageSrc, setImageSrc] = useState<string>('')
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [isProcessing, setIsProcessing] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  React.useEffect(() => {
    const reader = new FileReader()
    reader.onload = () => setImageSrc(reader.result as string)
    reader.readAsDataURL(imageFile)
  }, [imageFile])

  const getCroppedImage = async (): Promise<File> => {
    const image = imgRef.current
    const crop = completedCrop
    
    if (!image || !crop) {
      throw new Error('No image or crop data')
    }

    // Use requestIdleCallback to avoid blocking the main thread
    return new Promise((resolve, reject) => {
      const processImage = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            reject(new Error('No 2d context'))
            return
          }

          const scaleX = image.naturalWidth / image.width
          const scaleY = image.naturalHeight / image.height

          canvas.width = crop.width * scaleX
          canvas.height = crop.height * scaleY

          ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
          )

          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], imageFile.name, {
                type: imageFile.type,
                lastModified: Date.now()
              })
              resolve(file)
            } else {
              reject(new Error('Failed to create blob'))
            }
          }, imageFile.type, 0.8) // Reduced quality for faster processing
        } catch (error) {
          reject(error)
        }
      }

      // Use setTimeout to yield control back to the UI thread
      setTimeout(processImage, 10)
    })
  }

  const handleCropComplete = async () => {
    if (isProcessing) return // Prevent double-clicks
    
    setIsProcessing(true)
    try {
      const croppedFile = await getCroppedImage()
      onCropComplete(croppedFile)
    } catch (error) {
      console.error('Error cropping image:', error)
      setIsProcessing(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#333' }}>Crop Your Photo</h3>
        
        {imageSrc && (
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            minWidth={100}
            minHeight={100}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              style={{ maxWidth: '500px', maxHeight: '500px' }}
              alt="Crop preview"
            />
          </ReactCrop>
        )}
        
        <div style={{ 
          marginTop: '1rem', 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'flex-end' 
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCropComplete}
            disabled={isProcessing}
            style={{
              padding: '0.5rem 1rem',
              background: isProcessing ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.7 : 1
            }}
          >
            {isProcessing ? 'Processing...' : 'Apply Crop'}
          </button>
        </div>
      </div>
    </div>
  )
}