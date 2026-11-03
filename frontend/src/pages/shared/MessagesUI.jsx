import { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { Send, Image as ImageIcon, BrainCircuit, FileText, X, CreditCard, CheckCircle2, MessageSquare, ChevronLeft, Lock, XCircle, UserCircle, Calendar, ShieldCheck, Eye, Activity } from 'lucide-react';
import { getConsultationStatusMeta } from '../../utils/consultationStatus';
import { getSocket, joinConsultationRoom, leaveConsultationRoom } from '../../utils/socket';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const MessagesUI = ({ role = 'patient' }) => {
  const { id: routeConsultationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Support consultationId from route param, navigation state, or URL search query
  const queryParams = new URLSearchParams(location.search);
  const targetConsultationId = routeConsultationId || location.state?.consultationId || queryParams.get('consultationId');

  const [consultations, setConsultations] = useState([]);
  const [selectedConsultationId, setSelectedConsultationId] = useState(targetConsultationId);
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync selectedConsultationId when target changes
  useEffect(() => {
    if (targetConsultationId && targetConsultationId !== selectedConsultationId) {
      setSelectedConsultationId(targetConsultationId);
    }
  }, [targetConsultationId]);

  // Fetch all consultations for this user to list booked appointments
  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const userStr = localStorage.getItem('dentaai_user');
        const user = userStr ? JSON.parse(userStr) : {};
        const userId = user._id || user.id;

        const url = role === 'doctor'
          ? `${API_BASE}/api/consultations?doctorId=${userId}`
          : `${API_BASE}/api/consultations`;

        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error('Failed to fetch consultations');

        const data = await res.json();
        const validList = Array.isArray(data) ? data : [];
        validList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setConsultations(validList);

        // If no consultation is selected yet, choose the target or the first active one
        if (!selectedConsultationId && validList.length > 0) {
          setSelectedConsultationId(validList[0].id || validList[0]._id);
        }
      } catch (e) {
        console.error('Error loading consultations in MessagesUI:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsultations();
  }, [role, selectedConsultationId]);

  // Fetch and poll the selected consultation record and messages in real-time
  useEffect(() => {
    if (!selectedConsultationId) return;

    let isMounted = true;

    // Join Socket.IO consultation room for instantaneous updates
    joinConsultationRoom(selectedConsultationId);
    const socket = getSocket();

    const handleConsultationAccepted = (payload) => {
      if (!isMounted) return;
      const targetId = payload.consultationId || payload.id;
      if (String(targetId) === String(selectedConsultationId)) {
        setActiveConsultation(prev => ({
          ...(prev || {}),
          status: 'Accepted',
          ...(payload.consultation || {})
        }));
        setConsultations(prevList => prevList.map(c => {
          const cId = c.id || c._id;
          if (String(cId) === String(selectedConsultationId)) {
            return { ...c, status: 'Accepted' };
          }
          return c;
        }));
        // Re-fetch messages immediately
        pollConsultationAndMessages();
      }
    };

    const handleNewMessage = (msg) => {
      if (!isMounted) return;
      if (String(msg.consultationId) === String(selectedConsultationId)) {
        setAllMessages(prev => {
          if (prev.some(m => (m._id && m._id === msg._id) || (m.timestamp && m.timestamp === msg.timestamp && m.text === msg.text))) {
            return prev;
          }
          return [...prev, msg];
        });
      }
    };

    if (socket) {
      socket.on('consultation-accepted', handleConsultationAccepted);
      socket.on('new-message', handleNewMessage);
    }

    const pollConsultationAndMessages = async () => {
      try {
        const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        // 1. Poll consultation record for live status updates (e.g., Pending -> Accepted) without page refresh
        const consultRes = await fetch(`${API_BASE}/api/consultations/${selectedConsultationId}`, { headers });
        if (consultRes.ok && isMounted) {
          const consultData = await consultRes.json();
          setActiveConsultation(prev => {
            if (!prev || prev.status !== consultData.status || prev.finalDiagnosis !== consultData.finalDiagnosis) {
              return consultData;
            }
            return prev;
          });

          // Sync status in the sidebar list if it changed
          setConsultations(prevList => prevList.map(c => {
            const cId = c.id || c._id;
            if (String(cId) === String(selectedConsultationId) && c.status !== consultData.status) {
              return { ...c, status: consultData.status };
            }
            return c;
          }));
        }

        // 2. Poll messages for the active consultation
        const msgRes = await fetch(`${API_BASE}/api/messages/${selectedConsultationId}`, { headers });
        if (msgRes.ok && isMounted) {
          const msgData = await msgRes.json();
          setAllMessages(Array.isArray(msgData) ? msgData : []);
        }
      } catch (e) {
        if (isMounted) console.error('Error polling consultation data in MessagesUI:', e);
      }
    };

    // Immediate initial fetch
    pollConsultationAndMessages();

    // Regular polling interval (every 3 seconds) for live status transitions as fallback
    const intervalId = setInterval(pollConsultationAndMessages, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      if (socket) {
        socket.off('consultation-accepted', handleConsultationAccepted);
        socket.off('new-message', handleNewMessage);
      }
      leaveConsultationRoom(selectedConsultationId);
    };
  }, [selectedConsultationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMessages.length, selectedConsultationId]);

  const getFormattedTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isPending = !activeConsultation?.status || ['Pending', 'Booked'].includes(activeConsultation?.status);
  const isAccepted = ['Accepted', 'Confirmed', 'In Consultation', 'In Progress'].includes(activeConsultation?.status);
  const isCompleted = activeConsultation?.status === 'Completed' || activeConsultation?.status === 'Verified';
  const isCancelled = activeConsultation?.status === 'Rejected' || activeConsultation?.status === 'Cancelled';
  const isReadOnly = isCompleted || isCancelled;
  const isMessagingLocked = isPending || isReadOnly;

  const [isAcceptingInChat, setIsAcceptingInChat] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeDiagnosis, setCompleteDiagnosis] = useState('');
  const [completeTreatment, setCompleteTreatment] = useState('');

  const handleCompleteConsultation = async () => {
    if (!selectedConsultationId) return;
    try {
      setIsCompleting(true);
      const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const resolvedDiag = completeDiagnosis.trim() || activeConsultation?.finalDiagnosis || 'Consultation concluded by specialist via chat.';
      const resolvedTreat = completeTreatment.trim() || activeConsultation?.treatmentPlan || 'Follow oral hygiene guidelines and advice discussed in consultation.';

      const payload = {
        finalDiagnosis: resolvedDiag,
        treatmentPlan: resolvedTreat,
        verificationStatus: 'Verified'
      };

      const res = await fetch(`${API_BASE}/api/consultations/${selectedConsultationId}/complete`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to complete consultation');
      }

      const updatedRecord = await res.json();
      setActiveConsultation(updatedRecord);
      setConsultations(prev => prev.map(c => {
        const cId = c.id || c._id;
        if (String(cId) === String(selectedConsultationId)) {
          return { ...c, status: 'Completed', finalDiagnosis: updatedRecord.finalDiagnosis, treatmentPlan: updatedRecord.treatmentPlan };
        }
        return c;
      }));
      setShowCompleteModal(false);
    } catch (err) {
      console.error('Error completing consultation:', err);
      alert(err.message || 'Failed to complete consultation.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDoctorAcceptInChat = async () => {
    if (!selectedConsultationId) return;
    try {
      setIsAcceptingInChat(true);
      const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const res = await fetch(`${API_BASE}/api/consultations/${selectedConsultationId}/accept`, {
        method: 'PUT',
        headers
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to accept consultation');
      }
      setActiveConsultation(prev => ({ ...prev, status: 'Accepted' }));
      setConsultations(prev => prev.map(c => ((c.id === selectedConsultationId || c._id === selectedConsultationId) ? { ...c, status: 'Accepted' } : c)));
    } catch (e) {
      console.error('Accept error in chat:', e);
      alert(e.message || 'Failed to accept consultation.');
    } finally {
      setIsAcceptingInChat(false);
    }
  };

  const saveMessage = async (newMessageObj) => {
    if (isPending) {
      alert(role === 'doctor' ? 'Please accept this consultation request before sending messages.' : 'Messaging will be available after the doctor accepts your consultation request.');
      return;
    }
    if (isCompleted) {
      alert('This consultation has been completed. New messages cannot be sent.');
      return;
    }
    if (isCancelled) {
      alert('This consultation has been cancelled. New messages cannot be sent.');
      return;
    }

    try {
      setIsSending(true);
      const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const userStr = localStorage.getItem('dentaai_user');
      const user = userStr ? JSON.parse(userStr) : {};
      const currentSenderId = user.id || user._id;

      const receiverId = role === 'doctor'
        ? (activeConsultation?.patientId)
        : (activeConsultation?.doctorId);

      const payload = {
        ...newMessageObj,
        consultationId: selectedConsultationId,
        senderId: currentSenderId,
        receiverId: receiverId,
        message: newMessageObj.text || newMessageObj.message || ''
      };

      const res = await fetch(`${API_BASE}/api/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to save message');
      }

      const savedMessage = await res.json();
      setAllMessages(prev => [...prev, savedMessage]);
    } catch (e) {
      console.error('Error saving message:', e);
      alert(e.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!selectedConsultationId || isMessagingLocked) return;
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
    if (!activeConsultation || isReadOnly) return;

    saveMessage({
      consultationId: selectedConsultationId,
      type: 'ai-report',
      sender: role,
      report: {
        condition: activeConsultation.condition || 'General Checkup',
        confidence: activeConsultation.confidence || 'N/A',
        status: activeConsultation.status || 'Pending'
      },
      time: getFormattedTime()
    });
  };

  const chatPartnerName = activeConsultation
    ? (role === 'patient' ? (activeConsultation.doctorName || 'Attending Specialist') : (activeConsultation.patientName || 'Patient'))
    : 'Consultation Chat';

  const chatPartnerSubtitle = activeConsultation
    ? (role === 'patient' 
        ? (activeConsultation.doctorSpecialization || 'DentaAI Specialist') 
        : `Patient UID: P-${activeConsultation.id ? activeConsultation.id.toString().substring(0, 6) : '00000'}`)
    : '';

  const statusMeta = getConsultationStatusMeta(activeConsultation?.status);

  if (isLoading && consultations.length === 0) {
    return (
      <div className="dashboard-view flex-align-center justify-center" style={{ minHeight: '60vh' }}>
        <Activity className="spin-anim" size={40} color="var(--primary, #1677FF)" />
      </div>
    );
  }

  return (
    <div className="dashboard-view animate-fade-in" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* TOP HEADER CARD */}
      <div 
        className="mb-4 page-header-card" 
        style={{ 
          padding: '20px 28px', 
          borderRadius: '20px', 
          background: '#ffffff',
          border: '1px solid #cbd5e1', 
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)', 
          flexShrink: 0 
        }}
      >
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <div>
            <div className="flex-align-center gap-2 mb-1">
              <Link 
                to={role === 'doctor' ? '/dashboard/doctor/consultations' : '/dashboard/patient/consultations'} 
                className="text-muted hover:text-primary flex-align-center gap-1 font-semibold"
                style={{ fontSize: '0.9rem', color: '#64748b' }}
              >
                <ChevronLeft size={16} /> {role === 'doctor' ? 'Back to Consultations' : 'Back to My Appointments'}
              </Link>
            </div>
            <h2 className="font-extrabold text-slate-900" style={{ fontSize: '1.65rem', margin: '2px 0 4px 0', color: '#0f172a' }}>
              Consultation Conversation
            </h2>
            <p className="font-medium text-slate-500" style={{ fontSize: '0.95rem', margin: 0, color: '#64748b' }}>
              Secure direct communication linked to consultation case <span style={{ fontWeight: 700, color: '#0f172a' }}>P-{activeConsultation?.id ? activeConsultation.id.toString().substring(0,6) : 'Case'}</span>
            </p>
          </div>

          {/* Quick Context Badges */}
          {activeConsultation && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span 
                className="badge font-bold" 
                style={{ 
                  background: statusMeta.bg, 
                  color: statusMeta.color, 
                  border: `1px solid ${statusMeta.border}`,
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontSize: '0.85rem'
                }}
              >
                {statusMeta.label}
              </span>

              {role === 'doctor' && (
                <>
                  <Link 
                    to={`/dashboard/doctor/consultation/${activeConsultation.id || activeConsultation._id}`}
                    className="btn btn-outline btn-sm flex-align-center gap-1 font-bold"
                    style={{ background: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', padding: '8px 14px', borderRadius: '10px' }}
                  >
                    <Eye size={16} color="#1677FF" /> Open Diagnostic Workspace
                  </Link>
                  {isAccepted && (
                    <button 
                      onClick={() => {
                        setCompleteDiagnosis(activeConsultation?.finalDiagnosis || '');
                        setCompleteTreatment(activeConsultation?.treatmentPlan || '');
                        setShowCompleteModal(true);
                      }}
                      className="btn btn-success btn-sm flex-align-center gap-1 font-bold"
                      style={{ padding: '8px 16px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(22, 163, 74, 0.2)' }}
                    >
                      <CheckCircle2 size={16} /> Complete Consultation
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
        
        {/* LEFT: BOOKED CONSULTATION SELECTOR (Allows switching between active appointments) */}
        <div 
          className="card" 
          style={{ 
            width: '340px', 
            background: '#ffffff', 
            border: '1px solid #cbd5e1', 
            borderRadius: '20px', 
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)', 
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h4 className="font-bold text-slate-800" style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b' }}>
              {role === 'doctor' ? 'My Consultations Queue' : 'My Booked Appointments'}
            </h4>
            <p className="text-slate-500" style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Messages are exclusively linked to their specific case.
            </p>
          </div>
          
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {consultations.length === 0 ? (
              <div className="text-center" style={{ padding: '40px 20px', color: '#64748b' }}>
                <MessageSquare size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p className="font-medium" style={{ margin: 0, fontSize: '0.9rem' }}>No booked consultations yet.</p>
              </div>
            ) : (
              consultations.map(c => {
                const partner = role === 'patient' ? (c.doctorName || 'Doctor') : (c.patientName || 'Patient');
                const partnerSub = role === 'patient' ? (c.doctorSpecialization || 'Specialist') : `Case P-${c.id?.toString().substring(0, 5)}`;
                const itemStatus = getConsultationStatusMeta(c.status);
                const isSelected = String(c.id || c._id) === String(selectedConsultationId);
                
                return (
                  <div 
                    key={c.id || c._id} 
                    onClick={() => {
                      const newId = c.id || c._id;
                      setSelectedConsultationId(newId);
                      navigate(role === 'doctor' 
                        ? `/dashboard/doctor/consultation/${newId}/messages` 
                        : `/dashboard/patient/consultation/${newId}/messages`, 
                        { state: { consultationId: newId }, replace: true }
                      );
                    }}
                    style={{ 
                      padding: '16px 20px', 
                      borderBottom: '1px solid #f1f5f9', 
                      backgroundColor: isSelected ? '#f0f9ff' : 'transparent', 
                      borderLeft: isSelected ? '4px solid #1677FF' : '4px solid transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div 
                        style={{ 
                          width: '42px', 
                          height: '42px', 
                          borderRadius: '50%', 
                          background: isSelected ? '#1677FF' : '#f1f5f9', 
                          color: isSelected ? '#ffffff' : '#334155', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          flexShrink: 0
                        }}
                      >
                        {partner.charAt(0) === 'D' && partner.charAt(1) === 'r' ? (partner.charAt(3) || 'D') : partner.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {partner}
                          </span>
                          <span 
                            style={{ 
                              fontSize: '0.7rem', 
                              fontWeight: 700, 
                              color: itemStatus.color,
                              background: itemStatus.bg,
                              border: `1px solid ${itemStatus.border}`,
                              padding: '2px 8px',
                              borderRadius: '999px'
                            }}
                          >
                            {itemStatus.label}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {partnerSub} &bull; {c.date || 'Scheduled'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: CHAT WORKSPACE FOR SELECTED CONSULTATION */}
        <div 
          className="card" 
          style={{ 
            flex: 1, 
            background: '#ffffff', 
            border: '1px solid #cbd5e1', 
            borderRadius: '20px', 
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)', 
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden' 
          }}
        >
          {selectedConsultationId && activeConsultation ? (
            <>
              {/* Consultation Context Header */}
              <div 
                style={{ 
                  padding: '16px 24px', 
                  borderBottom: '1px solid #e2e8f0', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  background: '#f8fafc' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div 
                    style={{ 
                      width: '46px', 
                      height: '46px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #1677FF, #00A6A6)', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: 'bold', 
                      fontSize: '1.2rem',
                      boxShadow: '0 4px 10px rgba(22, 119, 255, 0.2)'
                    }}
                  >
                    <UserCircle size={26} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '1.15rem' }}>
                      {chatPartnerName}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                        {chatPartnerSubtitle}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} color="#1677FF" /> {activeConsultation.date} @ {activeConsultation.time}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span 
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      background: statusMeta.bg, 
                      color: statusMeta.color, 
                      border: `1px solid ${statusMeta.border}`,
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.85rem'
                    }}
                  >
                    {statusMeta.label}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={14} color="#1677FF" /> Encrypted Channel
                  </span>
                  {role === 'doctor' && isAccepted && (
                    <button
                      onClick={() => {
                        setCompleteDiagnosis(activeConsultation?.finalDiagnosis || '');
                        setCompleteTreatment(activeConsultation?.treatmentPlan || '');
                        setShowCompleteModal(true);
                      }}
                      className="btn btn-success btn-sm font-bold flex-align-center gap-1"
                      style={{ padding: '6px 14px', borderRadius: '8px' }}
                    >
                      <CheckCircle2 size={15} /> Complete Consultation
                    </button>
                  )}
                </div>
              </div>

              {/* Status Alert Banner for Pending, Completed or Cancelled Cases */}
              {isPending && (
                <div style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Lock size={20} color="#b45309" style={{ flexShrink: 0 }} />
                    <div>
                      <span style={{ fontWeight: 800, color: '#92400e', fontSize: '0.9rem' }}>
                        {role === 'doctor' ? '🔒 Consultation Request Awaiting Acceptance' : '🔒 Messaging Locked — Awaiting Doctor Acceptance'}
                      </span>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#b45309', fontWeight: 500 }}>
                        {role === 'doctor'
                          ? 'Accept this consultation request to enable messaging with the patient.'
                          : 'Messaging will be available after the doctor accepts your consultation request.'}
                      </p>
                    </div>
                  </div>
                  {role === 'doctor' && (
                    <button
                      onClick={handleDoctorAcceptInChat}
                      disabled={isAcceptingInChat}
                      className="btn btn-success btn-sm font-bold flex-align-center gap-1"
                      style={{ padding: '6px 14px', borderRadius: '8px' }}
                    >
                      <CheckCircle2 size={16} /> Accept Consultation
                    </button>
                  )}
                </div>
              )}

              {isCompleted && (
                <div style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={22} color="#15803d" style={{ flexShrink: 0 }} />
                  <div>
                    <span style={{ fontWeight: 800, color: '#15803d', fontSize: '0.92rem', display: 'block', marginBottom: '2px' }}>Consultation Completed</span>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
                      This consultation has ended. You can view the conversation history, but new messages are disabled.
                    </p>
                  </div>
                </div>
              )}

              {isCancelled && (
                <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <XCircle size={20} color="#b91c1c" style={{ flexShrink: 0 }} />
                  <div>
                    <span style={{ fontWeight: 800, color: '#b91c1c', fontSize: '0.9rem' }}>Consultation Cancelled</span>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#991b1b', fontWeight: 500 }}>
                      This consultation request was declined or cancelled. New messages cannot be sent.
                    </p>
                  </div>
                </div>
              )}

              {/* Messages Content Area */}
              <div 
                style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  padding: '24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px', 
                  background: '#f8fafc' 
                }}
              >
                {allMessages.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: '#64748b', maxWidth: '400px' }}>
                    <div style={{ 
                      background: '#ffffff', 
                      width: '64px', 
                      height: '64px', 
                      borderRadius: '50%', 
                      border: isPending ? '1px solid #fde68a' : '1px solid #cbd5e1', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      margin: '0 auto 16px', 
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)' 
                    }}>
                      {isPending ? (
                        <Lock size={30} color="#b45309" />
                      ) : (
                        <MessageSquare size={32} color="#1677FF" style={{ opacity: 0.8 }} />
                      )}
                    </div>
                    <h4 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '6px', fontSize: '1.2rem' }}>
                      {isPending ? 'Messaging Locked' : 'No messages yet'}
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                      {isPending
                        ? (role === 'doctor' 
                            ? 'Accept this consultation request above to enable messaging with the patient.' 
                            : 'Messaging will be available after the doctor accepts your consultation request.')
                        : (role === 'patient' 
                            ? 'Send a message to your specialist regarding symptoms, questions, or updates.' 
                            : 'Initiate communication with the patient regarding their scheduled consultation.')}
                    </p>
                  </div>
                ) : (
                  allMessages.map((msg, index) => {
                    const isMine = msg.sender === role;
                    const messageText = msg.message || msg.text;

                    return (
                      <div key={msg.id || msg._id || `msg-${index}`} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                        
                        {/* TEXT MESSAGE BUBBLE */}
                        {msg.type === 'text' && (
                          <div 
                            style={{
                              background: isMine ? 'linear-gradient(135deg, #1677FF, #00A6A6)' : '#ffffff',
                              color: isMine ? '#ffffff' : '#0f172a',
                              border: isMine ? 'none' : '1px solid #cbd5e1',
                              padding: '12px 18px',
                              borderRadius: isMine ? '16px 16px 0 16px' : '16px 16px 16px 0',
                              maxWidth: '75%',
                              fontSize: '0.95rem',
                              lineHeight: '1.5',
                              fontWeight: 500,
                              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)'
                            }}
                          >
                            {messageText}
                          </div>
                        )}

                        {/* IMAGE MESSAGE */}
                        {msg.type === 'image' && (
                          <div 
                            style={{ 
                              padding: '8px', 
                              background: isMine ? 'linear-gradient(135deg, #1677FF, #00A6A6)' : '#ffffff', 
                              border: isMine ? 'none' : '1px solid #cbd5e1', 
                              borderRadius: isMine ? '16px 16px 0 16px' : '16px 16px 16px 0', 
                              maxWidth: '320px',
                              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)'
                            }}
                          >
                            <img src={msg.image} alt="Attachment" style={{ width: '100%', borderRadius: '10px', display: 'block' }} />
                          </div>
                        )}

                        {/* AI REPORT EMBED */}
                        {msg.type === 'ai-report' && (
                          <div 
                            style={{ 
                              backgroundColor: '#ffffff', 
                              border: '1px solid #cbd5e1', 
                              borderRadius: '16px', 
                              padding: '20px', 
                              width: '360px', 
                              maxWidth: '92%', 
                              boxShadow: '0 4px 15px rgba(15, 23, 42, 0.05)' 
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                              <div style={{ background: '#e0f2fe', padding: '8px', borderRadius: '8px', color: '#0369a1' }}>
                                <BrainCircuit size={18} />
                              </div>
                              <h4 style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>AI Dental Analysis Summary</h4>
                            </div>
                            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Identified Pathology</span>
                              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{msg.report?.condition?.replace('_', ' ')}</span>
                            </div>
                            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Confidence</span>
                              <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.9rem' }}>{msg.report?.confidence}</span>
                            </div>
                            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Status</span>
                              <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                                {msg.report?.status}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0, textAlign: 'center', fontWeight: 500, fontStyle: 'italic' }}>
                              * Pre-screened algorithmic analysis for physician verification.
                            </p>
                          </div>
                        )}

                        <span style={{ fontSize: '0.75rem', marginTop: '6px', color: '#64748b', fontWeight: 600 }}>
                          {msg.time}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* COMPOSER / INPUT SECTION */}
              <div 
                style={{ 
                  padding: '16px 24px', 
                  borderTop: '1px solid #e2e8f0', 
                  background: '#ffffff' 
                }}
              >
                {/* Secondary Actions (Share AI Report) */}
                {!isMessagingLocked && role === 'patient' && (
                  <div style={{ marginBottom: '12px' }}>
                    <button 
                      type="button" 
                      onClick={shareAiReport} 
                      className="btn btn-outline btn-sm font-semibold" 
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        borderRadius: '8px', 
                        borderColor: '#cbd5e1', 
                        color: '#0f172a',
                        background: '#f8fafc' 
                      }}
                    >
                      <BrainCircuit size={15} color="#1677FF" /> Share Dental Scan Findings
                    </button>
                  </div>
                )}

                {/* Selected Image Preview */}
                {!isMessagingLocked && selectedImage && (
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: '12px' }}>
                    <img src={selectedImage} alt="Preview" style={{ height: '70px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
                    <button 
                      onClick={() => setSelectedImage(null)} 
                      style={{ 
                        position: 'absolute', 
                        top: '-8px', 
                        right: '-8px', 
                        width: '24px', 
                        height: '24px', 
                        padding: 0, 
                        background: '#ffffff', 
                        border: '1px solid #cbd5e1', 
                        borderRadius: '50%', 
                        color: '#64748b', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Form or Locked/Read-Only Notice */}
                {isPending ? (
                  <div 
                    style={{ 
                      padding: '12px 18px', 
                      background: '#fffbeb', 
                      border: '1px solid #fde68a', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '8px',
                      color: '#92400e',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  >
                    <Lock size={16} /> {role === 'doctor' ? 'Accept consultation request above to unlock messaging.' : 'Messaging will be available after the doctor accepts your consultation request.'}
                  </div>
                ) : isCompleted ? (
                  <div 
                    style={{ 
                      padding: '12px 18px', 
                      background: '#f1f5f9', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '8px',
                      color: '#475569',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  >
                    <Lock size={16} /> This consultation has ended. You can view the conversation history, but new messages are disabled.
                  </div>
                ) : isCancelled ? (
                  <div 
                    style={{ 
                      padding: '12px 18px', 
                      background: '#fef2f2', 
                      border: '1px solid #fecaca', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '8px',
                      color: '#991b1b',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  >
                    <Lock size={16} /> Consultation cancelled — messaging is disabled.
                  </div>
                ) : (
                  <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '999px' }}>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
                    
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()} 
                      style={{ background: 'none', border: 'none', color: '#64748b', padding: '8px', cursor: 'pointer', display: 'flex', borderRadius: '50%' }}
                      title="Attach Image"
                    >
                      <ImageIcon size={20} />
                    </button>
                    
                    <input 
                      type="text" 
                      placeholder="Type a message..." 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      disabled={isSending}
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#0f172a', fontSize: '0.95rem', fontWeight: 500, padding: '0 8px' }}
                    />
                    
                    <button 
                      type="submit" 
                      disabled={(!inputText.trim() && !selectedImage) || isSending} 
                      style={{ 
                        background: 'linear-gradient(135deg, #1677FF, #00A6A6)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '50%', 
                        width: '38px', 
                        height: '38px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: ((!inputText.trim() && !selectedImage) || isSending) ? 'not-allowed' : 'pointer', 
                        opacity: ((!inputText.trim() && !selectedImage) || isSending) ? 0.45 : 1, 
                        boxShadow: '0 4px 10px rgba(22, 119, 255, 0.25)',
                        flexShrink: 0
                      }}
                    >
                      <Send size={16} style={{ marginLeft: '2px' }} />
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '50%', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
                <MessageSquare size={44} color="#64748b" opacity={0.6} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontWeight: 800, color: '#0f172a', fontSize: '1.4rem' }}>
                Select a Booked Consultation
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontWeight: 500, maxWidth: '340px', fontSize: '0.95rem' }}>
                Messaging is strictly integrated with your consultations. Choose a case to view its verified conversation history.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Complete Consultation Confirmation Modal */}
      {showCompleteModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div 
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '16px',
              padding: '24px 28px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div className="flex-between mb-3">
              <div className="flex-align-center gap-2">
                <CheckCircle2 size={22} color="#16a34a" />
                <h3 className="font-extrabold text-slate-900" style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
                  Complete Consultation
                </h3>
              </div>
              <button 
                onClick={() => setShowCompleteModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#991b1b', lineHeight: 1.5, fontWeight: 600 }}>
                Completing this consultation will conclude the session and make this chat read-only for both you and the patient. No further messages can be sent.
              </p>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '16px', lineHeight: 1.5 }}>
              Patient: <strong>{activeConsultation?.patientName || 'Patient'}</strong> (Case P-{activeConsultation?.id ? activeConsultation.id.toString().substring(0,6) : 'Case'})
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Final Clinical Diagnosis / Summary
              </label>
              <input 
                type="text"
                value={completeDiagnosis}
                onChange={(e) => setCompleteDiagnosis(e.target.value)}
                placeholder="e.g., General dental consultation completed. No critical pathology."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Treatment Plan / Patient Recommendations
              </label>
              <textarea 
                rows={3}
                value={completeTreatment}
                onChange={(e) => setCompleteTreatment(e.target.value)}
                placeholder="e.g., Maintain twice-daily brushing and routine cleaning."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  color: '#0f172a',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="btn btn-outline font-semibold"
                style={{ color: '#475569', borderColor: '#cbd5e1' }}
                disabled={isCompleting}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleCompleteConsultation}
                className="btn btn-success font-bold flex-align-center gap-1"
                style={{ padding: '8px 18px', borderRadius: '8px' }}
                disabled={isCompleting}
              >
                <CheckCircle2 size={16} /> {isCompleting ? 'Completing...' : 'Confirm & Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesUI;
