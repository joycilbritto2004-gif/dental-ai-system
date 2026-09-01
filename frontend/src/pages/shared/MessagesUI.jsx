import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Image as ImageIcon, BrainCircuit, Search, MoreVertical, FileText, X, Info, CreditCard, CheckCircle2, MessageSquare } from 'lucide-react';
import '../Dashboard.css';

const MessagesUI = ({ role = 'patient' }) => {
  const { state } = useLocation();
  const initialConsultationId = state?.consultationId || null;

  const [consultations, setConsultations] = useState([]);
  const [selectedConsultationId, setSelectedConsultationId] = useState(initialConsultationId);
  
  const [allMessages, setAllMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch Consultations from backend
  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const url = role === 'doctor' 
          ? 'http://localhost:5000/api/consultations?doctorId=3'
          : 'http://localhost:5000/api/consultations';
        
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch consultations');
        
        const data = await res.json();
        
        // Filter out Pending Requests and Rejected as they haven't started a chat yet
        const activeConsultations = data.filter(c => 
          c.status === 'Accepted' || 
          c.status === 'Payment Requested' || 
          c.status === 'Paid' || 
          c.status === 'Completed' ||
          c.status === 'Verified' ||
          c.paymentStatus === 'Paid'
        );

        // Sort by newest first
        activeConsultations.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setConsultations(activeConsultations);
        
        if (activeConsultations.length > 0 && !selectedConsultationId) {
          setSelectedConsultationId(activeConsultations[0].id);
        }
      } catch (e) {
        console.error("Error loading consultations:", e);
      }
    };
    fetchConsultations();
  }, [role, selectedConsultationId]);

  // Fetch Messages for selected consultation
  useEffect(() => {
    if (!selectedConsultationId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/messages/${selectedConsultationId}`);
        if (!res.ok) throw new Error('Failed to fetch messages');
        const data = await res.json();
        setAllMessages(data);
      } catch (e) {
        console.error("Error loading messages:", e);
      }
    };

    fetchMessages();
    // 3 second polling for real-time messages
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedConsultationId]);

  const activeMessages = allMessages;
  const activeConsultation = consultations.find(c => String(c.id) === String(selectedConsultationId));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages.length, selectedConsultationId]);

  const getFormattedTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const saveMessage = async (newMessageObj) => {
    try {
      const userStr = localStorage.getItem('dentaai_user');
      const user = userStr ? JSON.parse(userStr) : {};
      
      const currentSenderId = user.id || user._id || (role === 'doctor' ? "3" : "patient_1");
      const receiverId = role === 'doctor' 
        ? (activeConsultation?.scanId?.patientId || "patient_1") 
        : (activeConsultation?.doctorId || "3");

      const payload = {
        ...newMessageObj,
        senderId: currentSenderId,
        receiverId: receiverId,
        message: newMessageObj.text || newMessageObj.message || ""
      };

      const res = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save message');
      const savedMessage = await res.json();
      setAllMessages(prev => [...prev, savedMessage]);
    } catch (e) {
      console.error("Error saving message:", e);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!selectedConsultationId) return;
    if (!inputText.trim() && !selectedImage) return;

    if (selectedImage) {
      saveMessage({
        consultationId: selectedConsultationId,
        type: 'image',
        sender: role,
        image: selectedImage,
        time: getFormattedTime()
      });
      setSelectedImage(null);
    }
    
    if (inputText.trim()) {
      saveMessage({
        consultationId: selectedConsultationId,
        type: 'text',
        sender: role,
        text: inputText.trim(),
        time: getFormattedTime()
      });
      setInputText('');
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const shareAiReport = () => {
    if (!activeConsultation) return;
    
    saveMessage({
      consultationId: selectedConsultationId,
      type: 'ai-report',
      sender: role, 
      report: {
        condition: activeConsultation.condition || 'Unknown',
        confidence: activeConsultation.confidence || '0%',
        status: 'Awaiting Doctor Verification'
      },
      time: getFormattedTime()
    });
  };

  const requestPayment = () => {
    if (!activeConsultation) return;
    
    saveMessage({
      consultationId: selectedConsultationId,
      type: 'payment-request',
      sender: 'doctor',
      amount: activeConsultation.fee || activeConsultation.totalAmount || 500,
      time: getFormattedTime()
    });
    setShowPaymentModal(false);
  };

  const chatPartnerName = activeConsultation 
    ? (role === 'patient' ? (activeConsultation.doctorName || 'Doctor') : (activeConsultation.patientName || 'Patient'))
    : 'Select a conversation';
  
  const chatPartnerTitle = activeConsultation
    ? (role === 'patient' ? (activeConsultation.doctorSpecialization || 'Dentist') : `Patient ID: P-${activeConsultation.id?.toString().substring(0, 5) || '00000'}`)
    : '';

  const getPartnerInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

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
            {consultations.length === 0 ? (
              <div className="text-center text-muted p-4 mt-4">
                <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                <p>No conversations yet.</p>
              </div>
            ) : (
              consultations.map(c => {
                const partnerName = role === 'patient' ? (c.doctorName || 'Doctor') : (c.patientName || 'Patient');
                const partnerTitle = role === 'patient' ? (c.doctorSpecialization || 'Dentist') : `ID: P-${c.id?.toString().substring(0, 5) || '00000'}`;
                const initials = getPartnerInitials(partnerName);
                const isActive = String(c.id) === String(selectedConsultationId);
                
                return (
                  <div 
                    key={c.id} 
                    className={`chat-contact ${isActive ? 'active' : 'hover-bg'}`} 
                    onClick={() => setSelectedConsultationId(c.id)}
                    style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', backgroundColor: isActive ? 'var(--bg-main)' : 'white', cursor: 'pointer' }}
                  >
                    <div className="flex-align-center gap-3">
                      <div className="doctor-avatar text-primary" style={{ backgroundColor: isActive ? 'var(--blue-light)' : '#f1f5f9', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                        {initials}
                      </div>
                      <div className="flex-1" style={{ overflow: 'hidden' }}>
                        <div className="flex-between mb-1">
                          <span className="font-semibold text-primary" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{partnerName}</span>
                          <span className="text-xs text-muted">{c.time || c.date}</span>
                        </div>
                        <div className="text-xs text-muted mb-1">{partnerTitle}</div>
                        <p className="text-sm text-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Condition: {c.condition || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="chat-main flex-1" style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
          
          {selectedConsultationId && activeConsultation ? (
            <>
              {/* Chat Header */}
              <div className="chat-header p-4 bg-white border-b" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="flex-align-center gap-3">
                  <div className="doctor-avatar bg-blue-light text-primary" style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.3rem' }}>
                    {getPartnerInitials(chatPartnerName)}
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
                      {activeConsultation.paymentStatus !== 'Paid' && (
                        <span className="badge badge-warning mr-2">Payment Required</span>
                      )}
                      <button className="btn btn-outline btn-sm flex-align-center gap-1"><FileText size={14}/> View AI Report</button>
                    </>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="chat-messages p-4" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeMessages.length === 0 ? (
                  <div className="text-center text-muted my-auto">
                    <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
                    <h4>No messages yet</h4>
                    <p className="mt-2 text-sm">Start the conversation by sending a message.</p>
                  </div>
                ) : (
                  activeMessages.map(msg => {
                    const isMine = msg.sender === role;
                    const messageText = msg.message || msg.text; // Ensure both work
                    
                    return (
                      <div key={msg.id || msg._id} className="message-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                        
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
                            <p>{messageText}</p>
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
                              <span className="font-bold text-main">{msg.report?.condition}</span>
                            </div>
                            <div className="mb-2">
                              <span className="text-xs text-muted block mb-1">AI Confidence:</span>
                              <span className="font-bold text-secondary">{msg.report?.confidence}</span>
                            </div>
                            <div className="mb-3">
                              <span className="text-xs text-muted block mb-1">Status:</span>
                              <span className="badge badge-warning">{msg.report?.status}</span>
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
                  })
                )}
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
                    disabled={!selectedConsultationId}
                    style={{ borderRadius: '999px', padding: '0.75rem 1.25rem', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)' }}
                  />
                  <button type="submit" className="btn btn-primary shadow-sm" disabled={!inputText.trim() && !selectedImage} style={{ borderRadius: '50%', width: '46px', height: '46px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!inputText.trim() && !selectedImage) ? 0.5 : 1 }}>
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex-align-center justify-center" style={{ flexDirection: 'column' }}>
              <MessageSquare size={64} className="text-muted mb-4 opacity-50" />
              <h3 className="text-primary font-bold">Select a conversation</h3>
              <p className="text-muted">Choose a consultation from the sidebar to start messaging.</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Request Modal (Doctor Side) */}
      {showPaymentModal && role === 'doctor' && activeConsultation && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '400px', padding: '2rem', textAlign: 'center' }}>
            <h3 className="mb-2">Consultation Fee</h3>
            <div className="font-bold text-primary mb-4" style={{ fontSize: '2.5rem' }}>₹{activeConsultation.fee || activeConsultation.totalAmount || 500}</div>
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
