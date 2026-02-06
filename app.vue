<template>
  <UApp>
    <UHeader v-if="user" title="EDL 이우애용 2026 오운완" to="/">
      <UNavigationMenu :items="navItems" />

      <template #right>
        <UDropdownMenu :items="userMenuItems">
          <UButton
            :avatar="{ src: user.photoURL || undefined, alt: user.displayName || '사용자' }"
            :label="user.displayName || '사용자'"
            variant="ghost"
            trailing-icon="i-lucide-chevron-down"
          />
        </UDropdownMenu>
      </template>

      <template #body>
        <UNavigationMenu :items="navItems" orientation="vertical" class="w-full" />
        <UDivider class="my-4" />
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
  { label: '갤러리', to: '/gallery', icon: 'i-lucide-image' },
  { label: '캘린더', to: '/calendar', icon: 'i-lucide-calendar' },
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
