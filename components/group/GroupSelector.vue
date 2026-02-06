<template>
  <UDropdownMenu :items="menuItems">
    <UButton
      :label="selectedLabel"
      variant="ghost"
      trailing-icon="i-lucide-chevron-down"
      class="max-w-[200px]"
    >
      <template #leading>
        <UIcon name="i-lucide-users" />
      </template>
    </UButton>
  </UDropdownMenu>
</template>

<script setup lang="ts">
const groupStore = useGroupStore()

const selectedLabel = computed(() => {
  if (!groupStore.currentGroupId) {
    return '그룹 선택'
  }
  const group = groupStore.myGroups.find(g => g.id === groupStore.currentGroupId)
  return group?.name ?? '그룹 선택'
})

const menuItems = computed(() => {
  const items = [
    groupStore.myGroups.map(group => ({
      label: group.name,
      icon: 'i-lucide-users',
      onSelect: () => groupStore.selectGroup(group.id),
    })),
    [{
      label: '그룹 관리',
      icon: 'i-lucide-settings',
      to: '/groups',
    }],
  ]
  return items
})

onMounted(async () => {
  try {
    await groupStore.fetchMyGroups()
    groupStore.restoreSelectedGroup()

    // 선택된 그룹이 없고 가입한 그룹이 있으면 첫 번째 그룹 자동 선택
    if (!groupStore.currentGroupId && groupStore.myGroups.length > 0) {
      groupStore.selectGroup(groupStore.myGroups[0].id)
    }
  } catch (err) {
    console.error('Failed to fetch groups:', err)
  }
})
</script>
