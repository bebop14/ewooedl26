<template>
  <UApp>
    <UHeader v-if="user" to="/">
      <template #title>
        <span class="hidden sm:inline">EDL 이우애용 2026 오운완</span>
        <span class="sm:hidden">EDL 오운완</span>
      </template>

      <UNavigationMenu :items="navItems" />

      <template #right>
        <!-- 데스크톱: 그룹 선택 + 사용자 메뉴 -->
        <div class="hidden sm:flex items-center gap-2">
          <GroupSelector />
          <UDropdownMenu :items="userMenuItems">
            <UButton variant="ghost" class="gap-2">
              <UAvatar
                :src="user.photoURL || undefined"
                :alt="user.displayName || '사용자'"
                size="2xs"
              />
              <span>{{ user.displayName || '사용자' }}</span>
              <UIcon name="i-lucide-chevron-down" class="size-4" />
            </UButton>
          </UDropdownMenu>
        </div>
        <!-- 모바일: 아바타만 표시 -->
        <UAvatar
          :src="user.photoURL || undefined"
          :alt="user.displayName || '사용자'"
          size="sm"
          class="sm:hidden"
        />
      </template>

      <template #body>
        <!-- 모바일 메뉴: 그룹 선택 -->
        <div class="px-2 py-3">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">그룹 선택</p>
          <GroupSelector />
        </div>
        <USeparator class="my-2" />
        <UNavigationMenu :items="navItems" orientation="vertical" class="w-full" />
        <USeparator class="my-4" />
        <UNavigationMenu :items="mobileUserMenuItems" orientation="vertical" class="w-full" />
      </template>
    </UHeader>

    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
import { signOut } from 'firebase/auth'

const auth = useFirebaseAuth()
const user = useCurrentUser()
const userStore = useUserStore()

const navItems = [
  { label: '대시보드', to: '/', icon: 'i-lucide-layout-dashboard' },
  { label: '순위', to: '/ranking', icon: 'i-lucide-trophy' },
  { label: '인증샷', to: '/gallery', icon: 'i-lucide-image' },
  { label: '캘린더', to: '/calendar', icon: 'i-lucide-calendar' },
  { label: '통계', to: '/stats', icon: 'i-lucide-chart-line' },
  { label: '그룹', to: '/groups', icon: 'i-lucide-users' },
]

const userMenuItems = computed(() => {
  const items: any[] = [
    {
      label: '내 프로필',
      icon: 'i-lucide-user',
      to: user.value ? `/profile/${user.value.uid}` : undefined,
    },
  ]
  if (userStore.isAdmin) {
    items.push({
      label: '관리자',
      icon: 'i-lucide-shield',
      to: '/admin',
    })
  }
  items.push({
    label: '로그아웃',
    icon: 'i-lucide-log-out',
    onSelect: () => handleSignOut(),
  })
  return [items]
})

const mobileUserMenuItems = computed(() => {
  const items: any[] = [
    {
      label: '내 프로필',
      icon: 'i-lucide-user',
      to: user.value ? `/profile/${user.value.uid}` : undefined,
    },
  ]
  if (userStore.isAdmin) {
    items.push({
      label: '관리자',
      icon: 'i-lucide-shield',
      to: '/admin',
    })
  }
  items.push({
    label: '로그아웃',
    icon: 'i-lucide-log-out',
    onSelect: () => handleSignOut(),
  })
  return items
})

// 로그인된 사용자의 프로필을 자동 로드 (관리자 메뉴 표시 등에 필요)
watch(user, async (u) => {
  if (u && !userStore.userProfile) {
    await userStore.loadUserProfile(u.uid)
  }
}, { immediate: true })

const handleSignOut = async () => {
  if (auth) {
    await signOut(auth)
    await navigateTo('/login')
  }
}
</script>
