<template>
  <UContainer class="py-8 max-w-2xl">
    <UCard>
      <template #header>
        <h1 class="text-xl font-bold">새 그룹 만들기</h1>
      </template>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- 그룹 이미지 -->
        <div>
          <label class="block text-sm font-medium mb-2">그룹 이미지 (선택)</label>
          <div class="flex items-center gap-4">
            <UAvatar
              :src="imagePreview || undefined"
              size="xl"
              :ui="{ fallback: 'bg-primary-100 text-primary-500' }"
            >
              <template #fallback>
                <UIcon name="i-lucide-users" class="text-2xl" />
              </template>
            </UAvatar>
            <div>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleFileSelect"
              />
              <UButton
                type="button"
                variant="outline"
                label="이미지 선택"
                icon="i-lucide-upload"
                @click="fileInput?.click()"
              />
            </div>
          </div>
        </div>

        <!-- 그룹명 -->
        <UFormField label="그룹명 *">
          <UInput
            v-model="form.name"
            placeholder="그룹 이름을 입력하세요"
            class="w-full"
          />
          <template #error>
            <span v-if="errors.name">{{ errors.name }}</span>
          </template>
        </UFormField>

        <!-- 설명 -->
        <UFormField label="그룹 설명">
          <UTextarea
            v-model="form.description"
            placeholder="그룹에 대한 설명을 입력하세요"
            :rows="4"
            class="w-full"
          />
        </UFormField>

        <!-- 제출 -->
        <div class="flex gap-2 justify-end">
          <UButton
            type="button"
            variant="outline"
            label="취소"
            @click="router.back()"
          />
          <UButton
            type="submit"
            label="그룹 만들기"
            icon="i-lucide-plus"
            :loading="submitting"
            :disabled="submitting"
          />
        </div>
      </form>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const router = useRouter()
const groupStore = useGroupStore()
const { uploadImage } = useImageUpload()
const toast = useToast()

const fileInput = ref<HTMLInputElement | null>(null)
const imagePreview = ref<string | null>(null)
const submitting = ref(false)

const form = reactive({
  name: '',
  description: '',
  imageFile: null as File | null,
})

const errors = reactive({
  name: '',
})

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    form.imageFile = file
    imagePreview.value = URL.createObjectURL(file)
  }
}

function validate(): boolean {
  errors.name = ''

  if (!form.name.trim()) {
    errors.name = '그룹 이름을 입력해주세요'
    return false
  }

  return true
}

async function handleSubmit() {
  if (!validate()) return

  submitting.value = true
  try {
    let imageUrl = ''

    // 이미지가 있으면 업로드
    if (form.imageFile) {
      const { imageUrl: uploadedUrl } = await uploadImage(form.imageFile, 'groups')
      imageUrl = uploadedUrl
    }

    const groupId = await groupStore.createGroup({
      name: form.name,
      description: form.description,
      imageFile: form.imageFile,
    }, imageUrl)

    toast.add({
      title: '그룹을 만들었습니다',
      color: 'success',
    })

    router.push(`/groups/${groupId}`)
  } catch (err) {
    toast.add({
      title: '그룹 생성 실패',
      description: err instanceof Error ? err.message : '알 수 없는 오류',
      color: 'error',
    })
  } finally {
    submitting.value = false
  }
}
</script>
