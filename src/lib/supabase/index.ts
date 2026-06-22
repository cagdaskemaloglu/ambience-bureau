export { createSupabaseServerClient, createSupabaseAdminClient } from './server'
export { createSupabaseClient } from './client'
export {
  signUpWithEmail,
  signInWithEmail,
  signInWithMagicLink,
  signOut,
  getCurrentUser,
  getOrCreateGuestSessionId,
  clearGuestSessionId,
} from './auth'
export {
  saveCustomDesign,
  getCustomDesignById,
  createOrder,
  updateOrderStatus,
  getOrderByNumber,
  getOrdersByUserId,
} from './queries'
