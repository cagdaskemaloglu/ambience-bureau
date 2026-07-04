import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const TO_EMAIL = process.env.CONTACT_EMAIL ?? 'ambiencebureau@gmail.com'

export async function POST(request: Request) {
  try {
    const { name, email, subject, message, locale } = await request.json()

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: locale === 'tr' ? 'Lütfen zorunlu alanları doldurun.' : 'Please fill in required fields.' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: locale === 'tr' ? 'Geçersiz e-posta adresi.' : 'Invalid email address.' },
        { status: 400 }
      )
    }

    const { error } = await resend.emails.send({
      from: 'The Ambience Bureau <onboarding@resend.dev>',
      to: TO_EMAIL,
      replyTo: email,
      subject: subject?.trim()
        ? `[TAB İletişim] ${subject}`
        : `[TAB İletişim] ${name} tarafından mesaj`,
      html: `
        <div style="font-family: monospace; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #1a1a1a;">
          <div style="background: #1a1a1a; color: #fff; padding: 12px 16px; margin-bottom: 24px;">
            <span style="font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.6;">
              FORM 300-A // INCOMING TRANSMISSION
            </span>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr style="border-bottom: 1px solid #e5e5e5;">
              <td style="padding: 10px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; width: 30%;">Gönderen</td>
              <td style="padding: 10px 0; font-size: 13px;">${name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e5e5;">
              <td style="padding: 10px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #888;">E-posta</td>
              <td style="padding: 10px 0; font-size: 13px;"><a href="mailto:${email}" style="color: #1a1a1a;">${email}</a></td>
            </tr>
            ${subject ? `<tr style="border-bottom: 1px solid #e5e5e5;">
              <td style="padding: 10px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #888;">Konu</td>
              <td style="padding: 10px 0; font-size: 13px;">${subject}</td>
            </tr>` : ''}
          </table>

          <div style="border: 1px solid #e5e5e5; padding: 16px; background: #fafafa;">
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin: 0 0 12px 0;">Mesaj</p>
            <p style="font-size: 13px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e5e5;">
            <span style="font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: #bbb;">
              The Ambience Bureau // Regulation of Spatial Photons // Est. 2026
            </span>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('[contact] Resend error:', error)
      return NextResponse.json(
        { error: locale === 'tr' ? 'Mesaj gönderilemedi.' : 'Message could not be sent.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('[contact]', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}