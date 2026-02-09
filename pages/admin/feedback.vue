<template>
  <UContainer class="py-8">
    <h1 class="text-2xl font-bold mb-6">피드백 관리</h1>

    <div v-if="loading" class="text-center py-12">
      <UIcon name="i-lucide-loader-circle" class="text-3xl animate-spin" />
    </div>

    <div v-else-if="feedbacks.length === 0" class="text-center py-12 text-gray-500">
      피드백이 없습니다.
    </div>

    <div v-else class="space-y-4">
      <UCard v-for="fb in feedbacks" :key="fb.id">
        <div class="flex justify-between items-start">
          <div>
            <p class="font-semibold">{{ fb.userName }}</p>
            <p class="text-sm text-gray-500">{{ formatDate(fb.createdAt) }}</p>
          </div>
        </div>
        <p class="mt-2 whitespace-pre-wrap">{{ fb.content }}</p>
      </UCard>

      <div v-if="hasMore" class="text-center pt-4">
        <UButton
          label="더보기"
          variant="outline"
          icon="i-lucide-chevron-down"
          :loading="loadingMore"
          @click="loadMore"
        />
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { collection, query, orderBy, limit, getDocs, startAfter, type QueryDocumentSnapshot, Timestamp } from 'firebase/firestore'

definePageMeta({ middleware: ['auth', 'admin'] })

interface Feedback {
  id: string
  userId: string
  userName: string
  content: string
  createdAt: Timestamp
}

const db = useFirestore()
const PAGE_SIZE = 20

const feedbacks = ref<Feedback[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(false)
const lastDoc = ref<QueryDocumentSnapshot | null>(null)

function formatDate(ts: Timestamp) {
  const date = ts.toDate()
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function fetchFeedbacks() {
  if (!db) return
  const q = query(
    collection(db, 'feedback'),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE),
  )
  const snapshot = await getDocs(q)
  feedbacks.value = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Feedback[]
  lastDoc.value = snapshot.docs[snapshot.docs.length - 1] || null
  hasMore.value = snapshot.docs.length === PAGE_SIZE
}

async function loadMore() {
  if (!db || !lastDoc.value) return
  loadingMore.value = true
  try {
    const q = query(
      collection(db, 'feedback'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc.value),
      limit(PAGE_SIZE),
    )
    const snapshot = await getDocs(q)
    const newFeedbacks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Feedback[]
    feedbacks.value.push(...newFeedbacks)
    lastDoc.value = snapshot.docs[snapshot.docs.length - 1] || null
    hasMore.value = snapshot.docs.length === PAGE_SIZE
  } finally {
    loadingMore.value = false
  }
}

onMounted(async () => {
  try {
    await fetchFeedbacks()
  } finally {
    loading.value = false
  }
})
</script>
