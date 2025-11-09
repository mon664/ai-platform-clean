"use client";

import { useState } from "react";

export default function PurchaseUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [steps, setSteps] = useState({
    step1: false,
    step2: false,
    step3: false,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    }
  };

  const handleProcess = async () => {
    if (!file) {
      setMessage("파일을 선택해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // ===== STEP 1: Vision AI (OCR) =====
      setMessage("🔍 STEP 1: 거래명세서 이미지 분석 중...");
      const formData = new FormData();
      formData.append("file", file);

      const step1Res = await fetch("/api/ecount/purchase/ocr", {
        method: "POST",
        body: formData,
      });

      const step1Data = await step1Res.json();

      if (!step1Res.ok) throw new Error(step1Data.error);

      setSteps((s) => ({ ...s, step1: true }));
      console.log("✅ STEP 1 완료:", step1Data.rawData);

      // ===== STEP 2: GLM 4.6 (Logic) =====
      setMessage(
        "⚙️ STEP 2: GLM 4.6으로 정확한 JSON 변환 중... (저비용 처리)"
      );

      const step2Res = await fetch("/api/ecount/purchase/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawData: step1Data.rawData }),
      });

      const step2Data = await step2Res.json();

      if (!step2Res.ok) throw new Error(step2Data.error);

      setSteps((s) => ({ ...s, step2: true }));
      console.log("✅ STEP 2 완료:", step2Data.purchaseJSON);

      // ===== STEP 3: 이카운트 ERP API =====
      setMessage("📤 STEP 3: 이카운트 ERP에 전표 등록 중...");

      const step3Res = await fetch("/api/ecount/purchase/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseJSON: step2Data.purchaseJSON }),
      });

      const step3Data = await step3Res.json();

      if (!step3Res.ok) throw new Error(step3Data.error);

      setSteps((s) => ({ ...s, step3: true }));
      console.log("✅ STEP 3 완료:", step3Data.result);

      // ===== 완료 =====
      setMessage(`✅ ${step3Data.message}`);
      setResult(step3Data);

      // 폼 초기화
      setTimeout(() => {
        setFile(null);
        setPreview("");
        setSteps({ step1: false, step2: false, step3: false });
      }, 2000);
    } catch (error) {
      setMessage(`❌ 오류: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#1f2937', borderRadius: '8px', color: 'white', marginBottom: '20px' }}>
      {/* 파일 업로드 */}
      <div style={{ border: '2px dashed #4b5563', borderRadius: '8px', padding: '32px', textAlign: 'center', marginBottom: '20px', cursor: 'pointer' }}>
        <label style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>📷</div>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>거래명세서를 업로드하세요</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {file && <p style={{ color: '#4ade80' }}>✅ {file.name} 선택됨</p>}
        </label>
      </div>

      {/* 미리보기 */}
      {preview && (
        <img
          src={preview}
          alt="preview"
          style={{ maxHeight: '256px', margin: '0 auto', display: 'block', borderRadius: '8px', border: '1px solid #4b5563', marginBottom: '20px' }}
        />
      )}

      {/* 프로세스 진행률 */}
      <div style={{ backgroundColor: '#374151', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span>{steps.step1 ? "✅" : "⏳"}</span>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>STEP 1: Vision AI - 거래명세서 분석</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span>{steps.step2 ? "✅" : "⏳"}</span>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>STEP 2: GLM 4.6 - JSON 변환 (저비용)</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{steps.step3 ? "✅" : "⏳"}</span>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>STEP 3: 이카운트 API - 전표 등록</p>
        </div>
      </div>

      {/* 메시지 */}
      {message && (
        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            backgroundColor: message.includes("✅") ? '#14532d' : '#1e3a8a',
            color: message.includes("✅") ? '#dcfce7' : '#dbeafe'
          }}
        >
          {message}
        </div>
      )}

      {/* 버튼 */}
      <button
        onClick={handleProcess}
        disabled={!file || loading}
        style={{
          width: '100%',
          backgroundColor: !file || loading ? '#4b5563' : '#16a34a',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '16px',
          cursor: !file || loading ? 'not-allowed' : 'pointer',
          border: 'none',
          marginBottom: '20px'
        }}
      >
        {loading ? "처리 중..." : "🚀 3단계 자동 처리 시작"}
      </button>

      {/* 결과 */}
      {result && (
        <div style={{ backgroundColor: '#14532d', padding: '16px', borderRadius: '8px', fontSize: '14px' }}>
          <p style={{ fontWeight: 'bold', color: '#86efac', marginBottom: '8px' }}>📊 처리 완료</p>
          <p style={{ color: '#dcfce7', margin: 0 }}>{result.message}</p>
        </div>
      )}
    </div>
  );
}