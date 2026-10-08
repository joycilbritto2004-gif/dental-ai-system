import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Image as ImageIcon, BrainCircuit, Search, FileText, X, CreditCard, CheckCircle2, MessageSquare, ChevronLeft } from 'lucide-react';
import '../Dashboard.css';

const MessagesUI = ({ role = 'patient' }) => {
  const { state } = useLocation();
  const initialConsultationId = state?.consultationId || null;

  const [consultations, setConsultations] = useState([]);
  const [selectedConsultationId, setSelectedConsultationId] = useState(initialConsultationId);
  const [isMobileViewOpen, setIsMobileViewOpen] = useState(initialConsultationId ? true : false);
  
  const [allMessages, setAllMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const userStr = localStorage.getItem('dentaai_user');
        const user = userStr ? JSON.parse(userStr) : {};
        const userId = user._id || user.id;
        
        const url = role === 'doctor' 
          ? `http://localhost:5000/api/consultations?doctorId=${userId}`
          : `http://localhost:5000/api/consultations`;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch consultations');
        
        const data = await res.json();
        
        const activeConsultations = data.filter(c => 
          c.status === 'Accepted' || 
          c.status === 'Payment Requested' || 
          c.status === 'Paid' || 
          c.status === 'Completed' ||
          c.status === 'Verified' ||
          c.paymentStatus === 'Paid'
        );

        activeConsultations.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setConsultations(activeConsultations);
        
        if (activeConsultations.length > 0 && !selectedConsultationId) {
          // don't auto-select on mobile so they see the list first
          if (window.innerWidth > 768) {
            setSelectedConsultationId(activeConsultations[0].id);
          }
        }
      } catch (e) {
        console.error("Error loading consultations:", e);
      }
    };
    fetchConsultations();
  }, [role, selectedConsultationId]);

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
      
      const currentSenderId = user.id || user._id;
      const receiverId = role === 'doctor' 
        ? (activeConsultation?.patientId || "patient_1") 
        : (activeConsultation?.doctorId);

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

  const handleCompleteConsultation = async () => {
    if (!finalDiagnosis || !treatmentPlan) {
      alert("Please enter both a final diagnosis and a treatment plan before completing.");
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:5000/api/consultations/${activeConsultation._id}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalDiagnosis, treatmentPlan })
      });
      
      if (!res.ok) throw new Error('Failed to update');
      
      const _updated = await res.json();
      
      setConsultations(prev => prev.map(c => 
        String(c.id) === String(selectedConsultationId) 
          ? { ...c, status: 'Completed', finalDiagnosis, treatmentPlan } 
          : c
      ));
      
      setShowCompletionModal(false);
      alert('Consultation completed successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to save consultation data.');
    }
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

  const isMobile = window.innerWidth <= 768;

  return (
    <div className="dashboard-view animate-fade-in" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER */}
      <div className="mb-4 page-header-card" style={{ padding: '24px 32px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', background: 'radial-gradient(circle at top right, rgba(0, 166, 166, 0.12), transparent 70%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--secondary)' }}></div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <h2 className="font-extrabold mb-1" style={{ color: 'var(--text-primary)', letterSpacing: '-0.5px', fontSize: '2rem', lineHeight: '1.2', margin: 0 }}>Messages</h2>
          <p className="font-medium m-0" style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Communicate securely with your dental care team.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
        
        {/* CONTACTS SIDEBAR */}
        <div 
          className="card" 
          style={{ 
            width: isMobile ? '100%' : '360px', 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '24px', 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', 
            display: (!isMobile || !isMobileViewOpen) ? 'flex' : 'none', 
            flexDirection: 'column', 
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} className="text-muted" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" className="form-input" placeholder="Search conversations..." style={{ paddingLeft: '44px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '999px', width: '100%' }} />
            </div>
          </div>
          
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {consultations.length === 0 ? (
              <div className="text-center text-muted" style={{ padding: '40px 20px' }}>
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
                    onClick={() => {
                      setSelectedConsultationId(c.id);
                      setIsMobileViewOpen(true);
                    }}
                    style={{ 
                      padding: '20px 24px', 
                      borderBottom: '1px solid var(--border-color)', 
                      backgroundColor: isActive ? 'rgba(0, 166, 166, 0.05)' : 'transparent', 
                      borderLeft: isActive ? '4px solid var(--secondary)' : '4px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ backgroundColor: isActive ? 'var(--secondary)' : 'var(--bg-primary)', color: isActive ? 'white' : 'var(--primary)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem', flexShrink: 0, border: isActive ? 'none' : '1px solid var(--border-color)' }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '1.05rem' }}>{partnerName}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{c.time || c.date}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {partnerTitle} &bull; {c.condition?.replace('_', ' ') || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CHAT WINDOW */}
        <div 
          className="card" 
          style={{ 
            flex: 1, 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '24px', 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', 
            display: (!isMobile || isMobileViewOpen) ? 'flex' : 'none', 
            flexDirection: 'column', 
            overflow: 'hidden' 
          }}
        >
          {selectedConsultationId && activeConsultation ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {isMobile && (
                    <button onClick={() => setIsMobileViewOpen(false)} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      <ChevronLeft size={24} />
                    </button>
                  )}
                  <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--secondary)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {getPartnerInitials(chatPartnerName)}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.2rem' }}>{chatPartnerName}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{chatPartnerTitle}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div> Online
                      </span>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {role === 'patient' ? (
                    <button className="btn btn-outline btn-sm" style={{ borderRadius: '999px', fontWeight: 'bold' }}>View Profile</button>
                  ) : (
                    <>
                      {activeConsultation.paymentStatus === 'Paid' && (
                        <span className="badge bg-success-light text-success" style={{ padding: '6px 12px', borderRadius: '999px', fontWeight: 800, fontSize: '0.8rem' }}>Paid</span>
                      )}
                      <button className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '999px', fontWeight: 'bold' }}>
                        <FileText size={14}/> Report
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-card)' }}>
                {activeMessages.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <MessageSquare size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
                    <h4 style={{ fontWeight: 800, color: 'var(--text-primary)' }}>No messages yet</h4>
                    <p style={{ fontSize: '0.95rem' }}>Start the conversation securely below.</p>
                  </div>
                ) : (
                  activeMessages.map((msg, index) => {
                    const isMine = msg.sender === role;
                    const messageText = msg.message || msg.text; 
                    
                    return (
                      <div key={msg.id || msg._id || `msg-${index}`} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                        
                        {/* TEXT MESSAGE */}
                        {msg.type === 'text' && (
                          <div style={{
                            background: isMine ? 'var(--gradient-primary)' : 'var(--bg-card)',
                            color: isMine ? 'white' : 'var(--text-primary)',
                            border: isMine ? 'none' : '1px solid var(--border-color)',
                            padding: '12px 18px',
                            borderRadius: isMine ? '16px 16px 0 16px' : '16px 16px 16px 0',
                            maxWidth: '75%',
                            fontSize: '0.95rem',
                            lineHeight: '1.5',
                            fontWeight: 500,
                            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                          }}>
                            {messageText}
                          </div>
                        )}

                        {/* IMAGE MESSAGE */}
                        {msg.type === 'image' && (
                          <div style={{ padding: '8px', background: isMine ? 'var(--gradient-primary)' : 'var(--bg-card)', border: isMine ? 'none' : '1px solid var(--border-color)', borderRadius: isMine ? '16px 16px 0 16px' : '16px 16px 16px 0', maxWidth: '300px' }}>
                            <img src={msg.image} alt="Attached" style={{ width: '100%', borderRadius: '10px' }} />
                          </div>
                        )}

                        {/* AI REPORT MESSAGE */}
                        {msg.type === 'ai-report' && (
                          <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px', width: '350px', maxWidth: '90%', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                              <div style={{ background: 'rgba(0, 166, 166, 0.1)', padding: '8px', borderRadius: '8px', color: 'var(--secondary)' }}><BrainCircuit size={18} /></div>
                              <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>AI Dental Analysis</h4>
                            </div>
                            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Detected Condition</span>
                              <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{msg.report?.condition?.replace('_', ' ')}</span>
                            </div>
                            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Confidence</span>
                              <span style={{ fontWeight: 800, color: 'var(--secondary)', fontSize: '0.9rem' }}>{msg.report?.confidence}</span>
                            </div>
                            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</span>
                              <span className="badge bg-warning-light text-warning" style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', fontWeight: 800 }}>{msg.report?.status}</span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--warning)', margin: 0, textAlign: 'center', fontWeight: 600, fontStyle: 'italic' }}>
                              * Assistive AI prediction requires verification.
                            </p>
                          </div>
                        )}

                        {/* PAYMENT REQUEST MESSAGE */}
                        {msg.type === 'payment-request' && (
                          <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--warning)', borderRadius: '16px', padding: '24px', width: '300px', maxWidth: '90%', textAlign: 'center' }}>
                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                              <CreditCard size={24} />
                            </div>
                            <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 16px 0', fontWeight: 600 }}>
                              Payment requested for <strong>₹{msg.amount}</strong>.
                            </p>
                            
                            {role === 'patient' && (
                              <button className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '999px', fontWeight: 'bold' }}>
                                <CreditCard size={16} /> Pay Now
                              </button>
                            )}
                          </div>
                        )}

                        <span style={{ fontSize: '0.75rem', marginTop: '6px', color: 'var(--text-muted)', fontWeight: 600 }}>{msg.time}</span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer Box */}
              <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                
                {/* Doctor Actions */}
                {role === 'doctor' && (
                  <div style={{ marginBottom: '16px' }}>
                    <button 
                      className="btn btn-outline" 
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '999px', fontWeight: 'bold', color: 'var(--success)', borderColor: 'var(--success)' }}
                      onClick={() => setShowCompletionModal(true)}
                    >
                      <CheckCircle2 size={16} /> Complete Consultation
                    </button>
                  </div>
                )}

                {/* Patient Actions (Share Report) */}
                {role === 'patient' && (
                  <div style={{ marginBottom: '16px' }}>
                    <button type="button" onClick={shareAiReport} className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '999px', fontWeight: 'bold', color: 'var(--secondary)', borderColor: 'var(--secondary)' }}>
                      <BrainCircuit size={16} /> Share AI Report
                    </button>
                  </div>
                )}

                {/* Image Preview inside composer */}
                {selectedImage && (
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
                    <img src={selectedImage} alt="Preview" style={{ height: '80px', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
                    <button onClick={() => setSelectedImage(null)} style={{ position: 'absolute', top: '-10px', right: '-10px', width: '28px', height: '28px', padding: 0, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50%', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={14} />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '8px', borderRadius: '999px' }}>
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
                  
                  <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '8px', cursor: 'pointer', display: 'flex' }}>
                    <ImageIcon size={20} />
                  </button>
                  
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={!selectedConsultationId}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 500, padding: '0 8px' }}
                  />
                  
                  <button type="submit" disabled={!inputText.trim() && !selectedImage} style={{ background: 'var(--gradient-primary)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (!inputText.trim() && !selectedImage) ? 'not-allowed' : 'pointer', opacity: (!inputText.trim() && !selectedImage) ? 0.5 : 1, boxShadow: '0 4px 10px rgba(22, 119, 255, 0.3)' }}>
                    <Send size={18} style={{ marginLeft: '2px' }} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '50%', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
                <MessageSquare size={48} color="var(--text-muted)" opacity={0.5} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.5rem' }}>Select a conversation</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontWeight: 500, maxWidth: '300px' }}>Choose a consultation from the list to view history or send a secure message.</p>
            </div>
          )}
        </div>
      </div>

      {/* Completion Modal (Doctor Side) */}
      {showCompletionModal && role === 'doctor' && activeConsultation && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '500px', maxWidth: '90%', padding: '32px', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>Complete Consultation</h3>
              <button onClick={() => setShowCompletionModal(false)} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
            </div>
            
            <div className="form-group mb-4">
              <label className="form-label font-bold text-muted" style={{ marginBottom: '8px', display: 'block' }}>Final Diagnosis</label>
              <input 
                type="text"
                className="form-input"
                placeholder="e.g. Early stage caries"
                value={finalDiagnosis}
                onChange={(e) => setFinalDiagnosis(e.target.value)}
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
              />
            </div>
            
            <div className="form-group mb-6">
              <label className="form-label font-bold text-muted" style={{ marginBottom: '8px', display: 'block' }}>Treatment Plan & Prescription</label>
              <textarea 
                className="form-input" 
                rows="4" 
                placeholder="Detail the clinical recommendations here..."
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
                style={{ resize: 'vertical', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="btn btn-outline" style={{ flex: 1, borderRadius: '999px', fontWeight: 'bold' }} onClick={() => setShowCompletionModal(false)}>Cancel</button>
              <button className="btn btn-success" style={{ flex: 1, borderRadius: '999px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleCompleteConsultation}>
                <CheckCircle2 size={18} /> Complete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MessagesUI;


