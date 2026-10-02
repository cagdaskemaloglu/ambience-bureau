import { useEffect, useState } from 'react'
import { useClient, useFormValue, type StringFieldProps } from 'sanity'
import { Card, Stack, Text } from '@sanity/ui'

/**
 * `registryNo` alanının ALTINA, seçili Drop'a göre canlı bir ipucu ekler:
 * "Bu Drop'ta şu an N ürün kayıtlı, sıradaki (N+1). ürün olur, planlanan
 * toplam: Y — örn. 00N+1/0Y". ALAN YİNE TAMAMEN ELLE GİRİLİR — bu SADECE
 * bilgilendirici bir ipucu, hiçbir otomatik doldurma/yazma yapmaz (bkz.
 * proje notu: admin bu alanı kendi girer, biz sadece "şu an sırada ne var"
 * diye gösteririz — tam otomatik doldurma BİLİNÇLİ olarak tercih edilmedi).
 *
 * Satın alma sonrası KOD TARAFINDAN otomatik oluşturulan ürünlerde bu alan
 * zaten programatik olarak dolduruluyor — bu bileşen sadece Studio'dan
 * ELLE ürün ekleyen admin için bir kolaylık.
 */
export function RegistryNoHint(props: StringFieldProps) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const dropRef = useFormValue(['drop']) as { _ref?: string } | undefined
  const currentId = useFormValue(['_id']) as string | undefined
  const [hint, setHint] = useState<React.ReactNode>(null)

  useEffect(() => {
    if (!dropRef?._ref) {
      setHint(null)
      return
    }
    let cancelled = false

    client
      .fetch<{ count: number; planned: number | null; dropName: string | null }>(
        `{
          "count": count(*[_type == "product" && drop._ref == $dropId && _id != $currentId && !(_id in path("drafts.**"))]),
          "planned": *[_type == "drop" && _id == $dropId][0].plannedQuantity,
          "dropName": *[_type == "drop" && _id == $dropId][0].dropNo
        }`,
        { dropId: dropRef._ref, currentId: (currentId ?? '').replace(/^drafts\./, '') }
      )
      .then((res) => {
        if (cancelled) return
        const nextSeq = (res.count ?? 0) + 1
        const seqPadded = String(nextSeq).padStart(3, '0')
        if (res.planned) {
          const totalPadded = String(res.planned).padStart(3, '0')
          setHint(
            <>
              Drop-{res.dropName ?? '?'}&apos;de şu an <strong>{res.count}</strong> ürün kayıtlı. Sıradaki muhtemelen{' '}
              <strong>{nextSeq}.</strong> ürün — ör. <strong>{seqPadded}/{totalPadded}</strong> yazabilirsiniz
              (planlanan toplam: {res.planned}).
            </>
          )
        } else {
          setHint(
            <>
              Drop-{res.dropName ?? '?'}&apos;de şu an <strong>{res.count}</strong> ürün kayıtlı (sıradaki {nextSeq}.
              olur) — ama bu Drop&apos;ta henüz &quot;Planlanan Satış Adedi&quot; girilmemiş, paydayı siz
              belirleyin.
            </>
          )
        }
      })
      .catch(() => setHint(null))

    return () => {
      cancelled = true
    }
  }, [client, dropRef?._ref, currentId])

  return (
    <Stack space={2}>
      {props.renderDefault(props)}
      {hint && (
        <Card padding={2} radius={2} tone="primary" border>
          <Text size={1}>{hint}</Text>
        </Card>
      )}
    </Stack>
  )
}
