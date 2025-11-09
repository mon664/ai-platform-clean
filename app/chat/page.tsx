'use client';

import { useState, useEffect, useRef } from 'react';
import {
  validateRequiredFields,
  findVendor,
  findProduct,
  findWarehouse,
  extractEntitiesFromText,
  generateMissingInfoQuestions,
  formatTransactionForDisplay,
  type Vendor,
  type Product,
  type Warehouse
} from '@/lib/validators';
import { OrderConfirmCard } from '@/app/components/OrderConfirmCard';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  data?: any;
}

interface BusinessTransaction {
  action: 'sale' | 'purchase' | 'production_receipt';
  customer?: string;
  vendor?: string;
  product: string;
  product_code?: string;
  qty: number;
  price: number;
  date: string;
  warehouse?: string;
  [key: string]: any;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '안녕하세요! 🤖 AI 스마트 팩토리 에이전트입니다.\n\n무엇을 도와드릴까요?\n• 판매 등록 (예: "삼성전자에 갤럭시 팔아줘")\n• 구매 등록 (예: "LG디스플레이에서 OLED 패널 사줘")\n• 생산 입고 (예: "갤럭시 50개 생산 완료")\n\n아래 버튼을 클릭하여 직접 주문을 등록할 수도 있습니다.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [currentTransaction, setCurrentTransaction] = useState<BusinessTransaction | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 정보 카드 컴포넌트
  const InfoCard = ({ transaction, validation }: { transaction: BusinessTransaction, validation: any }) => {
    const items = formatTransactionForDisplay(transaction, validation, warehouses);

    return (
      <div style={{
        backgroundColor: '#1f2937',
        border: '2px solid #374151',
        borderRadius: '12px',
        padding: '20px',
        margin: '16px 0'
      }}>
        {items.map((item, idx) => (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: idx < items.length - 1 ? '1px solid #374151' : 'none'
          }}>
            <div style={{ fontSize: '24px', marginRight: '12px' }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>{item.label}</div>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: item.value.includes('없음') || item.value.includes('정보 없음') ? '#ef4444' : 'white'
              }}>
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 액션 버튼 컴포넌트
  const ActionButtons = ({
    onConfirm,
    onEdit,
    onCancel,
    isValid
  }: {
    onConfirm: () => void;
    onEdit: () => void;
    onCancel: () => void;
    isValid: boolean;
  }) => {
    return (
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        margin: '16px 0'
      }}>
        <button
          onClick={onConfirm}
          disabled={!isValid}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: isValid ? '#10b981' : '#4b5563',
            color: 'white',
            fontWeight: 'bold',
            cursor: isValid ? 'pointer' : 'not-allowed',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ✅ 맞아요
        </button>

        <button
          onClick={onEdit}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: '1px solid #f59e0b',
            backgroundColor: 'transparent',
            color: '#f59e0b',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🔧 수정할게
        </button>

        <button
          onClick={onCancel}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: '1px solid #ef4444',
            backgroundColor: 'transparent',
            color: '#ef4444',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ❌ 취소
        </button>
      </div>
    );
  };

  const loadData = async () => {
    try {
      const [vendorsRes, productsRes, warehousesRes] = await Promise.all([
        fetch('/api/data/vendors'),
        fetch('/api/data/products'),
        fetch('/api/data/warehouses')
      ]);

      if (vendorsRes.ok) {
        const vendorsData = await vendorsRes.json();
        setVendors(vendorsData.vendors || []);
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.products || []);
      }

      if (warehousesRes.ok) {
        const warehousesData = await warehousesRes.json();
        setWarehouses(warehousesData.warehouses || []);
      }
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    }
  };

  const analyzeCommand = (message: string): { transaction: BusinessTransaction | null, validation: any } => {
    const lowerMessage = message.toLowerCase();

    // 액션 판별
    let action: 'sale' | 'purchase' | 'production_receipt';
    if (lowerMessage.includes('팔아') || lowerMessage.includes('판매') || lowerMessage.includes('출하')) {
      action = 'sale';
    } else if (lowerMessage.includes('사') || lowerMessage.includes('구매') || lowerMessage.includes('입고')) {
      action = 'purchase';
    } else if (lowerMessage.includes('생산') || lowerMessage.includes('완료')) {
      action = 'production_receipt';
    } else {
      return { transaction: null, validation: null };
    }

    // 엔티티 추출
    const entities = extractEntitiesFromText(message, vendors, products);

    // 기본값 설정
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const defaultWarehouse = '00003'; // 본사창고

    // 거래처 정보 설정
    let customer: string | undefined;
    if (action === 'sale' && entities.vendor) {
      customer = entities.vendor.name;
    }

    // 품목 정보 설정
    let product: string;
    let product_code: string | undefined;
    let price: number;

    if (entities.product) {
      product = entities.product.name;
      product_code = entities.product.code;
      price = parseInt(entities.product.price) || 10000;
    } else {
      // 품목명 추출 시도
      const productMatch = message.match(/[가-힣]+[\s]*[\w]*[\s]*[\w]*/);
      product = productMatch ? productMatch[0] : '알 수 없는 품목';
      price = 10000;
    }

    const transaction: BusinessTransaction = {
      action,
      customer,
      product,
      product_code,
      qty: entities.quantity || 1,
      price: entities.price || price,
      date: today,
      warehouse: action === 'production_receipt' ? '00003' : undefined
    };

    // 유효성 검사
    const validation = validateRequiredFields(transaction, action);

    return { transaction, validation };
  };

  const createConfirmationMessage = (transaction: BusinessTransaction, validation: any): string => {
    const actionText = transaction.action === 'sale' ? '판매' :
                      transaction.action === 'purchase' ? '구매' : '생산입고';

    let message = `📋 ${actionText} 등록 확인\n\n`;
    message += `품목: ${transaction.product}\n`;
    message += `수량: ${transaction.qty}개\n`;
    message += `단가: ${transaction.price.toLocaleString()}원\n`;

    if (transaction.customer) {
      message += `거래처: ${transaction.customer}\n`;
    }

    if (transaction.product_code) {
      message += `품목코드: ${transaction.product_code}\n`;
    }

    if (transaction.warehouse) {
      message += `창고: ${warehouses.find(w => w.code === transaction.warehouse)?.name || transaction.warehouse}\n`;
    }

    message += `날짜: ${transaction.date}\n\n`;

    // 경고 메시지 추가
    if (validation.warnings.length > 0) {
      message += `⚠️ 경고:\n`;
      validation.warnings.forEach((warning: string) => {
        message += `• ${warning}\n`;
      });
      message += `\n`;
    }

    // 누락된 필드 안내
    if (!validation.isValid) {
      message += `❌ 다음 정보가 필요합니다:\n`;
      validation.missing.forEach((field: string) => {
        let fieldName = field;
        switch (field) {
          case 'customer': fieldName = '거래처'; break;
          case 'vendor': fieldName = '공급업체'; break;
          case 'product_code': fieldName = '품목코드'; break;
          case 'qty': fieldName = '수량'; break;
          case 'price': fieldName = '단가'; break;
          case 'warehouse': fieldName = '창고'; break;
        }
        message += `• ${fieldName}\n`;
      });
      message += `\n`;
    }

    // 개선 제안
    if (validation.suggestions.length > 0) {
      message += `💡 제안:\n`;
      validation.suggestions.forEach((suggestion: string) => {
        message += `• ${suggestion}\n`;
      });
      message += `\n`;
    }

    if (validation.isValid) {
      message += `✅ 모든 정보가 확인되었습니다. 이대로 등록하시겠습니까? (예/아니오)`;
    } else {
      message += `❌ 정보가 부족하여 등록할 수 없습니다. 누락된 정보를 추가로 입력해주세요.`;
    }

    return message;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // 사용자 메시지 추가
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      if (awaitingConfirmation && currentTransaction) {
        // 확인 단계 처리
        if (userMessage.toLowerCase().includes('예') || userMessage.toLowerCase().includes('네') || userMessage.toLowerCase().includes('yes')) {
          // 실제 이카운트 API 호출
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: JSON.stringify(currentTransaction),
              confirmed: true
            })
          });

          const result = await response.json();
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `✅ 처리 완료!\n\n${result.response}`,
            data: result
          }]);
        } else {
          // 취소
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '❌ 처리가 취소되었습니다.\n\n다른 거래를 도와드릴까요?'
          }]);
        }

        setAwaitingConfirmation(false);
        setCurrentTransaction(null);
      } else {
        // 명령어 분석 단계
        const result = analyzeCommand(userMessage);

        if (!result.transaction) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '죄송합니다. 명령을 이해할 수 없습니다.\n\n아래 예시를 참고해주세요:\n• "삼성전자에 갤럭시 10대 팔아줘"\n• "LG디스플레이에서 OLED 패널 100개 사줘"\n• "갤럭시 50개 생산 완료"'
          }]);
        } else {
          const { transaction, validation } = result;

          // 항상 정보 카드와 버튼 표시 (유효성과 상관없이)
          setCurrentTransaction(transaction);
          setAwaitingConfirmation(true);

          // 정보 카드와 버튼이 포함된 메시지 생성
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '📋 거래 정보를 확인해주세요.',
            data: {
              transaction,
              validation,
              showInfoCard: true
            }
          }]);

          // 유효성 검사 실패 시 추가 안내
          if (!validation.isValid) {
            setTimeout(() => {
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: `⚠️ 누락된 정보가 있습니다. ${validation.missing.length}개 필드를 확인해주세요.\n\n${validation.suggestions.join('\n')}`,
                data: { transaction, validation, showInfoCard: true }
              }]);
            }, 1000);
          }
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '오류 발생: ' + (error as Error).message
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 액션 버튼 핸들러
  const handleActionConfirm = async (transaction: BusinessTransaction) => {
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: JSON.stringify(transaction),
          confirmed: true
        })
      });

      const result = await response.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ 처리 완료!\n\n${result.response}`,
        data: result
      }]);

      // 현재 트랜잭션 초기화
      setCurrentTransaction(null);
      setAwaitingConfirmation(false);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ 처리 중 오류 발생: ' + (error as Error).message
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionEdit = () => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '📝 수정할 내용을 말씀해주세요.\n\n예시:\n• "거래처를 OO전자로 변경"\n• "수량을 50개로 수정"\n• "단가를 15000원으로 변경"'
    }]);

    // 수정 모드로 전환 (awaitingConfirmation은 유지)
  };

  const handleActionCancel = () => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '❌ 처리가 취소되었습니다.\n\n다른 거래를 도와드릴까요?'
    }]);

    // 현재 트랜잭션 초기화
    setCurrentTransaction(null);
    setAwaitingConfirmation(false);
  };

  // OrderForm 핸들러
  const handleOrderSubmit = async (orderData: any) => {
    setLoading(true);

    try {
      // 액션 타입 결정
      const action = orderData.action === '구매' ? 'purchase' :
                     orderData.action === '판매' ? 'sale' : 'production_receipt';

      // API 엔드포인트 결정
      const apiEndpoint = action === 'sale' ? '/api/ecount/sales' : '/api/ecount/purchase';

      // API에 전송할 데이터
      const payload = {
        product: orderData.product,
        productCode: orderData.productCode || "",
        quantity: orderData.quantity.toString(),
        price: orderData.unitPrice.toString(),
        [action === 'sale' ? 'customer' : 'vendor']: orderData.vendor,
        date: orderData.date,
        warehouse: orderData.warehouse || "00001"
      };

      console.log(`📤 ${action === 'sale' ? '판매' : '구매'} API 호출:`, payload);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '알 수 없는 오류');
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.message,
        data: result
      }]);

      setShowOrderForm(false);
    } catch (error) {
      const errorMsg = (error as Error).message;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ 처리 중 오류 발생:\n${errorMsg}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderCancel = () => {
    setShowOrderForm(false);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '❌ 주문 등록이 취소되었습니다.\n\n다른 거래를 도와드릴까요?'
    }]);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <div style={{
        backgroundColor: '#1f2937',
        padding: '16px 24px',
        borderBottom: '1px solid #374151',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{ fontSize: '24px' }}>🤖</span>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>AI 스마트 팩토리 챗봇</h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
            {vendors.length}거래처, {products.length}품목, {warehouses.length}창고 연동됨
          </p>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        backgroundColor: '#111827',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            marginBottom: '16px',
            textAlign: msg.role === 'user' ? 'right' : 'left',
            maxWidth: '100%'
          }}>
            {/* 일반 메시지 */}
            {!msg.data?.transaction && (
              <div style={{
                display: 'inline-block',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: msg.role === 'user' ? '#2563eb' : '#374151',
                color: msg.role === 'user' ? 'white' : '#f3f4f6',
                maxWidth: '80%',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {msg.content}
              </div>
            )}

            {/* 정보 카드 + 액션 버튼 */}
            {msg.data?.transaction && (
              <div style={{
                display: 'inline-block',
                maxWidth: '90%',
                width: '90%'
              }}>
                <InfoCard
                  transaction={msg.data.transaction}
                  validation={msg.data.validation}
                />
                <ActionButtons
                  onConfirm={() => handleActionConfirm(msg.data.transaction)}
                  onEdit={() => handleActionEdit()}
                  onCancel={() => handleActionCancel()}
                  isValid={msg.data.validation?.isValid || false}
                />
              </div>
            )}

            {/* 시스템 응답 표시 */}
            {msg.data && !msg.data.transaction && (
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#065f46',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#86efac',
                maxWidth: '80%',
                display: 'inline-block'
              }}>
                📊 시스템 응답 수신됨
              </div>
            )}
          </div>
        ))}

        {/* 직접 주문 버튼 */}
        {!showOrderForm && !awaitingConfirmation && (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <button
              onClick={() => setShowOrderForm(true)}
              disabled={loading}
              style={{
                padding: '16px 32px',
                borderRadius: '12px',
                border: '2px solid #10b981',
                backgroundColor: 'transparent',
                color: '#10b981',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '0 auto',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#10b981';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#10b981';
                }
              }}
            >
              <span style={{ fontSize: '20px' }}>📝</span>
              직접 주문 등록하기
            </button>
            <p style={{
              color: '#9ca3af',
              fontSize: '14px',
              marginTop: '8px',
              margin: '8px auto 0'
            }}>
              클릭하여 상세 주문 폼을 열고 모든 정보를 직접 입력하세요
            </p>
          </div>
        )}

        {/* OrderForm 표시 */}
        {showOrderForm && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
            <OrderConfirmCard
              onSubmit={handleOrderSubmit}
              onCancel={handleOrderCancel}
              loading={loading}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div style={{
        backgroundColor: '#1f2937',
        padding: '16px',
        borderTop: '1px solid #374151'
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={awaitingConfirmation ? "확인 (예/아니오)" : "명령을 입력하세요..."}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #4b5563',
              backgroundColor: '#374151',
              color: 'white',
              fontSize: '14px'
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: loading || !input.trim() ? '#4b5563' : '#3b82f6',
              color: 'white',
              fontWeight: 'bold',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '처리 중...' : '전송'}
          </button>
        </div>

        {/* 상태 표시 */}
        {awaitingConfirmation && (
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: '#065f46',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#86efac'
          }}>
            ⏳ 확인을 기다리는 중입니다...
          </div>
        )}
      </div>
    </div>
  );
}