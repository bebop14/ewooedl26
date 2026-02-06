import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

function compressImage(file: File, maxWidth = 1200, quality = 0.7): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    img.onload = () => {
      let { width, height } = img
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
        'image/jpeg',
        quality,
      )
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export function useImageUpload() {
  const storage = useFirebaseStorage()
  const user = useCurrentUser()

  const uploading = ref(false)
  const progress = ref(0)
  const previewUrl = ref<string | null>(null)

  function setPreview(file: File) {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = URL.createObjectURL(file)
  }

  function clearPreview() {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }

  async function uploadWorkoutImage(file: File): Promise<{ imageUrl: string; thumbnailUrl: string }> {
    if (!storage || !user.value) throw new Error('Not authenticated')

    uploading.value = true
    progress.value = 0

    try {
      const timestamp = Date.now()
      const userId = user.value.uid

      progress.value = 10
      const [compressed, thumbnail] = await Promise.all([
        compressImage(file, 1200, 0.7),
        compressImage(file, 400, 0.6),
      ])
      progress.value = 40

      const imageRef = storageRef(storage, `workouts/${userId}/${timestamp}_original.jpg`)
      const thumbRef = storageRef(storage, `workouts/${userId}/${timestamp}_thumb.jpg`)

      const [imageSnap, thumbSnap] = await Promise.all([
        uploadBytes(imageRef, compressed, { contentType: 'image/jpeg' }),
        uploadBytes(thumbRef, thumbnail, { contentType: 'image/jpeg' }),
      ])
      progress.value = 80

      const [imageUrl, thumbnailUrl] = await Promise.all([
        getDownloadURL(imageSnap.ref),
        getDownloadURL(thumbSnap.ref),
      ])
      progress.value = 100

      return { imageUrl, thumbnailUrl }
    } finally {
      uploading.value = false
    }
  }

  async function uploadProfileImage(file: File): Promise<string> {
    if (!storage || !user.value) throw new Error('Not authenticated')

    uploading.value = true
    progress.value = 0

    try {
      const userId = user.value.uid
      progress.value = 10

      const compressed = await compressImage(file, 400, 0.8)
      progress.value = 50

      const imageRef = storageRef(storage, `profiles/${userId}/avatar.jpg`)
      const snap = await uploadBytes(imageRef, compressed, { contentType: 'image/jpeg' })
      progress.value = 80

      const url = await getDownloadURL(snap.ref)
      progress.value = 100

      return url
    } finally {
      uploading.value = false
    }
  }

  return {
    uploading,
    progress,
    previewUrl,
    setPreview,
    clearPreview,
    uploadWorkoutImage,
    uploadProfileImage,
  }
}
