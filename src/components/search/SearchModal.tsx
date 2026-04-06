'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Search, X, ChevronRight, Video, FileText, Code, Palette, MessageSquare } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { expandSearchTerm } from '@/utils/search-utils'
import Link from 'next/link'

/**
 * 카테고리에 맞는 아이콘을 반환합니다.
 */
const getCategoryIcon = (category: string) => {
  switch (category) {
    case '개발': return <Code className="w-5 h-5 text-blue-600" />;
    case '디자인': return <Palette className="w-5 h-5 text-purple-600" />;
    case '멀티미디어': return <Video className="w-5 h-5 text-pink-500" />;
    case '문서작성': return <FileText className="w-5 h-5 text-blue-500" />;
    case '고객관리': return <MessageSquare className="w-5 h-5 text-green-500" />;
    default: return <FileText className="w-5 h-5 text-gray-400" />;
  }
}

export function SearchModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const supabase = createClient()
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  // 실시간 검색 로직
  React.useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      const keywords = expandSearchTerm(query);
      const searchConditions = keywords.map(k => `title.ilike.%${k}%`).join(',');
      const contentConditions = keywords.map(k => `content.ilike.%${k}%`).join(',');

      const { data } = await supabase
        .from('posts')
        .select('*')
        .or(`${searchConditions},${contentConditions}`)
        .limit(5);

      setResults(data || []);
      setLoading(false);
    };

    const timer = setTimeout(fetchResults, 200);
    return () => clearTimeout(timer);
  }, [query, supabase]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-2xl bg-white rounded-[2rem] shadow-2xl z-[101] overflow-hidden animate-in zoom-in-95 duration-200 outline-none">
          
          {/* Search Header */}
          <div className="p-6 border-b border-gray-50 bg-white">
            <div className="relative flex items-center group">
              <Search className="absolute left-6 w-6 h-6 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="찾으시는 가이드를 입력하세요"
                className="w-full h-16 pl-16 pr-12 bg-white border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none text-xl font-medium transition-all"
              />
              <Dialog.Close asChild>
                <button className="absolute right-6 p-2 hover:bg-gray-100 rounded-xl transition-all">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Results Area */}
          <div className="max-h-[60vh] overflow-y-auto">
            {!query.trim() ? (
              <div className="p-12 text-center text-gray-400">
                <p className="text-lg">무엇을 도와드릴까요?</p>
                <p className="text-sm mt-2">최근 가이드나 프로그램 이름을 검색해 보세요.</p>
              </div>
            ) : loading ? (
              <div className="p-12 text-center text-gray-400">검색 중입니다...</div>
            ) : results.length > 0 ? (
              <div className="py-4">
                <div className="px-8 py-4 flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-400">{results.length}개의 가이드를 찾았습니다</p>
                </div>
                <div className="space-y-2 px-4">
                  {results.map((post) => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.id}`}
                      onClick={() => onOpenChange(false)}
                      className="group flex items-center gap-6 p-6 hover:bg-blue-50/50 rounded-3xl transition-all"
                    >
                      <div className="w-14 h-14 bg-gray-50 flex items-center justify-center rounded-2xl group-hover:bg-white group-hover:shadow-lg transition-all">
                        {getCategoryIcon(post.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{post.title}</h3>
                        <p className="text-sm text-gray-500 truncate mt-1">{post.content.substring(0, 80)}...</p>
                        <div className="flex items-center gap-3 mt-3">
                           <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-bold rounded-lg uppercase tracking-wider">{post.category || '기타'}</span>
                           <span className="text-[11px] text-gray-400 font-medium">작성자: Member</span>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-400">
                <p className="text-lg font-bold">검색 결과가 없습니다</p>
                <p className="text-sm mt-2">단어를 확인하거나 다른 단어로 검색해 보세요.</p>
              </div>
            )}
          </div>

          {/* Footer Hint */}
          <div className="p-6 bg-gray-50/50 border-t border-gray-100/50 flex justify-center items-center">
            <span className="text-xs font-medium text-gray-400 flex items-center gap-2">
              <span className="px-2 py-0.5 border border-gray-200 bg-white rounded-md text-[10px]">ESC</span>
              키를 눌러 닫기
            </span>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
