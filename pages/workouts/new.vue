<template>
  <UContainer class="py-8 max-w-2xl">
    <div class="flex items-center gap-3 mb-6">
      <UButton icon="i-lucide-arrow-left" variant="ghost" to="/" />
      <h1 class="text-2xl font-bold">오늘의 운동 기록하기</h1>
    </div>

    <UAlert
      v-if="error"
      color="error"
      icon="i-lucide-alert-circle"
      :title="error"
      class="mb-4"
    />

    <UProgress
      v-if="uploading"
      :value="progress"
      :max="100"
      size="sm"
      class="mb-4"
    />

    <WorkoutForm :submitting="isSubmitting" @submit="handleSubmit" />
  </UContainer>
</template>

<script setup lang="ts">
import type { WorkoutFormData } from '~/types/workout'

definePageMeta({ middleware: 'auth' })

const router = useRouter()
const workoutStore = useWorkoutStore()
const { uploadWorkoutImage, uploading, progress } = useImageUpload()

const error = ref('')
const isSubmitting = computed(() => uploading.value || workoutStore.submitting)

async function handleSubmit(formData: WorkoutFormData) {
  error.value = ''

  try {
    const urls = await uploadWorkoutImage(formData.imageFile!)
    await workoutStore.addWorkout(formData, urls)
    router.push('/')
  } catch (err: any) {
    console.error('Workout submit error:', err)
    error.value = err.message || '운동 기록 저장 중 오류가 발생했습니다.'
  }
}
</script>
