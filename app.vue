<template>
  <UApp>
    <UHeader v-if="user" title="EDL 이우애용 2026 오운완" to="/">
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
          class="sm:hidden mr-2"
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

const navItems = [
  { label: '대시보드', to: '/', icon: 'i-lucide-layout-dashboard' },
  { label: '순위', to: '/ranking', icon: 'i-lucide-trophy' },
  { label: '인증샷', to: '/gallery', icon: 'i-lucide-image' },
  { label: '캘린더', to: '/calendar', icon: 'i-lucide-calendar' },
  { label: '그룹', to: '/groups', icon: 'i-lucide-users' },
]

const userMenuItems = computed(() => [[
  {
    label: '내 프로필',
    icon: 'i-lucide-user',
    to: user.value ? `/profile/${user.value.uid}` : undefined,
  },
  {
    label: '로그아웃',
    icon: 'i-lucide-log-out',
    onSelect: () => handleSignOut()
  }
]])

const mobileUserMenuItems = computed(() => [
  {
    label: '내 프로필',
    icon: 'i-lucide-user',
    to: user.value ? `/profile/${user.value.uid}` : undefined,
  },
  {
    label: '로그아웃',
    icon: 'i-lucide-log-out',
    click: () => handleSignOut()
  }
])

const handleSignOut = async () => {
  if (auth) {
    await signOut(auth)
    await navigateTo('/login')
  }
}
</script>
