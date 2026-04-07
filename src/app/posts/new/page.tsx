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
  ChevronRight
} from 'lucide-react'

const CATEGORIES = ['전체', '문서작성', '디자인', '멀티미디어', '개발', '마케팅', '데이터분석', '고객관리', '기타']

interface Step {
  title: string;
  content: string;
  image_url: string;
  image_file?: File | null; 
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
  const [featuredImage, setFeaturedImage] = useState<File | null>(null)
  
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

  // Calc Reading Time
  useEffect(() => {
    const totalChars = title.length + 
                       description.length + 
                       steps.reduce((acc, step) => acc + step.title.length + step.content.length, 0)
    // Roughly 200 characters per minute for Korean
    setReadingTime(Math.max(1, Math.ceil(totalChars / 200)))
  }, [title, description, steps])

  // Handlers for dynamic arrays
  const addStep = () => setSteps([...steps, { title: '', content: '', image_url: '' }])
  const removeStep = (index: number) => {
    if (steps.length > 1) setSteps(steps.filter((_, i) => i !== index))
  }
  const updateStep = (index: number, field: keyof Step, value: any) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setSteps(newSteps)
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
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('로그인이 필요합니다.')
        return
      }

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
        content: `본문의 가이드를 참고하세요. (${finalSteps.length}단계 구성)` // legacy field fallback
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
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Dynamic Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">나가기</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-400 font-medium">예상 소요 시간</p>
              <p className="text-sm font-bold text-blue-600">약 {readingTime}분</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? '저장 중' : '가이드 공유하기'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-12">
        <div className="space-y-12">
          {/* Section 1: Basic Info */}
          <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
              <div className="w-2 h-6 bg-blue-600 rounded-full" />
              기본 정보
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-400" /> 카테고리
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-12 px-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" /> 작성자
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="이름을 입력하세요"
                    className="w-full h-12 px-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 오디오북 만들기 가이드"
                  className="w-full h-14 px-6 bg-gray-50 border-none rounded-2xl text-lg font-bold focus:ring-2 focus:ring-blue-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">가이드 설명</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="가이드에 대해 간단히 설명해 주세요"
                  className="w-full p-6 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium resize-none shadow-inner"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" /> 소요 비용
                  </label>
                  <input
                    type="text"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="예: 월 2만원 미만"
                    className="w-full h-12 px-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-gray-400" /> 대표 이미지
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFeaturedImage(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Steps */}
          <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <div className="w-2 h-6 bg-blue-600 rounded-full" />
                단계별 가이드
              </h2>
              <button 
                onClick={addStep}
                className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-4 h-4" /> 단계 추가
              </button>
            </div>
            
            <div className="space-y-8">
              {steps.map((step, index) => (
                <div key={index} className="relative p-8 bg-gray-50 rounded-[2rem] border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
                  <div className="absolute -left-3 top-8 w-10 h-10 bg-white border border-gray-100 shadow-md rounded-xl flex items-center justify-center font-black text-blue-600">
                    {index + 1}
                  </div>
                  <button 
                    onClick={() => removeStep(index)}
                    className="absolute top-8 right-8 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => updateStep(index, 'title', e.target.value)}
                      placeholder="단계 제목 (예: 1단계: 스크립트 준비)"
                      className="w-full bg-transparent border-none text-lg font-bold focus:ring-0 placeholder:text-gray-300"
                    />
                    <textarea
                      value={step.content}
                      onChange={(e) => updateStep(index, 'content', e.target.value)}
                      rows={3}
                      placeholder="상세 내용을 작성하세요"
                      className="w-full bg-transparent border-none focus:ring-0 font-medium text-gray-600 placeholder:text-gray-300 resize-none"
                    />
                    <div className="pt-4 border-t border-gray-200/50 flex items-center gap-4">
                       <ImageIcon className="w-5 h-5 text-gray-300" />
                       <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => updateStep(index, 'image_file', e.target.files?.[0])}
                        className="text-xs text-gray-400 file:hidden"
                      />
                      {step.image_file && <span className="text-xs font-bold text-blue-600">이미지 첨부됨</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Tips & Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold flex items-center gap-3">
                    <div className="w-2 h-6 bg-orange-400 rounded-full" />
                    핵심 팁
                  </h2>
                  <button onClick={addTip} className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Plus className="w-4 h-4"/></button>
                </div>
                <div className="space-y-3">
                  {tips.map((tip, i) => (
                    <div key={i} className="flex gap-2">
                       <input 
                        value={tip}
                        onChange={(e) => updateTip(i, e.target.value)}
                        className="flex-1 h-10 px-4 bg-gray-50 border-none rounded-xl text-sm font-medium"
                        placeholder="팁 입력..."
                       />
                       <button onClick={() => removeTip(i)} className="text-gray-300 hover:text-red-400"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  ))}
                </div>
             </section>

             <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold flex items-center gap-3">
                    <div className="w-2 h-6 bg-purple-500 rounded-full" />
                    사용 도구
                  </h2>
                  <button onClick={addTool} className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Plus className="w-4 h-4"/></button>
                </div>
                <div className="space-y-3">
                  {tools.map((tool, i) => (
                    <div key={i} className="flex gap-2">
                       <input 
                        value={tool}
                        onChange={(e) => updateTool(i, e.target.value)}
                        className="flex-1 h-10 px-4 bg-gray-50 border-none rounded-xl text-sm font-medium"
                        placeholder="도구 이름..."
                       />
                       <button onClick={() => removeTool(i)} className="text-gray-300 hover:text-red-400"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  ))}
                </div>
             </section>
          </div>
        </div>
      </div>
    </div>
  )
}
