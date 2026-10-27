import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { countryName, isValidAlpha2 } from '@/lib/countries'

const resend = new Resend(process.env.RESEND_API_KEY)
const TO_EMAIL = process.env.CONTACT_EMAIL ?? 'ambiencebureau@gmail.com'

const MAX = { short: 200, url: 400, message: 4000 }
const DISCIPLINES = ['lighting', 'industrial', 'product3d', 'interior', 'other']

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

export async function POST(request: Request) {
  try {
    // Başvuru göndermek için üyelik ŞART.
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const tr = body.locale === 'tr'
    const type = body.type === 'hub' || body.type === 'creator' ? (body.type as 'hub' | 'creator') : null
    if (!type) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const name = str(body.name, MAX.short)
    const email = str(body.email, MAX.short)
    const phone = str(body.phone, 50)
    const message = str(body.message, MAX.message)
    const country = str(body.country, 2).toUpperCase()

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: tr ? 'Lütfen zorunlu alanları doldurun.' : 'Please fill in required fields.' },
        { status: 400 }
      )
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: tr ? 'Geçersiz e-posta adresi.' : 'Invalid email address.' },
        { status: 400 }
      )
    }
    if (type === 'hub' && !isValidAlpha2(country)) {
      return NextResponse.json(
        { error: tr ? 'Lütfen başvuru ülkesini seçin.' : 'Please select a country.' },
        { status: 400 }
      )
    }
    const validCountry = country && isValidAlpha2(country) ? country : null

    const details: Record<string, string> =
      type === 'hub'
        ? { city: str(body.city, MAX.short), organization: str(body.organization, MAX.short) }
        : {
            discipline: DISCIPLINES.includes(body.discipline) ? body.discipline : 'other',
            portfolioUrl: str(body.portfolioUrl, MAX.url),
          }

    // 1) Veritabanına kaydet. `applications` tablosu henüz oluşturulmadıysa
    //    (bkz. supabase/applications.sql) başvuru yine de e-postayla ulaşır.
    const { error: dbError } = await (supabase as any).from('applications').insert({
      user_id: user.id,
      type,
      country: validCountry,
      name,
      email,
      phone: phone || null,
      message,
      details,
      locale: tr ? 'tr' : 'en',
    })
    if (dbError) console.error('[apply] DB insert failed (e-posta yine de gönderilecek):', dbError)

    // 2) Büroya e-posta bildirimi.
    const typeLabel = type === 'hub' ? 'Bölge Bürosu' : 'Tasarım Departmanı'
    const countryLabel = validCountry ? countryName(validCountry, 'tr') : '—'
    const rows: [string, string][] = [
      ['Başvuru', typeLabel],
      ['Ülke', countryLabel],
      ['Ad Soyad', name],
      ['E-posta', email],
      ['Telefon', phone || '—'],
      ['Üye ID', user.id],
      ...Object.entries(details).map(([k, v]) => [k, v || '—'] as [string, string]),
    ]

    const { error: mailError } = await resend.emails.send({
      from: 'The Ambience Bureau <onboarding@resend.dev>',
      to: TO_EMAIL,
      replyTo: email,
      subject: `[TAB Başvuru] ${typeLabel} — ${countryLabel} — ${name}`,
      html: `
        <div style="font-family: monospace; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #1a1a1a;">
          <div style="background: #1a1a1a; color: #fff; padding: 12px 16px; margin-bottom: 24px;">
            <span style="font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.6;">
              FORM 400 // ${type === 'hub' ? 'REGIONAL OFFICE' : 'DESIGN DEPARTMENT'} APPLICATION
            </span>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            ${rows
              .map(
                ([k, v]) => `<tr style="border-bottom: 1px solid #e5e5e5;">
              <td style="padding: 10px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; width: 30%;">${esc(k)}</td>
              <td style="padding: 10px 0; font-size: 13px;">${esc(v)}</td>
            </tr>`
              )
              .join('')}
          </table>
          <div style="border: 1px solid #e5e5e5; padding: 16px; background: #fafafa;">
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin: 0 0 12px 0;">Mesaj</p>
            <p style="font-size: 13px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${esc(message)}</p>
          </div>
        </div>
      `,
    })

    if (mailError) {
      console.error('[apply] Resend error:', mailError)
      // DB'ye yazıldıysa başvuru kaybolmadı — kullanıcıya hata göstermeyelim.
      if (dbError) {
        return NextResponse.json(
          { error: tr ? 'Başvuru gönderilemedi.' : 'Application could not be sent.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('[apply]', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
