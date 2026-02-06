<template>
  <UContainer class="py-8">
    <div v-if="loading" class="flex justify-center py-24">
      <UIcon name="i-lucide-loader-circle" class="text-4xl animate-spin text-muted" />
    </div>

    <div v-else-if="profile">
      <!-- 프로필 헤더 -->
      <UCard class="mb-6">
        <!-- 보기 모드 -->
        <template v-if="!editing">
          <div class="flex items-center gap-6">
            <UAvatar :src="profile.photoURL || undefined" :alt="profile.displayName" size="xl" />
            <div class="flex-1">
              <h1 class="text-2xl font-bold">{{ profile.displayName }}</h1>
              <p class="text-sm text-muted">{{ profile.email }}</p>
              <UBadge :label="providerLabel" variant="subtle" class="mt-2" />
              <p class="text-xs text-muted mt-1">
                가입일: {{ formattedDate }}
              </p>
            </div>
            <UButton
              v-if="isOwnProfile"
              icon="i-lucide-pencil"
              label="편집"
              variant="outline"
              size="sm"
              @click="startEditing"
            />
          </div>
        </template>

        <!-- 편집 모드 -->
        <template v-else>
          <div class="space-y-4">
            <!-- 프로필 이미지 변경 -->
            <div class="flex items-center gap-4">
              <div class="relative">
                <UAvatar
                  :src="imagePreview || editForm.photoURL || undefined"
                  :alt="editForm.displayName"
                  size="xl"
                />
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
                <p class="text-sm text-muted">프로필 사진을 변경하려면 이미지를 클릭하세요</p>
              </div>
            </div>

            <!-- 이름 변경 -->
            <UFormField label="이름" class="max-w-xs">
              <UInput v-model="editForm.displayName" placeholder="이름을 입력하세요" />
            </UFormField>

            <!-- 버튼 -->
            <div class="flex gap-2 justify-end">
              <UButton label="취소" variant="outline" @click="cancelEditing" />
              <UButton
                label="저장"
                icon="i-lucide-check"
                :loading="saving"
                :disabled="!isFormValid"
                @click="saveProfile"
              />
            </div>
          </div>
        </template>
      </UCard>

      <!-- 운동 통계 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UCard>
          <div class="text-center">
            <UIcon name="i-lucide-flame" class="text-2xl text-blue-500 mb-2" />
            <p class="text-xs text-muted">총 운동</p>
            <p class="text-2xl font-bold">{{ profile.stats.totalWorkouts }}회</p>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <UIcon name="i-lucide-zap" class="text-2xl text-green-500 mb-2" />
            <p class="text-xs text-muted">연속 운동</p>
            <p class="text-2xl font-bold">{{ profile.stats.currentStreak }}일</p>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <UIcon name="i-lucide-trophy" class="text-2xl text-amber-500 mb-2" />
            <p class="text-xs text-muted">최장 연속</p>
            <p class="text-2xl font-bold">{{ profile.stats.longestStreak }}일</p>
          </div>
        </UCard>
      </div>
    </div>

    <div v-else>
      <UEmpty
        icon="i-lucide-user-x"
        title="프로필을 찾을 수 없습니다"
        description="존재하지 않는 사용자입니다."
        :actions="[{ label: '홈으로 돌아가기', to: '/' }]"
      />
    </div>
  </UContainer>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const userStore = useUserStore()
const user = useCurrentUser()
const { uploadProfileImage, uploading } = useImageUpload()
const { userProfile: profile, loading } = storeToRefs(userStore)

const userId = route.params.id as string
const editing = ref(false)
const saving = ref(false)
const imagePreview = ref<string | null>(null)
const selectedFile = ref<File | null>(null)

const editForm = reactive({
  displayName: '',
  photoURL: '',
})

const isOwnProfile = computed(() => user.value?.uid === userId)

const isFormValid = computed(() => editForm.displayName.trim().length > 0)

const providerLabel = computed(() => {
  const providers: Record<string, string> = {
    'google.com': 'Google',
  }
  return providers[profile.value?.provider || ''] || profile.value?.provider || ''
})

const formattedDate = computed(() => {
  if (!profile.value?.createdAt) return ''
  return new Date(profile.value.createdAt).toLocaleDateString('ko-KR')
})

function startEditing() {
  if (!profile.value) return
  editForm.displayName = profile.value.displayName
  editForm.photoURL = profile.value.photoURL
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

async function saveProfile() {
  if (!isFormValid.value) return
  saving.value = true

  try {
    const updates: { displayName?: string; photoURL?: string } = {}

    if (editForm.displayName.trim() !== profile.value?.displayName) {
      updates.displayName = editForm.displayName.trim()
    }

    if (selectedFile.value) {
      updates.photoURL = await uploadProfileImage(selectedFile.value)
    }

    if (Object.keys(updates).length > 0) {
      await userStore.updateUserProfile(userId, updates)
    }

    cancelEditing()
  } catch (error) {
    console.error('Profile update error:', error)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  userStore.loadUserProfile(userId)
})
</script>
