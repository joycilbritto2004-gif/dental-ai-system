import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  AlertCircle, 
  Stethoscope,
  Info,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { getCareSuggestions } from '../utils/careSuggestions';
import '../pages/Dashboard.css';

/**
 * Reusable Precautions & Recommendations Component
 * Refined for clean readability, high contrast, compact spacing,
 * balanced 2-column grid, and seamless adherence to the DentaAI dashboard design system.
 */
const PrecautionsSection = ({
  condition,
  confidence,
  predictionResult = null,
  showBookingButton = false,
  actions = null,
  className = '',
  style = {},
  hideHeader = false
}) => {
  // If no condition provided at all, do not render precautions
  if (!condition) {
    return null;
  }

  const careData = getCareSuggestions(condition);
  const {
    isSupported,
    conditionName,
    category,
    explanation,
    precautions,
    whenToSeeDentist,
    disclaimer,
    emergencyNotice
  } = careData;

  // Check if confidence is a valid number
  const hasValidConfidence = 
    confidence !== null && 
    confidence !== undefined && 
    !isNaN(Number(confidence)) && 
    Number(confidence) >= 0;

  return (
    <div 
      className={`precautions-container ${className}`}
      style={{
        ...style
      }}
    >
      {/* SECTION HEADER */}
      {!hideHeader && (
        <div 
          className="precautions-header-bar"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            borderBottom: '1px solid rgba(191, 212, 229, 0.5)',
            paddingBottom: '16px'
          }}
        >
        <div className="precautions-header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            className={`precautions-header-icon ${isSupported ? 'is-supported' : 'is-unsupported'}`}
            style={{
              background: isSupported ? 'rgba(0, 166, 166, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              color: isSupported ? '#00A6A6' : '#D97706',
              borderRadius: '12px',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {isSupported ? (
              <ShieldCheck size={24} color="#00A6A6" stroke="#00A6A6" />
            ) : (
              <HelpCircle size={24} color="#D97706" stroke="#D97706" />
            )}
          </div>
          <div>
            <h4 
              className="precautions-header-title"
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#17324D',
                letterSpacing: '-0.3px',
                lineHeight: 1.25
              }}
            >
              Precautions & Recommendations
            </h4>
            <span 
              className="precautions-header-subtitle"
              style={{ 
                fontSize: '0.92rem', 
                color: '#40566F', 
                fontWeight: 600, 
                marginTop: '2px', 
                display: 'block' 
              }}
            >
              {isSupported ? `Clinical oral health guidance for ${conditionName}` : 'General Clinical Advisory'}
            </span>
          </div>
        </div>

        {/* Status / Category Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {category && (
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              padding: '5px 14px',
              borderRadius: '999px',
              background: '#F1F5F9',
              color: '#475569',
              border: '1px solid #E2E8F0'
            }}>
              {category}
            </span>
          )}
          {hasValidConfidence && (
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              padding: '5px 14px',
              borderRadius: '999px',
              background: '#E6FFFA',
              color: '#0D9488',
              border: '1px solid #99F6E4'
            }}>
              AI Confidence: {Number(confidence).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      )}

      {/* UNKNOWN CONDITION WARNING BANNER */}
      {!isSupported && (
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderLeft: '4px solid #D97706',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <AlertCircle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 800, color: '#B45309', fontSize: '0.98rem', marginBottom: '4px' }}>
              Unclassified Dental Scan
            </div>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#78350F', lineHeight: 1.55 }}>
              The scan pattern could not be definitively matched to one of our six standard categories. 
              Please schedule an in-person clinical examination with a licensed dental practitioner for a reliable diagnosis.
            </p>
          </div>
        </div>
      )}

      {/* ABOUT CONDITION EXPLANATION CARD */}
      <div className="precautions-subcard" style={{
        background: '#FFFFFF',
        borderRadius: '14px',
        padding: '18px 22px',
        border: '1px solid #BFD4E5',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{
          fontSize: '0.85rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: '#00A6A6',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Info size={16} />
          About {conditionName}
        </div>
        <p style={{
          margin: 0,
          fontSize: '0.98rem',
          color: '#17324D',
          lineHeight: 1.65,
          fontWeight: 500,
          textAlign: 'left'
        }}>
          {explanation}
        </p>
      </div>

      {/* DAILY PRECAUTIONS (Balanced 2-column grid on desktop, 1-column on mobile) */}
      <div className="precautions-subcard" style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '20px 24px',
        border: '1px solid #BFD4E5',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)'
      }}>
        <h5 style={{
          margin: '0 0 16px 0',
          fontSize: '1rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: '#17324D',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Sparkles size={18} color="#00A6A6" /> Recommended Daily Precautions
        </h5>

        <div className="precautions-daily-grid">
          {precautions.map((precaution, idx) => (
            <div
              key={idx}
              className="precautions-grid-item"
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                padding: '14px 16px',
                background: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #EDF2F7',
                boxSizing: 'border-box'
              }}
            >
              <div style={{
                color: '#00A6A6',
                flexShrink: 0,
                marginTop: '2px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <CheckCircle2 size={18} strokeWidth={2.5} />
              </div>
              <span style={{
                fontSize: '0.95rem',
                lineHeight: 1.55,
                color: '#17324D',
                fontWeight: 600,
                textAlign: 'left',
                wordBreak: 'break-word'
              }}>
                {precaution}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* WHEN TO SEE A DENTIST (Balanced 2-column grid on desktop, 1-column on mobile) */}
      <div className="precautions-subcard" style={{
        background: '#FFFFFF',
        border: '1px solid #BFD4E5',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#17324D',
          fontWeight: 800,
          fontSize: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '8px'
        }}>
          <Stethoscope size={19} color="#00A6A6" />
          <span>When to See a Dentist</span>
        </div>
        <p style={{
          fontSize: '0.95rem',
          color: '#40566F',
          margin: '0 0 16px 0',
          fontWeight: 600,
          lineHeight: 1.5
        }}>
          Arrange an appointment promptly if you observe any of the following clinical signs:
        </p>
        <div className="precautions-dentist-grid">
          {whenToSeeDentist.map((item, idx) => (
            <div
              key={idx}
              className="precautions-grid-item"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 16px',
                background: '#F8FAFC',
                borderRadius: '10px',
                border: '1px solid #EDF2F7',
                fontSize: '0.95rem',
                color: '#17324D',
                lineHeight: 1.5,
                fontWeight: 600,
                textAlign: 'left',
                boxSizing: 'border-box'
              }}
            >
              <div style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#00A6A6',
                flexShrink: 0,
                marginTop: '8px'
              }} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CLINICAL SAFETY & LEGAL DISCLAIMER GROUP */}
      <div className="precautions-safety-group">
        {/* EMERGENCY RED-FLAG NOTICE */}
        <div className="emergency-notice-banner" role="alert">
          <div className="emergency-notice-icon">
            <AlertTriangle size={15} strokeWidth={2.2} />
          </div>
          <div className="emergency-notice-content">
            <strong className="emergency-notice-heading">
              Emergency Red-Flag Notice:
            </strong>
            <span className="emergency-notice-text">
              {emergencyNotice}
            </span>
          </div>
        </div>

        {/* AI DENTAL SAFETY DISCLAIMER */}
        <div className="ai-disclaimer-banner" role="note">
          <div className="ai-disclaimer-icon">
            <Info size={16} strokeWidth={2.2} />
          </div>
          <div className="ai-disclaimer-text">
            {disclaimer}
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      {actions && (
        <div style={{
          marginTop: '6px',
          paddingTop: '18px',
          borderTop: '1px solid #E2E8F0',
          width: '100%'
        }}>
          {actions}
        </div>
      )}

      {/* OPTIONAL BOOKING ACTION */}
      {!actions && showBookingButton && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-start',
          marginTop: '6px',
          paddingTop: '16px',
          borderTop: '1px solid #E2E8F0'
        }}>
          <Link
            to="/dashboard/patient/recommended-doctors"
            state={{ predictionResult: predictionResult || { condition, confidence } }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
              background: '#1677FF',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(22, 119, 255, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <Calendar size={18} />
            <span>Book a Dentist</span>
            <ChevronRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
};

export default PrecautionsSection;
