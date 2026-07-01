import { Suspense } from 'react'
import { ConfirmationContent } from './ConfirmationContent'

export const metadata = {
  title: 'Order Confirmed — The Ambience Bureau',
  robots: { index: false },
}

export default function CheckoutConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmationContent />
    </Suspense>
  )
}