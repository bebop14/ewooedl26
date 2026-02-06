<template>
  <UCard
    class="hover:shadow-md transition-shadow cursor-pointer"
    @click="navigateTo(`/groups/${group.id}`)"
  >
    <div class="flex items-start gap-3">
      <UAvatar
        :src="group.imageUrl || undefined"
        :alt="group.name"
        size="lg"
        :ui="{ fallback: 'bg-primary-100 text-primary-500' }"
      >
        <template #fallback>
          <UIcon name="i-lucide-users" class="text-lg" />
        </template>
      </UAvatar>

      <div class="flex-1 min-w-0">
        <h3 class="font-semibold truncate">{{ group.name }}</h3>
        <p class="text-sm text-muted line-clamp-2 mb-2">{{ group.description || '설명 없음' }}</p>
        <div class="flex items-center gap-3 text-xs text-muted">
          <span class="flex items-center gap-1">
            <UIcon name="i-lucide-users" />
            {{ group.memberCount }}명
          </span>
        </div>
      </div>
    </div>

    <template #footer v-if="!isMember">
      <UButton
        label="가입하기"
        size="sm"
        block
        :loading="joining"
        @click.stop="handleJoin"
      />
    </template>

    <template #footer v-else>
      <UBadge color="success" variant="subtle" class="w-full justify-center">
        <UIcon name="i-lucide-check" class="mr-1" />
        가입됨
      </UBadge>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import type { Group } from '~/types/group'

const props = defineProps<{
  group: Group
  isMember: boolean
}>()

const emit = defineEmits<{
  join: [groupId: string]
}>()

const joining = ref(false)

async function handleJoin() {
  joining.value = true
  try {
    emit('join', props.group.id)
  } finally {
    joining.value = false
  }
}
</script>
