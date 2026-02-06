export default defineNuxtRouteMiddleware(async () => {
  const auth = useFirebaseAuth()
  if (!auth) return navigateTo('/login')

  const user = await getCurrentUser(auth)
  if (!user) return navigateTo('/login')
})
