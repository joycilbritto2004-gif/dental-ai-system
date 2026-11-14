import { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Send,
  Image as ImageIcon,
  BrainCircuit,
  FileText,
  X,
  CheckCircle2,
  MessageSquare,
  ChevronLeft,
  Lock,
  XCircle,
  Calendar,
  ShieldCheck,
  Eye,
  Activity,
  Video,
  Clock,
  Sparkles,
  ArrowRight,
  BadgeCheck,
  AlertCircle,
  MapPin,
  Building2
} from 'lucide-react';
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
  const [mobileShowChat, setMobileShowChat] = useState(!!targetConsultationId);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync selectedConsultationId when target changes
  useEffect(() => {
    if (targetConsultationId && targetConsultationId !== selectedConsultationId) {
      setSelectedConsultationId(targetConsultationId);
      setMobileShowChat(true);
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
        
        // Strict separation: Only Online Chat consultations belong in the messaging workspace
        const chatList = validList.filter(c => {
          const cType = String(c.consultationType || '').toLowerCase();
          return cType.includes('chat');
        });
        setConsultations(chatList);

        // If no consultation is selected yet, choose the target or the first active chat
        if (!selectedConsultationId && chatList.length > 0) {
          setSelectedConsultationId(chatList[0].id || chatList[0]._id);
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

        // 1. Poll consultation record for live status updates
        const consultRes = await fetch(`${API_BASE}/api/consultations/${selectedConsultationId}`, { headers });
        if (consultRes.ok && isMounted) {
          const consultData = await consultRes.json();
          setActiveConsultation(prev => {
            if (!prev || prev.status !== consultData.status || prev.finalDiagnosis !== consultData.finalDiagnosis) {
              return consultData;
            }
            return prev;
          });

          // Strict Access Control: In-person clinic appointments must never poll or fetch messages
          const isChat = String(consultData.consultationType || '').toLowerCase().includes('chat');
          if (!isChat) {
            setAllMessages([]);
            return;
          }

          // Sync status in the sidebar list if it changed
          setConsultations(prevList => prevList.map(c => {
            const cId = c.id || c._id;
            if (String(cId) === String(selectedConsultationId) && c.status !== consultData.status) {
              return { ...c, status: consultData.status };
            }
            return c;
          }));
        }

        // 2. Poll messages for the active chat consultation only
        const msgRes = await fetch(`${API_BASE}/api/messages/${selectedConsultationId}`, { headers });
        if (msgRes.ok && isMounted) {
          const msgData = await msgRes.json();
          setAllMessages(Array.isArray(msgData) ? msgData : []);
        }
      } catch (e) {
        if (isMounted) console.error('Error polling consultation data in MessagesUI:', e);
      }
    };

    pollConsultationAndMessages();
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

  // Doctor display name helper: prevents "Dr. Dr. Priya Menon" even if DB stored repeated prefix
  const doctorDisplayName = activeConsultation?.doctorName
    ? `Dr. ${activeConsultation.doctorName.replace(/^(Dr\.?\s*)+/i, '').trim()}`
    : 'the specialist';

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
    ? (role === 'patient' ? doctorDisplayName : (activeConsultation.patientName || 'Patient'))
    : 'Consultation Chat';

  const chatPartnerSubtitle = activeConsultation
    ? (role === 'patient' 
        ? (activeConsultation.doctorSpecialization || 'DentaAI Specialist') 
        : `Patient Case P-${activeConsultation.id ? activeConsultation.id.toString().substring(0, 6) : '00000'}`)
    : '';

  const statusMeta = getConsultationStatusMeta(activeConsultation?.status);
  const isChatActiveConsultation = !activeConsultation || String(activeConsultation.consultationType || '').toLowerCase().includes('chat');

  // Partner Initials
  const partnerInitials = chatPartnerName
    ? chatPartnerName.replace(/^(Dr\.|Dr)\s*/i, '').trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'DR';

  if (isLoading && consultations.length === 0) {
    return (
      <div className="dashboard-view" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#17324D', fontWeight: 700, fontSize: '1.1rem' }}>
          <Activity className="spin-anim" size={36} color="#00A6A6" style={{ margin: '0 auto 14px' }} />
          Loading Consultation Workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-view messages-page-wrapper animate-fade-in">
      
      {/* TOP HEADER CARD */}
      <div className="messages-header-card">
        <div className="messages-header-top">
          
          <div>
            <div style={{ marginBottom: '6px' }}>
              <Link 
                to={role === 'doctor' ? '/dashboard/doctor/consultations' : '/dashboard/patient/consultations'} 
                className="messages-back-btn"
              >
                <ChevronLeft size={16} color="#00A6A6" /> {role === 'doctor' ? 'Back to Consultations' : 'Back to My Appointments'}
              </Link>
            </div>
            <h1 className="messages-header-title">Consultation Workspace</h1>
            <p className="messages-header-desc">
              Direct clinical communication for Case <strong style={{ color: '#00A6A6' }}>P-{activeConsultation?.id ? activeConsultation.id.toString().substring(0, 6) : 'ACTIVE'}</strong>
            </p>
          </div>

          {/* Quick Context & Actions */}
          {activeConsultation && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              
              <span 
                className={`chat-status-pill ${isPending ? 'pending' : isAccepted ? 'active' : 'completed'}`}
              >
                <span className="radio-dot" style={{ width: '8px', height: '8px' }}></span>
                {statusMeta.label}
              </span>

              {role === 'doctor' && (
                <>
                  <Link 
                    to={`/dashboard/doctor/consultation/${activeConsultation.id || activeConsultation._id}`}
                    className="btn btn-outline btn-sm font-bold"
                    style={{ background: '#FFFFFF', borderColor: '#BFD4E5', color: '#17324D', padding: '8px 14px', borderRadius: '10px' }}
                  >
                    <Eye size={15} color="#00A6A6" /> Diagnostic Workspace
                  </Link>

                  {isAccepted && (
                    <button 
                      onClick={() => {
                        setCompleteDiagnosis(activeConsultation?.finalDiagnosis || '');
                        setCompleteTreatment(activeConsultation?.treatmentPlan || '');
                        setShowCompleteModal(true);
                      }}
                      className="btn btn-success btn-sm font-bold"
                      style={{ padding: '8px 16px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(22, 163, 74, 0.2)' }}
                    >
                      <CheckCircle2 size={15} /> Complete Consultation
                    </button>
                  )}
                </>
              )}

            </div>
          )}

        </div>
      </div>

      {/* 2-COLUMN SPLIT CONTAINER */}
      <div className="messages-split-wrapper">
        
        {/* LEFT COLUMN: BOOKED CONSULTATIONS QUEUE */}
        <div className={`messages-sidebar ${mobileShowChat ? 'mobile-hidden' : ''}`}>
          
          <div className="messages-sidebar-header">
            <h3 className="messages-sidebar-title">
              {role === 'doctor' ? 'Consultations Queue' : 'My Booked Appointments'}
            </h3>
            <span className="messages-count-badge">{consultations.length} Active</span>
          </div>

          <div className="messages-sidebar-list">
            {consultations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                <MessageSquare size={36} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>No booked consultations yet.</p>
              </div>
            ) : (
              consultations.map(c => {
                const partner = role === 'patient' 
                  ? `Dr. ${(c.doctorName || 'Doctor').replace(/^(Dr\.?\s*)+/i, '').trim()}` 
                  : (c.patientName || 'Patient');
                const partnerSub = role === 'patient' ? (c.doctorSpecialization || 'Specialist') : `Case P-${c.id?.toString().substring(0, 5)}`;
                const itemStatus = getConsultationStatusMeta(c.status);
                const isSelected = String(c.id || c._id) === String(selectedConsultationId);
                const cInitials = partner.replace(/^(Dr\.?\s*)+/i, '').trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'DR';

                return (
                  <div
                    key={c.id || c._id}
                    onClick={() => {
                      const newId = c.id || c._id;
                      setSelectedConsultationId(newId);
                      setMobileShowChat(true);
                      navigate(role === 'doctor'
                        ? `/dashboard/doctor/consultation/${newId}/messages`
                        : `/dashboard/patient/consultation/${newId}/messages`,
                        { state: { consultationId: newId }, replace: true }
                      );
                    }}
                    className={`messages-appointment-card ${isSelected ? 'selected' : ''}`}
                  >
                    <div className="appointment-avatar-box">
                      {cInitials}
                    </div>

                    <div className="appointment-info-col">
                      <div className="appointment-name-row">
                        <span className="appointment-doctor-name">{partner}</span>
                        <span 
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            color: itemStatus.color,
                            background: itemStatus.bg,
                            border: `1px solid ${itemStatus.border}`,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            flexShrink: 0
                          }}
                        >
                          {itemStatus.label}
                        </span>
                      </div>

                      <div className="appointment-sub-row">
                        <span>{partnerSub}</span>
                      </div>

                      <div className="appointment-badge-strip">
                        <span className="appointment-type-tag">
                          {c.consultationType === 'Video Consultation' ? <Video size={11} color="#00A6A6" /> : <MessageSquare size={11} color="#1677FF" />}
                          {c.consultationType === 'Video Consultation' ? 'Video' : 'Chat'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={11} /> {c.date || 'Scheduled'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: ACTIVE CHAT PANE & CLINICAL WORKSPACE */}
        <div className={`messages-chat-pane ${!mobileShowChat ? 'mobile-hidden' : ''}`}>
          
          {selectedConsultationId && activeConsultation ? (
            !isChatActiveConsultation ? (
              <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', background: '#F8FAFC' }}>
                <div style={{ maxWidth: '640px', margin: '20px auto', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #BFD4E5', padding: '32px', boxShadow: '0 8px 30px rgba(7, 26, 51, 0.06)' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(0, 166, 166, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={28} color="#00A6A6" />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#00A6A6', background: 'rgba(0, 166, 166, 0.08)', padding: '3px 10px', borderRadius: '999px' }}>
                        Physical Clinic Appointment
                      </span>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#17324D', margin: '6px 0 0' }}>In-Person Clinic Visit</h2>
                    </div>
                  </div>

                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <AlertCircle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '0.88rem', color: '#92400E', lineHeight: '1.5' }}>
                      <strong>Online Consultation Chat Disabled:</strong> This appointment is reserved for a physical, in-person consultation at the doctor's clinic. Virtual messaging and chat windows are strictly disabled for in-person appointments. Please attend the clinic physically at your scheduled slot.
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Consulting Doctor</span>
                      <strong style={{ color: '#17324D', fontSize: '0.96rem', display: 'block' }}>{doctorDisplayName}</strong>
                      <span style={{ color: '#52677A', fontSize: '0.82rem' }}>{activeConsultation.doctorSpecialization || 'Dental Specialist'}</span>
                    </div>

                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Scheduled Slot</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#17324D', fontWeight: 700, fontSize: '0.96rem' }}>
                        <Calendar size={15} color="#00A6A6" /> {activeConsultation.date}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#52677A', fontSize: '0.82rem', marginTop: '2px' }}>
                        <Clock size={14} /> {activeConsultation.time}
                      </div>
                    </div>

                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px', gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Physical Clinic Location</span>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <MapPin size={18} color="#00A6A6" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <strong style={{ color: '#17324D', fontSize: '0.96rem', display: 'block' }}>
                            {activeConsultation.clinic || 'Apollo Dental Clinic & Implant Center'}
                          </strong>
                          <span style={{ color: '#52677A', fontSize: '0.85rem' }}>
                            {activeConsultation.location || '124 Healthcare Boulevard, 2nd Floor, Indiranagar, Bengaluru, Karnataka 560038'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px', gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Payment Summary</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#52677A', fontSize: '0.88rem' }}>In-Person Consultation (₹500) + Platform Fee (₹49)</span>
                        <strong style={{ color: '#17324D', fontSize: '1.05rem', fontWeight: 800 }}>₹{activeConsultation.totalAmount || 549} Paid</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <Link
                      to={role === 'doctor' ? '/dashboard/doctor/consultations' : '/dashboard/patient/consultations'}
                      className="btn btn-primary font-bold"
                      style={{ padding: '10px 24px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                      <ChevronLeft size={16} /> Back to My Appointments
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
            <>
              {/* Consultation Partner Header */}
              <div className="messages-chat-header">
                
                <div className="chat-partner-info">
                  <button
                    type="button"
                    onClick={() => setMobileShowChat(false)}
                    className="mobile-back-to-list-btn"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div className="chat-partner-avatar">
                    {partnerInitials}
                    <div className="chat-avatar-status-dot"></div>
                  </div>

                  <div>
                    <h2 className="chat-partner-title">{chatPartnerName}</h2>
                    <div className="chat-partner-subtitle-row">
                      <span className="chat-partner-spec">{chatPartnerSubtitle}</span>
                      <span className="meta-dot">•</span>
                      <span className="chat-partner-slot">
                        <Calendar size={13} color="#00A6A6" /> {activeConsultation.date} @ {activeConsultation.time}
                      </span>
                      <span className="appointment-type-tag">
                        {activeConsultation.consultationType === 'Video Consultation' ? <Video size={12} color="#00A6A6" /> : <MessageSquare size={12} color="#1677FF" />}
                        {activeConsultation.consultationType || 'Consultation'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="chat-header-actions">
                  <span className={`chat-status-pill ${isPending ? 'pending' : isAccepted ? 'active' : 'completed'}`}>
                    <span className="radio-dot" style={{ width: '8px', height: '8px' }}></span>
                    {statusMeta.label}
                  </span>

                  <span className="chat-security-pill">
                    <ShieldCheck size={14} color="#10B981" /> 256-Bit SSL Encrypted
                  </span>

                  {role === 'doctor' && isPending && (
                    <button
                      onClick={handleDoctorAcceptInChat}
                      disabled={isAcceptingInChat}
                      className="btn btn-primary btn-sm font-bold"
                      style={{ padding: '8px 16px', borderRadius: '10px' }}
                    >
                      <CheckCircle2 size={16} /> Accept Consultation
                    </button>
                  )}
                </div>

              </div>

              {/* CENTER PANE: PENDING STATE (ONE COMPACT, UNIFIED HUB CARD - NO DUPLICATES OR SCROLL CLIPPING!) */}
              {isPending ? (
                <div className="messages-pending-hub">
                  <div className="pending-hub-card">
                    
                    {/* 1. HORIZONTAL PROGRESS STEPPER */}
                    <div className="pending-stepper-compact">
                      <div className="step-compact-item done">
                        <span className="step-circle"><CheckCircle2 size={14} /></span>
                        <div className="step-text-wrap">
                          <strong>Confirmed</strong>
                          <span>₹{activeConsultation.totalAmount || 549} Paid</span>
                        </div>
                      </div>

                      <div className="step-line done"></div>

                      <div className="step-compact-item active">
                        <span className="step-circle"><Clock size={14} /></span>
                        <div className="step-text-wrap">
                          <strong>Doctor Review</strong>
                          <span>Awaiting Slot</span>
                        </div>
                      </div>

                      <div className="step-line"></div>

                      <div className="step-compact-item upcoming">
                        <span className="step-circle"><Lock size={13} /></span>
                        <div className="step-text-wrap">
                          <strong>Live Session</strong>
                          <span>Chat & Call</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. DOCTOR NOTIFICATION STATUS */}
                    <div className="pending-main-status-body">
                      <div className="pending-status-icon-box">
                        <Clock size={24} color="#D97706" />
                      </div>
                      
                      <div className="pending-status-text-content">
                        <div className="pending-title-line">
                          <h3 className="pending-status-title">Awaiting Doctor Acceptance</h3>
                          <span className="pending-status-pill">
                            <span className="pulse-dot-amber"></span> Review in Progress
                          </span>
                        </div>

                        <p className="pending-status-desc">
                          Your appointment request has been securely submitted to <strong>{doctorDisplayName}</strong>. The specialist has been notified and is currently confirming the scheduled consultation slot.
                        </p>

                        <div className="pending-speed-pill">
                          <Sparkles size={14} color="#D97706" />
                          <span>Average specialist response time is under 15 minutes. You will be alerted immediately once accepted.</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. ATTACHED SCAN SUMMARY STRIP */}
                    {activeConsultation.condition && activeConsultation.condition !== 'N/A' && (
                      <div className="pending-attached-scan-strip">
                        <div className="scan-strip-left">
                          <div className="scan-strip-icon">
                            <BrainCircuit size={16} color="#00A6A6" />
                          </div>
                          <div>
                            <span className="scan-strip-label">Attached Scan Findings</span>
                            <div className="scan-strip-condition">
                              {activeConsultation.condition.replace(/_/g, ' ')}
                              <span className="scan-strip-conf">
                                {activeConsultation.confidence} AI Score
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="scan-strip-right">
                          <span className="scan-case-pill">
                            Case P-{activeConsultation.id ? activeConsultation.id.toString().substring(0, 6) : 'ACTIVE'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* DOCTOR ACTION (IF VIEWED BY DOCTOR) */}
                    {role === 'doctor' && (
                      <button
                        onClick={handleDoctorAcceptInChat}
                        disabled={isAcceptingInChat}
                        className="pending-doctor-accept-cta"
                      >
                        <CheckCircle2 size={18} />
                        <span>Accept Consultation & Open Live Messaging</span>
                      </button>
                    )}

                  </div>
                </div>
              ) : (
                /* MESSAGES CONTENT AREA (WHEN ACCEPTED OR COMPLETED) */
                <div 
                  style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    padding: '24px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '16px', 
                    background: '#F8FAFC' 
                  }}
                >
                  {/* VIDEO CONSULTATION CALLOUT BANNER (IF ACTIVE) */}
                  {isAccepted && activeConsultation.consultationType === 'Video Consultation' && (
                    <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: '14px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 166, 166, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Video size={18} color="#00A6A6" />
                        </div>
                        <div>
                          <strong style={{ color: '#17324D', fontSize: '0.92rem', display: 'block' }}>Video Consultation Room Active</strong>
                          <span style={{ color: '#52677A', fontSize: '0.8rem' }}>1-on-1 private video room is ready for your appointment</span>
                        </div>
                      </div>
                      <Link
                        to={`/dashboard/video-consultation/${activeConsultation.id || activeConsultation._id}`}
                        className="btn btn-primary btn-sm font-bold"
                        style={{ padding: '8px 16px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Video size={15} /> Join Video Room
                      </Link>
                    </div>
                  )}

                  {/* COMPLETED BANNER */}
                  {isCompleted && (
                    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '14px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <CheckCircle2 size={22} color="#15803D" style={{ flexShrink: 0 }} />
                      <div>
                        <strong style={{ color: '#15803D', fontSize: '0.95rem', display: 'block' }}>Consultation Concluded</strong>
                        <span style={{ color: '#166534', fontSize: '0.82rem' }}>
                          {activeConsultation.finalDiagnosis || 'Official clinical diagnosis & prescription has been issued.'}
                        </span>
                      </div>
                    </div>
                  )}

                  {allMessages.length === 0 ? (
                    <div style={{ margin: 'auto', textAlign: 'center', color: '#64748B', maxWidth: '380px', padding: '40px 20px' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#FFFFFF', border: '1px solid #BFD4E5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <MessageSquare size={28} color="#00A6A6" />
                      </div>
                      <h4 style={{ fontWeight: 800, color: '#17324D', margin: '0 0 6px 0', fontSize: '1.2rem' }}>
                        Session Started
                      </h4>
                      <p style={{ fontSize: '0.88rem', color: '#52677A', lineHeight: 1.5, margin: 0 }}>
                        {role === 'patient' 
                          ? `You are directly connected with ${doctorDisplayName}. Send a message, describe your symptoms, or share additional photos.` 
                          : `You are connected with ${activeConsultation.patientName}. Initiate clinical dialogue or request additional observations.`}
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
                                background: isMine ? 'linear-gradient(135deg, #00A6A6 0%, #06C6E8 100%)' : '#FFFFFF',
                                color: isMine ? '#FFFFFF' : '#17324D',
                                border: isMine ? 'none' : '1px solid #BFD4E5',
                                padding: '12px 18px',
                                borderRadius: isMine ? '16px 16px 0 16px' : '16px 16px 16px 0',
                                maxWidth: '75%',
                                fontSize: '0.95rem',
                                lineHeight: '1.5',
                                fontWeight: 500,
                                boxShadow: '0 2px 8px rgba(7, 26, 51, 0.04)'
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
                                background: isMine ? 'linear-gradient(135deg, #00A6A6 0%, #06C6E8 100%)' : '#FFFFFF', 
                                border: isMine ? 'none' : '1px solid #BFD4E5', 
                                borderRadius: isMine ? '16px 16px 0 16px' : '16px 16px 16px 0', 
                                maxWidth: '320px',
                                boxShadow: '0 2px 8px rgba(7, 26, 51, 0.04)'
                              }}
                            >
                              <img src={msg.image} alt="Attachment" style={{ width: '100%', borderRadius: '10px', display: 'block' }} />
                            </div>
                          )}

                          {/* AI REPORT EMBED */}
                          {msg.type === 'ai-report' && (
                            <div 
                              style={{ 
                                backgroundColor: '#FFFFFF', 
                                border: '1px solid #BFD4E5', 
                                borderRadius: '16px', 
                                padding: '18px', 
                                width: '360px', 
                                maxWidth: '92%', 
                                boxShadow: '0 4px 15px rgba(7, 26, 51, 0.05)' 
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #E2E8F0' }}>
                                <div style={{ background: 'rgba(0, 166, 166, 0.1)', padding: '6px', borderRadius: '8px', color: '#00A6A6' }}>
                                  <BrainCircuit size={18} />
                                </div>
                                <h4 style={{ margin: 0, fontWeight: 800, color: '#17324D', fontSize: '0.92rem' }}>AI Dental Analysis Summary</h4>
                              </div>
                              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>Identified Finding</span>
                                <span style={{ fontWeight: 800, color: '#17324D', fontSize: '0.88rem' }}>{msg.report?.condition?.replace('_', ' ')}</span>
                              </div>
                              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>Model Confidence</span>
                                <span style={{ fontWeight: 800, color: '#00A6A6', fontSize: '0.88rem' }}>{msg.report?.confidence}</span>
                              </div>
                              <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '8px 0 0 0', textAlign: 'center', fontStyle: 'italic' }}>
                                * Verified against specialist diagnostic benchmark.
                              </p>
                            </div>
                          )}

                          <span style={{ fontSize: '0.72rem', marginTop: '4px', color: '#64748B', fontWeight: 600 }}>
                            {msg.time}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* COMPOSER / BOTTOM BAR */}
              <div 
                style={{ 
                  padding: '16px 24px', 
                  borderTop: '1px solid #E2E8F0', 
                  background: '#FFFFFF' 
                }}
              >
                {/* Secondary Action: Share Scan */}
                {!isMessagingLocked && role === 'patient' && (
                  <div style={{ marginBottom: '10px' }}>
                    <button 
                      type="button" 
                      onClick={shareAiReport} 
                      className="btn btn-outline btn-sm font-semibold" 
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        borderRadius: '8px', 
                        borderColor: '#BFD4E5', 
                        color: '#17324D',
                        background: '#F8FAFC',
                        fontSize: '0.82rem',
                        padding: '6px 12px'
                      }}
                    >
                      <BrainCircuit size={14} color="#00A6A6" /> Share Dental Scan Findings
                    </button>
                  </div>
                )}

                {/* Selected Image Preview */}
                {!isMessagingLocked && selectedImage && (
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: '10px' }}>
                    <img src={selectedImage} alt="Preview" style={{ height: '64px', borderRadius: '10px', border: '1px solid #BFD4E5' }} />
                    <button 
                      onClick={() => setSelectedImage(null)} 
                      style={{ 
                        position: 'absolute', 
                        top: '-6px', 
                        right: '-6px', 
                        width: '20px', 
                        height: '20px', 
                        padding: 0, 
                        background: '#FFFFFF', 
                        border: '1px solid #BFD4E5', 
                        borderRadius: '50%', 
                        color: '#64748B', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Bottom Bar: Single, Non-Redundant Status Placeholder When Locked */}
                {isPending ? (
                  <div className="messages-composer-disabled">
                    <Lock size={15} color="#D97706" />
                    <span>
                      {role === 'doctor'
                        ? 'Accept this consultation request above to begin messaging with the patient.'
                        : `Messaging will be available as soon as ${doctorDisplayName} accepts your consultation request.`}
                    </span>
                  </div>
                ) : isCompleted ? (
                  <div className="messages-composer-disabled">
                    <CheckCircle2 size={16} color="#15803D" />
                    <span>This consultation has concluded. The chat transcript is archived for your records.</span>
                  </div>
                ) : isCancelled ? (
                  <div className="messages-composer-disabled">
                    <XCircle size={16} color="#B91C1C" />
                    <span>Consultation was declined or cancelled. Messaging is disabled.</span>
                  </div>
                ) : (
                  /* Active Message Input Form */
                  <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F8FAFC', border: '1px solid #BFD4E5', padding: '6px 10px', borderRadius: '999px' }}>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
                    
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()} 
                      style={{ background: 'none', border: 'none', color: '#64748B', padding: '8px', cursor: 'pointer', display: 'flex', borderRadius: '50%' }}
                      title="Attach Intraoral Photo"
                    >
                      <ImageIcon size={19} color="#00A6A6" />
                    </button>
                    
                    <input 
                      type="text" 
                      placeholder="Type your message or query..." 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      disabled={isSending}
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#17324D', fontSize: '0.95rem', fontWeight: 500, padding: '0 8px' }}
                    />
                    
                    <button 
                      type="submit" 
                      disabled={(!inputText.trim() && !selectedImage) || isSending} 
                      style={{ 
                        background: 'linear-gradient(135deg, #00A6A6 0%, #06C6E8 100%)', 
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
                        boxShadow: '0 4px 10px rgba(0, 166, 166, 0.25)',
                        flexShrink: 0
                      }}
                    >
                      <Send size={16} style={{ marginLeft: '2px' }} />
                    </button>
                  </form>
                )}

              </div>
            </>
            )
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
              <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '50%', border: '1px solid #BFD4E5', marginBottom: '18px' }}>
                <MessageSquare size={44} color="#00A6A6" opacity={0.6} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontWeight: 800, color: '#17324D', fontSize: '1.4rem' }}>
                Select a Booked Consultation
              </h3>
              <p style={{ margin: 0, color: '#52677A', fontWeight: 500, maxWidth: '360px', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Choose an appointment from the queue to view session messages, clinical recommendations, and diagnostic records.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* Complete Consultation Confirmation Modal (For Doctors) */}
      {showCompleteModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7, 26, 51, 0.6)',
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
              background: '#FFFFFF',
              border: '1px solid #BFD4E5',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(7, 26, 51, 0.15)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={22} color="#15803D" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#17324D' }}>
                  Conclude Consultation
                </h3>
              </div>
              <button 
                onClick={() => setShowCompleteModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#166534', lineHeight: 1.5, fontWeight: 600 }}>
                Completing this session will finalize the diagnosis and issue an official verification for patient records.
              </p>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#52677A', marginBottom: '16px', lineHeight: 1.5 }}>
              Patient: <strong style={{ color: '#17324D' }}>{activeConsultation?.patientName || 'Patient'}</strong> (Case P-{activeConsultation?.id ? activeConsultation.id.toString().substring(0,6) : 'Case'})
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#17324D', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Final Clinical Diagnosis / Summary
              </label>
              <input 
                type="text"
                value={completeDiagnosis}
                onChange={(e) => setCompleteDiagnosis(e.target.value)}
                placeholder="e.g., Gingivitis evaluated. Professional ultrasonic scaling advised."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #BFD4E5',
                  fontSize: '0.92rem',
                  color: '#17324D',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#17324D', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Treatment Plan / Patient Recommendations
              </label>
              <textarea 
                rows={3}
                value={completeTreatment}
                onChange={(e) => setCompleteTreatment(e.target.value)}
                placeholder="e.g., Twice daily chlorhexidine rinse and routine flossing."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #BFD4E5',
                  fontSize: '0.92rem',
                  color: '#17324D',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="btn btn-outline font-semibold"
                style={{ color: '#52677A', borderColor: '#BFD4E5' }}
                disabled={isCompleting}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleCompleteConsultation}
                className="btn btn-success font-bold flex-align-center gap-1"
                style={{ padding: '10px 20px', borderRadius: '10px' }}
                disabled={isCompleting}
              >
                <CheckCircle2 size={16} /> {isCompleting ? 'Finalizing...' : 'Confirm & Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MessagesUI;
