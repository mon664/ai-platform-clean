import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  console.log('TTS API: Request received.');
  try {
    const { text, voice, speed = 1.0, pitch = 1.0, tone, zoom = 1.0, pan = 0.0 } = await req.json();
    console.log(`TTS API: Received data - Text length: ${text?.length}, Voice: ${voice}, Tone: ${tone}`);

    if (!text) {
      console.error('TTS API: Error - No text provided.');
      return new NextResponse(JSON.stringify({ error: '?ìŠ¤?¸ê? ?„ìš”?©ë‹ˆ?? }), { status: 400 });
    }

    const GOOGLE_TTS_API_KEY = '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';
    if (!GOOGLE_TTS_API_KEY) {
      console.error('TTS API: Error - Google TTS API key not set.');
      return new NextResponse(JSON.stringify({ error: 'Google TTS API ?¤ê? ?¤ì •?˜ì? ?Šì•˜?µë‹ˆ?? }), { status: 500 });
    }

    let ssmlToSynthesize = '';

    if (tone && tone.trim()) {
      console.log('TTS API: Tone provided, starting AI for SSML generation.');
      const ssmlGenPrompt = `You are an SSML generation machine. Your ONLY output should be a single, valid SSML string. Do not include any explanation, preamble, or markdown. Your entire response must start with '<speak>' and end with '</speak>'.\n\nConvert the following plain text script into SSML that reflects the desired mood.\n\n**Desired Mood:** "${tone}"\n\n**Plain Text Script:**\n"${text}"\n\n**SSML Output (must start with '<speak>'):**`;

      const ssmlGenRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_TTS_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: ssmlGenPrompt }] }] })
        }
      );

      if (!ssmlGenRes.ok) {
        const errorText = await ssmlGenRes.text();
        console.error(`TTS API: AI for SSML generation failed. Status: ${ssmlGenRes.status}, Error: ${errorText}`);
        throw new Error('AIë¥??´ìš©??SSML ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
      }

      const ssmlGenData = await ssmlGenRes.json();
      const rawResponse = ssmlGenData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log(`TTS API: AI generated raw response: ${rawResponse.substring(0, 200)}...`);

      const ssmlMatch = rawResponse.match(/<speak>[\s\S]*?<\/speak>/);
      ssmlToSynthesize = ssmlMatch ? ssmlMatch[0] : '';
      
      if (!ssmlToSynthesize) {
         console.error('TTS API: Error - Could not extract valid SSML from AI response.', rawResponse);
         throw new Error('AIê°€ ? íš¨??SSML???ì„±?˜ì? ëª»í–ˆ?µë‹ˆ??');
      }

    } else {
      console.log('TTS API: No tone provided, using optimized SSML for natural speech.');
      // ?ì—°?¤ëŸ¬??ë§í•˜ê¸°ë? ?„í•œ ìµœì ?”ëœ SSML
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const ssmlSentences = sentences.map(sentence => {
        const trimmed = sentence.trim();
        if (trimmed.length === 0) return '';

        // ?ì ˆ??ë¸Œë ˆ?´í¬?€ ê°•ì¡° ì¶”ê?
        const withBreaks = trimmed.replace(/([ê°€-??+)([.!?])/g, '$1<break time="400ms"/>$2');
        return `<prosody rate="0.95" pitch="medium">${withBreaks}</prosody>`;
      }).filter(s => s.length > 0);

      ssmlToSynthesize = `<speak>${ssmlSentences.join('<break time="600ms"/>')}</speak>`;
    }

    // ?ì—°?¤ëŸ¬???Œì„±???„í•œ ìµœì ?”ëœ ?Œë¼ë¯¸í„°
    const requestBody = {
      voice: {
        languageCode: 'ko-KR',
        name: voice || 'ko-KR-Wavenet-D'  // ê¸°ë³¸?ìœ¼ë¡?ê°€???ì—°?¤ëŸ¬???Œì„±
      },
      audioConfig: {
        audioEncoding: 'LINEAR16',
        speakingRate: Math.min(Math.max(speed || 0.9, 0.8), 1.1), // ?ì—°?¤ëŸ¬???ë„ ë²”ìœ„
        pitch: Math.min(Math.max((pitch - 1.0) * 10 || 0.0, -5.0), 5.0), // ?ì—°?¤ëŸ¬???¼ì¹˜ ë²”ìœ„
        sampleRateHertz: 24000, // ???’ì? ?˜í”Œë§??ˆì´??
        volumeGainDb: 2.0, // ?½ê°„??ë³¼ë¥¨ ì¦ê?
        effectsProfileId: ['headphone-class-device'] // ?¤ë“œ???˜ê²½ ìµœì ??
      },
      input: { ssml: ssmlToSynthesize },
    };
    
    console.log('TTS API: Preparing to call Google TTS API...');
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

                if (!res.ok) {
                  const errorText = await res.text();
                  console.error(`TTS API: Google TTS API call failed. Status: ${res.status}, Error: ${errorText}`);
                  throw new Error(`ìµœì¢… ?Œì„± ?ì„± ?¤íŒ¨: ${errorText}`);
                }    const data = await res.json();
    console.log('TTS API: Google TTS API call successful.');
    
    return new NextResponse(JSON.stringify({ audioContent: data.audioContent }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('TTS API: Unhandled error in POST handler.', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || '?œë²„ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤' }),
      { status: 500 }
    );
  }
}
