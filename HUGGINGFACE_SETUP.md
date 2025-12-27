# Hugging Face Spaces Stable Diffusion 설정 가이드

## 1. Hugging Face Space 생성

### 단계별 가이드:

1. **Hugging Face 계정 생성/로그인**
   - [https://huggingface.co](https://huggingface.co) 접속
   - 계정 생성 또는 로그인

2. **새 Space 생성**
   - 오른쪽 위 `+ New Space` 클릭
   - Space 설정:
     ```
     Space name: autovid-stable-diffusion (또는 원하는 이름)
     License: MIT
     Space SDK: Gradio
     Hardware: CPU basic (무료) / T4 GPU (유료 권장)
     Visibility: Public
     ```

3. **파일 생성**
   - `app.py` 파일 생성
   - `requirements.txt` 파일 생성
   - `README.md` 파일 생성

## 2. app.py 파일 내용

```python
import gradio as gr
import torch
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
from PIL import Image
import random

# 모델 로드 (무료 CPU 사용)
device = "cuda" if torch.cuda.is_available() else "cpu"
model_id = "runwayml/stable-diffusion-v1-5"

pipe = StableDiffusionPipeline.from_pretrained(model_id, torch_dtype=torch.float16)
pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
pipe = pipe.to(device)

# 메모리 최적화 (CPU용)
if device == "cpu":
    pipe.enable_attention_slicing()
    pipe.enable_sequential_cpu_offload()

def generate_image(prompt, negative_prompt, guidance_scale, seed, width, height, steps, model_type):
    try:
        # 시드 설정
        if seed == 0:
            seed = random.randint(1, 1000000)

        generator = torch.Generator(device=device).manual_seed(seed)

        # 이미지 생성
        with torch.autocast(device):
            image = pipe(
                prompt=prompt,
                negative_prompt=negative_prompt,
                num_inference_steps=steps,
                guidance_scale=guidance_scale,
                width=width,
                height=height,
                generator=generator
            ).images[0]

        # 이미지를 임시 파일로 저장
        temp_path = f"/tmp/generated_image_{seed}.png"
        image.save(temp_path)

        return temp_path

    except Exception as e:
        return None

# Gradio 인터페이스
with gr.Blocks() as demo:
    gr.Markdown("# AutoVid Stable Diffusion Image Generator")

    with gr.Row():
        with gr.Column():
            prompt_input = gr.Textbox(label="Prompt", lines=3, placeholder="Describe your image...")
            negative_prompt_input = gr.Textbox(label="Negative Prompt", lines=2, value="blurry, low quality, distorted, deformed")

            with gr.Row():
                guidance_scale = gr.Slider(minimum=1.0, maximum=20.0, value=7.5, label="Guidance Scale")
                steps = gr.Slider(minimum=10, maximum=50, value=25, step=5, label="Steps")

            with gr.Row():
                width = gr.Slider(minimum=256, maximum=1024, value=512, step=64, label="Width")
                height = gr.Slider(minimum=256, maximum=1024, value=512, step=64, label="Height")

            seed_input = gr.Number(label="Seed (0 for random)", value=42)
            model_type = gr.Dropdown(
                choices=["stable-diffusion-v1-5", "dreamshaper", "realistic-vision"],
                value="stable-diffusion-v1-5",
                label="Model Type"
            )

            generate_btn = gr.Button("Generate Image", variant="primary")

        with gr.Column():
            output_image = gr.Image(label="Generated Image", type="filepath")

    # API 엔드포인트 설정
    generate_btn.click(
        fn=generate_image,
        inputs=[prompt_input, negative_prompt_input, guidance_scale, seed_input, width, height, steps, model_type],
        outputs=output_image
    )

# API 엔드포인트
demo.queue()
demo.launch(share=True)
```

## 3. requirements.txt 파일 내용

```txt
torch
torchvision
diffusers
transformers
accelerate
gradio
pillow
numpy
```

## 4. .env 파일 설정

프로젝트 루트의 `.env.local` 파일에 추가:

```env
HF_SPACES_URL=https://your-username-autovid-stable-diffusion.hf.space
```

## 5. API 엔드포인트 사용법

Space가 배포되면 다음 URL로 API 호출:

```
POST https://your-username-autovid-stable-diffusion.hf.space/api/predict
Content-Type: application/json

{
  "data": [
    "a beautiful landscape with mountains",  // prompt
    "blurry, low quality",                   // negative prompt
    7.5,                                    // guidance_scale
    42,                                     // seed
    512,                                    // width
    512,                                    // height
    25,                                     // steps
    "stable-diffusion-v1-5"                 // model
  ]
}
```

## 6. 비용 및 제한

### 무료 버전 (CPU basic)
- ✅ 완전 무료
- ✅ 무제한 사용
- ❌ 생성 속도 느림 (1-2분)
- ❌ 이미지 품질 제한

### 유료 버전 (T4 GPU - $0.25/hour)
- ✅ 빠른 생성 속도 (5-10초)
- ✅ 고품질 이미지
- ✅ 대형 모델 지원
- ❌ 시간당 비용 발생

## 7. 추천 설정

### 테스트용:
- CPU basic으로 시작
- 나중에 필요시 GPU로 업그레이드

### 상용용:
- T4 GPU 사용
- 월 $180 정도 (하루 6시간 사용 기준)

## 8. 대안: 공개 Space 사용

직접 Space를 만들고 싶지 않으면 공개된 Space 사용:

```env
HF_SPACES_URL=https://stabilityai-stable-diffusion.hf.space
```

## 9. 트러블슈팅

### Common Issues:

1. **Memory Error**: CPU 사용 시 메모리 부족
   - 해결: `pipe.enable_attention_slicing()` 활성화

2. **Slow Generation**: CPU에서 너무 느림
   - 해결: GPU로 업그레이드

3. **API Timeout**: 생성 시간 초과
   - 해결: steps 수 줄이기 (50→25)

4. **CORS Error**: 웹에서 API 호출 실패
   - 해결: Space 설정에서 CORS 허용

## 10. 다음 단계

1. Hugging Face Space 생성 및 배포
2. `.env.local`에 URL 추가
3. AutoVid에서 이미지 생성 테스트
4. 필요시 모델 추가 (anime, realistic 등)