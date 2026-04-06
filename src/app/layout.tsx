import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import '@/styles/tailwind.css'
import Header from '@/components/layout/Header'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: '한경매거진앤북 AI 업무활용TIP',
  description: '팀원들이 직접 작성한 실무 중심 가이드를 확인해보세요',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={`${outfit.variable} ${inter.variable}`}>
      <body className="font-outfit bg-[#F9FAFB] text-[#111827]">
        {/* Client-side Header */}
        <Header />

        <main className="min-h-screen">
          {children}
        </main>

        {/* Footer - 피그마 디자인 반영 */}
        <footer className="bg-[#0F172A] text-white py-16 px-6">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">✦</div>
                <h3 className="font-bold text-xl tracking-tight">한경매거진앤북 AI업무TIP 아카이브</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                우리만의 AI 활용 노하우를 한 곳에.<br />
                실무에서 검증된 가이드로 업무 효율을 높이세요!
              </p>
            </div>
            <div className="flex flex-col md:items-end justify-between">
              <div className="text-right">
                <h4 className="font-bold mb-4 opacity-50 text-sm tracking-widest uppercase">문의하기</h4>
                <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
                  <span className="text-sm">juhye94@hankyung.com</span>
                  <button className="p-1 hover:bg-white/10 rounded"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 012-2v-8a2 2 0 01-2-2h-8a2 2 0 01-2 2v8a2 2 0 012 2z" /></svg></button>
                </div>
              </div>
              <p className="mt-8 text-xs text-gray-500">© 2026 AI Guideline Archive. All Rights Reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
