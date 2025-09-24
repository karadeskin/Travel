import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { entriesApi } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { useState } from 'react'
import { PhotoCropper } from '../components/PhotoCropper'

const entrySchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  location: z.string().optional(),
})

type EntryForm = z.infer<typeof entrySchema>

export const Route = createLazyFileRoute('/entries/new')({
  component: NewEntry,
})

function NewEntry() {
  const navigate = useNavigate()
  const { data: user } = useAuth()
  const queryClient = useQueryClient()
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [fileToProcess, setFileToProcess] = useState<File | null>(null)
  
  const createEntryMutation = useMutation({
    mutationFn: entriesApi.create,
    onSuccess: () => {
      // Invalidate entries query to refresh the dashboard
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      navigate({ to: '/dashboard' })
    },
    onError: (error: any) => {
      console.error('Failed to create entry:', error)
    }
  })

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // For now, process one file at a time with cropping
    const file = files[0]
    if (file.type.startsWith('image/')) {
      setFileToProcess(file)
    }
    
    // Clear the input so the same file can be selected again
    event.target.value = ''
  }

  const handleCropComplete = async (croppedFile: File) => {
    setIsUploadingPhoto(true)
    try {
      const response = await entriesApi.uploadPhoto(croppedFile)
      setUploadedPhotos(prev => [...prev, response.url])
    } catch (error) {
      console.error('Photo upload failed:', error)
    } finally {
      setIsUploadingPhoto(false)
      setFileToProcess(null)
    }
  }

  const handleCropCancel = () => {
    setFileToProcess(null)
  }

  const removePhoto = (photoUrl: string) => {
    setUploadedPhotos(prev => prev.filter(url => url !== photoUrl))
  }
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EntryForm>({
    resolver: zodResolver(entrySchema),
  })

  const onSubmit = async (data: EntryForm) => {
    try {
      // Include user_id and photos in the request
      const entryData = {
        ...data,
        user_id: user?.id,
        photos: uploadedPhotos
      }
      console.log('Creating entry with data:', entryData) // Debug log
      await createEntryMutation.mutateAsync(entryData)
    } catch (error: any) {
      console.error('Entry creation error:', error)
    }
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Create New Entry
        </h1>
        <p style={{ opacity: '0.8' }}>
          Share your travel experience and memories
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Title
              </label>
              <input
                {...register('title')}
                type="text"
                id="title"
                className="form-input"
                placeholder="Give your entry a memorable title..."
              />
              {errors.title && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444' }}>
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="location" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Location
              </label>
              <input
                {...register('location')}
                type="text"
                id="location"
                className="form-input"
                placeholder="Where did this happen? (optional)"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Photos
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="form-input"
                disabled={isUploadingPhoto}
              />
              {isUploadingPhoto && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#3b82f6' }}>
                  Uploading photos...
                </p>
              )}
              
              {uploadedPhotos.length > 0 && (
                <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
                  {uploadedPhotos.map((photoUrl, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <img
                        src={`http://localhost:8080${photoUrl}`}
                        alt={`Photo ${index + 1}`}
                        style={{ 
                          width: '100%', 
                          height: '120px', 
                          objectFit: 'cover', 
                          borderRadius: '4px',
                          border: '1px solid #333'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photoUrl)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="content" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Your Story
              </label>
              <textarea
                {...register('content')}
                id="content"
                rows={12}
                className="form-input form-textarea"
                placeholder="Tell us about your experience, what you saw, how you felt, what made it special..."
                style={{ resize: 'vertical', minHeight: '200px' }}
              />
              {errors.content && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444' }}>
                  {errors.content.message}
                </p>
              )}
            </div>
          </div>

          {createEntryMutation.error && (
            <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#ef4444' }}>
              {createEntryMutation.error?.response?.data?.error || 'Failed to create entry. Please try again.'}
            </div>
          )}

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
            <button
              type="button"
              onClick={() => navigate({ to: '/dashboard' })}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createEntryMutation.isPending}
              className="btn-primary"
              style={{ 
                opacity: (isSubmitting || createEntryMutation.isPending) ? '0.5' : '1',
                cursor: (isSubmitting || createEntryMutation.isPending) ? 'not-allowed' : 'pointer'
              }}
            >
              {createEntryMutation.isPending ? 'Creating...' : 'Create Entry'}
            </button>
          </div>
        </div>
      </form>

      {/* Photo Cropper Modal */}
      {fileToProcess && (
        <PhotoCropper
          imageFile={fileToProcess}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  )
}