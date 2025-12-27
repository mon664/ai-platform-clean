// FFmpeg 전환 효과 60개
export interface TransitionEffect {
  id: string;
  name: string;
  displayName: string;
  category: 'fade' | 'slide' | 'wipe' | 'zoom' | 'rotate' | 'pixel' | 'custom';
  duration?: number;
  complexity: 'simple' | 'medium' | 'complex';
  description: string;
  ffmpegFilter?: string;
  parameters?: {
    name: string;
    type: 'number' | 'select' | 'boolean';
    default: any;
    min?: number;
    max?: number;
    options?: string[];
    description: string;
  }[];
}

export const FFMPEG_TRANSITIONS: TransitionEffect[] = [
  // Fade 효과 (8개)
  {
    id: 'fade',
    name: 'fade',
    displayName: '페이드',
    category: 'fade',
    complexity: 'simple',
    description: '부드러운 페이드 인/아웃 효과',
    ffmpegFilter: 'fade={direction}:t={duration}',
    parameters: [
      {
        name: 'direction',
        type: 'select',
        default: 'in',
        options: ['in', 'out', 'inout'],
        description: '페이드 방향'
      },
      {
        name: 'duration',
        type: 'number',
        default: 1.0,
        min: 0.1,
        max: 5.0,
        description: '페이드 지속시간 (초)'
      }
    ]
  },
  {
    id: 'crossfade',
    name: 'crossfade',
    displayName: '크로스페이드',
    category: 'fade',
    complexity: 'simple',
    description: '두 클립 간 부드러운 크로스페이드',
    ffmpegFilter: 'xfade=transition=fade:duration={duration}:offset={offset}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.0,
        min: 0.5,
        max: 3.0,
        description: '전환 지속시간 (초)'
      },
      {
        name: 'offset',
        type: 'number',
        default: 0,
        min: 0,
        max: 10,
        description: '오프셋 (초)'
      }
    ]
  },
  {
    id: 'dissolve',
    name: 'dissolve',
    displayName: '디졸브',
    category: 'fade',
    complexity: 'simple',
    description: '서서히 사라지는 디졸브 효과',
    ffmpegFilter: 'xfade=transition=dissolve:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.5,
        min: 0.5,
        max: 4.0,
        description: '디졸브 지속시간 (초)'
      }
    ]
  },
  {
    id: 'fadeblack',
    name: 'fadeblack',
    displayName: '블랙 페이드',
    category: 'fade',
    complexity: 'simple',
    description: '검은 화면으로 페이드',
    ffmpegFilter: 'xfade=transition=fade:duration={duration}:color=black',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.0,
        min: 0.5,
        max: 3.0,
        description: '페이드 지속시간 (초)'
      }
    ]
  },
  {
    id: 'fadewhite',
    name: 'fadewhite',
    displayName: '화이트 페이드',
    category: 'fade',
    complexity: 'simple',
    description: '흰 화면으로 페이드',
    ffmpegFilter: 'xfade=transition=fade:duration={duration}:color=white',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.0,
        min: 0.5,
        max: 3.0,
        description: '페이드 지속시간 (초)'
      }
    ]
  },
  {
    id: 'alphafade',
    name: 'alphafade',
    displayName: '알파 페이드',
    category: 'fade',
    complexity: 'medium',
    description: '알파 채널 페이드 효과',
    ffmpegFilter: 'alphafade={direction}:st={start}:d={duration}:a={alpha}',
    parameters: [
      {
        name: 'direction',
        type: 'select',
        default: 'in',
        options: ['in', 'out'],
        description: '페이드 방향'
      },
      {
        name: 'start',
        type: 'number',
        default: 0,
        min: 0,
        max: 100,
        description: '시작 시간 (프레임)'
      },
      {
        name: 'duration',
        type: 'number',
        default: 25,
        min: 1,
        max: 100,
        description: '지속시간 (프레임)'
      },
      {
        name: 'alpha',
        type: 'boolean',
        default: true,
        description: '알파 채널 사용'
      }
    ]
  },
  {
    id: 'lumafade',
    name: 'lumafade',
    displayName: '루마 페이드',
    category: 'fade',
    complexity: 'medium',
    description: '밝기 기반 페이드 효과',
    ffmpegFilter: 'xfade=transition=lumakey:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 2.0,
        min: 0.5,
        max: 5.0,
        description: '전환 지속시간 (초)'
      }
    ]
  },
  {
    id: 'smoothfade',
    name: 'smoothfade',
    displayName: '부드러운 페이드',
    category: 'fade',
    complexity: 'medium',
    description: '매끄러운 곡선 페이드',
    ffmpegFilter: 'curves=all="{preset}"',
    parameters: [
      {
        name: 'preset',
        type: 'select',
        default: 'color_negative',
        options: ['color_negative', 'cross_process', 'darker', 'increase_contrast', 'lighter', 'linear_contrast', 'medium_contrast', 'negative', 'strong_contrast', 'vintage'],
        description: '커브 프리셋'
      }
    ]
  },

  // Slide 효과 (10개)
  {
    id: 'slideleft',
    name: 'slideleft',
    displayName: '좌측 슬라이드',
    category: 'slide',
    complexity: 'simple',
    description: '왼쪽으로 슬라이드',
    ffmpegFilter: 'xfade=transition=slideleft:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.0,
        min: 0.5,
        max: 3.0,
        description: '슬라이드 지속시간 (초)'
      }
    ]
  },
  {
    id: 'slideright',
    name: 'slideright',
    displayName: '우측 슬라이드',
    category: 'slide',
    complexity: 'simple',
    description: '오른쪽으로 슬라이드',
    ffmpegFilter: 'xfade=transition=slideright:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.0,
        min: 0.5,
        max: 3.0,
        description: '슬라이드 지속시간 (초)'
      }
    ]
  },
  {
    id: 'slideup',
    name: 'slideup',
    displayName: '상단 슬라이드',
    category: 'slide',
    complexity: 'simple',
    description: '위쪽으로 슬라이드',
    ffmpegFilter: 'xfade=transition=slideup:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.0,
        min: 0.5,
        max: 3.0,
        description: '슬라이드 지속시간 (초)'
      }
    ]
  },
  {
    id: 'slidedown',
    name: 'slidedown',
    displayName: '하단 슬라이드',
    category: 'slide',
    complexity: 'simple',
    description: '아래쪽으로 슬라이드',
    ffmpegFilter: 'xfade=transition=slidedown:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.0,
        min: 0.5,
        max: 3.0,
        description: '슬라이드 지속시간 (초)'
      }
    ]
  },
  {
    id: 'pushleft',
    name: 'pushleft',
    displayName: '좌측 푸시',
    category: 'slide',
    complexity: 'simple',
    description: '왼쪽으로 밀어내기',
    ffmpegFilter: 'xfade=transition=pushleft:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.0,
        min: 0.5,
        max: 3.0,
        description: '푸시 지속시간 (초)'
      }
    ]
  },
  {
    id: 'pushright',
    name: 'pushright',
    displayName: '우측 푸시',
    category: 'slide',
    complexity: 'simple',
    description: '오른쪽으로 밀어내기',
    ffmpegFilter: 'xfade=transition=pushright:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.0,
        min: 0.5,
        max: 3.0,
        description: '푸시 지속시간 (초)'
      }
    ]
  },
  {
    id: 'coverleft',
    name: 'coverleft',
    displayName: '좌측 커버',
    category: 'slide',
    complexity: 'simple',
    description: '왼쪽에서 덮기',
    ffmpegFilter: 'xfade=transition=coverleft:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.0,
        min: 0.5,
        max: 3.0,
        description: '커버 지속시간 (초)'
      }
    ]
  },
  {
    id: 'coverright',
    name: 'coverright',
    displayName: '우측 커버',
    category: 'slide',
    complexity: 'simple',
    description: '오른쪽에서 덮기',
    ffmpegFilter: 'xfade=transition=coverright:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.0,
        min: 0.5,
        max: 3.0,
        description: '커버 지속시간 (초)'
      }
    ]
  },
  {
    id: 'coverup',
    name: 'coverup',
    displayName: '상단 커버',
    category: 'slide',
    complexity: 'simple',
    description: '위쪽에서 덮기',
    ffmpegFilter: 'xfade=transition=coverup:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.0,
        min: 0.5,
        max: 3.0,
        description: '커버 지속시간 (초)'
      }
    ]
  },
  {
    id: 'coverdown',
    name: 'coverdown',
    displayName: '하단 커버',
    category: 'slide',
    complexity: 'simple',
    description: '아래쪽에서 덮기',
    ffmpegFilter: 'xfade=transition=coverdown:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.0,
        min: 0.5,
        max: 3.0,
        description: '커버 지속시간 (초)'
      }
    ]
  },

  // Wipe 효과 (12개)
  {
    id: 'wipeleft',
    name: 'wipeleft',
    displayName: '좌측 와이프',
    category: 'wipe',
    complexity: 'simple',
    description: '왼쪽으로 와이프',
    ffmpegFilter: 'xfade=transition=wipeleft:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.0,
        min: 0.5,
        max: 3.0,
        description: '와이프 지속시간 (초)'
      }
    ]
  },
  {
    id: 'wiperight',
    name: 'wiperight',
    displayName: '우측 와이프',
    category: 'wipe',
    complexity: 'simple',
    description: '오른쪽으로 와이프',
    ffmpegFilter: 'xfade=transition=wiperight:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.0,
        min: 0.5,
        max: 3.0,
        description: '와이프 지속시간 (초)'
      }
    ]
  },
  {
    id: 'wipeup',
    name: 'wipeup',
    displayName: '상단 와이프',
    category: 'wipe',
    complexity: 'simple',
    description: '위쪽으로 와이프',
    ffmpegFilter: 'xfade=transition=wipeup:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.0,
        min: 0.5,
        max: 3.0,
        description: '와이프 지속시간 (초)'
      }
    ]
  },
  {
    id: 'wipedown',
    name: 'wipedown',
    displayName: '하단 와이프',
    category: 'wipe',
    complexity: 'simple',
    description: '아래쪽으로 와이프',
    ffmpegFilter: 'xfade=transition=wipedown:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.0,
        min: 0.5,
        max: 3.0,
        description: '와이프 지속시간 (초)'
      }
    ]
  },
  {
    id: 'radial',
    name: 'radial',
    displayName: '방사형 와이프',
    category: 'wipe',
    complexity: 'medium',
    description: '원형 방사형 와이프',
    ffmpegFilter: 'xfade=transition=radial:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.5,
        min: 0.5,
        max: 4.0,
        description: '와이프 지속시간 (초)'
      }
    ]
  },
  {
    id: 'circleopen',
    name: 'circleopen',
    displayName: '원형 열기',
    category: 'wipe',
    complexity: 'medium',
    description: '원형으로 열리는 효과',
    ffmpegFilter: 'xfade=transition=circleopen:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.5,
        min: 0.5,
        max: 4.0,
        description: '전환 지속시간 (초)'
      }
    ]
  },
  {
    id: 'circleclose',
    name: 'circleclose',
    displayName: '원형 닫기',
    category: 'wipe',
    complexity: 'medium',
    description: '원형으로 닫히는 효과',
    ffmpegFilter: 'xfade=transition=circleclose:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.5,
        min: 0.5,
        max: 4.0,
        description: '전환 지속시간 (초)'
      }
    ]
  },
  {
    id: 'rectwipe',
    name: 'rectwipe',
    displayName: '사각 와이프',
    category: 'wipe',
    complexity: 'medium',
    description: '사각형 와이프 효과',
    ffmpegFilter: 'xfade=transition=rectwipe:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.5,
        min: 0.5,
        max: 4.0,
        description: '와이프 지속시간 (초)'
      }
    ]
  },
  {
    id: 'diagtl',
    name: 'diagtl',
    displayName: '좌상단 대각선',
    category: 'wipe',
    complexity: 'medium',
    description: '좌측 상단 대각선 와이프',
    ffmpegFilter: 'xfade=transition=diagtl:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.5,
        min: 0.5,
        max: 4.0,
        description: '대각선 지속시간 (초)'
      }
    ]
  },
  {
    id: 'diagtr',
    name: 'diagtr',
    displayName: '우상단 대각선',
    category: 'wipe',
    complexity: 'medium',
    description: '우측 상단 대각선 와이프',
    ffmpegFilter: 'xfade=transition=diagtr:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.5,
        min: 0.5,
        max: 4.0,
        description: '대각선 지속시간 (초)'
      }
    ]
  },
  {
    id: 'diagbl',
    name: 'diagbl',
    displayName: '좌하단 대각선',
    category: 'wipe',
    complexity: 'medium',
    description: '좌측 하단 대각선 와이프',
    ffmpegFilter: 'xfade=transition=diagbl:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.5,
        min: 0.5,
        max: 4.0,
        description: '대각선 지속시간 (초)'
      }
    ]
  },
  {
    id: 'diagbr',
    name: 'diagbr',
    displayName: '우하단 대각선',
    category: 'wipe',
    complexity: 'medium',
    description: '우측 하단 대각선 와이프',
    ffmpegFilter: 'xfade=transition=diagbr:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.5,
        min: 0.5,
        max: 4.0,
        description: '대각선 지속시간 (초)'
      }
    ]
  },

  // Zoom 효과 (8개)
  {
    id: 'zoomin',
    name: 'zoomin',
    displayName: '확대',
    category: 'zoom',
    complexity: 'simple',
    description: '확대 전환 효과',
    ffmpegFilter: 'xfade=transition=zoomin:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.5,
        min: 0.5,
        max: 4.0,
        description: '줌 지속시간 (초)'
      }
    ]
  },
  {
    id: 'zoomout',
    name: 'zoomout',
    displayName: '축소',
    category: 'zoom',
    complexity: 'simple',
    description: '축소 전환 효과',
    ffmpegFilter: 'xfade=transition=zoomout:duration={duration}',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        default: 1.5,
        min: 0.5,
        max: 4.0,
        description: '줌 지속시간 (초)'
      }
    ]
  },
  {
    id: 'smoothzoom',
    name: 'smoothzoom',
    displayName: '부드러운 줌',
    category: 'zoom',
    complexity: 'medium',
    description: '부드러운 줌 전환',
    ffmpegFilter: 'zoompan=z={zoom}:x={x}:y={y}:d={duration}',
    parameters: [
      {
        name: 'zoom',
        type: 'number',
        default: 1.2,
        min: 0.5,
        max: 3.0,
        description: '줌 레벨'
      },
      {
        name: 'x',
        type: 'number',
        default: 'iw/2',
        description: 'X 좌표'
      },
      {
        name: 'y',
        type: 'number',
        default: 'ih/2',
        description: 'Y 좌표'
      },
      {
        name: 'duration',
        type: 'number',
        default: 2.0,
        min: 0.5,
        max: 5.0,
        description: '줌 지속시간 (초)'
      }
    ]
  },
  {
    id: 'whipzoom',
    name: 'whipzoom',
    displayName: '휩 줌',
    category: 'zoom',
    complexity: 'complex',
    description: '빠른 휩 줌 전환',
    ffmpegFilter: 'scale=w={scale}:h={scale}:flags=neighbor:interl=-1',
    parameters: [
      {
        name: 'scale',
        type: 'number',
        default: 2.0,
        min: 1.0,
        max: 5.0,
        description: '스케일 배수'
      }
    ]
  },
  {
    id: 'fisheye',
    name: 'fisheye',
    displayName: '어안 렌즈',
    category: 'zoom',
    complexity: 'complex',
    description: '어안 렌즈 효과',
    ffmpegFilter: 'lenscorrection=cx={cx}:cy={cy}:k1={k1}:k2={k2}',
    parameters: [
      {
        name: 'cx',
        type: 'number',
        default: 0.5,
        min: 0,
        max: 1,
        description: '중심 X'
      },
      {
        name: 'cy',
        type: 'number',
        default: 0.5,
        min: 0,
        max: 1,
        description: '중심 Y'
      },
      {
        name: 'k1',
        type: 'number',
        default: 0.5,
        min: -2,
        max: 2,
        description: '왜곡 계수 1'
      },
      {
        name: 'k2',
        type: 'number',
        default: 0.2,
        min: -1,
        max: 1,
        description: '왜곡 계수 2'
      }
    ]
  },
  {
    id: 'magnify',
    name: 'magnify',
    displayName: '돋보기',
    category: 'zoom',
    complexity: 'complex',
    description: '돋보기 효과',
    ffmpegFilter: 'magnify=m={magnification}:x={x}:y={y}:w={width}:h={height}',
    parameters: [
      {
        name: 'magnification',
        type: 'number',
        default: 2.0,
        min: 1.0,
        max: 5.0,
        description: '확대 배수'
      },
      {
        name: 'x',
        type: 'number',
        default: 'iw/4',
        description: 'X 위치'
      },
      {
        name: 'y',
        type: 'number',
        default: 'ih/4',
        description: 'Y 위치'
      },
      {
        name: 'width',
        type: 'number',
        default: 'iw/2',
        description: '너비'
      },
      {
        name: 'height',
        type: 'number',
        default: 'ih/2',
        description: '높이'
      }
    ]
  },
  {
    id: 'perspective',
    name: 'perspective',
    displayName: '원근감',
    category: 'zoom',
    complexity: 'complex',
    description: '원근감 변환',
    ffmpegFilter: 'perspective={parameters}',
    parameters: [
      {
        name: 'parameters',
        type: 'select',
        default: '0:0:W:0:0:H:W:H',
        options: ['0:0:W:0:0:H:W:H', 'x0:y0:x1:y1:x2:y2:x3:y3'],
        description: '원근감 파라미터'
      }
    ]
  },
  {
    id: 'polar',
    name: 'polar',
    displayName: '극좌표',
    category: 'zoom',
    complexity: 'complex',
    description: '극좌표 변환',
    ffmpegFilter: 'geq=lum=lum(X,Y):cb=cb(X,Y):cr=cr(X,Y)',
    parameters: [
      {
        name: 'r',
        type: 'number',
        default: 2,
        min: 1,
        max: 10,
        description: '반경'
      },
      {
        name: 'a',
        type: 'number',
        default: 0,
        min: 0,
        max: 360,
        description: '각도'
      }
    ]
  },

  // Pixel 효과 (8개)
  {
    id: 'pixelize',
    name: 'pixelize',
    displayName: '픽셀화',
    category: 'pixel',
    complexity: 'simple',
    description: '픽셀화 효과',
    ffmpegFilter: 'pixelize={width}:{height}',
    parameters: [
      {
        name: 'width',
        type: 'number',
        default: 10,
        min: 2,
        max: 100,
        description: '픽셀 너비'
      },
      {
        name: 'height',
        type: 'number',
        default: 10,
        min: 2,
        max: 100,
        description: '픽셀 높이'
      }
    ]
  },
  {
    id: 'despill',
    name: 'despill',
    displayName: '디스필',
    category: 'pixel',
    complexity: 'medium',
    description: '그린 스크린 디스필',
    ffmpegFilter: 'colorkey={color}:similarity={similarity}:blend={blend}',
    parameters: [
      {
        name: 'color',
        type: 'select',
        default: 'green',
        options: ['green', 'blue', 'red'],
        description: '제거할 색상'
      },
      {
        name: 'similarity',
        type: 'number',
        default: 0.3,
        min: 0.1,
        max: 1.0,
        description: '유사도 임계값'
      },
      {
        name: 'blend',
        type: 'number',
        default: 0.0,
        min: 0.0,
        max: 1.0,
        description: '블렌딩 값'
      }
    ]
  },
  {
    id: 'chromahold',
    name: 'chromahold',
    displayName: '색상 유지',
    category: 'pixel',
    complexity: 'medium',
    description: '특정 색상만 유지',
    ffmpegFilter: 'chromahold={color}:similarity={similarity}:blend={blend}',
    parameters: [
      {
        name: 'color',
        type: 'select',
        default: 'red',
        options: ['red', 'green', 'blue', 'yellow', 'magenta', 'cyan'],
        description: '유지할 색상'
      },
      {
        name: 'similarity',
        type: 'number',
        default: 0.3,
        min: 0.1,
        max: 1.0,
        description: '유사도'
      }
    ]
  },
  {
    id: 'colorbalance',
    name: 'colorbalance',
    displayName: '색상 밸런스',
    category: 'pixel',
    complexity: 'medium',
    description: '색상 밸런스 조정',
    ffmpegFilter: 'colorbalance=rs={rs}:gs={gs}:bs={bs}:rm={rm}:gm={gm}:bm={bm}:rh={rh}:gh={gh}:bh={bh}',
    parameters: [
      {
        name: 'rs',
        type: 'number',
        default: 0,
        min: -1,
        max: 1,
        description: '빨강 색도 그림자'
      },
      {
        name: 'gs',
        type: 'number',
        default: 0,
        min: -1,
        max: 1,
        description: '초록 색도 그림자'
      },
      {
        name: 'bs',
        type: 'number',
        default: 0,
        min: -1,
        max: 1,
        description: '파랑 색도 그림자'
      }
    ]
  },
  {
    id: 'colorchannelmixer',
    name: 'colorchannelmixer',
    displayName: '색상 채널 믹서',
    category: 'pixel',
    complexity: 'complex',
    description: 'RGB 채널 믹싱',
    ffmpegFilter: 'colorchannelmixer={parameters}',
    parameters: [
      {
        name: 'parameters',
        type: 'select',
        default: 'rr=1:gg=1:bb=1',
        options: ['rr=1:gg=1:bb=1', 'rr=0:gg=1:bb=0', 'rr=1:gg=0:bb=1', 'rr=0:gg=1:bb=1'],
        description: '채널 믹싱 파라미터'
      }
    ]
  },
  {
    id: 'colormap',
    name: 'colormap',
    displayName: '색상 맵',
    category: 'pixel',
    complexity: 'medium',
    description: '색상 맵 적용',
    ffmpegFilter: 'colormap={map}',
    parameters: [
      {
        name: 'map',
        type: 'select',
        default: 'viridis',
        options: ['viridis', 'inferno', 'magma', 'plasma', 'parula', 'jet', 'hot', 'cool', 'rainbow'],
        description: '색상 맵 종류'
      }
    ]
  },
  {
    id: 'vibrance',
    name: 'vibrance',
    displayName: '채도 강조',
    category: 'pixel',
    complexity: 'simple',
    description: '채도 보정 및 강조',
    ffmpegFilter: 'vibrance=intensity={intensity}',
    parameters: [
      {
        name: 'intensity',
        type: 'number',
        default: 0.5,
        min: -2,
        max: 2,
        description: '채도 강도'
      }
    ]
  },
  {
    id: 'eq',
    name: 'eq',
    displayName: '이퀄라이저',
    category: 'pixel',
    complexity: 'medium',
    description: '밝기/채도/대비 조정',
    ffmpegFilter: 'eq=brightness={brightness}:contrast={contrast}:saturation={saturation}:gamma={gamma}',
    parameters: [
      {
        name: 'brightness',
        type: 'number',
        default: 0,
        min: -1,
        max: 1,
        description: '밝기'
      },
      {
        name: 'contrast',
        type: 'number',
        default: 1,
        min: -2,
        max: 2,
        description: '대비'
      },
      {
        name: 'saturation',
        type: 'number',
        default: 1,
        min: 0,
        max: 3,
        description: '채도'
      },
      {
        name: 'gamma',
        type: 'number',
        default: 1,
        min: 0.1,
        max: 3,
        description: '감마'
      }
    ]
  },

  // Custom 효과 (14개)
  {
    id: 'hlslice',
    name: 'hlslice',
    displayName: '수평 슬라이스',
    category: 'custom',
    complexity: 'medium',
    description: '수평 슬라이스 효과',
    ffmpegFilter: 'crop=h={height}:y={y_position}',
    parameters: [
      {
        name: 'height',
        type: 'number',
        default: 100,
        min: 10,
        max: 500,
        description: '슬라이스 높이'
      },
      {
        name: 'y_position',
        type: 'number',
        default: 0,
        min: 0,
        max: 1000,
        description: 'Y 위치'
      }
    ]
  },
  {
    id: 'hrslice',
    name: 'hrslice',
    displayName: '수직 슬라이스',
    category: 'custom',
    complexity: 'medium',
    description: '수직 슬라이스 효과',
    ffmpegFilter: 'crop=w={width}:x={x_position}',
    parameters: [
      {
        name: 'width',
        type: 'number',
        default: 100,
        min: 10,
        max: 500,
        description: '슬라이스 너비'
      },
      {
        name: 'x_position',
        type: 'number',
        default: 0,
        min: 0,
        max: 1000,
        description: 'X 위치'
      }
    ]
  },
  {
    id: 'glitch',
    name: 'glitch',
    displayName: '글리치',
    category: 'custom',
    complexity: 'complex',
    description: '디지털 글리치 효과',
    ffmpegFilter: 'cellauto=fifo=random:random_fill=prob={probability}:ratio={ratio}',
    parameters: [
      {
        name: 'probability',
        type: 'number',
        default: 0.5,
        min: 0.1,
        max: 1.0,
        description: '글리치 확률'
      },
      {
        name: 'ratio',
        type: 'number',
        default: 0.5,
        min: 0.1,
        max: 1.0,
        description: '글리치 비율'
      }
    ]
  },
  {
    id: 'noise',
    name: 'noise',
    displayName: '노이즈',
    category: 'custom',
    complexity: 'simple',
    description: '노이즈 추가',
    ffmpegFilter: 'noise=c0s={c0s}:c1s={c1s}:allf=t',
    parameters: [
      {
        name: 'c0s',
        type: 'number',
        default: 10,
        min: 0,
        max: 100,
        description: 'Y 채널 노이즈'
      },
      {
        name: 'c1s',
        type: 'number',
        default: 10,
        min: 0,
        max: 100,
        description: 'UV 채널 노이즈'
      }
    ]
  },
  {
    id: 'filmgrain',
    name: 'filmgrain',
    displayName: '필름 그레인',
    category: 'custom',
    complexity: 'medium',
    description: '필름 그레인 효과',
    ffmpegFilter: 'gradfun=radius={radius}:strength={strength}',
    parameters: [
      {
        name: 'radius',
        type: 'number',
        default: 16,
        min: 4,
        max: 32,
        description: '반경'
      },
      {
        name: 'strength',
        type: 'number',
        default: 0.5,
        min: 0.1,
        max: 1.0,
        description: '강도'
      }
    ]
  },
  {
    id: 'vignette',
    name: 'vignette',
    displayName: '비네팅',
    category: 'custom',
    complexity: 'medium',
    description: '비네팅 효과',
    ffmpegFilter: 'vignette=angle={angle}:x0={x0}:y0={y0}',
    parameters: [
      {
        name: 'angle',
        type: 'number',
        default: 0,
        min: -180,
        max: 180,
        description: '각도'
      },
      {
        name: 'x0',
        type: 'number',
        default: 'iw/2',
        description: '중심 X'
      },
      {
        name: 'y0',
        type: 'number',
        default: 'ih/2',
        description: '중심 Y'
      }
    ]
  },
  {
    id: 'blur',
    name: 'blur',
    displayName: '블러',
    category: 'custom',
    complexity: 'simple',
    description: '가우시안 블러',
    ffmpegFilter: 'gblur=sigma={sigma}:steps={steps}',
    parameters: [
      {
        name: 'sigma',
        type: 'number',
        default: 2.0,
        min: 0.5,
        max: 10.0,
        description: '블러 강도'
      },
      {
        name: 'steps',
        type: 'number',
        default: 1,
        min: 1,
        max: 6,
        description: '블러 단계'
      }
    ]
  },
  {
    id: 'sharpen',
    name: 'sharpen',
    displayName: '선명화',
    category: 'custom',
    complexity: 'simple',
    description: '선명 효과',
    ffmpegFilter: 'unsharp=luma_msize_x=7:luma_msize_y=7:luma_amount=2.5',
    parameters: [
      {
        name: 'amount',
        type: 'number',
        default: 2.5,
        min: 0,
        max: 5,
        description: '선명화 강도'
      }
    ]
  },
  {
    id: 'sepia',
    name: 'sepia',
    displayName: '세피아',
    category: 'custom',
    complexity: 'simple',
    description: '세피아 톤 효과',
    ffmpegFilter: 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131',
    parameters: []
  },
  {
    id: 'grayscale',
    name: 'grayscale',
    displayName: '흑백',
    category: 'custom',
    complexity: 'simple',
    description: '흑백 효과',
    ffmpegFilter: 'colorchannelmixer=.299:.587:.114:0:.299:.587:.114:0:.299:.587:.114',
    parameters: []
  },
  {
    id: 'invert',
    name: 'invert',
    displayName: '반전',
    category: 'custom',
    complexity: 'simple',
    description: '색상 반전',
    ffmpegFilter: 'negate',
    parameters: []
  },
  {
    id: 'mirror',
    name: 'mirror',
    displayName: '미러',
    category: 'custom',
    complexity: 'simple',
    description: '수평 미러',
    ffmpegFilter: 'hflip',
    parameters: []
  },
  {
    id: 'rotate',
    name: 'rotate',
    displayName: '회전',
    category: 'custom',
    complexity: 'simple',
    description: '시계 방향 회전',
    ffmpegFilter: 'rotate=angle={angle}',
    parameters: [
      {
        name: 'angle',
        type: 'number',
        default: 90,
        options: [90, 180, 270],
        description: '회전 각도'
      }
    ]
  },
  {
    id: 'flip',
    name: 'flip',
    displayName: '플립',
    category: 'custom',
    complexity: 'simple',
    description: '수직 플립',
    ffmpegFilter: 'vflip',
    parameters: []
  }
];

export function getTransitionById(id: string): TransitionEffect | undefined {
  return FFMPEG_TRANSITIONS.find(transition => transition.id === id);
}

export function getTransitionsByCategory(category: TransitionEffect['category']): TransitionEffect[] {
  return FFMPEG_TRANSITIONS.filter(transition => transition.category === category);
}

export function getTransitionsByComplexity(complexity: TransitionEffect['complexity']): TransitionEffect[] {
  return FFMPEG_TRANSITIONS.filter(transition => transition.complexity === complexity);
}

export function generateFFmpegFilter(transition: TransitionEffect, parameters: Record<string, any>): string {
  let filter = transition.ffmpegFilter || '';

  Object.entries(parameters).forEach(([key, value]) => {
    filter = filter.replace(new RegExp(`{${key}}`, 'g'), String(value));
  });

  return filter;
}