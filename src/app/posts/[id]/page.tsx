'use client'

import { createClient } from '@/utils/supabase/client'
import Image from 'next/image'
import { notFound, useRouter } from 'next/navigation'
import { useEffect, useState, use as useReact } from 'react'
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
  ChevronRight,
  CheckCircle2,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react'

export default function PostDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>
}) {
  const params = useReact(paramsPromise)
  const id = params.id
  const router = useRouter()
  const supabase = createClient()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [helpfulCount, setHelpfulCount] = useState(0)
  const [isHelpfulClicked, setIsHelpfulClicked] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [user, setUser] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true)
        const { data, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id)
          .single()

        if (postError || !data) {
          setError('가이드를 찾을 수 없습니다.')
          return
        }

        setPost(data)
        setHelpfulCount(data.helpful_count || 0)

        // 초기 사용자 확인 및 추천 상태 확인
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser(user)
          const { data: voteData } = await supabase
            .from('helpful_votes')
            .select('*')
            .eq('post_id', id)
            .eq('user_id', user.id)
            .single()
            
          if (voteData) setIsHelpfulClicked(true)
        }
      } catch (err) {
        console.error('Fetch error:', err)
        setError('데이터를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: true })
      
      setComments(data || [])
    }

    // Auth 상태 실시간 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    fetchPost()
    fetchComments()

    return () => {
      subscription.unsubscribe()
    }
  }, [id, supabase])

  const handleHelpful = async () => {
    if (!user) {
      alert('추천을 위해 로그인이 필요합니다. 홈 화면으로 이동합니다.')
      router.push('/')
      return
    }
    
    // 토글 로직
    try {
      if (isHelpfulClicked) {
        const { error } = await supabase
          .from('helpful_votes')
          .delete()
          .eq('post_id', id)
          .eq('user_id', user.id)

        if (!error) {
          const newCount = Math.max(0, helpfulCount - 1)
          await supabase.from('posts').update({ helpful_count: newCount }).eq('id', id)
          setHelpfulCount(newCount)
          setIsHelpfulClicked(false)
        }
      } else {
        const { error } = await supabase
          .from('helpful_votes')
          .insert({ post_id: id, user_id: user.id })

        if (!error) {
          const newCount = helpfulCount + 1
          await supabase.from('posts').update({ helpful_count: newCount }).eq('id', id)
          setHelpfulCount(newCount)
          setIsHelpfulClicked(true)
        }
      }
    } catch (err) {
      console.error('Vote error:', err)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('로그인이 필요한 기능입니다.')
      router.push('/')
      return
    }
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: id,
          user_id: user.id,
          user_name: user.user_metadata?.full_name || '사용자',
          content: newComment
        })
        .select()
        .single()

      if (error) {
        alert(`댓글 저장에 실패했습니다: ${error.message}`)
      } else if (data) {
        setComments([...comments, data])
        setNewComment('')
      }
    } catch (err: any) {
      alert(`오류가 발생했습니다: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (!error) {
      setComments(comments.filter(c => c.id !== commentId))
    }
  }

  const handleStartEdit = (comment: any) => {
    setEditingCommentId(comment.id)
    setEditingContent(comment.content)
  }

  const handleUpdateComment = async (commentId: string) => {
    if (!editingContent.trim()) return

    const { error } = await supabase
      .from('comments')
      .update({ content: editingContent })
      .eq('id', commentId)

    if (!error) {
      setComments(comments.map(c => 
        c.id === commentId ? { ...c, content: editingContent } : c
      ))
      setEditingCommentId(null)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <p className="text-xl font-bold text-gray-900 mb-2">{error}</p>
      <button onClick={() => router.push('/')} className="text-blue-600 font-bold hover:underline">홈으로 돌아가기</button>
    </div>
  )

  const steps = Array.isArray(post.steps) ? post.steps : []
  const tips = Array.isArray(post.tips) ? post.tips : []
  const tools = Array.isArray(post.tools) ? post.tools : []

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-40">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-all font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> 돌아가기
        </button>
      </div>

      <main className="max-w-4xl mx-auto px-6 space-y-12">
        <div className="bg-white rounded-[3rem] p-12 shadow-xl shadow-blue-900/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-50" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <ImageIcon className="w-8 h-8" />
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
              {post.description || post.content}
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

        {post.image_url && (
          <div className="relative aspect-[21/9] w-full rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-900/10 border-8 border-white">
            <Image src={post.image_url} alt="Cover" fill className="object-cover" />
          </div>
        )}

        <section className="bg-white rounded-[3rem] p-10 md:p-14 shadow-xl shadow-blue-900/5">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">단계별 가이드</h2>
          </div>

          <div className="space-y-6">
            {steps.map((step: any, index: number) => (
              <div key={index} className="group p-8 bg-blue-50/30 rounded-[2.5rem] border border-transparent hover:border-blue-100 hover:bg-white transition-all duration-300">
                <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-4">
                  <span className="text-blue-600">{index + 1}단계:</span> {step.title}
                </h3>
                <p className="text-gray-500 font-medium leading-relaxed whitespace-pre-wrap mb-6">{step.content}</p>
                {step.image_url && (
                  <div className="relative aspect-video w-full rounded-[2rem] overflow-hidden border-4 border-white mt-4 shadow-sm">
                    <Image src={step.image_url} alt={`Step ${index + 1}`} fill className="object-cover" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {tips.length > 0 && (
          <section className="bg-white rounded-[3rem] p-12 shadow-xl shadow-blue-900/5">
            <div className="flex items-center gap-3 mb-8">
              <Lightbulb className="w-7 h-7 text-orange-400" />
              <h2 className="text-2xl font-black text-gray-900">핵심 팁</h2>
            </div>
            <ul className="space-y-4">
              {tips.map((tip: string, i: number) => (
                <li key={i} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-orange-50/50">
                  <div className="w-2 h-2 rounded-full bg-orange-400 mt-2.5 shrink-0" />
                  <p className="text-gray-600 font-bold">{tip}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tools.length > 0 && (
          <section className="bg-white rounded-[3rem] p-12 shadow-xl shadow-blue-900/5">
            <div className="flex items-center gap-3 mb-8">
              <Wrench className="w-7 h-7 text-blue-500" />
              <h2 className="text-2xl font-black text-gray-900">사용 도구</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {tools.map((tool: string, i: number) => (
                <span key={i} className="px-6 py-3 bg-blue-50 text-blue-600 font-bold rounded-2xl text-sm">
                  {tool}
                </span>
              ))}
            </div>
          </section>
        )}

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-14 text-center text-white shadow-2xl relative overflow-hidden group">
           <h2 className="text-3xl font-black mb-4">이 가이드가 도움이 되셨나요?</h2>
           <p className="text-blue-100 font-medium mb-10">여러분의 노하우도 공유해 주세요. 함께 성장하는 힘이 됩니다!</p>
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <button 
                onClick={handleHelpful}
                className={`px-10 py-4 rounded-full font-black flex items-center gap-3 transition-all ${isHelpfulClicked ? 'bg-white text-blue-600' : 'bg-white/10 hover:bg-white text-blue-100 hover:text-blue-600'}`}
              >
                <ThumbsUp className={`w-5 h-5 ${isHelpfulClicked ? 'fill-blue-600' : ''}`} />
                {isHelpfulClicked ? '추천 완료!' : '도움이 되었어요'} ({helpfulCount})
              </button>
              <button onClick={() => router.push('/')} className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white font-black rounded-full transition-all">
                다른 가이드 보러가기
              </button>
           </div>
        </div>

        <section className="pt-20">
          <div className="flex items-center gap-3 mb-10 px-4">
            <MessageCircle className="w-8 h-8 text-gray-400" />
            <h2 className="text-2xl font-black text-gray-900">댓글 {comments.length}</h2>
          </div>

          <div className="bg-white rounded-[3rem] p-10 md:p-12 shadow-xl shadow-blue-900/5 mb-12">
            {user ? (
              <form onSubmit={handleAddComment} className="space-y-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={`${user.user_metadata?.full_name || '사용자'}님, 댓글을 작성해 보세요...`}
                  className="w-full p-6 bg-gray-50 border-none rounded-3xl focus:ring-2 focus:ring-blue-500 font-medium resize-none"
                  rows={3}
                />
                <div className="flex justify-end">
                  <button className="px-10 py-3 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all">작성하기</button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 font-bold mb-4">로그인 후 댓글을 남길 수 있습니다.</p>
                <button onClick={() => router.push('/')} className="px-8 py-2.5 bg-blue-600 text-white font-black rounded-xl text-sm">로그인하기</button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50">
                <div className="flex items-start justify-between mb-4">
                   <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-lg">
                        {comment.user_name ? comment.user_name[0] : 'U'}
                      </div>
                      <div>
                        <p className="font-black text-gray-900">{comment.user_name || '익명 사용자'}</p>
                        <p className="text-xs text-gray-400 font-medium">{new Date(comment.created_at).toLocaleDateString()}</p>
                      </div>
                   </div>
                   
                   {user && comment.user_id === user.id && (
                     <div className="flex gap-2">
                       <button onClick={() => handleStartEdit(comment)} className="p-2 text-gray-300 hover:text-blue-500 transition-colors"><Upload className="w-4 h-4" /></button>
                       <button onClick={() => handleDeleteComment(comment.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                     </div>
                   )}
                </div>

                {editingCommentId === comment.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full p-4 bg-gray-50 border-blue-100 border rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingCommentId(null)} className="text-sm font-bold text-gray-400">취소</button>
                      <button onClick={() => handleUpdateComment(comment.id)} className="text-sm font-bold text-blue-600">저장</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 font-bold leading-relaxed ml-16">{comment.content}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
