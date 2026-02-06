<template>
  <UContainer class="py-8">
    <div v-if="loading" class="text-center py-12">
      <UIcon name="i-lucide-loader-circle" class="text-3xl animate-spin" />
    </div>

    <template v-else-if="group">
      <!-- 그룹 헤더 -->
      <UCard class="mb-6">
        <div class="flex items-start gap-4">
          <UAvatar
            :src="group.imageUrl || undefined"
            :alt="group.name"
            size="xl"
            :ui="{ fallback: 'bg-primary-100 text-primary-500' }"
          >
            <template #fallback>
              <UIcon name="i-lucide-users" class="text-2xl" />
            </template>
          </UAvatar>

          <div class="flex-1">
            <h1 class="text-2xl font-bold mb-1">{{ group.name }}</h1>
            <p class="text-muted mb-2">{{ group.description }}</p>
            <div class="flex items-center gap-4 text-sm text-muted">
              <span class="flex items-center gap-1">
                <UIcon name="i-lucide-users" />
                {{ group.memberCount }}명
              </span>
              <span class="flex items-center gap-1">
                <UIcon name="i-lucide-user" />
                {{ group.createdByName }}
              </span>
            </div>
          </div>

          <div class="flex gap-2">
            <UButton
              v-if="isMember && !isAdmin"
              label="탈퇴"
              variant="outline"
              color="error"
              :loading="groupStore.submitting"
              @click="handleLeave"
            />
            <UButton
              v-else-if="!isMember"
              label="가입하기"
              :loading="groupStore.submitting"
              @click="handleJoin"
            />
          </div>
        </div>
      </UCard>

      <!-- 멤버 목록 -->
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">멤버 ({{ groupStore.groupMembers.length }}명)</h2>
        </template>

        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <div
            v-for="member in groupStore.groupMembers"
            :key="member.id"
            class="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
          >
            <UAvatar
              :src="member.photoURL || undefined"
              :alt="member.displayName"
              size="sm"
            />
            <div class="flex-1">
              <NuxtLink
                :to="`/profile/${member.userId}`"
                class="font-medium hover:text-primary-500"
              >
                {{ member.displayName }}
              </NuxtLink>
              <p v-if="member.role === 'admin'" class="text-xs text-muted">관리자</p>
            </div>
            <UBadge v-if="member.role === 'admin'" color="primary" variant="subtle">
              관리자
            </UBadge>
          </div>
        </div>
      </UCard>
    </template>

    <UEmpty
      v-else
      icon="i-lucide-users-x"
      title="그룹을 찾을 수 없습니다"
      description="존재하지 않거나 삭제된 그룹입니다."
    >
      <UButton label="그룹 목록으로" to="/groups" variant="outline" />
    </UEmpty>
  </UContainer>
</template>

<script setup lang="ts">
import type { Group } from '~/types/group'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const groupStore = useGroupStore()
const user = useCurrentUser()
const toast = useToast()

const groupId = computed(() => route.params.id as string)
const group = ref<Group | null>(null)
const loading = ref(true)
const isAdmin = ref(false)

const isMember = computed(() => groupStore.isMemberOf(groupId.value))

async function loadGroup() {
  loading.value = true
  try {
    group.value = await groupStore.fetchGroupById(groupId.value)
    if (group.value) {
      await groupStore.fetchGroupMembers(groupId.value)
      isAdmin.value = await groupStore.isAdminOf(groupId.value)
    }
  } finally {
    loading.value = false
  }
}

async function handleJoin() {
  try {
    await groupStore.joinGroup(groupId.value)
    toast.add({
      title: '그룹에 가입했습니다',
      color: 'success',
    })
    await loadGroup()
  } catch (err) {
    toast.add({
      title: '가입 실패',
      description: err instanceof Error ? err.message : '알 수 없는 오류',
      color: 'error',
    })
  }
}

async function handleLeave() {
  try {
    await groupStore.leaveGroup(groupId.value)
    toast.add({
      title: '그룹에서 탈퇴했습니다',
      color: 'info',
    })
    router.push('/groups')
  } catch (err) {
    toast.add({
      title: '탈퇴 실패',
      description: err instanceof Error ? err.message : '알 수 없는 오류',
      color: 'error',
    })
  }
}

onMounted(async () => {
  await groupStore.fetchMyGroups()
  await loadGroup()
})
</script>
