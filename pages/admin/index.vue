<template>
  <UContainer class="py-8">
    <h1 class="text-2xl font-bold mb-6">관리자 대시보드</h1>

    <!-- 통계 카드 -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <UCard>
        <div class="text-center">
          <p class="text-sm text-muted">전체 사용자</p>
          <p class="text-3xl font-bold">{{ users.length }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-muted">전체 그룹</p>
          <p class="text-3xl font-bold">{{ groups.length }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-muted">전체 운동 수</p>
          <p class="text-3xl font-bold">{{ totalWorkouts }}</p>
        </div>
      </UCard>
    </div>

    <!-- 빠른 링크 -->
    <div class="mb-8">
      <UButton
        label="피드백 관리"
        to="/admin/feedback"
        icon="i-lucide-message-square-text"
        variant="outline"
      />
    </div>

    <!-- 사용자 목록 -->
    <UCard class="mb-8">
      <template #header>
        <h2 class="text-lg font-semibold">사용자 목록 ({{ users.length }}명)</h2>
      </template>

      <div v-if="loading" class="text-center py-8">
        <UIcon name="i-lucide-loader-circle" class="text-3xl animate-spin" />
      </div>

      <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
        <div
          v-for="u in users"
          :key="u.id"
          class="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
        >
          <UAvatar
            :src="u.photoURL || undefined"
            :alt="u.displayName"
            size="sm"
          />
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">{{ u.displayName }}</p>
            <p class="text-xs text-muted truncate">{{ u.email }}</p>
          </div>
          <div class="text-right text-xs text-muted hidden sm:block">
            <p>운동 {{ u.stats?.totalWorkouts ?? 0 }}회</p>
            <p>{{ formatDate(u.createdAt) }}</p>
          </div>
          <UBadge
            :color="u.role === 'admin' ? 'primary' : 'neutral'"
            variant="subtle"
          >
            {{ u.role === 'admin' ? '관리자' : '멤버' }}
          </UBadge>
          <UButton
            :label="u.role === 'admin' ? '멤버로' : '관리자로'"
            size="xs"
            variant="outline"
            :loading="togglingUserId === u.id"
            @click="toggleUserRole(u)"
          />
        </div>
      </div>
    </UCard>

    <!-- 그룹 목록 -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">그룹 목록 ({{ groups.length }}개)</h2>
      </template>

      <div v-if="loading" class="text-center py-8">
        <UIcon name="i-lucide-loader-circle" class="text-3xl animate-spin" />
      </div>

      <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
        <div
          v-for="g in groups"
          :key="g.id"
          class="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
        >
          <UAvatar
            :src="g.imageUrl || undefined"
            :alt="g.name"
            size="sm"
          >
            <template #fallback>
              <UIcon name="i-lucide-users" />
            </template>
          </UAvatar>
          <div class="flex-1 min-w-0">
            <NuxtLink :to="`/groups/${g.id}`" class="font-medium hover:text-primary-500 truncate block">
              {{ g.name }}
            </NuxtLink>
            <p class="text-xs text-muted">
              멤버 {{ g.memberCount }}명 &middot; {{ g.createdByName }} &middot; {{ formatTimestamp(g.createdAt) }}
            </p>
          </div>
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            variant="outline"
            color="error"
            @click="confirmDeleteGroup(g)"
          />
        </div>
      </div>
    </UCard>

    <!-- 그룹 삭제 확인 모달 -->
    <UModal v-model:open="showDeleteConfirm">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold">그룹 삭제</h3>
          <p>
            <strong>{{ groupToDelete?.name }}</strong> 그룹을 삭제하시겠습니까?
            모든 멤버와 데이터가 삭제됩니다.
          </p>
          <div class="flex justify-end gap-2">
            <UButton label="취소" variant="outline" @click="showDeleteConfirm = false" />
            <UButton label="삭제" color="error" :loading="deleting" @click="handleDeleteGroup" />
          </div>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>

<script setup lang="ts">
import { collection, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore'
import type { UserProfile } from '~/stores/user'
import type { Group } from '~/types/group'

definePageMeta({ middleware: ['auth', 'admin'] })

const db = useFirestore()
const toast = useToast()

interface AdminUser extends UserProfile {
  id: string
}

const users = ref<AdminUser[]>([])
const groups = ref<Group[]>([])
const loading = ref(true)
const togglingUserId = ref<string | null>(null)
const showDeleteConfirm = ref(false)
const groupToDelete = ref<Group | null>(null)
const deleting = ref(false)

const totalWorkouts = computed(() =>
  users.value.reduce((sum, u) => sum + (u.stats?.totalWorkouts ?? 0), 0),
)

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatTimestamp(ts: Timestamp) {
  if (!ts?.toDate) return ''
  return ts.toDate().toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function fetchUsers() {
  if (!db) return
  const snapshot = await getDocs(collection(db, 'users'))
  users.value = snapshot.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as AdminUser[]
}

async function fetchGroups() {
  if (!db) return
  const snapshot = await getDocs(collection(db, 'groups'))
  groups.value = snapshot.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as Group[]
}

async function toggleUserRole(u: AdminUser) {
  if (!db) return
  togglingUserId.value = u.id
  try {
    const newRole = u.role === 'admin' ? 'member' : 'admin'
    await updateDoc(doc(db, 'users', u.id), { role: newRole })
    u.role = newRole
    toast.add({
      title: `${u.displayName}님의 역할이 ${newRole === 'admin' ? '관리자' : '멤버'}로 변경되었습니다`,
      color: 'success',
    })
  } catch (err) {
    toast.add({
      title: '역할 변경 실패',
      description: err instanceof Error ? err.message : '알 수 없는 오류',
      color: 'error',
    })
  } finally {
    togglingUserId.value = null
  }
}

function confirmDeleteGroup(g: Group) {
  groupToDelete.value = g
  showDeleteConfirm.value = true
}

async function handleDeleteGroup() {
  if (!db || !groupToDelete.value) return
  deleting.value = true
  try {
    const gId = groupToDelete.value.id

    // 하위 멤버 문서 모두 삭제
    const membersSnapshot = await getDocs(collection(db, 'groups', gId, 'members'))
    await Promise.all(membersSnapshot.docs.map(d => deleteDoc(d.ref)))

    // 그룹 문서 삭제
    await deleteDoc(doc(db, 'groups', gId))

    groups.value = groups.value.filter(g => g.id !== gId)
    toast.add({ title: '그룹이 삭제되었습니다', color: 'success' })
  } catch (err) {
    toast.add({
      title: '삭제 실패',
      description: err instanceof Error ? err.message : '알 수 없는 오류',
      color: 'error',
    })
  } finally {
    deleting.value = false
    showDeleteConfirm.value = false
    groupToDelete.value = null
  }
}

onMounted(async () => {
  try {
    await Promise.all([fetchUsers(), fetchGroups()])
  } finally {
    loading.value = false
  }
})
</script>
