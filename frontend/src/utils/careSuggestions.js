/**
 * DentaAI - Precautions and Clinical Suggestions Module
 * Centralized knowledge base for condition-specific oral-health precautions,
 * educational advice, clinical indicators ("When to See a Dentist"), and safety notices.
 */

export const SUPPORTED_CONDITIONS = [
  'Calculus',
  'Caries',
  'Gingivitis',
  'Hypodontia',
  'Mouth Ulcer',
  'Tooth Discoloration'
];

/**
 * Normalizes any format (e.g., 'mouth_ulcer', 'Mouth_Ulcer', 'MOUTH ULCER')
 * to standard display name, or returns null if unrecognized.
 */
export const normalizeConditionKey = (condition) => {
  if (!condition || typeof condition !== 'string') return null;
  const cleaned = condition.trim().toLowerCase().replace(/[\s_-]+/g, '_');
  
  const map = {
    'calculus': 'Calculus',
    'caries': 'Caries',
    'gingivitis': 'Gingivitis',
    'hypodontia': 'Hypodontia',
    'mouth_ulcer': 'Mouth Ulcer',
    'mouthulcer': 'Mouth Ulcer',
    'tooth_discoloration': 'Tooth Discoloration',
    'toothdiscoloration': 'Tooth Discoloration'
  };

  return map[cleaned] || null;
};

export const isSupportedCondition = (condition) => {
  return normalizeConditionKey(condition) !== null;
};

export const GENERAL_DISCLAIMER =
  "DentaAI provides AI-assisted preliminary information for educational purposes. Image-based predictions may be inaccurate and are not a confirmed dental diagnosis. Consult a qualified dental professional for examination and treatment.";

export const URGENT_CARE_NOTICE =
  "Seek urgent emergency medical care immediately if you experience difficulty breathing, trouble swallowing, high fever, or rapidly increasing facial or neck swelling. Do not delay care based on preliminary scan results.";

export const DENTAL_PRECAUTIONS_DATA = {
  Calculus: {
    name: "Calculus",
    category: "Plaque & Mineralization",
    severityLevel: "Moderate",
    explanation:
      "Dental calculus (tartar) is calcified plaque that bonds firmly to tooth enamel and along the gumline. While routine brushing prevents soft plaque, hardened calculus cannot be removed at home and requires professional scaling.",
    precautions: [
      "Brush twice daily with fluoride toothpaste.",
      "Clean between teeth daily using floss or an appropriate interdental cleaner.",
      "If hardened tartar is present, arrange professional dental cleaning.",
      "Do not attempt to scrape hardened deposits off your teeth yourself."
    ],
    whenToSeeDentist: [
      "Yellowish, brownish, or dark hardened deposits along the gumline that do not brush away.",
      "Gums that bleed, appear swollen, or feel tender during routine brushing and flossing.",
      "Persistent bad breath (halitosis) or rough texture against your tongue."
    ]
  },
  Caries: {
    name: "Caries",
    category: "Bacterial Enamel Breakdown",
    severityLevel: "High Attention",
    explanation:
      "Dental caries (tooth decay) develops when acid-producing oral bacteria gradually demineralize enamel and deeper dentin layers. Early clinical intervention is crucial to prevent progressive cavity formation and pulp infection.",
    precautions: [
      "Brush twice daily with fluoride toothpaste.",
      "Reduce frequent sugary snacks and drinks.",
      "Arrange a dental examination to assess possible tooth decay.",
      "Suspected cavities may require professional treatment and will not necessarily resolve through home care alone."
    ],
    whenToSeeDentist: [
      "Noticeable tooth sensitivity triggered by hot, cold, or sugary foods and beverages.",
      "Visible pits, dark brown spots, or physical holes forming on any tooth surface.",
      "Spontaneous toothache, throbbing pain, or discomfort while biting down."
    ]
  },
  Gingivitis: {
    name: "Gingivitis",
    category: "Periodontal Soft Tissue",
    severityLevel: "Early & Reversible",
    explanation:
      "Gingivitis is an early and reversible stage of periodontal inflammation caused by bacterial biofilm accumulating at the gum margin. With diligent oral hygiene and clinical cleaning, gum tissues can fully heal.",
    precautions: [
      "Brush gently along the gumline twice daily.",
      "Clean between teeth daily.",
      "Avoid aggressive brushing.",
      "Seek dental advice if bleeding, redness, or swelling persists."
    ],
    whenToSeeDentist: [
      "Gums that bleed consistently during regular brushing, flossing, or eating firm foods.",
      "Noticeable puffiness, dark red coloring, or tenderness of the gum tissue.",
      "Gums receding or pulling away from the base of your teeth."
    ]
  },
  Hypodontia: {
    name: "Hypodontia",
    category: "Developmental / Structural",
    severityLevel: "Clinical Review",
    explanation:
      "Hypodontia is the congenital absence of one or more permanent teeth. A dental professional will evaluate bite alignment, spatial balance in the dental arch, and long-term functional or aesthetic options.",
    precautions: [
      "Arrange a dental examination to confirm missing teeth.",
      "Ask a dentist about bite alignment, spacing, and appropriate treatment options.",
      "Do not suggest that a particular replacement treatment is necessary without professional assessment.",
      "Maintain meticulous hygiene around existing teeth to protect the dental arch foundation."
    ],
    whenToSeeDentist: [
      "Permanent teeth that have failed to erupt well past the expected developmental age.",
      "Unusual spacing, shifting, tilting, or overcrowding of adjacent teeth.",
      "Difficulties with efficient chewing, clear speech, or jaw discomfort."
    ]
  },
  'Mouth Ulcer': {
    name: "Mouth Ulcer",
    category: "Oral Mucosa / Soft Tissue",
    severityLevel: "Moderate",
    explanation:
      "Mouth ulcers are lesions of the oral mucosa that cause localized discomfort. While most simple aphthous ulcers heal spontaneously within 10 to 14 days, prolonged or recurrent ulcers require professional assessment.",
    precautions: [
      "Avoid foods that irritate the ulcer, including very spicy or acidic foods.",
      "Maintain gentle oral hygiene and stay hydrated.",
      "Seek professional evaluation if an ulcer lasts longer than two weeks, frequently recurs, or worsens.",
      "Refrain from picking, rubbing, or using unverified home remedies on open sores."
    ],
    whenToSeeDentist: [
      "Any ulcer or lesion persisting for more than two consecutive weeks without improvement.",
      "Ulcers that are unusually large, extremely painful, or continually recurring in crops.",
      "Ulcers accompanied by systemic signs such as high fever, swollen glands, or difficulty eating."
    ]
  },
  'Tooth Discoloration': {
    name: "Tooth Discoloration",
    category: "Aesthetic & Structural",
    severityLevel: "Evaluation",
    explanation:
      "Tooth discoloration encompasses extrinsic stains from dietary factors or tobacco, as well as intrinsic enamel shade changes. A dentist can determine whether discoloration stems from superficial staining or nerve vitality changes.",
    precautions: [
      "Brush twice daily with fluoride toothpaste.",
      "Avoid tobacco and excessive consumption of staining drinks.",
      "Arrange a dental assessment for persistent or sudden discoloration, particularly if accompanied by pain.",
      "Do not recommend unapproved whitening products or harsh home whitening methods."
    ],
    whenToSeeDentist: [
      "Sudden darkening, greying, or pinkish hue in an individual tooth (may indicate nerve trauma).",
      "Discoloration paired with tooth pain, throbbing, or sensitivity to thermal changes.",
      "Deep intrinsic staining that does not respond to regular oral hygiene."
    ]
  }
};

/**
 * Returns comprehensive precautions and educational recommendations for a given condition.
 * Fully backwards-compatible with existing consumers accessing .suggestions and .disclaimer.
 */
export const getCareSuggestions = (condition) => {
  const normKey = normalizeConditionKey(condition);

  if (!normKey) {
    const rawLabel = (condition && typeof condition === 'string') ? condition.replace(/_/g, ' ') : 'Unrecognized Condition';
    return {
      isSupported: false,
      conditionName: rawLabel,
      category: "Unclassified Scan",
      explanation:
        "The AI scan could not classify this image into one of the supported standard conditions. A clinical consultation with a licensed dentist is advised for an accurate diagnosis.",
      precautions: [
        "Arrange a clinical dental examination for professional evaluation and imaging.",
        "Maintain gentle twice-daily brushing with fluoride toothpaste.",
        "Clean between teeth daily using floss or an interdental cleaner.",
        "Do not attempt self-treatment or unverified remedies for unconfirmed dental issues."
      ],
      suggestions: [
        "Arrange a clinical dental examination for professional evaluation and imaging.",
        "Maintain gentle twice-daily brushing with fluoride toothpaste.",
        "Clean between teeth daily using floss or an interdental cleaner.",
        "Do not attempt self-treatment or unverified remedies for unconfirmed dental issues."
      ],
      whenToSeeDentist: [
        "Any persistent toothache, sensitivity, or gum swelling.",
        "Any visible oral lesion, broken tooth, or bleeding that does not stop.",
        "For an accurate diagnostic assessment and individualized care plan."
      ],
      disclaimer: GENERAL_DISCLAIMER,
      emergencyNotice: URGENT_CARE_NOTICE
    };
  }

  const data = DENTAL_PRECAUTIONS_DATA[normKey];

  return {
    isSupported: true,
    conditionName: data.name,
    category: data.category,
    severityLevel: data.severityLevel,
    explanation: data.explanation,
    precautions: data.precautions,
    suggestions: data.precautions, // Backwards-compatibility alias
    whenToSeeDentist: data.whenToSeeDentist,
    disclaimer: GENERAL_DISCLAIMER,
    emergencyNotice: URGENT_CARE_NOTICE
  };
};
