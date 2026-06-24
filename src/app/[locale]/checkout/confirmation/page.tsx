import { Suspense } from 'react'
import { ConfirmationContent } from './ConfirmationContent'

export default function CheckoutConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmationContent />
    </Suspense>
  )
}
