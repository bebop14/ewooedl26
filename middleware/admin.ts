export default defineNuxtRouteMiddleware(async () => {
  const userStore = useUserStore()
  const user = useCurrentUser()

  if (!user.value) return navigateTo('/')

  if (!userStore.userProfile) {
    await userStore.loadUserProfile(user.value.uid)
  }

  if (!userStore.isAdmin) return navigateTo('/')
})
