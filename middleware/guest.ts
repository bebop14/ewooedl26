export default defineNuxtRouteMiddleware(async () => {
  const auth = useFirebaseAuth()
  if (!auth) return

  const user = await getCurrentUser(auth)
  if (user) return navigateTo('/')
})
