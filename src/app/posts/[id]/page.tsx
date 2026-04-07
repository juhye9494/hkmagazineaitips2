'use client'

import { createClient } from '@/utils/supabase/client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
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
  ChevronRight,
  CheckCircle2,
  Upload,
  X,
  Image as ImageIcon,
  Edit3,
  Trash2
} from 'lucide-react'
import { EditGuideDialog } from '@/app/components/EditGuideDialog'

export default function PostDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>
}) {
  const params = useReact(paramsPromise)
  const id = params.id
  const router = useRouter()
  const supabase = createClient()

  // States
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  
  // Interaction States
  const [helpfulCount, setHelpfulCount] = useState(0)
  const [isHelpfulClicked, setIsHelpfulClicked] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  
  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Get Current User
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      // 2. Fetch Post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single()

      if (postError || !postData) {
        setError('가이드를 찾을 수 없거나 삭제되었습니다.')
        return
      }
      setPost(postData)

      // 3. Fetch Helpful Votes
      const { count: votesCount } = await supabase
        .from('helpful_votes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', id)
      setHelpfulCount(votesCount || 0)

      if (currentUser) {
        const { data: myVote } = await supabase
          .from('helpful_votes')
          .select('*')
          .eq('post_id', id)
          .eq('user_id', currentUser.id)
          .single()
        setIsHelpfulClicked(!!myVote)
      }

      // 4. Fetch Comments
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: false })
      setComments(commentsData || [])

    } catch (err: any) {
      console.error('Fetch error:', err)
      setError('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [id])

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`,
      },
    })
  }

  const handleDeletePost = async () => {
    if (!confirm('정말로 이 가이드를 삭제하시겠습니까? 삭제된 가이드는 복구할 수 없습니다.')) return
    try {
      const { error } = await supabase.from('posts').delete().eq('id', id)
      if (error) throw error
      alert('가이드가 성공적으로 삭제되었습니다.')
      router.replace('/')
    } catch (err: any) {
      alert(`삭제 실패: ${err.message}`)
    }
  }

  const handleUpdatePost = async (updatedData: any) => {
    try {
      const { error } = await supabase.from('posts').update(updatedData).eq('id', id)
      if (error) throw error
      alert('가이드가 성공적으로 수정되었습니다.')
      fetchData() // Refresh page data
    } catch (err: any) {
      alert(`수정 실패: ${err.message}`)
    }
  }

  const handleHelpful = async () => {
    if (!user) { handleLogin(); return; }
    try {
      if (isHelpfulClicked) {
        await supabase.from('helpful_votes').delete().eq('post_id', id).eq('user_id', user.id)
        setHelpfulCount(prev => Math.max(0, prev - 1))
        setIsHelpfulClicked(false)
      } else {
        await supabase.from('helpful_votes').insert({ post_id: id, user_id: user.id })
        setHelpfulCount(prev => prev + 1)
        setIsHelpfulClicked(true)
      }
    } catch (err) { console.error(err) }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { handleLogin(); return; }
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
        .select().single()
      if (data) {
        setComments([data, ...comments])
        setNewComment('')
      }
    } catch (err: any) { alert(err.message) }
    finally { setIsSubmitting(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
  if (error || !post) return <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"><p className="text-xl font-bold text-gray-900 mb-4">{error || '가이드를 찾을 수 없습니다.'}</p><button onClick={() => router.push('/')} className="text-blue-600 font-bold hover:underline">홈으로 돌아가기</button></div>

  const steps = Array.isArray(post.steps) ? post.steps : []
  const tips = Array.isArray(post.tips) ? post.tips : []
  const tools = Array.isArray(post.tools) ? post.tools : []
  const links = Array.isArray(post.links) ? post.links : []

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-40">
      {/* Edit Dialog */}
      <EditGuideDialog 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSubmit={handleUpdatePost} 
        guide={post} 
      />

      <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-all font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> 돌아가기
        </button>

        {/* Author Actions */}
        {user && post.user_id === user.id && (
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 font-black rounded-xl border border-blue-100 shadow-sm hover:bg-blue-50 transition-all"
             >
               <Edit3 className="w-4 h-4" /> 수정하기
             </button>
             <button 
              onClick={handleDeletePost}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-red-500 font-black rounded-xl border border-red-50 shadow-sm hover:bg-red-50 transition-all"
             >
               <Trash2 className="w-4 h-4" /> 삭제하기
             </button>
          </div>
        )}
      </div>

      <main className="max-w-4xl mx-auto px-6 space-y-12">
        <div className="bg-white rounded-[3rem] p-12 shadow-xl shadow-blue-900/5 relative overflow-hidden border border-gray-100">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div>
                <span className="inline-block px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-black rounded-lg mb-2 uppercase tracking-widest border border-purple-100">
                  {post.category || '기타'}
                </span>
                <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight">
                  {post.title}
                </h1>
              </div>
            </div>
            
            <p className="text-lg text-gray-500 font-medium mb-10 leading-relaxed max-w-2xl">
              {post.description || post.content}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: User, label: '작성자', val: post.author_name || '익명' },
                { icon: Clock, label: '읽는 시간', val: `약 ${post.reading_time || 1}분` },
                { icon: Tag, label: '카테고리', val: post.category || '기타' },
                { icon: DollarSign, label: '소요 비용', val: post.cost || '무료' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <item.icon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{item.label}</p>
                    <p className="text-sm font-black text-gray-900 truncate">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {post.image_url && (
          <div className="relative aspect-[21/9] w-full rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-900/10 border-8 border-white">
            <Image src={post.image_url} alt="Cover" fill className="object-cover" priority />
          </div>
        )}

        <section className="space-y-10">
          <div className="flex items-center gap-4 mb-4 ml-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-black text-gray-900">단계별 상세 가이드</h2>
          </div>

          <div className="space-y-8">
             {steps.map((step: any, index: number) => (
               <div key={index} className="bg-white rounded-[3.5rem] p-10 md:p-14 shadow-xl shadow-blue-900/5 relative overflow-hidden group border border-transparent hover:border-blue-100 transition-all duration-500">
                 <div className="absolute top-0 left-0 w-20 h-20 bg-blue-50 rounded-br-[3rem] flex items-center justify-center font-black text-blue-600 text-2xl shadow-inner italic">
                   {index + 1}
                 </div>
                 <h3 className="text-2xl font-black text-gray-900 mb-6 mt-8 pl-6 border-l-4 border-blue-600 leading-tight">
                    {step.title}
                 </h3>
                 <p className="text-gray-500 font-medium text-lg leading-relaxed whitespace-pre-wrap mb-10 pl-6">{step.content}</p>
                 
                 <div className="space-y-8">
                    {Array.isArray(step.image_urls) && step.image_urls.length > 0 ? (
                      step.image_urls.map((url: string, imgIdx: number) => (
                        <div key={imgIdx} className="relative aspect-video w-full rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl shadow-blue-900/10">
                          <Image src={url} alt={`Step ${index + 1}`} fill className="object-cover" />
                        </div>
                      ))
                    ) : step.image_url ? (
                      <div className="relative aspect-video w-full rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl shadow-blue-900/10">
                        <Image src={step.image_url} alt={`Step ${index + 1}`} fill className="object-cover" />
                      </div>
                    ) : null}
                 </div>
               </div>
             ))}
          </div>
        </section>

        {tips.length > 0 && (
          <section className="bg-white rounded-[3.5rem] p-12 shadow-xl shadow-blue-900/5 border border-gray-50">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 shadow-inner">
                <Lightbulb className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">핵심 실전 팁</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tips.map((tip: string, i: number) => (
                <div key={i} className="flex items-start gap-4 p-6 bg-orange-50/30 rounded-3xl border border-orange-100/50 hover:bg-orange-50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-orange-400 mt-2.5 shrink-0 shadow-sm" />
                  <p className="text-gray-700 font-bold leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {tools.length > 0 && (
             <section className="bg-white rounded-[3.5rem] p-12 shadow-xl shadow-blue-900/5 border border-gray-50 flex flex-col">
               <div className="flex items-center gap-4 mb-8">
                 <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-inner">
                   <Wrench className="w-6 h-6" />
                 </div>
                 <h2 className="text-xl font-black text-gray-900">사용 도구</h2>
               </div>
               <div className="flex flex-wrap gap-2 mt-auto">
                 {tools.map((tool: string, i: number) => (
                   <span key={i} className="px-5 py-2.5 bg-purple-50 text-purple-600 font-black rounded-xl text-xs border border-purple-100 shadow-sm">
                     {tool}
                   </span>
                 ))}
               </div>
             </section>
           )}

           {links.length > 0 && (
             <section className="bg-white rounded-[3.5rem] p-12 shadow-xl shadow-blue-900/5 border border-gray-50 flex flex-col">
               <div className="flex items-center gap-4 mb-8">
                 <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 shadow-inner">
                   <Tag className="w-6 h-6" />
                 </div>
                 <h2 className="text-xl font-black text-gray-900">참고 자료</h2>
               </div>
               <div className="space-y-3 mt-auto">
                 {links.map((link: string, i: number) => (
                   <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-green-50/50 rounded-2xl group hover:bg-green-100 transition-all border border-green-50">
                      <div className="flex-1 truncate text-xs font-black text-green-700">{link}</div>
                      <ChevronRight className="w-4 h-4 text-green-400 group-hover:translate-x-1 transition-transform" />
                   </a>
                 ))}
               </div>
             </section>
           )}
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[4rem] p-16 text-center text-white shadow-[0_30px_60px_-15px_rgba(37,99,235,0.4)] relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
           <div className="relative z-10">
             <h2 className="text-4xl font-black mb-4 tracking-tight">이 가이드가 도움이 되셨나요?</h2>
             <p className="text-blue-100 font-bold mb-12 text-lg">여러분의 따뜻한 추천 한 번이 작성자에게는 큰 힘이 됩니다.</p>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button 
                  onClick={handleHelpful}
                  className={`px-12 py-5 rounded-[2rem] font-black text-lg flex items-center gap-4 transition-all transform active:scale-95 ${isHelpfulClicked ? 'bg-white text-blue-600 shadow-xl shadow-white/20' : 'bg-white/10 hover:bg-white text-white hover:text-blue-600 border-2 border-white/20'}`}
                >
                  <ThumbsUp className={`w-6 h-6 ${isHelpfulClicked ? 'fill-blue-600' : ''}`} />
                  {isHelpfulClicked ? '추천 완료!' : '정말 도움됐어요'} ({helpfulCount})
                </button>
             </div>
           </div>
        </div>

        <section className="pt-20 space-y-10">
          <div className="flex items-center justify-between px-6">
            <h2 className="text-3xl font-black text-gray-900 flex items-center gap-4">
              <MessageCircle className="w-8 h-8 text-blue-600" />
              댓글 피드백 <span className="text-blue-600">{comments.length}</span>
            </h2>
          </div>

          <div className="bg-white rounded-[3.5rem] p-10 md:p-14 shadow-xl shadow-blue-900/5 border border-gray-50">
            {user ? (
              <form onSubmit={handleAddComment} className="space-y-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={`${user.user_metadata?.full_name || '동료'}님, 응원의 메시지나 질문을 남겨주세요...`}
                  className="w-full p-8 bg-gray-50/50 border-2 border-gray-50 rounded-[2.5rem] focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all font-bold text-lg resize-none"
                  rows={3}
                />
                <div className="flex justify-end">
                  <button className="px-12 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95">댓글 등록하기</button>
                </div>
              </form>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                <p className="text-gray-400 font-black text-lg mb-6">로그인 후 소중한 답변을 남길 수 있습니다.</p>
                <button onClick={handleLogin} className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95 transition-all">Google 로그인 후 댓글 쓰기</button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-start justify-between mb-6">
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                        {comment.user_name ? comment.user_name[0] : 'U'}
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-lg leading-tight mb-1">{comment.user_name || '익명 사용자'}</p>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{new Date(comment.created_at).toLocaleDateString()}</p>
                      </div>
                   </div>
                   {user && comment.user_id === user.id && (
                     <div className="flex items-center gap-1">
                        <button onClick={() => handleDeleteComment(comment.id)} className="p-3 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><X className="w-5 h-5" /></button>
                     </div>
                   )}
                </div>
                <p className="text-gray-600 font-bold text-lg leading-relaxed pl-2">{comment.content}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
