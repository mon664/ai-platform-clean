'use client';

import React, { useState, useEffect } from 'react';
import { FFMPEG_TRANSITIONS, TransitionEffect } from '@/app/lib/ffmpeg-transitions';

interface TransitionSelectorProps {
  selectedTransition?: string;
  onTransitionSelect: (transitionId: string, parameters: Record<string, any>) => void;
  className?: string;
}

export default function TransitionSelector({
  selectedTransition,
  onTransitionSelect,
  className = ''
}: TransitionSelectorProps) {
  const [transitions, setTransitions] = useState<TransitionEffect[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedTransitionData, setSelectedTransitionData] = useState<TransitionEffect | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});

  useEffect(() => {
    setTransitions(FFMPEG_TRANSITIONS);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedTransition) {
      const transition = transitions.find(t => t.id === selectedTransition);
      if (transition) {
        setSelectedTransitionData(transition);
        // 기본 파라미터 설정
        const defaultParams: Record<string, any> = {};
        (transition.parameters || []).forEach(param => {
          defaultParams[param.name] = param.default;
        });
        setParameters(defaultParams);
      }
    }
  }, [selectedTransition, transitions]);

  const categories = [
    { id: 'all', name: '전체', count: transitions.length },
    { id: 'fade', name: '페이드', count: transitions.filter(t => t.category === 'fade').length },
    { id: 'slide', name: '슬라이드', count: transitions.filter(t => t.category === 'slide').length },
    { id: 'wipe', name: '와이프', count: transitions.filter(t => t.category === 'wipe').length },
    { id: 'zoom', name: '줌', count: transitions.filter(t => t.category === 'zoom').length },
    { id: 'pixel', name: '픽셀', count: transitions.filter(t => t.category === 'pixel').length },
    { id: 'custom', name: '커스텀', count: transitions.filter(t => t.category === 'custom').length }
  ];

  const filteredTransitions = activeCategory === 'all'
    ? transitions
    : transitions.filter(t => t.category === activeCategory);

  const handleTransitionSelect = (transition: TransitionEffect) => {
    setSelectedTransitionData(transition);
    const defaultParams: Record<string, any> = {};
    (transition.parameters || []).forEach(param => {
      defaultParams[param.name] = param.default;
    });
    setParameters(defaultParams);
    onTransitionSelect(transition.id, defaultParams);
  };

  const handleParameterChange = (paramName: string, value: any) => {
    const newParameters = { ...parameters, [paramName]: value };
    setParameters(newParameters);
    if (selectedTransitionData) {
      onTransitionSelect(selectedTransitionData.id, newParameters);
    }
  };

  const getComplexityColor = (complexity: TransitionEffect['complexity']) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: TransitionEffect['category']) => {
    switch (category) {
      case 'fade': return '🌫️';
      case 'slide': return '➡️';
      case 'wipe': return '🧹';
      case 'zoom': return '🔍';
      case 'pixel': return '🟦';
      case 'custom': return '🎨';
      default: return '✨';
    }
  };

  return (
    <div className={`transition-selector ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-3">전환 효과 선택</h3>

        {/* 카테고리 탭 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                activeCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getCategoryIcon(category.id as any)} {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* 전환 효과 격자 */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-video rounded-lg mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTransitions.map(transition => (
            <TransitionCard
              key={transition.id}
              transition={transition}
              isSelected={selectedTransition === transition.id}
              onClick={() => handleTransitionSelect(transition)}
            />
          ))}
        </div>
      )}

      {/* 파라미터 설정 */}
      {selectedTransitionData && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-md font-semibold mb-3">
            {getCategoryIcon(selectedTransitionData.category)} {selectedTransitionData.displayName} 설정
          </h4>
          <p className="text-sm text-gray-600 mb-4">{selectedTransitionData.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedTransitionData.parameters?.map(param => (
              <div key={param.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {param.description}
                </label>

                {param.type === 'select' ? (
                  <select
                    value={parameters[param.name] || ''}
                    onChange={(e) => handleParameterChange(param.name, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {param.options?.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : param.type === 'boolean' ? (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={parameters[param.name] || false}
                      onChange={(e) => handleParameterChange(param.name, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {parameters[param.name] ? '활성' : '비활성'}
                    </span>
                  </div>
                ) : (
                  <input
                    type="number"
                    value={parameters[param.name] || ''}
                    onChange={(e) => handleParameterChange(param.name, parseFloat(e.target.value) || 0)}
                    min={param.min}
                    max={param.max}
                    step={param.min && param.max && (param.max - param.min) / 10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>FFmpeg 필터:</strong> {selectedTransitionData.ffmpegFilter}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface TransitionCardProps {
  transition: TransitionEffect;
  isSelected: boolean;
  onClick: () => void;
}

function TransitionCard({ transition, isSelected, onClick }: TransitionCardProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPreview = async () => {
    if (previewImage) return;

    setLoading(true);
    try {
      const response = await fetch('/api/autovid/transitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transitionId: transition.id,
          parameters: {}
        })
      });

      const data = await response.json();
      if (data.success) {
        setPreviewImage(data.previewImage);
      }
    } catch (error) {
      console.error('Preview loading failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getComplexityColor = (complexity: TransitionEffect['complexity']) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: TransitionEffect['category']) => {
    switch (category) {
      case 'fade': return 'border-purple-300 bg-purple-50';
      case 'slide': return 'border-blue-300 bg-blue-50';
      case 'wipe': return 'border-green-300 bg-green-50';
      case 'zoom': return 'border-red-300 bg-red-50';
      case 'pixel': return 'border-yellow-300 bg-yellow-50';
      case 'custom': return 'border-pink-300 bg-pink-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div
      className={`cursor-pointer transition-all hover:scale-105 ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      }`}
      onClick={onClick}
      onMouseEnter={loadPreview}
    >
      <div className={`relative border-2 rounded-lg overflow-hidden ${getCategoryColor(transition.category)}`}>
        <div className="aspect-video flex items-center justify-center">
          {previewImage ? (
            <img
              src={previewImage}
              alt={transition.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="p-4 text-center">
              <div className="text-2xl mb-2">
                {transition.category === 'fade' && '🌫️'}
                {transition.category === 'slide' && '➡️'}
                {transition.category === 'wipe' && '🧹'}
                {transition.category === 'zoom' && '🔍'}
                {transition.category === 'pixel' && '🟦'}
                {transition.category === 'custom' && '🎨'}
              </div>
              <div className="text-sm font-medium text-gray-800">
                {transition.displayName}
              </div>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <div className="p-3 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-900 truncate">
              {transition.displayName}
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getComplexityColor(transition.complexity)}`}>
              {transition.complexity}
            </span>
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {transition.category} 효과
          </div>
        </div>
      </div>
    </div>
  );
}