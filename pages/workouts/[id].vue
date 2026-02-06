<template>
  <UContainer class="py-8 max-w-2xl">
    <div class="flex items-center gap-3 mb-6">
      <UButton icon="i-lucide-arrow-left" variant="ghost" to="/" />
      <h1 class="text-2xl font-bold">운동 상세</h1>
    </div>

    <div v-if="loading" class="text-center py-12">
      <UIcon name="i-lucide-loader-circle" class="text-3xl animate-spin" />
    </div>

    <template v-else-if="workout">
      <!-- 인증샷 -->
      <img
        :src="workout.imageUrl"
        :alt="typeLabel"
        class="w-full rounded-lg mb-6 cursor-zoom-in"
        @click="showZoom = true"
      />
      <GalleryImageZoomModal v-model:open="showZoom" :image-url="workout.imageUrl" />

      <!-- 운동 정보 -->
      <UCard class="mb-4">
        <div class="flex items-center gap-3 mb-4">
          <UIcon :name="typeIcon" class="text-2xl text-blue-500" />
          <div>
            <h2 class="text-xl font-semibold">{{ typeLabel }}</h2>
            <p class="text-sm text-gray-500">{{ formattedDate }}</p>
          </div>
        </div>

        <!-- 메모 -->
        <div v-if="workout.memo">
          <USeparator class="my-4" />
          <p class="text-gray-700 dark:text-gray-300">{{ workout.memo }}</p>
        </div>

        <!-- 해시태그 -->
        <div v-if="workout.hashtags.length" class="flex flex-wrap gap-2 mt-4">
          <UBadge
            v-for="tag in workout.hashtags"
            :key="tag"
            variant="subtle"
            color="info"
          >
            #{{ tag }}
          </UBadge>
        </div>
      </UCard>

      <!-- 좋아요 / 댓글 수 -->
      <div class="flex items-center gap-4 mb-4">
        <SocialLikeButton
          :workout-id="workout.id"
          :like-count="workout.likes"
          @toggled="(d: number) => { if (workout) workout.likes += d }"
        />
        <div class="flex items-center gap-1 text-gray-500">
          <UIcon name="i-lucide-message-circle" />
          <span>{{ workout.comments }}</span>
        </div>
      </div>

      <!-- 작성자 -->
      <UCard class="mb-4">
        <div class="flex items-center gap-3">
          <UAvatar :src="workout.userPhoto || undefined" :alt="workout.userName" size="md" />
          <div>
            <p class="font-medium">{{ workout.userName }}</p>
          </div>
        </div>
      </UCard>

      <!-- 댓글 -->
      <SocialCommentSection
        :workout-id="workout.id"
        @comment-added="workout.comments++"
        @comment-deleted="workout.comments--"
      />
    </template>

    <UEmpty
      v-else
      icon="i-lucide-search-x"
      title="운동 기록을 찾을 수 없습니다"
      description="존재하지 않거나 삭제된 기록입니다."
    />
  </UContainer>
</template>

<script setup lang="ts">
import type { Workout } from '~/types/workout'
import { WORKOUT_TYPES } from '~/types/workout'
import { Timestamp } from 'firebase/firestore'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const workoutStore = useWorkoutStore()
const socialStore = useSocialStore()

const workout = ref<Workout | null>(null)
const loading = ref(true)
const showZoom = ref(false)

const typeInfo = computed(() =>
  WORKOUT_TYPES.find((t) => t.value === workout.value?.workoutType) ?? WORKOUT_TYPES[WORKOUT_TYPES.length - 1],
)
const typeLabel = computed(() => typeInfo.value?.label ?? '기타')
const typeIcon = computed(() => typeInfo.value?.icon ?? 'i-lucide-activity')

const formattedDate = computed(() => {
  if (!workout.value) return ''
  const raw = workout.value.date
  const date = raw && typeof raw === 'object' && 'toDate' in raw
    ? (raw as Timestamp).toDate()
    : new Date(raw as unknown as string)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
})

onMounted(async () => {
  try {
    workout.value = await workoutStore.fetchWorkoutById(route.params.id as string)
    if (workout.value) {
      await socialStore.loadUserLikesForWorkouts([workout.value.id])
    }
  } finally {
    loading.value = false
  }
})
</script>
