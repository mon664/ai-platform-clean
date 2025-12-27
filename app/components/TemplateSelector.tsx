'use client';

import React, { useState, useEffect } from 'react';
import { AUTVID_TEMPLATES, Template } from '@/app/lib/autovid-templates';

interface TemplateSelectorProps {
  selectedTemplate?: string;
  onTemplateSelect: (templateId: string) => void;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  className?: string;
}

export default function TemplateSelector({
  selectedTemplate,
  onTemplateSelect,
  aspectRatio = '16:9',
  className = ''
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'all' | 'minimal' | 'storycard'>('all');

  useEffect(() => {
    // 비율에 맞는 템플릿 필터링
    const filteredTemplates = aspectRatio
      ? AUTVID_TEMPLATES.filter(t => t.aspectRatio === aspectRatio)
      : AUTVID_TEMPLATES;

    setTemplates(filteredTemplates);
    setLoading(false);
  }, [aspectRatio]);

  const categories = [
    { id: 'all', name: '전체', count: templates.length },
    { id: 'minimal', name: '미니멀', count: templates.filter(t => t.category === 'minimal').length },
    { id: 'storycard', name: '스토리카드', count: templates.filter(t => t.category === 'storycard').length }
  ];

  const filteredTemplates = activeCategory === 'all'
    ? templates
    : templates.filter(t => t.category === activeCategory);

  return (
    <div className={`template-selector ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-3">템플릿 선택</h3>

        {/* 카테고리 탭 */}
        <div className="flex gap-2 mb-4">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* 템플릿 격자 */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-video rounded-lg mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-1"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplate === template.id}
              onClick={() => onTemplateSelect(template.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onClick: () => void;
}

function TemplateCard({ template, isSelected, onClick }: TemplateCardProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPreview = async () => {
    if (previewImage) return;

    setLoading(true);
    try {
      const response = await fetch('/api/autovid/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          title: '미리보기',
          body: '샘플 텍스트',
          width: 400,
          height: 300
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

  const getTemplateColor = (template: Template) => {
    if (template.category === 'minimal') {
      return template.id === 'BLACK' ? 'border-gray-900' : 'border-gray-200';
    }
    return template.name.includes('Red') ? 'border-red-300' :
           template.name.includes('Blue') ? 'border-blue-300' :
           template.name.includes('Green') ? 'border-green-300' :
           template.name.includes('Pink') ? 'border-pink-300' : 'border-yellow-200';
  };

  return (
    <div
      className={`cursor-pointer transition-all hover:scale-105 ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      }`}
      onClick={onClick}
      onMouseEnter={loadPreview}
    >
      <div className={`relative border-2 rounded-lg overflow-hidden ${getTemplateColor(template)}`}>
        <div
          className="aspect-video flex items-center justify-center text-white text-xs font-medium"
          style={{ backgroundColor: template.backgroundColor }}
        >
          {previewImage ? (
            <img
              src={previewImage}
              alt={template.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="p-2 text-center">
              <div className="text-xs mb-1" style={{ color: template.fontColor }}>
                {template.displayName}
              </div>
              <div className="text-xs opacity-75" style={{ color: template.fontColor }}>
                {template.aspectRatio}
              </div>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <div className="p-2 bg-white">
          <div className="text-sm font-medium text-gray-900 truncate">
            {template.displayName}
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {template.category}
          </div>
        </div>
      </div>
    </div>
  );
}