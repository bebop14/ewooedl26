<template>
  <UApp>
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-default focus:text-highlighted focus:rounded-md focus:ring-2 focus:ring-primary"
    >메인 콘텐츠로 이동</a>
    <UHeader v-if="user" to="/">
      <template #title>
        <span class="hidden sm:inline">EDL 이우애용 2026 오운완</span>
        <span class="sm:hidden">EDL 오운완</span>
      </template>

      <UNavigationMenu :items="navItems" />

      <template #right>
        <!-- 데스크톱: 운동 기록 + 그룹 선택 + 사용자 메뉴 -->
        <div class="hidden sm:flex items-center gap-2">
          <UButton
            to="/workouts/new"
            icon="i-lucide-plus"
            label="기록하기"
            size="sm"
          />
          <GroupSelector />
          <UDropdownMenu :items="userMenuItems">
            <UButton variant="ghost" class="gap-2">
              <UAvatar
                :src="user.photoURL || undefined"
                :alt="user.displayName || '사용자'"
                size="2xs"
              />
              <span>{{ user.displayName || '사용자' }}</span>
              <UIcon name="i-lucide-chevron-down" class="size-4" aria-hidden="true" />
            </UButton>
          </UDropdownMenu>
        </div>
        <!-- 모바일: 아바타 탭 시 사용자 메뉴(프로필/관리자/로그아웃) -->
        <UDropdownMenu :items="userMenuItems" class="sm:hidden">
          <UButton variant="ghost" color="neutral" class="p-1" aria-label="사용자 메뉴">
            <UAvatar
              :src="user.photoURL || undefined"
              :alt="user.displayName || '사용자'"
              size="sm"
            />
          </UButton>
        </UDropdownMenu>
      </template>

      <template #body>
        <!-- 모바일 메뉴: 그룹 선택 -->
        <div class="px-2 py-3">
          <p class="text-sm text-muted mb-2">그룹 선택</p>
          <GroupSelector />
        </div>
        <USeparator class="my-2" />
        <UNavigationMenu :items="navItems" orientation="vertical" class="w-full" />
      </template>
    </UHeader>

    <main id="main-content">
      <NuxtPage />
    </main>

    <!-- 모바일 FAB: 운동 기록하기 -->
    <NuxtLink
      v-if="user"
      to="/workouts/new"
      class="fixed bottom-6 right-6 z-50 sm:hidden"
    >
      <UButton
        icon="i-lucide-plus"
        size="xl"
        class="rounded-full shadow-lg"
      />
    </NuxtLink>
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
