import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  HeartPulse, 
  ShieldCheck, 
  Activity, 
  Coffee, 
  Smile, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  Info, 
  Upload, 
  ShieldAlert,
  RefreshCw,
  Stethoscope,
  ChevronRight
} from 'lucide-react';
import '../Dashboard.css';
import { API_BASE } from '../../config';

/**
 * Educational Condition-Specific Knowledge Base for all 6 supported classes.
 * - Oral Hygiene Guidance: 4 physical/mechanical daily hygiene recommendations.
 * - Preventive Care: 4 clinical, lifestyle, and protective prevention measures.
 * - Adheres strictly to non-diagnostic educational guidelines:
 *   NO drug names, NO dosages, NO prescriptions.
 */
export const CONDITION_DATA = {
  Calculus: {
    name: 'Calculus (Dental Tartar)',
    category: 'Plaque & Mineralized Deposits',
    badgeText: 'Calcified Deposit',
    badgeColor: '#00A6A6',
    badgeBg: 'rgba(0, 166, 166, 0.12)',
    summary: 'Hardened bacterial plaque (tartar) bonded to tooth enamel and along the gingival margin, requiring professional clinical removal.',
    hygieneGuidance: [
      {
        title: 'Proper Brushing Along the Gumline',
        desc: 'Angle soft bristles at 45 degrees towards the gum margin using gentle circular motions to remove bacterial plaque biofilm before calcification.'
      },
      {
        title: 'Daily Interdental Flossing',
        desc: 'Floss between all contact areas daily to disrupt plaque in tight spaces where hardened calculus most commonly forms.'
      },
      {
        title: 'Tartar-Control Fluoride Toothpaste',
        desc: 'Use an ADA-approved pyrophosphate or zinc-formulated tartar-control toothpaste to slow down calcium phosphate mineralization.'
      },
      {
        title: 'Antiseptic Oral Mouth Rinse',
        desc: 'Swish with a clinically verified antimicrobial mouthwash daily to reduce bacterial load in hard-to-reach interproximal spaces.'
      }
    ],
    preventiveCare: [
      {
        title: 'Professional Dental Scaling Required',
        desc: 'Hardened tartar cannot be safely brushed away at home. Arrange a professional scaling and polishing with your dentist or dental hygienist.'
      },
      {
        title: 'Avoid Home Metal Scraping Tools',
        desc: 'Never attempt to scrape tartar deposits off your teeth with household tools or dental picks, as this risks permanent enamel damage and gum trauma.'
      },
      {
        title: 'Bi-Annual Clinical Checkups',
        desc: 'Maintain routine dental prophylaxis every 6 months to prevent supragingival and subgingival tartar from causing periodontal inflammation.'
      },
      {
        title: 'Hydration & Saliva Stimulation',
        desc: 'Drink plenty of water throughout the day to support saliva production, which naturally buffers oral acids and cleanses residual food particles.'
      }
    ]
  },
  Caries: {
    name: 'Dental Caries (Tooth Decay)',
    category: 'Bacterial Demineralization',
    badgeText: 'Active Decay Risk',
    badgeColor: '#ef4444',
    badgeBg: 'rgba(239, 68, 68, 0.12)',
    summary: 'Demineralization of enamel and deeper dentin layers caused by acid-producing bacterial biofilm feeding on dietary carbohydrates.',
    hygieneGuidance: [
      {
        title: 'Brush Twice Daily with Fluoride Toothpaste',
        desc: 'Brush thoroughly for at least two minutes twice daily with fluoride toothpaste (1,000–1,450 ppm) to actively remineralize enamel.'
      },
      {
        title: 'Spit, Don\'t Rinse After Brushing',
        desc: 'Spit out excess toothpaste foam after brushing, but avoid rinsing immediately with water so the protective fluoride layer remains on enamel.'
      },
      {
        title: 'Clean Between Teeth Daily',
        desc: 'Curve dental floss in a C-shape around each tooth surface daily to dislodge acid-producing food debris caught between tight contact points.'
      },
      {
        title: 'Clean Chewing Fissures & Grooves',
        desc: 'Ensure toothbrush bristles reach deep into the pits and fissures of posterior molars where bacterial plaque readily stagnates.'
      }
    ],
    preventiveCare: [
      {
        title: 'Reduce Frequent Sugar Exposure',
        desc: 'Minimize frequent snacking on sugary foods, sticky carbohydrates, and sweet beverages that cause prolonged enamel acid attacks.'
      },
      {
        title: 'Rinse with Water After Carbohydrates',
        desc: 'Rinse your mouth thoroughly with plain water immediately after consuming acidic fruits, starches, or sweet beverages to neutralize oral pH.'
      },
      {
        title: 'Prompt Clinical Restoration',
        desc: 'Schedule an evaluation with a licensed dentist promptly; dental decay does not heal on its own and requires a clinical filling or sealant.'
      },
      {
        title: 'Stimulate Saliva with Xylitol',
        desc: 'Chew 100% xylitol sugar-free gum for 10–15 minutes after meals to enhance saliva flow and inhibit Streptococcus mutans bacterial adhesion.'
      }
    ]
  },
  Gingivitis: {
    name: 'Gingivitis (Gum Inflammation)',
    category: 'Periodontal Soft Tissue',
    badgeText: 'Reversible Stage',
    badgeColor: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    summary: 'Localized inflammation of the gingival margins caused by bacterial plaque accumulation along the cervical borders of the teeth.',
    hygieneGuidance: [
      {
        title: 'Use a Soft-Bristled Toothbrush',
        desc: 'Gently clean along the gumline twice daily with soft or extra-soft bristles using light circular motions; avoid abrasive scrubbing.'
      },
      {
        title: 'Clean Between Teeth Daily',
        desc: 'Continue flossing every day; regular plaque removal is essential to relieve inflammation even if gums bleed slightly during early care.'
      },
      {
        title: 'Anti-Gingivitis Antimicrobial Rinse',
        desc: 'Swish with an alcohol-free antibacterial or therapeutic anti-gingivitis mouthwash to curb subgingival bacterial multiplication.'
      },
      {
        title: 'Replace Toothbrush Every 2–3 Months',
        desc: 'Switch to a fresh toothbrush or electric brush head every 2 to 3 months, or sooner if bristles flare, to ensure gentle effective cleaning.'
      }
    ],
    preventiveCare: [
      {
        title: 'Reversible with Clinical Cleaning',
        desc: 'Early gingivitis is completely reversible when plaque biofilm is removed daily through good oral hygiene and professional scaling.'
      },
      {
        title: 'Avoid Tobacco & Vaping Products',
        desc: 'Tobacco impairs gingival circulation, diminishes the local immune response, and masks early warning signs of periodontal infection.'
      },
      {
        title: 'Monitor Persistent Symptoms',
        desc: 'Seek a periodontal dental checkup if gum swelling, deep redness, persistent bad breath, or bleeding continues past 7 to 10 days.'
      },
      {
        title: 'Nutritional Gum Tissue Support',
        desc: 'Maintain a balanced diet rich in Vitamin C, bioflavonoids, and lean proteins to support collagen synthesis in gum connective tissues.'
      }
    ]
  },
  Hypodontia: {
    name: 'Hypodontia (Missing Teeth)',
    category: 'Developmental & Arch Alignment',
    badgeText: 'Developmental Review',
    badgeColor: '#3A86FF',
    badgeBg: 'rgba(58, 134, 255, 0.12)',
    summary: 'Congenital absence of one or more permanent teeth, requiring spatial assessment and alignment monitoring to preserve bite functionality.',
    hygieneGuidance: [
      {
        title: 'Careful Cleaning Around Missing-Tooth Spaces',
        desc: 'Brush with extra diligence around teeth adjacent to empty gaps where food debris and plaque readily accumulate on exposed lateral surfaces.'
      },
      {
        title: 'Interdental & Single-Tufted Brushes',
        desc: 'Utilize specialized single-tufted brushes to navigate awkward contact angles, drifted tooth surfaces, and wider interdental gaps.'
      },
      {
        title: 'Protect Existing Tooth Foundations',
        desc: 'Clean meticulously along the gum margins of remaining teeth to preserve the periodontal bone foundation needed for future restorative work.'
      },
      {
        title: 'Daily Appliance Maintenance',
        desc: 'If wearing a prescribed space maintainer, retainer, or orthodontic appliance, clean it thoroughly daily with approved mild cleansers.'
      }
    ],
    preventiveCare: [
      {
        title: 'Consult a Dentist or Orthodontist',
        desc: 'Schedule a specialist consultation to evaluate dental arch stability, bite alignment, and modern options such as space closure or implants.'
      },
      {
        title: 'Avoid Excessive Bite Force on Lone Teeth',
        desc: 'Refrain from biting down forcefully on ice, hard candies, or unyielding foods directly near isolated teeth without adjacent support.'
      },
      {
        title: 'Long-Term Arch Monitoring',
        desc: 'Follow up with periodic dental panoramic X-rays as advised by your clinician to track jawbone density and adjacent root angulation.'
      },
      {
        title: 'Protective Mouthguard for Sports',
        desc: 'Wear an athletic mouthguard during physical sports to shield lone-standing teeth and dental gap areas from accidental impact.'
      }
    ]
  },
  'Mouth Ulcer': {
    name: 'Mouth Ulcer (Aphthous Lesion)',
    category: 'Oral Mucosal Tissue',
    badgeText: 'Mucosal Care',
    badgeColor: '#ec4899',
    badgeBg: 'rgba(236, 72, 153, 0.12)',
    summary: 'Localized benign erosion or sore of the oral mucosa causing temporary discomfort, typically resolving within 10 to 14 days.',
    hygieneGuidance: [
      {
        title: 'Use a Soft Toothbrush',
        desc: 'Brush very gently around the ulcerated mucosal area to prevent accidental abrasive contact, tissue scratching, or re-injury.'
      },
      {
        title: 'Switch to SLS-Free Toothpaste',
        desc: 'Use a toothpaste formulated without sodium lauryl sulfate (SLS), a foaming agent known to trigger or irritate recurrent aphthous ulcers.'
      },
      {
        title: 'Soothing Warm Saline Rinses',
        desc: 'Swish with a mild warm salt water solution (half a teaspoon of table salt in a cup of lukewarm water) 2 to 3 times daily to soothe tissue.'
      },
      {
        title: 'Avoid Alcohol-Based Mouthwashes',
        desc: 'Steer clear of astringent or high-alcohol oral rinses, which cause intense stinging sensations on healing mucosal borders.'
      }
    ],
    preventiveCare: [
      {
        title: 'Avoid Foods That Irritate the Affected Area',
        desc: 'Steer clear of spicy, highly acidic (citrus, vinegar, tomato), salty, or rough-textured foods (chips, crusts) while the ulcer is active.'
      },
      {
        title: 'Do Not Pick or Apply Harsh Caustics',
        desc: 'Refrain from touching, picking, or applying unverified household chemicals or undiluted hydrogen peroxide directly onto open sores.'
      },
      {
        title: 'Seek Evaluation for Prolonged Ulcers',
        desc: 'Consult a dentist or medical doctor if an oral ulcer lasts longer than 14 days, is unusually large, or makes eating and swallowing difficult.'
      },
      {
        title: 'Hydration & Stress Management',
        desc: 'Ensure adequate rest, hydration, and stress reduction, as physical fatigue and emotional stress frequently trigger aphthous ulcer episodes.'
      }
    ]
  },
  'Tooth Discoloration': {
    name: 'Tooth Discoloration (Enamel Staining)',
    category: 'Aesthetic & Enamel Integrity',
    badgeText: 'Enamel Evaluation',
    badgeColor: '#8b5cf6',
    badgeBg: 'rgba(139, 92, 246, 0.12)',
    summary: 'Surface extrinsic staining from chromogenic foods or intrinsic shade variations within the enamel and dentin crystalline matrix.',
    hygieneGuidance: [
      {
        title: 'Brush Gently with Fluoride Toothpaste',
        desc: 'Clean teeth twice daily for two minutes using an approved non-abrasive fluoride toothpaste to gently lift daily surface food films.'
      },
      {
        title: 'Rinse Immediately After Dark Drinks',
        desc: 'Swish with plain water right after drinking coffee, black tea, red wine, or colas to prevent stain pigments from adhering to enamel.'
      },
      {
        title: 'Daily Interproximal Plaque Removal',
        desc: 'Floss daily to prevent stain-attracting plaque from accumulating along the dark proximal edges where enamel meets adjacent teeth.'
      },
      {
        title: 'Use a Straw for Pigmented Beverages',
        desc: 'When consuming iced coffee, tea, or dark juices, use a straw to bypass anterior teeth and minimize direct fluid contact with enamel.'
      }
    ],
    preventiveCare: [
      {
        title: 'Avoid Abrasive Whitening Remedies',
        desc: 'Never scrub teeth with baking soda, lemon juice, or abrasive charcoal powders, which erode protective enamel and worsen yellowing.'
      },
      {
        title: 'Professional Dental Polishing & Scaling',
        desc: 'Arrange clinical ultrasonic scaling and prophy paste polishing with a dental hygienist to safely lift stubborn extrinsic stains.'
      },
      {
        title: 'Clinical Check for Single Discolored Teeth',
        desc: 'If an individual tooth turns grey, brown, or pinkish following an injury, see a dentist promptly to assess internal pulp vitality.'
      },
      {
        title: 'Tobacco and Smoking Cessation',
        desc: 'Eliminating smoking, vaping, or chewing tobacco prevents stubborn, deep-seated nicotine and tar stains from embedding into enamel.'
      }
    ]
  }
};

/**
 * Normalizes any variation of condition keys (e.g., 'mouth_ulcer', 'Mouth_Ulcer', 'caries')
 * into the standardized dictionary keys.
 */
export const normalizeCondition = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.trim().toLowerCase().replace(/[\s_-]+/g, '_');
  if (cleaned.includes('calculus')) return 'Calculus';
  if (cleaned.includes('caries') || cleaned.includes('cavity') || cleaned.includes('decay')) return 'Caries';
  if (cleaned.includes('gingivitis')) return 'Gingivitis';
  if (cleaned.includes('hypodontia')) return 'Hypodontia';
  if (cleaned.includes('ulcer')) return 'Mouth Ulcer';
  if (cleaned.includes('discoloration') || cleaned.includes('stain')) return 'Tooth Discoloration';
  return null;
};

export const MEDICAL_DISCLAIMER_TEXT = 
  "These recommendations are intended for general oral health education only. AI screening results are preliminary and do not constitute a confirmed diagnosis. Please consult a qualified dentist for professional evaluation and treatment.";

const PatientHealthTips = () => {
  const [latestScan, setLatestScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLatestScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const userStr = localStorage.getItem('dentaai_user');
      if (!userStr) {
        setLoading(false);
        return;
      }

      const user = JSON.parse(userStr);
      const token = localStorage.getItem('dentaai_token');
      const patientId = user._id || user.id;

      if (!patientId) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/scans/${patientId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Not authorized to access scan history for this account.');
        }
        throw new Error(`Failed to fetch scan records (status: ${response.status})`);
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setLatestScan(sorted[0]);
      } else {
        setLatestScan(null);
      }
    } catch (err) {
      console.error('Error fetching latest scan for health tips:', err);
      setError(err.message || 'Unable to retrieve scan data at this time.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestScan();
  }, []);

  const normalizedKey = latestScan ? normalizeCondition(latestScan.condition) : null;
  const conditionDetails = normalizedKey ? CONDITION_DATA[normalizedKey] : null;

  const formattedScanDate = latestScan?.createdAt 
    ? new Date(latestScan.createdAt).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : null;

  return (
    <div className="dashboard-view" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      {/* 1. PAGE HEADER CARD */}
      <div 
        className="page-header-card" 
        style={{ 
          padding: '32px 36px', 
          borderRadius: '24px', 
          border: '1px solid var(--border-color)', 
          background: 'var(--bg-card, rgba(255, 255, 255, 0.78))', 
          backdropFilter: 'blur(16px)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.04)', 
          position: 'relative', 
          overflow: 'hidden' 
        }}
      >
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '45%', background: 'radial-gradient(circle at top right, rgba(0, 210, 255, 0.12), transparent 70%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--secondary)' }}></div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '999px', background: 'rgba(0, 210, 255, 0.1)', color: 'var(--secondary-hover, #00A6A6)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px' }}>
            <Sparkles size={16} /> Intelligent Oral Care Guidance
          </div>
          <h2 style={{ color: 'var(--text-main, #17324D)', letterSpacing: '-0.5px', fontSize: '2.2rem', fontWeight: 800, margin: '0 0 6px 0', lineHeight: 1.2 }}>
            Health Tips
          </h2>
          <p style={{ color: 'var(--text-muted, #475569)', fontSize: '1.05rem', margin: 0, fontWeight: 500, maxWidth: '750px' }}>
            Personalized dental care recommendations dynamically aligned with your latest AI scan and proven oral hygiene guidelines.
          </p>
        </div>
      </div>

      {/* 2. LOADING STATE */}
      {loading && (
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '60px 20px', 
            background: 'var(--bg-card, rgba(255, 255, 255, 0.78))', 
            backdropFilter: 'blur(16px)',
            borderRadius: '24px', 
            border: '1px solid var(--border-color)', 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' 
          }}
        >
          <Activity className="spin-anim" size={38} color="var(--secondary)" style={{ marginBottom: '16px' }} />
          <p style={{ margin: 0, color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem' }}>
            Fetching your latest oral health scan data...
          </p>
        </div>
      )}

      {/* 3. ERROR STATE */}
      {!loading && error && (
        <div 
          style={{ 
            padding: '24px 32px', 
            background: 'rgba(239, 68, 68, 0.06)', 
            borderRadius: '20px', 
            border: '1px solid rgba(239, 68, 68, 0.25)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <AlertTriangle size={24} color="#ef4444" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#ef4444', fontSize: '0.95rem' }}>Unable to load scan-based tips</p>
              <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{error}</p>
            </div>
          </div>
          <button 
            onClick={fetchLatestScan}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '8px 16px', 
              borderRadius: '10px', 
              background: '#ef4444', 
              color: '#FFFFFF', 
              fontWeight: 700, 
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* 4. DYNAMIC PERSONALIZED SECTION OR NO-SCAN STATE */}
      {!loading && !error && (
        <>
          {latestScan && conditionDetails ? (
            /* ACTIVE SCAN AVAILABLE - PERSONALIZED HEALTH TIPS SECTION */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Scan Assessment Overview Card: Condition, Confidence, Scan Date */}
              <div 
                style={{ 
                  background: 'var(--bg-card, rgba(255, 255, 255, 0.78))', 
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--border-color)', 
                  borderRadius: '24px', 
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', 
                  padding: '28px 32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
                <div 
                  style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div 
                      style={{ 
                        width: '56px', 
                        height: '56px', 
                        borderRadius: '16px', 
                        background: conditionDetails.badgeBg, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: conditionDetails.badgeColor,
                        flexShrink: 0
                      }}
                    >
                      <HeartPulse size={28} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span 
                          style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 800, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.5px', 
                            padding: '3px 10px', 
                            borderRadius: '999px', 
                            background: conditionDetails.badgeBg, 
                            color: conditionDetails.badgeColor 
                          }}
                        >
                          {conditionDetails.category}
                        </span>
                        {latestScan.confidence && (
                          <span 
                            style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 700, 
                              padding: '3px 10px', 
                              borderRadius: '999px', 
                              background: 'rgba(7, 26, 51, 0.06)', 
                              color: 'var(--text-main, #17324D)' 
                            }}
                          >
                            {latestScan.confidence}% AI Screening Confidence
                          </span>
                        )}
                      </div>
                      <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main, #17324D)' }}>
                        {conditionDetails.name}
                      </h3>
                    </div>
                  </div>

                  {/* Scan Date Metadata */}
                  <div 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      background: 'var(--card-bg-dark, rgba(255, 255, 255, 0.70))',
                      padding: '10px 18px',
                      borderRadius: '16px',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-muted, #475569)',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}
                  >
                    <Calendar size={16} color="var(--secondary)" />
                    <span>Scan Date: <strong style={{ color: 'var(--text-main, #17324D)' }}>{formattedScanDate || 'Recent'}</strong></span>
                  </div>
                </div>

                {/* Condition Summary */}
                <div 
                  style={{ 
                    background: 'rgba(0, 210, 255, 0.04)', 
                    border: '1px solid rgba(0, 210, 255, 0.15)', 
                    borderRadius: '16px', 
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <Info size={18} color="var(--secondary)" style={{ flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main, #17324D)', lineHeight: 1.5, fontWeight: 500 }}>
                    <strong style={{ fontWeight: 700 }}>Condition Overview:</strong> {conditionDetails.summary}
                  </p>
                </div>
              </div>

              {/* 2 Cards Side-by-Side on Desktop, Stacked Vertically on Mobile */}
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
                  gap: '24px',
                  alignItems: 'stretch'
                }}
              >
                {/* CARD 1: ORAL HYGIENE GUIDANCE */}
                <div 
                  style={{ 
                    background: 'var(--bg-card, rgba(255, 255, 255, 0.78))', 
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--border-color)', 
                    borderRadius: '24px', 
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', 
                    padding: '30px 28px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: 'rgba(6, 198, 232, 0.15)', padding: '10px', borderRadius: '12px', color: '#00A6A6' }}>
                      <Sparkles size={22} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main, #17324D)' }}>
                        Oral Hygiene Guidance
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #475569)', fontWeight: 600 }}>Practical brushing, flossing & habits</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                    {conditionDetails.hygieneGuidance.map((item, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          background: 'var(--card-bg-dark, rgba(255, 255, 255, 0.70))', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '16px', 
                          padding: '16px',
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'flex-start',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                        }}
                      >
                        <CheckCircle2 size={18} color="#00A6A6" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <p style={{ margin: '0 0 3px 0', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main, #17324D)' }}>
                            {item.title}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted, #475569)', lineHeight: 1.45, fontWeight: 500 }}>
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CARD 2: PREVENTIVE CARE */}
                <div 
                  style={{ 
                    background: 'var(--bg-card, rgba(255, 255, 255, 0.78))', 
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--border-color)', 
                    borderRadius: '24px', 
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', 
                    padding: '30px 28px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '12px', color: '#16A34A' }}>
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main, #17324D)' }}>
                        Preventive Care
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #475569)', fontWeight: 600 }}>Clinical prevention & daily protection</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                    {conditionDetails.preventiveCare.map((item, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          background: 'var(--card-bg-dark, rgba(255, 255, 255, 0.70))', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '16px', 
                          padding: '16px',
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'flex-start',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                        }}
                      >
                        <ShieldCheck size={18} color="#16A34A" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <p style={{ margin: '0 0 3px 0', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main, #17324D)' }}>
                            {item.title}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted, #475569)', lineHeight: 1.45, fontWeight: 500 }}>
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            /* NO SCAN AVAILABLE STATE */
            <div 
              style={{ 
                padding: '48px 24px', 
                background: 'var(--bg-card, rgba(255, 255, 255, 0.78))', 
                backdropFilter: 'blur(16px)',
                border: '1px dashed var(--border-color)', 
                borderRadius: '24px', 
                textAlign: 'center', 
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' 
              }}
            >
              <div 
                style={{ 
                  width: '72px', 
                  height: '72px', 
                  borderRadius: '50%', 
                  background: 'rgba(0, 210, 255, 0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 20px auto', 
                  color: 'var(--secondary)' 
                }}
              >
                <HeartPulse size={36} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main, #17324D)' }}>
                No AI scan available yet
              </h3>
              <p style={{ color: 'var(--text-muted, #475569)', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto 24px auto', lineHeight: 1.5, fontWeight: 500 }}>
                Upload an image of your teeth on the scan upload page to unlock personalized, condition-specific preventive guidance.
              </p>
              <Link 
                to="/dashboard/patient" 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  background: 'var(--secondary, #00A6A6)', 
                  color: '#FFFFFF', 
                  padding: '12px 24px', 
                  borderRadius: '12px', 
                  fontWeight: 700, 
                  fontSize: '0.95rem', 
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(0, 166, 166, 0.3)',
                  transition: 'all 0.2s'
                }}
              >
                <Upload size={18} /> Go to Scan Upload <ArrowRight size={16} />
              </Link>
            </div>
          )}

          {/* 5. GENERAL DENTAL HEALTH GUIDELINES (Always Visible to All Patients) */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(0, 210, 255, 0.12)', padding: '8px', borderRadius: '10px', color: 'var(--secondary)' }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main, #17324D)' }}>
                  General Dental Health Guidelines
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted, #475569)', fontWeight: 500 }}>
                  Foundational oral hygiene practices recommended by dental clinicians for all patients.
                </p>
              </div>
            </div>

            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                gap: '20px' 
              }}
            >
              {/* Card 1: Brushing & Flossing */}
              <div 
                style={{ 
                  background: 'var(--bg-card, rgba(255, 255, 255, 0.78))', 
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--border-color)', 
                  borderRadius: '20px', 
                  padding: '28px', 
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(0, 210, 255, 0.1)', padding: '12px', borderRadius: '12px', color: 'var(--secondary)' }}>
                    <Smile size={24} />
                  </div>
                  <h4 style={{ margin: 0, color: 'var(--text-main, #17324D)', fontSize: '1.15rem', fontWeight: 800 }}>
                    Brushing & Flossing
                  </h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    'Brush for at least 2 minutes, twice a day.',
                    'Use a soft-bristled toothbrush to protect your gums.',
                    'Floss at least once daily to remove hidden plaque.',
                    "Don't brush too hard; gentle circular motions are best."
                  ].map((tip, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary)', marginTop: '8px', flexShrink: 0 }}></div>
                      <span style={{ color: 'var(--text-muted, #475569)', fontSize: '0.9rem', lineHeight: 1.5, fontWeight: 500 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Diet & Nutrition */}
              <div 
                style={{ 
                  background: 'var(--bg-card, rgba(255, 255, 255, 0.78))', 
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--border-color)', 
                  borderRadius: '20px', 
                  padding: '28px', 
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '12px', color: '#f59e0b' }}>
                    <Coffee size={24} />
                  </div>
                  <h4 style={{ margin: 0, color: 'var(--text-main, #17324D)', fontSize: '1.15rem', fontWeight: 800 }}>
                    Diet & Nutrition
                  </h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    'Limit sugary and acidic foods and drinks.',
                    'Drink plenty of water, especially after meals.',
                    'Eat crunchy fruits and vegetables to stimulate saliva.',
                    'Avoid snacking constantly to give your teeth a break.'
                  ].map((tip, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', marginTop: '8px', flexShrink: 0 }}></div>
                      <span style={{ color: 'var(--text-muted, #475569)', fontSize: '0.9rem', lineHeight: 1.5, fontWeight: 500 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: When to Visit a Dentist */}
              <div 
                style={{ 
                  background: 'var(--bg-card, rgba(255, 255, 255, 0.78))', 
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--border-color)', 
                  borderRadius: '20px', 
                  padding: '28px', 
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '12px', color: '#ef4444' }}>
                    <Stethoscope size={24} />
                  </div>
                  <h4 style={{ margin: 0, color: 'var(--text-main, #17324D)', fontSize: '1.15rem', fontWeight: 800 }}>
                    When to Visit a Dentist
                  </h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    'Schedule regular check-ups every 6 months.',
                    'Visit immediately if you experience persistent tooth pain.',
                    'See a professional if your gums bleed frequently or are swollen.',
                    'Consult a dentist for any sudden sensitivity to hot or cold.'
                  ].map((tip, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', marginTop: '8px', flexShrink: 0 }}></div>
                      <span style={{ color: 'var(--text-muted, #475569)', fontSize: '0.9rem', lineHeight: 1.5, fontWeight: 500 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 6. MEDICAL DISCLAIMER CARD */}
          <div 
            style={{ 
              background: 'rgba(7, 26, 51, 0.03)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '20px', 
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              marginTop: '8px'
            }}
          >
            <ShieldAlert size={24} color="var(--secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h5 style={{ margin: '0 0 6px 0', fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main, #17324D)' }}>
                Medical Disclaimer
              </h5>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted, #475569)', lineHeight: 1.6, fontWeight: 500 }}>
                {MEDICAL_DISCLAIMER_TEXT}
              </p>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default PatientHealthTips;
