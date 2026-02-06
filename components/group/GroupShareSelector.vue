<template>
  <div>
    <label class="block text-sm font-medium mb-2">공유할 그룹</label>
    <p class="text-xs text-muted mb-3">운동 기록을 공유할 그룹을 선택하세요. 선택하지 않으면 본인만 볼 수 있습니다.</p>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="group in groupStore.myGroups"
        :key="group.id"
        type="button"
        class="flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors text-sm"
        :class="isSelected(group.id)
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950 text-primary-600'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'"
        @click="toggleGroup(group.id)"
      >
        <UAvatar
          :src="group.imageUrl || undefined"
          :alt="group.name"
          size="2xs"
          :ui="{ fallback: 'bg-primary-100 text-primary-500' }"
        >
          <template #fallback>
            <UIcon name="i-lucide-users" class="text-xs" />
          </template>
        </UAvatar>
        <span>{{ group.name }}</span>
        <UIcon
          v-if="isSelected(group.id)"
          name="i-lucide-check"
          class="text-primary-500"
        />
      </button>
    </div>

    <p v-if="groupStore.myGroups.length === 0" class="text-sm text-muted py-4 text-center">
      아직 가입한 그룹이 없습니다.
      <NuxtLink to="/groups" class="text-primary-500 hover:underline">
        그룹 둘러보기
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const groupStore = useGroupStore()

function isSelected(groupId: string): boolean {
  return props.modelValue.includes(groupId)
}

function toggleGroup(groupId: string) {
  if (isSelected(groupId)) {
    emit('update:modelValue', props.modelValue.filter(id => id !== groupId))
  } else {
    emit('update:modelValue', [...props.modelValue, groupId])
  }
}

onMounted(() => {
  groupStore.fetchMyGroups()
})
</script>
