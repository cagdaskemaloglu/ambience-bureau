import type { Config } from 'tailwindcss'

const config: Config = {
  // Karanlık/aydınlık mod, <html> elemanına eklenen/kaldırılan "dark"
  // class'ına göre çalışır (bkz. src/components/theme/ThemeProvider.tsx).
  // Sistem tercihine (prefers-color-scheme) bırakmıyoruz, çünkü kullanıcının
  // elle seçtiği tercihi (localStorage) korumamız gerekiyor.
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core palette — The Ambience Bureau
        // DEĞERLER globals.css'teki CSS custom property'lerinden (:root ve
        // .dark) geliyor — burada sabit hex YOK, böylece karanlık modda
        // tüm bureau-* class'ları (bg-bureau-black, text-bureau-muted, vb.)
        // otomatik olarak doğru renge döner. "/opacity" modifier'ları
        // (bg-bureau-amber/5 gibi) çalışsın diye rgb() + <alpha-value>
        // kalıbı kullanılıyor — Tailwind'in resmi CSS-variable yöntemi.
        bureau: {
          white:   'rgb(var(--bureau-white) / <alpha-value>)',
          black:   'rgb(var(--bureau-black) / <alpha-value>)',
          ink:     'rgb(var(--bureau-ink) / <alpha-value>)',
          muted:   'rgb(var(--bureau-muted) / <alpha-value>)',
          subtle:  'rgb(var(--bureau-subtle) / <alpha-value>)',
          rule:    'rgb(var(--bureau-rule) / <alpha-value>)',
          surface: 'rgb(var(--bureau-surface) / <alpha-value>)',
          amber:   'rgb(var(--bureau-amber) / <alpha-value>)', // the only warm accent — light itself
          'amber-dim': 'rgb(var(--bureau-amber-dim) / <alpha-value>)',
        },
        // SABİT (tema DEĞİŞTİRMEZ) paleti — aynı hex değerler, ama CSS
        // değişkenine değil doğrudan sabit renge bağlı. Karanlık modda da
        // aynı kalması gereken köşeler için (şu an: DropRow.tsx'teki siyah
        // Drop etiket paneli ve anasayfa Drop bölümünün geri kalanı —
        // "karanlık modda drop kısmının renkleri aynı kalsın" isteği).
        // YENİ bir yer için bunu kullanmadan önce iki kez düşünün: normal
        // `bureau-*` tema ile birlikte değişmeli, sadece BİLİNÇLİ olarak
        // sabit kalması gereken tasarım kararlarında `bureau-fixed-*` kullanın.
        'bureau-fixed': {
          black: '#000000',
          rule: '#E0E0E0',
          muted: '#666666',
          surface: '#FAFAFA',
          amber: '#E6792E',
        },
        // Karanlık modda "Space Blue"/"Space Gray" olması istenen üç özel
        // çizgi. ÖNEMLİ: her biri KENDİ CSS değişkenine bağlı, TEK bir
        // class — light/dark değerini `globals.css`'teki :root/.dark
        // bloklarında kendi içinde taşıyor. Bunu BİLEREK `bureau-fixed-*
        // dark:bureau-dark-line-*` gibi İKİ AYRI class'ı karıştırarak değil,
        // tek class olarak kurduk: iki farklı renk class'ını aynı özellikte
        // (border-color) karıştırmak, Tailwind'in derlediği CSS'te hangisinin
        // kazanacağını sıralamaya bırakır — garanti değildir. Tek class,
        // garanti sonuç.
        'bureau-line': {
          // Header altı / footer üstü DÜZ çizgi — ışıkta siyah, karanlıkta Space Blue.
          header: 'rgb(var(--bureau-line-header) / <alpha-value>)',
          // Drop isimlerinin altındaki KESİKLİ çizgi — ışıkta gri, karanlıkta Space Gray.
          dashed: 'rgb(var(--bureau-line-dashed) / <alpha-value>)',
        },
        // Drop panelinin kenarlığı/arka planı — ışıkta siyah, karanlıkta
        // sayfanın gerçek koyu-mod arka planıyla (#0D0D0D) birebir eşleşir.
        'bureau-panel-edge': 'rgb(var(--bureau-panel-edge) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'monospace'],
      },
      letterSpacing: {
        bureau:   '0.08em',
        wide:     '0.12em',
        wider:    '0.18em',
        widest:   '0.25em',
      },
      borderWidth: {
        DEFAULT: '1px',
      },
    },
  },
  plugins: [],
}

export default config
