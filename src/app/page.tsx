'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

const CATEGORIES = ['전체', '문서작성', '디자인', '멀티미디어', '개발', '마케팅', '데이터분석', '고객관리', '기타']

export default function Home() {
  const supabase = createClient()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('전체')

  // 데이터 가져오기 함수 (기본 카테고리 필터링 유지)
  const fetchPosts = async () => {
    setLoading(true)
    try {
      let query = supabase.from('posts').select('*').order('created_at', { ascending: false })

      if (activeCategory !== '전체') {
        query = query.eq('category', activeCategory)
      }

      const { data, error } = await query
      if (error) throw error
      setPosts(data || [])
    } catch (err) {
      console.error('데이터 조회 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [activeCategory])

  // 전역 검색 모달 트리거 이벤트 발생시키기
  const openSearch = () => {
    window.dispatchEvent(new CustomEvent('open-search'))
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-white pt-24 pb-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[2.5rem] md:text-[3.5rem] font-bold text-[#111827] leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            한경매거진앤북<br />
            <span className="text-[#0056FF]">AI 업무 활용TIP</span>
          </h2>
          <p className="text-xl text-gray-500 mb-12 font-medium">실무에 바로 쓰는 AI 활용 가이드 모음</p>
          
          {/* 가짜 검색 바 - 클릭 시 모달 열림 */}
          <div className="relative max-w-xl mx-auto mb-12 group">
            <button 
              onClick={openSearch}
              className="w-full h-16 pl-14 pr-6 bg-white border border-gray-100 shadow-xl shadow-gray-200/50 rounded-2xl text-left text-gray-400 text-lg hover:ring-2 hover:ring-blue-500 transition-all cursor-text flex items-center"
            >
              찾으시는 가이드를 입력하세요
            </button>
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-[#0056FF]" />
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-gray-400">
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>실무 활용법</span>
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>검증된 팁</span>
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>상시 업데이트</span>
          </div>
        </div>
      </section>

      {/* Categories & Listing */}
      <section className="max-w-[1400px] mx-auto px-6 py-20 pb-40">
        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-20 animate-in fade-in duration-1000">
          {CATEGORIES.map((cat) => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeCategory === cat ? 'bg-[#0056FF] text-white shadow-lg shadow-blue-500/30 scale-105' : 'bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1,2,3].map(i => <div key={i} className="h-64 bg-gray-50 rounded-[2rem] animate-pulse" />)}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in fade-in duration-500">
            {posts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="group bg-white rounded-[2rem] overflow-hidden border border-gray-50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 shadow-sm flex flex-col">
                <div className="aspect-[16/10] bg-gray-100 relative">
                  {post.image_url ? (
                    <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gradient-to-br from-gray-50 to-gray-100">AI Archive Card</div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-white/90 backdrop-blur-sm text-[#0056FF] px-3 py-1 rounded-lg text-xs font-bold shadow-sm">{post.category || '기타'}</span>
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold mb-8 leading-tight group-hover:text-[#0056FF] transition-colors h-[3.5rem] line-clamp-2">
                    {post.title}
                  </h3>
                  <div className="mt-auto flex justify-between items-center pt-6 border-t border-gray-50">
                    <span className="text-sm font-medium text-gray-400">작성자: <span className="text-gray-900">Member</span></span>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-[#0056FF] group-hover:bg-[#0056FF] group-hover:text-white transition-all">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 animate-fade-in bg-white rounded-[3rem] border border-dashed border-gray-200">
             <div className="text-5xl mb-6">📂</div>
             <p className="text-gray-500 text-lg font-bold">등록된 가이드가 없습니다.</p>
             <p className="text-gray-400 text-sm mt-2">첫 번째 가이드를 공유해 보세요!</p>
             <Link href="/posts/new" className="mt-8 inline-block px-8 py-3 bg-[#0056FF] text-white font-bold rounded-full shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform">
               가이드 공유하기
             </Link>
          </div>
        )}
      </section>
    </div>
  )
}
