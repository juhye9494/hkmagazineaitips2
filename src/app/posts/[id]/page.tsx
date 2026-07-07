import { createClient } from '@/utils/supabase/server'
import Image from 'next/image'
import { notFound } from 'next/navigation'

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !post) {
    notFound()
  }

  const toolsText = Array.isArray(post.tools)
    ? post.tools.join(', ')
    : typeof post.tools === 'string'
      ? post.tools
      : ''

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 text-sm font-semibold text-blue-600 bg-blue-50 rounded-full">
            AI 가이드
          </span>
          <span className="text-sm text-gray-500">
            {new Date(post.created_at).toLocaleDateString()}
          </span>
        </div>

        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
          {post.title}
        </h1>

        {post.description && (
          <p className="mt-4 text-lg text-gray-600 leading-relaxed">
            {post.description}
          </p>
        )}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
          {post.author_name && (
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <span className="font-semibold text-gray-900">작성자</span>
              <p>{post.author_name}</p>
            </div>
          )}

          {post.reading_time && (
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <span className="font-semibold text-gray-900">읽는 시간</span>
              <p>{post.reading_time}분</p>
            </div>
          )}

          {post.cost && (
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <span className="font-semibold text-gray-900">소요 비용</span>
              <p>{post.cost}</p>
            </div>
          )}

          {toolsText && (
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <span className="font-semibold text-gray-900">사용 AI</span>
              <p>{toolsText}</p>
            </div>
          )}
        </div>
      </div>

      {post.image_url && (
        <div className="relative aspect-video w-full mb-12 rounded-3xl overflow-hidden shadow-2xl">
          <Image
            src={post.image_url}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">
        {post.content}
      </div>

      <div className="mt-16 pt-8 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600" />
          <div>
            <p className="text-sm font-bold text-gray-900">
              {post.author_name || '익명의 작성자'}
            </p>
            <p className="text-xs text-gray-500">AI Enthusiast</p>
          </div>
        </div>
        <button className="px-6 py-2 border border-gray-200 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          목록으로 돌아가기
        </button>
      </div>
    </div>
  )
}