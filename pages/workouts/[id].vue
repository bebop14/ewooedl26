<template>
  <UContainer class="py-8 max-w-2xl">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <UButton icon="i-lucide-arrow-left" variant="ghost" to="/" />
        <h1 class="text-2xl font-bold">운동 상세</h1>
      </div>
      <UButton
        v-if="isOwner"
        icon="i-lucide-trash-2"
        color="error"
        variant="ghost"
        :loading="deleting"
        @click="confirmDelete"
      />
    </div>

    <div v-if="loading" class="text-center py-12" role="status" aria-label="로딩 중">
      <UIcon name="i-lucide-loader-circle" class="text-3xl animate-spin" aria-hidden="true" />
    </div>

    <template v-else-if="workout">
      <!-- 작성자 헤더 -->
      <div class="flex items-center gap-3 mb-4">
        <NuxtLink :to="`/profile/${workout.userId}`">
          <UAvatar :src="workout.userPhoto || undefined" :alt="workout.userName" size="md" />
        </NuxtLink>
        <div class="flex-1 min-w-0">
          <NuxtLink :to="`/profile/${workout.userId}`" class="font-medium hover:underline">
            {{ workout.userName }}
          </NuxtLink>
          <p class="text-sm text-muted">{{ formattedDate }}</p>
        </div>
        <div class="flex items-center gap-1">
          <UIcon :name="typeIcon" class="text-lg text-primary" />
          <span class="text-sm text-muted">{{ typeLabel }}</span>
        </div>
      </div>

      <!-- 인증샷 -->
      <img
        :src="workout.imageUrl"
        :alt="typeLabel"
        class="w-full rounded-lg mb-4 cursor-zoom-in"
        @click="showZoom = true"
      />
      <GalleryImageZoomModal v-model:open="showZoom" :image-url="workout.imageUrl" />

      <!-- 좋아요 / 댓글 수 -->
      <div class="flex items-center gap-4 mb-4">
        <SocialLikeButton
          :workout-id="workout.id"
          :like-count="workout.likes"
          @toggled="(d: number) => { if (workout) workout.likes += d }"
        />
        <div class="flex items-center gap-1 text-muted">
          <UIcon name="i-lucide-message-circle" aria-hidden="true" />
          <span>{{ workout.comments }}</span>
        </div>
      </div>

      <!-- 운동 정보 (메모/해시태그가 있을 때만 카드 표시) -->
      <UCard v-if="workout.memo || workout.hashtags.length" class="mb-4">
        <!-- 메모 -->
        <p v-if="workout.memo" class="text-toned">{{ workout.memo }}</p>

        <!-- 해시태그 -->
        <div v-if="workout.hashtags.length" class="flex flex-wrap gap-2" :class="workout.memo ? 'mt-3' : ''">
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

    <!-- 삭제 확인 모달 -->
    <UModal v-model:open="showDeleteConfirm">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-2">운동 기록 삭제</h3>
          <p class="text-sm text-muted mb-6">정말로 이 운동 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" label="취소" @click="showDeleteConfirm = false" />
            <UButton color="error" label="삭제" :loading="deleting" @click="executeDelete" />
          </div>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>

<script setup lang="ts">
import type { Workout } from '~/types/workout'
import { WORKOUT_TYPES } from '~/types/workout'
import { Timestamp } from 'firebase/firestore'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const user = useCurrentUser()
const workoutStore = useWorkoutStore()
const socialStore = useSocialStore()
const toast = useToast()

const workout = ref<Workout | null>(null)
const loading = ref(true)
const showZoom = ref(false)
const deleting = ref(false)
const showDeleteConfirm = ref(false)

const isOwner = computed(() => {
  return workout.value && user.value && workout.value.userId === user.value.uid
})

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

function confirmDelete() {
  showDeleteConfirm.value = true
}

async function executeDelete() {
  if (!workout.value) return

  deleting.value = true
  try {
    await workoutStore.deleteWorkout(workout.value.id)
    showDeleteConfirm.value = false
    toast.add({
      title: '운동 기록이 삭제되었습니다',
      color: 'success',
    })
    router.push('/')
  } catch (err) {
    toast.add({
      title: '삭제 실패',
      description: err instanceof Error ? err.message : '알 수 없는 오류',
      color: 'error',
    })
  } finally {
    deleting.value = false
  }
}

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
