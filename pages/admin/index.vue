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
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-lg font-semibold shrink-0">사용자 목록 ({{ filteredUsers.length }}명)</h2>
          <UInput
            v-model="userSearch"
            placeholder="이름 또는 이메일 검색"
            icon="i-lucide-search"
            size="sm"
            class="max-w-xs"
          />
        </div>
      </template>

      <div v-if="loading" class="text-center py-8">
        <UIcon name="i-lucide-loader-circle" class="text-3xl animate-spin" />
      </div>

      <template v-else>
        <div v-if="filteredUsers.length === 0" class="text-center py-8 text-muted">
          검색 결과가 없습니다.
        </div>

        <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
          <div
            v-for="u in paginatedUsers"
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
              <div v-if="getUserGroups(u).length" class="flex flex-wrap gap-1 mt-1">
                <UBadge
                  v-for="g in getUserGroups(u)"
                  :key="g.id"
                  variant="subtle"
                  color="neutral"
                  size="xs"
                >
                  {{ g.name }}
                </UBadge>
              </div>
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

        <!-- 사용자 페이지네이션 -->
        <div v-if="userTotalPages > 1" class="flex items-center justify-center gap-2 pt-4">
          <UButton
            icon="i-lucide-chevron-left"
            size="xs"
            variant="outline"
            :disabled="userPage === 1"
            @click="userPage--"
          />
          <span class="text-sm text-muted">{{ userPage }} / {{ userTotalPages }}</span>
          <UButton
            icon="i-lucide-chevron-right"
            size="xs"
            variant="outline"
            :disabled="userPage === userTotalPages"
            @click="userPage++"
          />
        </div>
      </template>
    </UCard>

    <!-- 그룹 목록 -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-lg font-semibold shrink-0">그룹 목록 ({{ filteredGroups.length }}개)</h2>
          <UInput
            v-model="groupSearch"
            placeholder="그룹 이름 검색"
            icon="i-lucide-search"
            size="sm"
            class="max-w-xs"
          />
        </div>
      </template>

      <div v-if="loading" class="text-center py-8">
        <UIcon name="i-lucide-loader-circle" class="text-3xl animate-spin" />
      </div>

      <template v-else>
        <div v-if="filteredGroups.length === 0" class="text-center py-8 text-muted">
          검색 결과가 없습니다.
        </div>

        <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
          <div
            v-for="g in paginatedGroups"
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

        <!-- 그룹 페이지네이션 -->
        <div v-if="groupTotalPages > 1" class="flex items-center justify-center gap-2 pt-4">
          <UButton
            icon="i-lucide-chevron-left"
            size="xs"
            variant="outline"
            :disabled="groupPage === 1"
            @click="groupPage--"
          />
          <span class="text-sm text-muted">{{ groupPage }} / {{ groupTotalPages }}</span>
          <UButton
            icon="i-lucide-chevron-right"
            size="xs"
            variant="outline"
            :disabled="groupPage === groupTotalPages"
            @click="groupPage++"
          />
        </div>
      </template>
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

const PAGE_SIZE = 20

const users = ref<AdminUser[]>([])
const groups = ref<Group[]>([])
const loading = ref(true)
const togglingUserId = ref<string | null>(null)
const showDeleteConfirm = ref(false)
const groupToDelete = ref<Group | null>(null)
const deleting = ref(false)

// 검색
const userSearch = ref('')
const groupSearch = ref('')

// 페이지네이션
const userPage = ref(1)
const groupPage = ref(1)

// 검색 시 페이지 초기화
watch(userSearch, () => { userPage.value = 1 })
watch(groupSearch, () => { groupPage.value = 1 })

const filteredUsers = computed(() => {
  const q = userSearch.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter(u =>
    u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
  )
})

const userTotalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / PAGE_SIZE)))

const paginatedUsers = computed(() => {
  const start = (userPage.value - 1) * PAGE_SIZE
  return filteredUsers.value.slice(start, start + PAGE_SIZE)
})

const filteredGroups = computed(() => {
  const q = groupSearch.value.trim().toLowerCase()
  if (!q) return groups.value
  return groups.value.filter(g => g.name.toLowerCase().includes(q))
})

const groupTotalPages = computed(() => Math.max(1, Math.ceil(filteredGroups.value.length / PAGE_SIZE)))

const paginatedGroups = computed(() => {
  const start = (groupPage.value - 1) * PAGE_SIZE
  return filteredGroups.value.slice(start, start + PAGE_SIZE)
})

const totalWorkouts = computed(() =>
  users.value.reduce((sum, u) => sum + (u.stats?.totalWorkouts ?? 0), 0),
)

// 그룹 ID → 그룹 객체 맵
const groupMap = computed(() => {
  const map = new Map<string, Group>()
  for (const g of groups.value) map.set(g.id, g)
  return map
})

function getUserGroups(u: AdminUser) {
  if (!u.groupIds?.length) return []
  return u.groupIds
    .map(id => groupMap.value.get(id))
    .filter((g): g is Group => !!g)
}

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
