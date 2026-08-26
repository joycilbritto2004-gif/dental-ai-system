import { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, BrainCircuit, Search, MoreVertical, FileText, X, Info, CreditCard, CheckCircle2 } from 'lucide-react';
import '../Dashboard.css';

const initialMessages = [
  { id: 1, type: 'text', sender: 'doctor', text: 'Hello Jane, I have reviewed your dental image and the AI-assisted report.', time: '10:00 AM' },
  { id: 2, type: 'text', sender: 'patient', text: 'Hello Doctor. I would like to know more about the result.', time: '10:05 AM' },
  { id: 3, type: 'text', sender: 'doctor', text: 'The AI model has indicated a possible case of Caries with 92% confidence. I recommend that we discuss your symptoms before deciding the next step.', time: '10:10 AM' },
  { id: 4, type: 'text', sender: 'patient', text: 'Can I schedule a consultation?', time: '10:12 AM' },
  { id: 5, type: 'text', sender: 'doctor', text: 'Yes. I can provide a consultation after the consultation fee is paid.', time: '10:15 AM' }
];

const MessagesUI = ({ role = 'patient' }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    if (selectedImage) {
      setMessages([...messages, { id: Date.now(), type: 'image', sender: role, image: selectedImage, time: 'Just now' }]);
      setSelectedImage(null);
    }
    
    if (inputText.trim()) {
      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'text', sender: role, text: inputText, time: 'Just now' }]);
      setInputText('');
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const shareAiReport = () => {
    setMessages([...messages, { 
      id: Date.now(), 
      type: 'ai-report',
      sender: role, 
      report: {
        condition: 'Caries',
        confidence: '92%',
        status: 'Awaiting Doctor Verification'
      },
      time: 'Just now' 
    }]);
  };

  const requestPayment = () => {
    setMessages([...messages, {
      id: Date.now(),
      type: 'payment-request',
      sender: 'doctor',
      amount: 500,
      time: 'Just now'
    }]);
    setShowPaymentModal(false);
  };

  // Derived Info for Header/Sidebar based on role
  const chatPartnerName = role === 'patient' ? 'Dr. Ananya Sharma' : 'Jane Doe';
  const chatPartnerTitle = role === 'patient' ? 'General Dentist' : 'Patient ID: P-98214';

  return (
    <div className="dashboard-view animate-fade-in" style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Safety Banner */}
      <div className="bg-blue-light text-primary p-3 flex-align-center gap-2" style={{ borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid var(--secondary)' }}>
        <Info size={20} className="text-secondary" />
        <span className="text-sm font-semibold">
          Information shared through chat is for consultation purposes. The doctor provides professional guidance and the AI prediction is only an assistive result.
        </span>
      </div>

      <div className="card chat-container flex-1" style={{ display: 'flex', padding: 0, overflow: 'hidden' }}>
        
        {/* Contacts Sidebar */}
        <div className="chat-sidebar border-r" style={{ width: '320px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
          <div className="p-4 border-b" style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 className="mb-4">Messages</h3>
            <div className="search-input-wrapper">
              <Search size={18} className="text-muted" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" className="form-input" placeholder="Search conversations..." style={{ paddingLeft: '2.5rem' }} />
            </div>
          </div>
          
          <div className="chat-contact-list" style={{ overflowY: 'auto', flex: 1 }}>
            <div className="chat-contact active" style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', cursor: 'pointer' }}>
              <div className="flex-align-center gap-3">
                <div className="doctor-avatar bg-blue-light text-primary" style={{ width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  {role === 'patient' ? 'SS' : 'JD'}
                </div>
                <div className="flex-1" style={{ overflow: 'hidden' }}>
                  <div className="flex-between mb-1">
                    <span className="font-semibold text-primary" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chatPartnerName}</span>
                    <span className="text-xs text-muted">10:15 AM</span>
                  </div>
                  <div className="text-xs text-muted mb-1">{chatPartnerTitle}</div>
                  <p className="text-sm text-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Yes. I can provide a consultation...
                  </p>
                </div>
              </div>
            </div>
            
            {/* Example 2nd contact */}
            <div className="chat-contact hover-bg" style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
              <div className="flex-align-center gap-3">
                <div className="doctor-avatar bg-main text-muted" style={{ width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  {role === 'patient' ? 'RK' : 'MJ'}
                </div>
                <div className="flex-1" style={{ overflow: 'hidden' }}>
                  <div className="flex-between mb-1">
                    <span className="font-semibold text-primary" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {role === 'patient' ? 'Dr. Rahul Kumar' : 'Michael Johnson'}
                    </span>
                    <span className="text-xs text-muted">Yesterday</span>
                  </div>
                  <div className="text-xs text-muted mb-1">{role === 'patient' ? 'Endodontist' : 'Patient ID: P-8123'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="chat-main flex-1" style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
          
          {/* Chat Header */}
          <div className="chat-header p-4 bg-white border-b" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="flex-align-center gap-3">
              <div className="doctor-avatar bg-blue-light text-primary" style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.3rem' }}>
                {role === 'patient' ? 'SS' : 'JD'}
              </div>
              <div>
                <h4 className="font-bold text-primary" style={{ fontSize: '1.1rem' }}>{chatPartnerName}</h4>
                <div className="flex-align-center gap-2 mt-1">
                  <span className="text-sm text-muted">{chatPartnerTitle}</span>
                  <span className="text-xs text-success flex-align-center gap-1"><div className="status-dot bg-success" style={{ width:'8px', height:'8px'}}></div> Online</span>
                </div>
              </div>
            </div>
            
            <div className="flex-align-center gap-2">
              {role === 'patient' ? (
                <button className="btn btn-outline btn-sm">View Doctor Profile</button>
              ) : (
                <>
                  <span className="badge badge-warning mr-2">Payment Required</span>
                  <button className="btn btn-outline btn-sm flex-align-center gap-1"><FileText size={14}/> View AI Report</button>
                </>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="chat-messages p-4" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map(msg => {
              const isMine = msg.sender === role;
              
              return (
                <div key={msg.id} className="message-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                  
                  {/* TEXT MESSAGE */}
                  {msg.type === 'text' && (
                    <div className="message-bubble shadow-sm" 
                      style={{
                        backgroundColor: isMine ? 'var(--secondary)' : 'white',
                        color: isMine ? 'white' : 'var(--text-main)',
                        padding: '0.85rem 1.25rem',
                        borderRadius: isMine ? '1.2rem 1.2rem 0 1.2rem' : '1.2rem 1.2rem 1.2rem 0',
                        maxWidth: '75%',
                        fontSize: '0.95rem',
                        lineHeight: '1.5'
                      }}>
                      <p>{msg.text}</p>
                    </div>
                  )}

                  {/* IMAGE MESSAGE */}
                  {msg.type === 'image' && (
                    <div className="message-bubble shadow-sm" style={{ padding: '0.5rem', backgroundColor: isMine ? 'var(--secondary)' : 'white', borderRadius: isMine ? '1.2rem 1.2rem 0 1.2rem' : '1.2rem 1.2rem 1.2rem 0', maxWidth: '300px' }}>
                      <img src={msg.image} alt="Attached" style={{ width: '100%', borderRadius: '0.8rem' }} />
                    </div>
                  )}

                  {/* AI REPORT MESSAGE */}
                  {msg.type === 'ai-report' && (
                    <div className="ai-report-card shadow-sm" style={{ backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '1rem', padding: '1.25rem', width: '350px', maxWidth: '90%' }}>
                      <div className="flex-align-center gap-2 mb-3 pb-3 border-b" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <BrainCircuit size={20} className="text-secondary" />
                        <h4 className="font-bold text-primary">AI Dental Analysis Report</h4>
                      </div>
                      <div className="mb-2">
                        <span className="text-xs text-muted block mb-1">Detected Condition:</span>
                        <span className="font-bold text-main">{msg.report.condition}</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-xs text-muted block mb-1">AI Confidence:</span>
                        <span className="font-bold text-secondary">{msg.report.confidence}</span>
                      </div>
                      <div className="mb-3">
                        <span className="text-xs text-muted block mb-1">Status:</span>
                        <span className="badge badge-warning">{msg.report.status}</span>
                      </div>
                      <div className="bg-main p-2 rounded text-center text-xs text-muted mt-2">
                        <ImageIcon size={14} className="inline mr-1" /> Uploaded Image Available
                      </div>
                      <p className="text-xs text-warning mt-3 text-center" style={{ fontStyle: 'italic' }}>
                        * AI prediction is assistive and requires professional verification.
                      </p>
                    </div>
                  )}

                  {/* PAYMENT REQUEST MESSAGE */}
                  {msg.type === 'payment-request' && (
                    <div className="payment-request-card shadow-sm" style={{ backgroundColor: 'white', border: '1px solid #fcd34d', borderRadius: '1rem', padding: '1.25rem', width: '300px', maxWidth: '90%', textAlign: 'center' }}>
                      <CreditCard size={32} className="text-warning mx-auto mb-2" style={{ margin: '0 auto 0.5rem' }} />
                      <p className="text-sm text-main mb-2">Doctor has requested a consultation payment of <strong>₹{msg.amount}</strong>.</p>
                      <span className="badge badge-warning mb-4 inline-block">Payment Required</span>
                      
                      {role === 'patient' && (
                        <button className="btn btn-primary w-full flex-align-center justify-center gap-2">
                          <CreditCard size={16} /> Pay Consultation Fee
                        </button>
                      )}
                    </div>
                  )}

                  <span className={`text-xs mt-1 block ${isMine ? 'text-muted' : 'text-muted'}`} style={{ opacity: 0.8 }}>{msg.time}</span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer Box */}
          <div className="chat-composer-area bg-white" style={{ borderTop: '1px solid var(--border-color)', padding: '1rem 1.5rem' }}>
            
            {/* Doctor Actions */}
            {role === 'doctor' && (
              <div className="flex-align-center gap-3 mb-3">
                <button className="btn btn-outline btn-sm text-warning flex-align-center gap-1" style={{ borderColor: '#fcd34d' }} onClick={() => setShowPaymentModal(true)}>
                  <CreditCard size={16} /> Request Consultation Payment
                </button>
                <button className="btn btn-outline btn-sm text-success flex-align-center gap-1" style={{ borderColor: '#86efac' }}>
                  <CheckCircle2 size={16} /> Complete Consultation
                </button>
              </div>
            )}

            {/* Patient Actions (Share Report) */}
            {role === 'patient' && (
              <div className="mb-3">
                <button type="button" onClick={shareAiReport} className="btn btn-outline btn-sm text-secondary flex-align-center gap-1" style={{ borderColor: 'var(--secondary)' }}>
                  <BrainCircuit size={16} /> Share AI Report
                </button>
              </div>
            )}

            {/* Image Preview inside composer */}
            {selectedImage && (
              <div className="composer-image-preview mb-3 relative inline-block" style={{ position: 'relative', display: 'inline-block' }}>
                <img src={selectedImage} alt="Preview" style={{ height: '80px', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
                <button onClick={() => setSelectedImage(null)} className="icon-btn bg-white shadow-sm" style={{ position: 'absolute', top: '-10px', right: '-10px', width: '24px', height: '24px', padding: 0 }}>
                  <X size={14} />
                </button>
              </div>
            )}

            <form onSubmit={handleSend} className="flex-align-center gap-3">
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
              
              <button type="button" className="icon-btn text-muted hover:text-primary" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon size={22} />
              </button>
              <button type="button" className="icon-btn text-muted hover:text-primary">
                <span style={{ fontSize: '1.2rem' }}>😀</span>
              </button>
              
              <input 
                type="text" 
                className="form-input flex-1" 
                placeholder="Type a message..." 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{ borderRadius: '999px', padding: '0.75rem 1.25rem', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)' }}
              />
              <button type="submit" className="btn btn-primary shadow-sm" style={{ borderRadius: '50%', width: '46px', height: '46px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Payment Request Modal (Doctor Side) */}
      {showPaymentModal && role === 'doctor' && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '400px', padding: '2rem', textAlign: 'center' }}>
            <h3 className="mb-2">Consultation Fee</h3>
            <div className="font-bold text-primary mb-4" style={{ fontSize: '2.5rem' }}>₹500</div>
            <p className="text-muted mb-6">Payment is required before continuing with the paid consultation.</p>
            <div className="flex-align-center gap-3">
              <button className="btn btn-outline flex-1" onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button className="btn btn-primary flex-1" onClick={requestPayment}>Request Payment</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MessagesUI;
