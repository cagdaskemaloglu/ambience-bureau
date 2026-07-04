'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'

export function ContactForm() {
  const locale = useLocale()
  const tr = locale === 'tr'

  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, locale }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? (tr ? 'Bir hata oluştu.' : 'An error occurred.'))
      } else {
        setSuccess(true)
        setForm({ name: '', email: '', subject: '', message: '' })
      }
    } catch {
      setError(tr ? 'Bağlantı hatası.' : 'Connection error.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="border border-bureau-amber bg-bureau-amber/5 p-6 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bureau-amber opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-bureau-amber" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-bureau-amber">
            {tr ? 'İletim Onaylandı' : 'Transmission Confirmed'}
          </span>
        </div>
        <p className="text-[13px] text-bureau-muted">
          {tr
            ? 'Mesajınız alındı. En kısa sürede yanıt vereceğiz.'
            : 'Your message has been received. We will respond shortly.'}
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 font-mono text-[10px] uppercase tracking-wider text-bureau-muted underline hover:text-bureau-black"
        >
          {tr ? 'Yeni mesaj gönder' : 'Send another message'}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Ad Soyad + E-posta */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">
            {tr ? 'Ad Soyad' : 'Full Name'} <span className="text-bureau-amber">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border border-bureau-black bg-white px-3 py-2.5 font-mono text-[12px] outline-none transition-colors focus:border-bureau-amber"
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">
            {tr ? 'E-posta' : 'Email'} <span className="text-bureau-amber">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border border-bureau-black bg-white px-3 py-2.5 font-mono text-[12px] outline-none transition-colors focus:border-bureau-amber"
          />
        </div>
      </div>

      {/* Konu */}
      <div>
        <label className="mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">
          {tr ? 'Konu' : 'Subject'}
        </label>
        <input
          type="text"
          name="subject"
          value={form.subject}
          onChange={handleChange}
          className="w-full border border-bureau-black bg-white px-3 py-2.5 font-mono text-[12px] outline-none transition-colors focus:border-bureau-amber"
        />
      </div>

      {/* Mesaj */}
      <div>
        <label className="mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">
          {tr ? 'Mesaj' : 'Message'} <span className="text-bureau-amber">*</span>
        </label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          required
          rows={5}
          className="w-full border border-bureau-black bg-white px-3 py-2.5 font-mono text-[12px] outline-none transition-colors focus:border-bureau-amber resize-none"
        />
      </div>

      {error && (
        <p className="border border-red-300 bg-red-50 px-3 py-2 text-[11px] text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-bureau w-full disabled:opacity-50 sm:w-auto sm:px-10"
      >
        {loading
          ? (tr ? 'Gönderiliyor...' : 'Sending...')
          : (tr ? 'Mesajı Gönder' : 'Send Message')}
      </button>
    </form>
  )
}