'use client'

import { createClient } from '@/utils/supabase/client'
import Image from 'next/image'
import { notFound, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  Clock, 
  User, 
  Tag, 
  DollarSign, 
  Lightbulb, 
  Wrench, 
  ArrowLeft,
  MessageCircle,
  ThumbsUp,
  Share2,
  ChevronRight
} from 'lucide-react'

export default function PostDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const supabase = createClient()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [helpfulCount, setHelpfulCount] = useState(0)
  const [isHelpfulClicked, setIsHelpfulClicked] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error || !data) {
        notFound()
        return
      }

      setPost(data)
      setHelpfulCount(data.helpful_count || 0)
      setLoading(false)
    }

    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', params.id)
        .order('created_at', { ascending: true })
      
      setComments(data || [])
    }

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    fetchPost()
    fetchComments()
    checkUser()
  }, [params.id, supabase])

  const handleHelpful = async () => {
    if (isHelpfulClicked) return
    
    const newCount = helpfulCount + 1
    const { error } = await supabase
      .from('posts')
      .update({ helpful_count: newCount })
      .eq('id', post.id)

    if (!error) {
       setHelpfulCount(newCount)
       setIsHelpfulClicked(true)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }
    if (!newComment.trim()) return

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: post.id,
        user_id: user.id,
        content: newComment
      })
      .select()
      .single()

    if (!error) {
      setComments([...comments, data])
      setNewComment('')
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const steps = Array.isArray(post.steps) ? post.steps : []
  const tips = Array.isArray(post.tips) ? post.tips : []
  const tools = Array.isArray(post.tools) ? post.tools : []

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-40">
      {/* Top Navigation */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-all font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> 돌아가기
        </button>
      </div>

      <main className="max-w-4xl mx-auto px-6 space-y-12">
        {/* Header Card */}
        <div className="bg-white rounded-[3rem] p-12 shadow-xl shadow-blue-900/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-50" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </div>
              <div>
                <span className="inline-block px-3 py-1 bg-purple-50 text-purple-600 text-xs font-black rounded-lg mb-2 uppercase tracking-wider">
                  {post.category || '기타'}
                </span>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                  {post.title}
                </h1>
              </div>
            </div>
            
            <p className="text-lg text-gray-500 font-medium mb-10 leading-relaxed max-w-2xl">
              {post.description || '인공지능 기술을 활용하여 실무 효율을 극대화하는 방법을 안내합니다.'}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">작성자</p>
                  <p className="text-sm font-bold text-gray-900">{post.author_name || '익명'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">읽는 시간</p>
                  <p className="text-sm font-bold text-gray-900">약 {post.reading_time || 1}분</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                <Tag className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">카테고리</p>
                  <p className="text-sm font-bold text-gray-900">{post.category || '기타'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">소요 비용</p>
                  <p className="text-sm font-bold text-gray-900 line-clamp-1">{post.cost || '무료'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {post.image_url && (
          <div className="relative aspect-[21/9] w-full rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-900/10 border-8 border-white">
            <Image src={post.image_url} alt="Cover" fill className="object-cover" />
          </div>
        )}

        {/* Step-by-Step Guide */}
        <section className="bg-white rounded-[3rem] p-10 md:p-14 shadow-xl shadow-blue-900/5">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-black text-gray-900">단계별 가이드</h2>
          </div>

          <div className="space-y-6">
            {steps.length > 0 ? steps.map((step: any, index: number) => (
              <div key={index} className="group p-8 bg-blue-50/30 rounded-[2.5rem] border border-transparent hover:border-blue-100 hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-4">
                  <span className="text-blue-600">{index + 1}단계:</span> {step.title}
                </h3>
                <p className="text-gray-500 font-medium leading-relaxed whitespace-pre-wrap mb-6">
                  {step.content}
                </p>
                {step.image_url && (
                  <div className="relative aspect-video w-full rounded-[2rem] overflow-hidden border-4 border-white shadow-sm mt-4">
                    <Image src={step.image_url} alt={`Step ${index + 1}`} fill className="object-cover" />
                  </div>
                )}
              </div>
            )) : (
              <div className="prose prose-lg max-w-none text-gray-500 font-medium leading-relaxed whitespace-pre-wrap">
                {post.content}
              </div>
            )}
          </div>
        </section>

        {/* Tips Section */}
        {tips.length > 0 && (
          <section className="bg-white rounded-[3rem] p-12 shadow-xl shadow-blue-900/5 border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
              <Lightbulb className="w-7 h-7 text-orange-400" />
              <h2 className="text-2xl font-black text-gray-900">핵심 팁</h2>
            </div>
            <ul className="space-y-4">
              {tips.map((tip: string, i: number) => (
                <li key={i} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-orange-50/50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-orange-400 mt-2.5 shrink-0" />
                  <p className="text-gray-600 font-bold">{tip}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Tools Section */}
        {tools.length > 0 && (
          <section className="bg-white rounded-[3rem] p-12 shadow-xl shadow-blue-900/5 border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
              <Wrench className="w-7 h-7 text-blue-500" />
              <h2 className="text-2xl font-black text-gray-900">사용 도구</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {tools.map((tool: string, i: number) => (
                <span key={i} className="px-6 py-3 bg-blue-50 text-blue-600 font-bold rounded-2xl text-sm border border-blue-100">
                  {tool}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Engagement Footer */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-14 text-center text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
           <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity" />
           <h2 className="text-3xl font-black mb-4">이 가이드가 도움이 되셨나요?</h2>
           <p className="text-blue-100 font-medium mb-10">여러분의 노하우도 공유해 주세요. 함께 성장하는 힘이 됩니다!</p>
           
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={handleHelpful}
                disabled={isHelpfulClicked}
                className={`px-10 py-4 rounded-full font-black flex items-center gap-3 transition-all ${isHelpfulClicked ? 'bg-white/20 text-white' : 'bg-white text-blue-600 hover:scale-105 shadow-xl'}`}
              >
                <ThumbsUp className={`w-5 h-5 ${isHelpfulClicked ? 'fill-white' : ''}`} />
                {isHelpfulClicked ? '추천 완료!' : '도움이 되었어요'} ({helpfulCount})
              </button>
              <button 
                onClick={() => router.push('/')}
                className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white font-black rounded-full transition-all border border-white/20"
              >
                다른 가이드 보러가기
              </button>
           </div>
        </div>

        {/* Comments Section */}
        <section className="pt-20">
          <div className="flex items-center gap-3 mb-10">
            <MessageCircle className="w-8 h-8 text-gray-400" />
            <h2 className="text-2xl font-black text-gray-900">댓글 {comments.length}</h2>
          </div>

          <div className="bg-white rounded-[3rem] p-10 md:p-12 shadow-xl shadow-blue-900/5 border border-gray-100 mb-12">
            {user ? (
              <form onSubmit={handleAddComment} className="space-y-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="댓글을 작성해 보세요..."
                  className="w-full p-6 bg-gray-50 border-none rounded-3xl focus:ring-2 focus:ring-blue-500 font-medium resize-none shadow-inner"
                  rows={3}
                />
                <div className="flex justify-end">
                  <button className="px-10 py-3 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                    작성하기
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-400 font-bold mb-6">댓글을 작성하려면 로그인이 필요합니다.</p>
                <button 
                  onClick={() => router.push('/')}
                  className="px-10 py-3 bg-blue-600 text-white font-black rounded-2xl"
                >
                  로그인
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 flex gap-6">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-lg shrink-0">
                  {comment.user_id ? 'U' : 'A'}
                </div>
                <div>
                   <div className="flex items-center gap-3 mb-2">
                     <span className="font-black text-gray-900 text-sm">익명 사용자</span>
                     <span className="text-xs text-gray-400 font-medium">{new Date(comment.created_at).toLocaleDateString()}</span>
                   </div>
                   <p className="text-gray-600 font-bold leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
