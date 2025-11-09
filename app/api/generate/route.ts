import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const formData = await request.formData()
    const protagonist = formData.get('protagonist') as File
    const story = formData.get('story') as string
    const persona = formData.get('persona') as string || ''
    const sceneCount = parseInt(formData.get('sceneCount') as string)
    const aspectRatio = formData.get('aspectRatio') as string || '16:9'

    if (!protagonist || !story) {
      return new Response(JSON.stringify({ error: 'Missing data' }), { status: 400 })
    }

    // Gemini Vision - encode Base64 in chunks to avoid stack overflow
    const bytes = await protagonist.arrayBuffer()
    const uint8Array = new Uint8Array(bytes)

    // Chunk processing for large images
    let base64 = ''
    const chunkSize = 8192
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize)
      base64 += String.fromCharCode.apply(null, Array.from(chunk))
    }
    base64 = btoa(base64)

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `Analyze this person's face with EXTREME precision for AI character consistency. Provide measurements and specific details:

FACE STRUCTURE:
- Face shape (oval/round/square/heart/diamond)
- Facial proportions (forehead:midface:jaw ratio)
- Jawline definition and angle
- Cheekbone prominence and placement

EYES (CRITICAL):
- Exact eye shape (almond/round/hooded/upturned/downturned)
- Eye color (specific shade, patterns, depth)
- Eye size relative to face
- Distance between eyes (wide-set/close-set/average)
- Eyelid type (monolid/double-lid)
- Eyebrow shape, thickness, arch position

NOSE:
- Nose bridge (high/low/straight/curved)
- Nose width and nostril shape
- Nose tip shape (pointed/rounded/bulbous)
- Nose length relative to face

MOUTH & LIPS:
- Lip fullness (upper and lower separately)
- Lip shape and cupid's bow definition
- Mouth width relative to nose
- Smile characteristics

SKIN & COMPLEXION:
- Exact skin tone (warm/cool/neutral undertones)
- Skin texture and any distinctive marks
- Facial hair details (if present)

HAIR:
- Hair color (exact shade and highlights)
- Hair texture and density
- Hairstyle and length
- Hairline shape

DISTINCTIVE FEATURES:
- Moles, freckles, scars (exact position)
- Any unique characteristics

Output: 250-300 words with numerical precision where possible.` },
              { inlineData: { mimeType: protagonist.type, data: base64 } }
            ]
          }]
        })
      }
    )

    if (!geminiRes.ok) {
      const err = await geminiRes.text()
      return new Response(err, { status: geminiRes.status })
    }

    const geminiData = await geminiRes.json()
    const face = geminiData.candidates[0].content.parts[0].text
    console.log('[DEBUG] Face description:', face)

    // Gemini 2.5 - Scene generation
    const sceneRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Create ${sceneCount} detailed scene descriptions for this story: "${story}"\nPersona: ${persona}\n\nReturn only a JSON array: ["scene 1 description", "scene 2 description", ...]`
            }]
          }]
        })
      }
    )

    if (!sceneRes.ok) {
      const err = await sceneRes.text()
      return new Response(err, { status: sceneRes.status })
    }

    const sceneData = await sceneRes.json()
    const sceneText = sceneData.candidates[0].content.parts[0].text
    const scenes = JSON.parse(sceneText.replace(/```json\n?|\n?```/g, ''))
    console.log('[DEBUG] Scenes array:', scenes)

    // Nano Banana (Gemini 2.5 Flash Image) - Character consistency with reference image
    const images: string[] = []
    console.log('[DEBUG] Using Nano Banana (gemini-2.5-flash-image) with reference image')

    for (const scene of scenes) {
      const nanoRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: `Generate a cinematic scene: ${scene}

The main character in this scene should look EXACTLY like the person in the reference image provided. Maintain perfect facial consistency including all features, expressions, skin tone, and distinctive marks.

Style: Photorealistic, cinematic lighting, high detail, film quality.`
                },
                {
                  inline_data: {
                    mime_type: protagonist.type,
                    data: base64
                  }
                }
              ]
            }],
            generationConfig: {
              response_modalities: ['Image'],
              image_config: {
                aspect_ratio: aspectRatio
              }
            }
          })
        }
      )

      if (nanoRes.ok) {
        const data = await nanoRes.json()
        console.log('[DEBUG] Nano Banana response:', JSON.stringify(data).substring(0, 500))

        if (!data.candidates || !data.candidates[0]?.content?.parts) {
          return new Response(JSON.stringify({
            error: 'Invalid Nano Banana response',
            response: JSON.stringify(data).substring(0, 500)
          }), { status: 500 })
        }

        // Find the image part in the response (note: camelCase inlineData)
        const imagePart = data.candidates[0].content.parts.find((part: any) => part.inlineData)
        if (!imagePart?.inlineData?.data) {
          return new Response(JSON.stringify({
            error: 'No image data in response',
            response: JSON.stringify(data).substring(0, 500)
          }), { status: 500 })
        }

        const imageData = imagePart.inlineData.data
        images.push(`data:image/png;base64,${imageData}`)
      } else {
        const errText = await nanoRes.text()
        console.error('[ERROR] Nano Banana failed:', errText)
        return new Response(JSON.stringify({
          error: 'Nano Banana API failed',
          status: nanoRes.status,
          details: errText.substring(0, 500)
        }), { status: 500 })
      }
    }

    console.log('[DEBUG] Total images generated:', images.length)

    if (images.length === 0) {
      return new Response(JSON.stringify({ error: 'No images generated (loop completed but empty)' }), { status: 500 })
    }

    return new Response(JSON.stringify({ scenes: images }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
