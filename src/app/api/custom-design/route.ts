import { NextResponse } from 'next/server'
import { saveCustomDesign } from '@/lib/supabase/queries'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { CustomDesignData } from '@/types/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { collectionKey, designData, totalPrice, guestSessionId, snapshotUrl } = body as {
      collectionKey: string
      designData: CustomDesignData
      totalPrice: number // TRY, tam sayı (kuruş değil, ana birim — basitlik için)
      guestSessionId?: string
      snapshotUrl?: string
    }

    if (!collectionKey || !designData) {
      return NextResponse.json(
        { error: 'collectionKey ve designData zorunludur.' },
        { status: 400 }
      )
    }

    // Giriş yapmış kullanıcı varsa session'dan al
    const supabase = await createSupabaseServerClient()
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id ?? null

    const design = await saveCustomDesign({
      userId,
      guestSessionId: userId ? null : guestSessionId,
      collectionKey,
      designData,
      totalPrice: Math.round(totalPrice * 100), // ana birim → kuruş
      snapshotUrl,
    })

    return NextResponse.json({ design }, { status: 201 })
  } catch (error) {
    console.error('[custom-design API] Kayıt hatası:', error)
    return NextResponse.json(
      { error: 'Tasarım kaydedilemedi. Lütfen tekrar deneyin.' },
      { status: 500 }
    )
  }
}
