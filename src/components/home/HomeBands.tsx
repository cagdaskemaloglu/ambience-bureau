import { Link } from '@/i18n/navigation'

/**
 * §3 Özel Tahsis ve §4 Kontrol Protokolü — anasayfanın kapanış bantları.
 * İki sütunlu, sade "madde" blokları; birincil eylem btn-file.
 */
export function CustomAllocationBand({ locale }: { locale: string }) {
  const tr = locale === 'tr'
  return (
    <div className="grid gap-6 px-5 py-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:px-9 md:py-10">
      <div className="max-w-[62ch] space-y-3">
        <p className="text-[15px] leading-relaxed text-bureau-muted md:text-[17px]">
          {tr
            ? 'Taban, gövde ve başlık parçalarını seçin; malzemeyi ve rengi belirleyin. Tasarımınız 3D olarak doğrulanır, numaralandırılır ve kendi sicil kaydıyla üretilir.'
            : 'Choose a base, body and head; set the material and colour. Your design is verified in 3D, numbered and produced with its own registry record.'}
        </p>
        <p className="font-mono text-[11px] uppercase tracking-wider text-bureau-subtle">
          {tr ? 'Form 104-B · Özel konfigürasyon talebi' : 'Form 104-B · Custom configuration request'}
        </p>
      </div>
      <Link href="/custom-registry" className="btn-file btn-file-amber focus-bureau self-start md:self-end">
        <span>{tr ? 'Konfigüratörü aç' : 'Open the configurator'}</span>
      </Link>
    </div>
  )
}

export function ControlProtocolBand({ locale }: { locale: string }) {
  const tr = locale === 'tr'
  return (
    <div className="grid gap-6 px-5 py-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:px-9 md:py-10">
      <p className="max-w-[62ch] text-[15px] leading-relaxed text-bureau-muted md:text-[17px]">
        {tr
          ? 'Akıllı nesneler Ambience Bureau uygulamasıyla yönetilir: renk, parlaklık, efekt, uyku modu ve otomasyon. Uygulama lambayla doğrudan ev ağınız üzerinden konuşur; hiçbir veri sunucuya gönderilmez.'
          : 'Smart objects are managed with the Ambience Bureau app: colour, brightness, effects, sleep mode and automation. The app talks to the lamp directly over your home network; no data is sent to a server.'}
      </p>
      <Link href="/control-protocol" className="btn-file focus-bureau self-start md:self-end">
        <span>{tr ? 'Protokolü incele' : 'Read the protocol'}</span>
      </Link>
    </div>
  )
}
