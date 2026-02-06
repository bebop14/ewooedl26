<template>
  <UCard>
    <template #header>
      <h3 class="font-semibold">댓글</h3>
    </template>

    <div v-if="socialStore.commentsLoading" class="text-center py-4">
      <UIcon name="i-lucide-loader-circle" class="text-xl animate-spin" />
    </div>

    <div v-else-if="socialStore.comments.length === 0" class="text-center py-4 text-gray-500 text-sm">
      아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="comment in socialStore.comments"
        :key="comment.id"
        class="flex gap-3"
      >
        <UAvatar :src="comment.userPhoto || undefined" :alt="comment.userName" size="sm" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-medium text-sm">{{ comment.userName }}</span>
            <span class="text-xs text-gray-400">{{ relativeTime(comment.createdAt) }}</span>
          </div>
          <p class="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{{ comment.content }}</p>
        </div>
        <UButton
          v-if="isOwner(comment)"
          icon="i-lucide-trash-2"
          variant="ghost"
          color="error"
          size="xs"
          :loading="deletingId === comment.id"
          @click="handleDelete(comment.id)"
        />
      </div>
    </div>

    <USeparator class="my-4" />

    <div class="flex gap-2">
      <UInput
        v-model="newComment"
        placeholder="댓글을 입력하세요..."
        class="flex-1"
        @keyup.enter="handleAdd"
      />
      <UButton
        icon="i-lucide-send"
        :loading="submitting"
        :disabled="!newComment.trim()"
        @click="handleAdd"
      />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { Comment } from '~/types/social'
import { Timestamp } from 'firebase/firestore'

const props = defineProps<{
  workoutId: string
}>()

const emit = defineEmits<{
  commentAdded: []
  commentDeleted: []
}>()

const socialStore = useSocialStore()
const user = useCurrentUser()

const newComment = ref('')
const submitting = ref(false)
const deletingId = ref<string | null>(null)

function isOwner(comment: Comment) {
  return comment.userId === user.value?.uid
}

function relativeTime(ts: Timestamp) {
  const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts as unknown as string)
  const now = Date.now()
  const diff = now - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  return `${days}일 전`
}

async function handleAdd() {
  if (!newComment.value.trim() || submitting.value) return
  submitting.value = true
  try {
    await socialStore.addComment(props.workoutId, newComment.value.trim())
    newComment.value = ''
    emit('commentAdded')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(commentId: string) {
  deletingId.value = commentId
  try {
    await socialStore.deleteComment(commentId, props.workoutId)
    emit('commentDeleted')
  } finally {
    deletingId.value = null
  }
}

onMounted(() => {
  socialStore.fetchComments(props.workoutId)
})
</script>
