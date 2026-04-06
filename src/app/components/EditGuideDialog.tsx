import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Upload, FileText, Image as ImageIcon, Video, Code } from 'lucide-react';
import { Method } from '../data/methods';

interface EditGuideDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (guide: Method) => void;
  guide: Method;
}

const categories = [
  { id: 'document', label: '문서작성', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  { id: 'design', label: '디자인', icon: ImageIcon, color: 'bg-pink-100 text-pink-700' },
  { id: 'multimedia', label: '멀티미디어', icon: Video, color: 'bg-purple-100 text-purple-700' },
  { id: 'development', label: '개발', icon: Code, color: 'bg-green-100 text-green-700' },
];

export function EditGuideDialog({ isOpen, onClose, onSubmit, guide }: EditGuideDialogProps) {
  const [title, setTitle] = useState(guide.title);
  const [author, setAuthor] = useState(guide.author);
  const [selectedCategory, setSelectedCategory] = useState(guide.tag);
  const [description, setDescription] = useState(guide.description);
  const [steps, setSteps] = useState(guide.steps);
  const [tips, setTips] = useState(guide.tips);
  const [tools, setTools] = useState(guide.tools);
  const [references, setReferences] = useState<{ title: string; url: string }[]>(guide.references || []);
  const [image, setImage] = useState(guide.image);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stepImageInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  useEffect(() => {
    setTitle(guide.title);
    setAuthor(guide.author);
    setSelectedCategory(guide.tag);
    setDescription(guide.description);
    setSteps(guide.steps);
    setTips(guide.tips);
    setTools(guide.tools);
    setReferences(guide.references || []);
    setImage(guide.image);
  }, [guide]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStepImageUpload = (stepIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages: string[] = [];
      let filesProcessed = 0;

      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          filesProcessed++;

          if (filesProcessed === files.length) {
            const newSteps = [...steps];
            newSteps[stepIndex].images = [...(newSteps[stepIndex].images || []), ...newImages];
            setSteps(newSteps);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeStepImage = (stepIndex: number, imageIndex: number) => {
    const newSteps = [...steps];
    newSteps[stepIndex].images = newSteps[stepIndex].images?.filter((_, i) => i !== imageIndex);
    setSteps(newSteps);
  };

  const addStep = () => {
    setSteps([...steps, { title: '', content: '', images: [] }]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, field: 'title' | 'content', value: string) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };

  const addTip = () => {
    setTips([...tips, '']);
  };

  const removeTip = (index: number) => {
    if (tips.length > 1) {
      setTips(tips.filter((_, i) => i !== index));
    }
  };

  const updateTip = (index: number, value: string) => {
    const newTips = [...tips];
    newTips[index] = value;
    setTips(newTips);
  };

  const addTool = () => {
    setTools([...tools, '']);
  };

  const removeTool = (index: number) => {
    if (tools.length > 1) {
      setTools(tools.filter((_, i) => i !== index));
    }
  };

  const updateTool = (index: number, value: string) => {
    const newTools = [...tools];
    newTools[index] = value;
    setTools(newTools);
  };

  const addReference = () => {
    setReferences([...references, { title: '', url: '' }]);
  };

  const removeReference = (index: number) => {
    if (references.length > 1) {
      setReferences(references.filter((_, i) => i !== index));
    }
  };

  const updateReference = (index: number, field: 'title' | 'url', value: string) => {
    const newReferences = [...references];
    newReferences[index][field] = value;
    setReferences(newReferences);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !author || !selectedCategory || !description) {
      alert('제목, 작성자, 카테고리, 설명은 필수 입력 항목입니다.');
      return;
    }

    // Get the tag color based on selected category
    const categoryInfo = categories.find(c => c.label === selectedCategory);
    const tagColor = categoryInfo?.color || guide.tagColor;

    const updatedGuide: Method = {
      ...guide,
      title,
      author,
      tag: selectedCategory,
      tagColor,
      description,
      steps: steps.filter(s => s.title && s.content),
      tips: tips.filter(t => t.trim()),
      tools: tools.filter(t => t.trim()),
      references: references.filter(r => r.title.trim() && r.url.trim()),
      image,
    };

    onSubmit(updatedGuide);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 flex items-center justify-between rounded-t-2xl">
                  <h2 className="text-2xl font-semibold text-white">가이드 수정</h2>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="px-8 py-6 space-y-8">
                  {/* 기본 정보 */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-gray-900">기본 정보</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        제목 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="예: ChatGPT로 업무 효율 3배 올리기"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        작성자 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="이름을 입력하세요"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        카테고리 <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {categories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => setSelectedCategory(category.label)}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              selectedCategory === category.label
                                ? `${category.color} border-current`
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <category.icon className="w-6 h-6 mx-auto mb-2" />
                            <div className="text-sm font-medium">{category.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        설명 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="이 가이드에 대한 간단한 설명을 작성해주세요"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        대표 이미지 (선택)
                      </label>
                      <div className="space-y-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
                        >
                          <Upload className="w-5 h-5" />
                          이미지 업로드
                        </button>
                        {image && (
                          <div className="relative rounded-lg overflow-hidden border border-gray-200">
                            <img src={image} alt="Preview" className="w-full h-48 object-cover" />
                            <button
                              type="button"
                              onClick={() => setImage(undefined)}
                              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-lg p-2 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 단계별 가이드 */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg text-gray-900">단계별 가이드</h3>
                      <button
                        type="button"
                        onClick={addStep}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        단계 추가
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {steps.map((step, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">단계 {index + 1}</span>
                            {steps.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeStep(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => updateStep(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="단계 제목 (예: 1단계: 주제 리서치)"
                          />
                          <textarea
                            value={step.content}
                            onChange={(e) => updateStep(index, 'content', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                            placeholder="단계별 상세 설명을 작성해주세요"
                          />
                          
                          {/* Step Images */}
                          <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-600">
                              단계별 이미지 (선택, 여러 장 가능)
                            </label>
                            
                            {step.images && step.images.length > 0 && (
                              <div className="grid grid-cols-2 gap-2">
                                {step.images.map((img, imgIndex) => (
                                  <div key={imgIndex} className="relative rounded-lg overflow-hidden border border-gray-200 group">
                                    <img src={img} alt={`Step ${index + 1} Image ${imgIndex + 1}`} className="w-full h-32 object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => removeStepImage(index, imgIndex)}
                                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-lg p-1.5 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <input
                              ref={(el) => { stepImageInputRefs.current[index] = el; }}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleStepImageUpload(index, e)}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => stepImageInputRefs.current[index]?.click()}
                              className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600 text-sm"
                            >
                              <Upload className="w-4 h-4" />
                              {step.images && step.images.length > 0 ? '이미지 더 추가' : '이미지 업로드'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 팁 */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg text-gray-900">실전 팁</h3>
                      <button
                        type="button"
                        onClick={addTip}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        팁 추가
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {tips.map((tip, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={tip}
                            onChange={(e) => updateTip(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="팁을 입력하세요"
                          />
                          {tips.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTip(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 추천 도구 */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg text-gray-900">추천 도구</h3>
                      <button
                        type="button"
                        onClick={addTool}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        도구 추가
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {tools.map((tool, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={tool}
                            onChange={(e) => updateTool(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="도구 이름 (예: ChatGPT, Notion)"
                          />
                          {tools.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTool(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 참고 자료 */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg text-gray-900">참고 자료</h3>
                      <button
                        type="button"
                        onClick={addReference}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        자료 추가
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {references.map((reference, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={reference.title}
                            onChange={(e) => updateReference(index, 'title', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="자료 제목"
                          />
                          <input
                            type="text"
                            value={reference.url}
                            onChange={(e) => updateReference(index, 'url', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="자료 URL"
                          />
                          {references.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeReference(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 제출 버튼 */}
                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors font-medium"
                    >
                      수정 완료
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}