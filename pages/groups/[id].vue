<template>
  <UContainer class="py-8">
    <div v-if="loading" class="text-center py-12">
      <UIcon name="i-lucide-loader-circle" class="text-3xl animate-spin" />
    </div>

    <template v-else-if="group">
      <!-- 그룹 헤더 -->
      <UCard class="mb-6">
        <!-- 보기 모드 -->
        <template v-if="!editing">
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
                v-if="isAdmin"
                icon="i-lucide-pencil"
                label="수정"
                variant="outline"
                size="sm"
                @click="startEditing"
              />
              <UButton
                v-if="isMember"
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
        </template>

        <!-- 편집 모드 -->
        <template v-else>
          <div class="space-y-4">
            <!-- 그룹 이미지 변경 -->
            <div class="flex items-center gap-4">
              <div class="relative">
                <UAvatar
                  :src="imagePreview || editForm.imageUrl || undefined"
                  :alt="editForm.name"
                  size="xl"
                  :ui="{ fallback: 'bg-primary-100 text-primary-500' }"
                >
                  <template #fallback>
                    <UIcon name="i-lucide-users" class="text-2xl" />
                  </template>
                </UAvatar>
                <label
                  class="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                >
                  <UIcon name="i-lucide-camera" class="text-white text-lg" />
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleImageSelect"
                  />
                </label>
              </div>
              <div class="flex-1">
                <p class="text-sm text-muted">그룹 이미지를 변경하려면 이미지를 클릭하세요</p>
              </div>
            </div>

            <!-- 이름 변경 -->
            <UFormField label="그룹 이름" class="max-w-xs">
              <UInput v-model="editForm.name" placeholder="그룹 이름을 입력하세요" />
            </UFormField>

            <!-- 설명 변경 -->
            <UFormField label="그룹 설명">
              <UTextarea v-model="editForm.description" placeholder="그룹 설명을 입력하세요" :rows="3" />
            </UFormField>

            <!-- 버튼 -->
            <div class="flex gap-2 justify-end">
              <UButton label="취소" variant="outline" @click="cancelEditing" />
              <UButton
                label="저장"
                icon="i-lucide-check"
                :loading="saving"
                :disabled="!isFormValid"
                @click="saveGroup"
              />
            </div>
          </div>
        </template>
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

            <!-- 관리자용 멤버 관리 드롭다운 (자기 자신 제외) -->
            <UDropdownMenu
              v-if="isAdmin && member.userId !== user?.uid"
              :items="getMemberActions(member)"
            >
              <UButton
                icon="i-lucide-more-vertical"
                variant="ghost"
                size="xs"
              />
            </UDropdownMenu>
          </div>
        </div>
      </UCard>

      <!-- 강퇴 확인 모달 -->
      <UModal v-model:open="showRemoveConfirm">
        <template #content>
          <div class="p-6 space-y-4">
            <h3 class="text-lg font-semibold">멤버 강퇴</h3>
            <p>
              <strong>{{ memberToRemove?.displayName }}</strong>님을 그룹에서 강퇴하시겠습니까?
            </p>
            <div class="flex justify-end gap-2">
              <UButton label="취소" variant="outline" @click="showRemoveConfirm = false" />
              <UButton label="강퇴" color="error" @click="confirmRemoveMember" />
            </div>
          </div>
        </template>
      </UModal>
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
const { uploadImage } = useImageUpload()

const groupId = computed(() => route.params.id as string)
const group = ref<Group | null>(null)
const loading = ref(true)
const isAdmin = ref(false)

const isMember = computed(() => groupStore.isMemberOf(groupId.value))

// 편집 관련
const editing = ref(false)
const saving = ref(false)
const imagePreview = ref<string | null>(null)
const selectedFile = ref<File | null>(null)

const editForm = reactive({
  name: '',
  description: '',
  imageUrl: '',
})

const isFormValid = computed(() => editForm.name.trim().length > 0)

function startEditing() {
  if (!group.value) return
  editForm.name = group.value.name
  editForm.description = group.value.description
  editForm.imageUrl = group.value.imageUrl || ''
  editing.value = true
}

function cancelEditing() {
  editing.value = false
  selectedFile.value = null
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value)
    imagePreview.value = null
  }
}

function handleImageSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  selectedFile.value = file
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value)
  imagePreview.value = URL.createObjectURL(file)
}

async function saveGroup() {
  if (!isFormValid.value || !group.value) return
  saving.value = true

  try {
    const updates: { name?: string; description?: string; imageUrl?: string } = {}

    if (editForm.name.trim() !== group.value.name) {
      updates.name = editForm.name.trim()
    }
    if (editForm.description.trim() !== group.value.description) {
      updates.description = editForm.description.trim()
    }
    if (selectedFile.value) {
      const { imageUrl } = await uploadImage(selectedFile.value, `groups/${groupId.value}`)
      updates.imageUrl = imageUrl
    }

    if (Object.keys(updates).length > 0) {
      await groupStore.updateGroup(groupId.value, updates)
      group.value = { ...group.value, ...updates }
      toast.add({ title: '그룹 정보가 수정되었습니다', color: 'success' })
    }

    cancelEditing()
  } catch (error) {
    toast.add({
      title: '수정 실패',
      description: error instanceof Error ? error.message : '알 수 없는 오류',
      color: 'error',
    })
  } finally {
    saving.value = false
  }
}

function getMemberActions(member: { userId: string; displayName: string; role: string }) {
  const items: any[] = []
  if (member.role === 'member') {
    items.push({
      label: '관리자로 변경',
      icon: 'i-lucide-shield',
      onSelect: () => handleRoleChange(member.userId, 'admin'),
    })
  } else {
    items.push({
      label: '멤버로 변경',
      icon: 'i-lucide-shield-off',
      onSelect: () => handleRoleChange(member.userId, 'member'),
    })
  }
  items.push({
    label: '강퇴',
    icon: 'i-lucide-user-x',
    onSelect: () => handleRemoveMember(member.userId, member.displayName),
  })
  return [items]
}

async function handleRoleChange(userId: string, role: 'admin' | 'member') {
  try {
    await groupStore.updateMemberRole(groupId.value, userId, role)
    toast.add({
      title: role === 'admin' ? '관리자로 변경되었습니다' : '멤버로 변경되었습니다',
      color: 'success',
    })
  } catch (err) {
    toast.add({
      title: '역할 변경 실패',
      description: err instanceof Error ? err.message : '알 수 없는 오류',
      color: 'error',
    })
  }
}

const memberToRemove = ref<{ userId: string; displayName: string } | null>(null)
const showRemoveConfirm = ref(false)

function handleRemoveMember(userId: string, displayName: string) {
  memberToRemove.value = { userId, displayName }
  showRemoveConfirm.value = true
}

async function confirmRemoveMember() {
  if (!memberToRemove.value) return
  try {
    await groupStore.removeMember(groupId.value, memberToRemove.value.userId)
    if (group.value) {
      group.value = { ...group.value, memberCount: group.value.memberCount - 1 }
    }
    toast.add({
      title: `${memberToRemove.value.displayName}님이 강퇴되었습니다`,
      color: 'success',
    })
  } catch (err) {
    toast.add({
      title: '강퇴 실패',
      description: err instanceof Error ? err.message : '알 수 없는 오류',
      color: 'error',
    })
  } finally {
    showRemoveConfirm.value = false
    memberToRemove.value = null
  }
}

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
  if (isAdmin.value) {
    const otherAdmins = groupStore.groupMembers.filter(
      m => m.role === 'admin' && m.userId !== user.value?.uid,
    )
    const isLastMember = groupStore.groupMembers.length <= 1

    if (isLastMember) {
      // 유일한 멤버 → 그룹 삭제
      try {
        await groupStore.deleteGroup(groupId.value)
        toast.add({
          title: '그룹이 삭제되었습니다',
          description: '마지막 멤버가 탈퇴하여 그룹이 삭제되었습니다.',
          color: 'info',
        })
        router.push('/groups')
      } catch (err) {
        toast.add({
          title: '삭제 실패',
          description: err instanceof Error ? err.message : '알 수 없는 오류',
          color: 'error',
        })
      }
      return
    }

    if (otherAdmins.length === 0) {
      // 다른 멤버는 있지만 다른 관리자가 없음
      toast.add({
        title: '탈퇴할 수 없습니다',
        description: '유일한 관리자는 탈퇴할 수 없습니다. 다른 멤버에게 관리자를 위임해주세요.',
        color: 'warning',
      })
      return
    }
  }
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
