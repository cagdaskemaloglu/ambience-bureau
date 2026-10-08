/**
 * KULLANILMIYOR — iyzico anlaşması sona erdi, ödeme altyapısı PayTR'ye
 * taşındı. Bu route artık hiçbir yerden çağrılmıyor (checkout/route.ts
 * artık PayTR'nin merchant_ok_url/merchant_fail_url'lerini kullanıyor,
 * asıl sipariş onaylama mantığı /api/checkout/paytr-notify/route.ts'e
 * taşındı).
 *
 * Bu dosyayı GÜVENLE SİLEBİLİRSİNİZ. Referans/arşiv amacıyla şimdilik
 * burada bırakıldı — silmeye hazır olduğunuzda bu klasörü
 * (src/app/api/checkout/callback/) tamamen kaldırabilirsiniz.
 */
export async function POST() {
  return new Response('Bu uç nokta artık kullanılmıyor (PayTR\'ye geçildi).', { status: 410 })
}
