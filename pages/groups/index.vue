<template>
  <UContainer class="py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">그룹</h1>
      <UButton
        label="그룹 만들기"
        icon="i-lucide-plus"
        to="/groups/new"
      />
    </div>

    <!-- 내 그룹 -->
    <section v-if="groupStore.myGroups.length > 0" class="mb-8">
      <h2 class="text-lg font-semibold mb-4">내 그룹</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <GroupCard
          v-for="group in groupStore.myGroups"
          :key="group.id"
          :group="group"
          :is-member="true"
        />
      </div>
    </section>

    <!-- 전체 그룹 탐색 -->
    <section>
      <h2 class="text-lg font-semibold mb-4">그룹 탐색</h2>

      <div v-if="groupStore.loading" class="text-center py-12">
        <UIcon name="i-lucide-loader-circle" class="text-3xl animate-spin" />
      </div>

      <UEmpty
        v-else-if="availableGroups.length === 0"
        icon="i-lucide-users"
        title="가입 가능한 그룹이 없습니다"
        description="새로운 그룹을 만들어보세요!"
      />

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <GroupCard
          v-for="group in availableGroups"
          :key="group.id"
          :group="group"
          :is-member="false"
          @join="handleJoin"
        />
      </div>
    </section>
  </UContainer>
</template>

<script setup lang="ts">
import type { Group } from '~/types/group'

definePageMeta({ middleware: 'auth' })

const groupStore = useGroupStore()
const toast = useToast()

// 이미 가입한 그룹을 제외한 목록
const availableGroups = computed(() => {
  const myGroupIds = new Set(groupStore.myGroups.map((g: Group) => g.id))
  return groupStore.groups.filter((g: Group) => !myGroupIds.has(g.id))
})

async function handleJoin(groupId: string) {
  try {
    await groupStore.joinGroup(groupId)
    toast.add({
      title: '그룹에 가입했습니다',
      color: 'success',
    })
  } catch (err) {
    toast.add({
      title: '가입 실패',
      description: err instanceof Error ? err.message : '알 수 없는 오류',
      color: 'error',
    })
  }
}

onMounted(async () => {
  await Promise.all([
    groupStore.fetchMyGroups(),
    groupStore.fetchAllGroups(),
  ])
})
</script>
