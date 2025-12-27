'use client';

import React, { useState, useEffect } from 'react';
import { IMAGE_MODELS, ImageModel, getModelById, getModelsByCategory, getModelRecommendations } from '@/app/lib/image-models';

interface ImageModelSelectorProps {
  selectedModel?: string;
  onModelSelect: (modelId: string) => void;
  aspectRatio?: string;
  className?: string;
}

// Helper functions - defined outside components so they can be shared
const getCategoryIcon = (category: ImageModel['category'] | 'all') => {
  switch (category) {
    case 'animation': return '🎌';
    case 'realistic': return '📷';
    case 'artistic': return '🎨';
    case 'webtoon': return '📚';
    case 'sketch': return '✏️';
    case 'dark': return '🌙';
    case 'all': return '🎯';
    default: return '✨';
  }
};

const getQualityColor = (quality: ImageModel['quality']) => {
  switch (quality) {
    case 'premium': return 'bg-purple-100 text-purple-800';
    case 'standard': return 'bg-blue-100 text-blue-800';
    case 'basic': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getSpeedColor = (speed: ImageModel['speed']) => {
  switch (speed) {
    case 'fast': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'slow': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function ImageModelSelector({
  selectedModel,
  onModelSelect,
  aspectRatio = '16:9',
  className = ''
}: ImageModelSelectorProps) {
  const [models, setModels] = useState<ImageModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, activeCategoryValue] = useState<'all' | ImageModel['category']>('all');
  const [recommendations, setRecommendations] = useState<ImageModel[]>([]);
  const [testPrompt, setTestPrompt] = useState('beautiful landscape with mountains');

  useEffect(() => {
    const compatibleModels = IMAGE_MODELS.filter(model =>
      model.supportedAspectRatios.includes(aspectRatio)
    );
    setModels(compatibleModels);

    // 추천 모델 설정
    const recs = getModelRecommendations(testPrompt, aspectRatio);
    setRecommendations(recs);

    setLoading(false);
  }, [aspectRatio, testPrompt]);

  const categories = [
    { id: 'all', name: '전체', count: models.length },
    { id: 'animation', name: '애니메이션', count: models.filter(m => m.category === 'animation').length },
    { id: 'realistic', name: '사실적', count: models.filter(m => m.category === 'realistic').length },
    { id: 'artistic', name: '아트', count: models.filter(m => m.category === 'artistic').length },
    { id: 'webtoon', name: '웹툰', count: models.filter(m => m.category === 'webtoon').length },
    { id: 'sketch', name: '스케치', count: models.filter(m => m.category === 'sketch').length },
    { id: 'dark', name: '다크', count: models.filter(m => m.category === 'dark').length }
  ];

  const filteredModels = activeCategory === 'all'
    ? models
    : models.filter(m => m.category === activeCategory);

  const handleCategoryChange = (category: typeof activeCategory) => {
    activeCategoryValue(category);
  };

  return (
    <div className={`image-model-selector ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-3">이미지 모델 선택</h3>

        {/* 추천 모델 */}
        {recommendations.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-blue-900">
                🎯 프롬프트에 맞는 추천 모델
              </h4>
              <input
                type="text"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="테스트 프롬프트..."
                className="text-xs px-2 py-1 border border-blue-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {recommendations.map(model => (
                <button
                  key={model.id}
                  onClick={() => onModelSelect(model.id)}
                  className={`px-3 py-1 text-xs rounded-full transition-all ${
                    selectedModel === model.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {getCategoryIcon(model.category)} {model.displayName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 카테고리 탭 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id as any)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                activeCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.id === 'all' ? '🎯' : getCategoryIcon(category.id as any)} {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* 모델 그리드 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-32 rounded-lg mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredModels.map(model => (
            <ModelCard
              key={model.id}
              model={model}
              isSelected={selectedModel === model.id}
              onClick={() => onModelSelect(model.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ModelCardProps {
  model: ImageModel;
  isSelected: boolean;
  onClick: () => void;
}

function ModelCard({ model, isSelected, onClick }: ModelCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentExample, setCurrentExample] = useState(0);

  // 예제 주기적으로 변경
  useEffect(() => {
    if (isHovered && model.styleExamples.length > 1) {
      const interval = setInterval(() => {
        setCurrentExample((prev) => (prev + 1) % model.styleExamples.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isHovered, model.styleExamples.length]);

  return (
    <div
      className={`cursor-pointer transition-all hover:scale-105 ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      }`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`relative border-2 rounded-lg overflow-hidden ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}>
        <div className="p-4">
          {/* 헤더 */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{getCategoryIcon(model.category)}</span>
                <h3 className="font-semibold text-gray-900">{model.displayName}</h3>
              </div>
              <p className="text-sm text-gray-600">{model.description}</p>
            </div>
          </div>

          {/* 태그 */}
          <div className="flex flex-wrap gap-1 mb-3">
            {model.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                {tag}
              </span>
            ))}
          </div>

          {/* 메타 정보 */}
          <div className="flex gap-2 mb-3">
            <span className={`px-2 py-1 text-xs rounded-full ${getQualityColor(model.quality)}`}>
              {model.quality === 'premium' ? '프리미엄' : model.quality === 'standard' ? '표준' : '기본'}
            </span>
            <span className={`px-2 py-1 text-xs rounded-full ${getSpeedColor(model.speed)}`}>
              {model.speed === 'fast' ? '⚡ 빠름' : model.speed === 'medium' ? '🚀 중간' : '🐌 느림'}
            </span>
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
              {model.provider === 'huggingface' ? '🤗 HF' : '🔧 Custom'}
            </span>
          </div>

          {/* 지원 비율 */}
          <div className="text-xs text-gray-500 mb-3">
            지원 비율: {model.supportedAspectRatios.join(', ')}
          </div>

          {/* 예제 프롬프트 */}
          {isHovered && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
              <div className="font-medium text-gray-700 mb-1">예제 프롬프트:</div>
              <div className="text-gray-600 italic">
                "{model.styleExamples[currentExample]}"
              </div>
            </div>
          )}
        </div>

        {/* 선택 상태 표시 */}
        {isSelected && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
            ✓
          </div>
        )}
      </div>
    </div>
  );
}