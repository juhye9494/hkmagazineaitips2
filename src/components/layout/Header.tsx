'use client'

import * as React from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import LoginButton from '@/components/auth/LoginButton'
import { SearchModal } from '@/components/search/SearchModal'

export default function Header() {
  const router = useRouter()
  const supabase = createClient()
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)

  // 전역 단축키 및 커스텀 이벤트 설정
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 'k') || e.key === '/') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }
    const handleOpenSearch = () => setIsSearchOpen(true)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-search', handleOpenSearch)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-search', handleOpenSearch)
    }
  }, [])

  const handleCreateGuide = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      router.push('/posts/new')
    } else {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/posts/new`,
        },
      })
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/50">
        <nav className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex-1 text-sm font-semibold text-gray-500">
             {/* 로그인 버튼 또는 사용자 정보 */}
             <LoginButton />
          </div>
          
          <Link href="/" className="flex-[2] text-center text-xl font-bold tracking-tight text-[#111827]">
            한경매거진앤북 <span className="text-[#0056FF]">AI 업무 활용TIP</span>
          </Link>

          <div className="flex-1 flex justify-end items-center gap-4">
            <button 
              onClick={handleCreateGuide}
              className="hidden md:block px-6 py-2.5 bg-[#0056FF] text-white text-sm font-semibold rounded-full hover:bg-[#0046CC] transition-all shadow-lg shadow-blue-500/20"
            >
              나만의 가이드 공유하기
            </button>
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              title="검색 (Ctrl+K)"
            >
              <Search className="w-6 h-6" />
            </button>
          </div>
        </nav>
      </header>

      {/* 실시간 검색 모달 */}
      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  )
}
