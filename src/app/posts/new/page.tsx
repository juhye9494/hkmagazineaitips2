'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { uploadImage } from '@/lib/storage-utils'
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Clock, 
  DollarSign, 
  User, 
  Tag,
  ArrowLeft,
  Loader2,
  ChevronRight,
  Camera,
  Upload,
  CheckCircle2,
  X
} from 'lucide-react'

const CATEGORIES = ['전체', '문서작성', '디자인', '멀티미디어', '개발', '마케팅', '데이터분석', '고객관리', '기타']

interface Step {
  title: string;
  content: string;
  image_url: string;
  image_file?: File | null;
  preview_url?: string;
}

export default function NewPostPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // Metadata States
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('기타')
  const [description, setDescription] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [cost, setCost] = useState('')
  
  // Image States
  const [featuredImage, setFeaturedImage] = useState<File | null>(null)
  const [featuredPreview, setFeaturedPreview] = useState<string>('')
  
  // Structured Content States
  const [steps, setSteps] = useState<Step[]>([{ title: '', content: '', image_url: '' }])
  const [tips, setTips] = useState<string[]>([''])
  const [tools, setTools] = useState<string[]>([''])
  
  const [isLoading, setIsLoading] = useState(false)
  const [readingTime, setReadingTime] = useState(0)

  // Auth Check
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/')
      }
    }
    checkUser()
  }, [router, supabase])

  // Reading Time Logic
  useEffect(() => {
    const totalChars = title.length + 
                       description.length + 
                       steps.reduce((acc, step) => acc + step.title.length + step.content.length, 0)
    setReadingTime(Math.max(1, Math.ceil(totalChars / 200)))
  }, [title, description, steps])

  // Handlers for dynamic arrays
  const addStep = () => setSteps([...steps, { title: '', content: '', image_url: '' }])
  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = steps.filter((_, i) => i !== index)
      setSteps(newSteps)
    }
  }
  const updateStep = (index: number, field: keyof Step, value: any) => {
    const newSteps = [...steps]
    if (field === 'image_file') {
      const file = value as File
      if (file) {
        const preview = URL.createObjectURL(file)
        newSteps[index] = { ...newSteps[index], image_file: file, preview_url: preview }
      }
    } else {
      newSteps[index] = { ...newSteps[index], [field]: value }
    }
    setSteps(newSteps)
  }

  const handleFeaturedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFeaturedImage(file)
      setFeaturedPreview(URL.createObjectURL(file))
    }
  }

  const addTip = () => setTips([...tips, ''])
  const removeTip = (index: number) => setTips(tips.filter((_, i) => i !== index))
  const updateTip = (index: number, value: string) => {
    const newTips = [...tips]
    newTips[index] = value
    setTips(newTips)
  }

  const addTool = () => setTools([...tools, ''])
  const removeTool = (index: number) => setTools(tools.filter((_, i) => i !== index))
  const updateTool = (index: number, value: string) => {
    const newTools = [...tools]
    newTools[index] = value
    setTools(newTools)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { alert('제목을 입력해주세요.'); return; }
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { alert('로그인이 필요합니다.'); return; }

      // 1. Featured Image Upload
      let featured_image_url = ''
      if (featuredImage) {
        featured_image_url = await uploadImage(featuredImage)
      }

      // 2. Step Images Upload
      const finalSteps = await Promise.all(steps.map(async (step) => {
        let step_image_url = ''
        if (step.image_file) {
          step_image_url = await uploadImage(step.image_file)
        }
        return {
          title: step.title,
          content: step.content,
          image_url: step_image_url
        }
      }))

      // 3. Database Insert
      const { error } = await supabase.from('posts').insert({
        title,
        category,
        description,
        author_name: authorName,
        reading_time: readingTime,
        cost,
        image_url: featured_image_url,
        steps: finalSteps,
        tips: tips.filter(t => t.trim()),
        tools: tools.filter(t => t.trim()),
        user_id: user.id,
        content: description // fallback
      })

      if (error) throw error

      alert('나만의 가이드가 등록되었습니다!')
      router.push('/')
      router.refresh()
    } catch (error: any) {
      console.error(error)
      alert(`등록 실패: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header Bar */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-bold text-sm"
          >
            <ArrowLeft className="w-5 h-5" /> 나가기
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-12 space-y-12">
        {/* Cover Image Section */}
        <section className="bg-white rounded-[3rem] p-10 shadow-xl shadow-blue-900/5 relative overflow-hidden group border border-gray-100">
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black flex items-center gap-3">
                <div className="w-2 h-6 bg-blue-600 rounded-full" />
                커버 이미지 설정
              </h2>
           </div>
           
           <label className="relative block aspect-[21/9] w-full rounded-[2.5rem] bg-gray-50 border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer overflow-hidden group">
              <input type="file" accept="image/*" onChange={handleFeaturedImageChange} className="hidden" />
              {featuredPreview ? (
                <>
                  <img src={featuredPreview} alt="Cover Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex items-center gap-2 text-white font-bold">
                       <Camera className="w-6 h-6" /> 커버 변경하기
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                   <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-blue-600">
                     <ImageIcon className="w-8 h-8" />
                   </div>
                   <p className="font-bold text-lg mb-1">가이드 대표 사진을 등록하세요</p>
                   <p className="text-sm font-medium text-gray-400">가이드 목록에 표시될 썸네일로 사용됩니다.</p>
                </div>
              )}
           </label>
        </section>

        {/* Basic Info Section */}
        <section className="bg-white rounded-[3rem] p-12 shadow-xl shadow-blue-900/5 border border-gray-100">
          <h2 className="text-xl font-black mb-10 flex items-center gap-3">
            <div className="w-2 h-6 bg-blue-600 rounded-full" />
            기본 정보 작성
          </h2>
          <div className="space-y-10">
            <div>
              <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">가이드 제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="어떤 AI 가이드를 공유하고 싶으신가요?"
                className="w-full h-16 px-8 bg-gray-50 border-none rounded-3xl text-2xl font-black focus:ring-4 focus:ring-blue-100 transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">설명 (짧은 한마디)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="이 가이드를 따라하면 무엇을 얻을 수 있나요?"
                className="w-full p-8 bg-gray-50 border-none rounded-[2rem] text-lg font-medium focus:ring-4 focus:ring-blue-100 transition-all shadow-inner resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">카테고리</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-14 px-6 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 font-bold appearance-none shadow-sm"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronRight className="w-5 h-5 rotate-90" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">작성자 명칭</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="예: 마케터 제이"
                  className="w-full h-14 px-6 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 font-bold shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">예상 비용</label>
                <input
                  type="text"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="예: 월 20달러"
                  className="w-full h-14 px-6 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 font-bold shadow-sm"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Steps Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-[1.2rem] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <ChevronRight className="w-6 h-6" />
              </div>
              단계별 상세 가이드
            </h2>
            <button 
              onClick={addStep}
              className="flex items-center gap-2 text-sm font-black text-blue-600 bg-blue-50 px-6 py-3 rounded-2xl hover:bg-blue-100 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" /> 단계 추가
            </button>
          </div>
          
          <div className="space-y-10">
            {steps.map((step, index) => (
              <div key={index} className="bg-white rounded-[3rem] p-10 md:p-14 shadow-xl shadow-blue-900/5 relative overflow-hidden group animate-in zoom-in-95 duration-500 border border-transparent hover:border-blue-100 transition-colors">
                <div className="absolute top-0 left-0 w-16 h-16 bg-blue-50 rounded-br-3xl flex items-center justify-center font-black text-blue-600 text-xl">
                  {index + 1}
                </div>
                
                <button 
                  onClick={() => removeStep(index)}
                  className="absolute top-8 right-8 text-gray-300 hover:text-red-500 transition-colors bg-gray-50 p-2 rounded-xl"
                  title="단계 삭제"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                   <div className="lg:col-span-7 space-y-6">
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => updateStep(index, 'title', e.target.value)}
                        placeholder="이 단계에서 수행할 핵심 내용을 작성하세요"
                        className="w-full bg-transparent border-none text-2xl font-black focus:ring-0 placeholder:text-gray-200"
                      />
                      <textarea
                        value={step.content}
                        onChange={(e) => updateStep(index, 'content', e.target.value)}
                        rows={5}
                        placeholder="상세한 조작 방법이나 노하우를 공유해 주세요. (예: 어떤 버튼을 클릭해야 하는지, 입력할 프롬프트는 무엇인지 등)"
                        className="w-full bg-transparent border-none focus:ring-0 font-medium text-gray-600 leading-relaxed placeholder:text-gray-200 resize-none"
                      />
                   </div>
                   
                   <div className="lg:col-span-5">
                      <label className="relative block h-full min-h-[220px] bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100 hover:border-blue-300 transition-all cursor-pointer overflow-hidden group/img">
                         <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => updateStep(index, 'image_file', e.target.files?.[0])} 
                            className="hidden" 
                         />
                         {step.preview_url ? (
                           <>
                             <img src={step.preview_url} alt="Step Preview" className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white font-black text-sm">이미지 교체</span>
                             </div>
                           </>
                         ) : (
                           <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3">
                                 <Upload className="w-6 h-6 text-blue-600" />
                              </div>
                              <span className="text-xs font-black uppercase tracking-widest text-gray-400">사진 추가</span>
                           </div>
                         )}
                      </label>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Tips & Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-20">
           <section className="bg-white rounded-[3rem] p-12 shadow-xl shadow-blue-900/5 border border-gray-100">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-xl font-black flex items-center gap-3">
                  <div className="w-2 h-6 bg-orange-400 rounded-full" />
                  핵심 팁 리스트
                </h2>
                <button onClick={addTip} className="p-3 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-all"><Plus className="w-5 h-5"/></button>
              </div>
              <div className="space-y-4">
                {tips.map((tip, i) => (
                  <div key={i} className="flex gap-3 group">
                     <input 
                      value={tip}
                      onChange={(e) => updateTip(i, e.target.value)}
                      className="flex-1 h-12 px-5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-orange-100 transition-all"
                      placeholder="단 한줄의 꿀팁!"
                     />
                     <button onClick={() => removeTip(i)} className="text-gray-200 hover:text-red-400 transition-colors"><X className="w-5 h-5"/></button>
                  </div>
                ))}
              </div>
           </section>

           <section className="bg-white rounded-[3rem] p-12 shadow-xl shadow-blue-900/5 border border-gray-100">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-xl font-black flex items-center gap-3">
                  <div className="w-2 h-6 bg-purple-500 rounded-full" />
                  사용된 AI 도구
                </h2>
                <button onClick={addTool} className="p-3 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-all"><Plus className="w-5 h-5"/></button>
              </div>
              <div className="space-y-4">
                {tools.map((tool, i) => (
                  <div key={i} className="flex gap-3 group">
                     <input 
                      value={tool}
                      onChange={(e) => updateTool(i, e.target.value)}
                      className="flex-1 h-12 px-5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-100 transition-all"
                      placeholder="도구 이름(예: Chat GPT)"
                     />
                     <button onClick={() => removeTool(i)} className="text-gray-200 hover:text-red-400 transition-colors"><X className="w-5 h-5"/></button>
                  </div>
                ))}
              </div>
           </section>
        </div>

        {/* Bottom Action Footer */}
        <div className="max-w-2xl mx-auto pt-10 pb-20 text-center space-y-8 animate-in fade-in slide-in-from-bottom-8">
           <div className="inline-flex flex-col items-center px-8 py-4 bg-white rounded-3xl shadow-sm border border-gray-50">
             <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">가이드 예상 소요 시간</span>
             <div className="flex items-center gap-2 text-blue-600">
                <Clock className="w-5 h-5" />
                <span className="text-xl font-black">약 {readingTime}분 분량</span>
             </div>
           </div>

           <div className="space-y-4">
             <button
               onClick={handleSubmit}
               disabled={isLoading}
               className="w-full py-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xl font-black rounded-[2rem] transition-all shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-4 active:scale-95 transform"
             >
               {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
               {isLoading ? '나만의 가이드 저장 중...' : '가이드 성황리에 공유하기'}
             </button>
             <p className="text-gray-400 font-medium text-sm">
               공유된 가이드는 즉시 플랫폼에 노출되어 동료들에게 큰 도움이 됩니다.
             </p>
           </div>
        </div>
      </div>
    </div>
  )
}
