// AutoVid 템플릿 시스템
export interface FixedText {
  id: string;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontColor: string;
  fontWeight: string;
  fontStyle?: string;
  textDecoration?: string;
  textAlign: string;
  x: number;
  y: number;
  width: number;
  height: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'triangle';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  rotation?: number;
}

export interface Template {
  id: string;
  name: string;
  displayName: string;
  backgroundColor: string;
  topHeightPercent: number;
  bottomHeightPercent: number;
  fontColor: string;
  titleFontColor: string;
  fontFamily: string;
  titleFontSize: number;
  bodyFontSize: number;
  fixedTexts: FixedText[];
  shapes?: Shape[];
  preview?: string;
  category: 'minimal' | 'storycard' | 'colorful';
  aspectRatio: '16:9' | '9:16' | '1:1';
}

export const AUTVID_TEMPLATES: Template[] = [
  {
    id: 'BLACK',
    name: 'BLACK',
    displayName: '블랙 미니멀',
    backgroundColor: '#000000',
    topHeightPercent: 15,
    bottomHeightPercent: 15,
    fontColor: '#FFFFFF',
    titleFontColor: '#FFFFFF',
    fontFamily: 'Arial, sans-serif',
    titleFontSize: 24,
    bodyFontSize: 18,
    fixedTexts: [],
    category: 'minimal',
    aspectRatio: '16:9'
  },
  {
    id: 'WHITE',
    name: 'WHITE',
    displayName: '화이트 미니멀',
    backgroundColor: '#FFFFFF',
    topHeightPercent: 15,
    bottomHeightPercent: 15,
    fontColor: '#000000',
    titleFontColor: '#000000',
    fontFamily: 'Arial, sans-serif',
    titleFontSize: 24,
    bodyFontSize: 18,
    fixedTexts: [],
    category: 'minimal',
    aspectRatio: '16:9'
  },
  {
    id: 'StoryCard-BeigeBrown',
    name: 'StoryCard-BeigeBrown',
    displayName: '베이지-브라운 스토리카드',
    backgroundColor: '#F5E6D3',
    topHeightPercent: 20,
    bottomHeightPercent: 20,
    fontColor: '#5D4037',
    titleFontColor: '#3E2723',
    fontFamily: 'Georgia, serif',
    titleFontSize: 28,
    bodyFontSize: 20,
    fixedTexts: [],
    shapes: [
      {
        id: 'top-accent',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 20,
        color: '#8D6E63',
        opacity: 0.3
      },
      {
        id: 'bottom-accent',
        type: 'rectangle',
        x: 0,
        y: 80,
        width: 100,
        height: 20,
        color: '#8D6E63',
        opacity: 0.3
      }
    ],
    category: 'storycard',
    aspectRatio: '9:16'
  },
  {
    id: 'StoryCard-BeigeRed',
    name: 'StoryCard-BeigeRed',
    displayName: '베이지-레드 스토리카드',
    backgroundColor: '#FFF8E1',
    topHeightPercent: 20,
    bottomHeightPercent: 20,
    fontColor: '#D32F2F',
    titleFontColor: '#B71C1C',
    fontFamily: 'Georgia, serif',
    titleFontSize: 28,
    bodyFontSize: 20,
    fixedTexts: [],
    shapes: [
      {
        id: 'top-stripe',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 15,
        color: '#D32F2F'
      },
      {
        id: 'bottom-stripe',
        type: 'rectangle',
        x: 0,
        y: 85,
        width: 100,
        height: 15,
        color: '#D32F2F'
      }
    ],
    category: 'storycard',
    aspectRatio: '9:16'
  },
  {
    id: 'StoryCard-BlackPink',
    name: 'StoryCard-BlackPink',
    displayName: '블랙-핑크 스토리카드',
    backgroundColor: '#1A1A1A',
    topHeightPercent: 18,
    bottomHeightPercent: 18,
    fontColor: '#E91E63',
    titleFontColor: '#FF4081',
    fontFamily: 'Arial Black, sans-serif',
    titleFontSize: 30,
    bodyFontSize: 22,
    fixedTexts: [],
    shapes: [
      {
        id: 'pink-accent',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 18,
        color: '#E91E63',
        opacity: 0.8
      }
    ],
    category: 'storycard',
    aspectRatio: '9:16'
  },
  {
    id: 'StoryCard-WhiteBlue',
    name: 'StoryCard-WhiteBlue',
    displayName: '화이트-블루 스토리카드',
    backgroundColor: '#FFFFFF',
    topHeightPercent: 20,
    bottomHeightPercent: 20,
    fontColor: '#1976D2',
    titleFontColor: '#0D47A1',
    fontFamily: 'Helvetica, sans-serif',
    titleFontSize: 26,
    bodyFontSize: 18,
    fixedTexts: [],
    shapes: [
      {
        id: 'blue-border',
        type: 'rectangle',
        x: 2,
        y: 2,
        width: 96,
        height: 96,
        color: 'transparent',
        strokeColor: '#1976D2',
        strokeWidth: 3,
        borderRadius: 8
      }
    ],
    category: 'storycard',
    aspectRatio: '9:16'
  },
  {
    id: 'StoryCard-WhiteGreen',
    name: 'StoryCard-WhiteGreen',
    displayName: '화이트-그린 스토리카드',
    backgroundColor: '#FFFFFF',
    topHeightPercent: 22,
    bottomHeightPercent: 22,
    fontColor: '#2E7D32',
    titleFontColor: '#1B5E20',
    fontFamily: 'Verdana, sans-serif',
    titleFontSize: 24,
    bodyFontSize: 16,
    fixedTexts: [],
    shapes: [
      {
        id: 'green-circle',
        type: 'circle',
        x: 85,
        y: 10,
        width: 10,
        height: 10,
        color: '#4CAF50',
        opacity: 0.7
      }
    ],
    category: 'storycard',
    aspectRatio: '9:16'
  },
  {
    id: 'StoryCard-WhiteRed',
    name: 'StoryCard-WhiteRed',
    displayName: '화이트-레드 스토리카드',
    backgroundColor: '#FAFAFA',
    topHeightPercent: 25,
    bottomHeightPercent: 25,
    fontColor: '#C62828',
    titleFontColor: '#B71C1C',
    fontFamily: 'Times New Roman, serif',
    titleFontSize: 32,
    bodyFontSize: 20,
    fixedTexts: [],
    shapes: [
      {
        id: 'red-line',
        type: 'line',
        x: 10,
        y: 25,
        width: 80,
        height: 2,
        color: '#C62828',
        strokeWidth: 2
      }
    ],
    category: 'storycard',
    aspectRatio: '9:16'
  }
];

export function getTemplateById(id: string): Template | undefined {
  return AUTVID_TEMPLATES.find(template => template.id === id);
}

export function getTemplatesByCategory(category: Template['category']): Template[] {
  return AUTVID_TEMPLATES.filter(template => template.category === category);
}

export function getTemplatesByAspectRatio(aspectRatio: Template['aspectRatio']): Template[] {
  return AUTVID_TEMPLATES.filter(template => template.aspectRatio === aspectRatio);
}

export function applyTemplateToCanvas(template: Template, canvas: HTMLCanvasElement, title: string, body?: string): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 배경색 설정
  ctx.fillStyle = template.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 도형 그리기
  if (template.shapes) {
    template.shapes.forEach(shape => {
      ctx.save();

      const x = (shape.x / 100) * canvas.width;
      const y = (shape.y / 100) * canvas.height;
      const width = (shape.width / 100) * canvas.width;
      const height = (shape.height / 100) * canvas.height;

      if (shape.type === 'rectangle') {
        if (shape.borderRadius && shape.borderRadius > 0) {
          // 둥근 사각형
          const radius = Math.min(width, height) * (shape.borderRadius / 100);
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + width - radius, y);
          ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
          ctx.lineTo(x + width, y + height - radius);
          ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
          ctx.lineTo(x + radius, y + height);
          ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
        } else {
          ctx.beginPath();
          ctx.rect(x, y, width, height);
        }

        if (shape.fill && shape.fill !== 'transparent') {
          ctx.fillStyle = shape.color;
          ctx.fill();
        }

        if (shape.strokeColor && shape.strokeWidth) {
          ctx.strokeStyle = shape.strokeColor;
          ctx.lineWidth = (shape.strokeWidth / 100) * canvas.width;
          ctx.stroke();
        }
      } else if (shape.type === 'circle') {
        ctx.beginPath();
        ctx.arc(x + width/2, y + height/2, Math.min(width, height)/2, 0, 2 * Math.PI);

        if (shape.opacity && shape.opacity < 1) {
          ctx.globalAlpha = shape.opacity;
        }

        ctx.fillStyle = shape.color;
        ctx.fill();
      } else if (shape.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y + height);
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = shape.strokeWidth || 2;
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  // 텍스트 그리기
  ctx.fillStyle = template.fontColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 제목 그리기
  ctx.fillStyle = template.titleFontColor;
  ctx.font = `bold ${template.titleFontSize}px ${template.fontFamily}`;
  const titleY = (template.topHeightPercent / 100) * canvas.height / 2;
  ctx.fillText(title, canvas.width / 2, titleY);

  // 본문 그리기
  if (body) {
    ctx.fillStyle = template.fontColor;
    ctx.font = `${template.bodyFontSize}px ${template.fontFamily}`;
    const bodyY = canvas.height - ((template.bottomHeightPercent / 100) * canvas.height / 2);
    ctx.fillText(body, canvas.width / 2, bodyY);
  }
}