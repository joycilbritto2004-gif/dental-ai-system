export const getCareSuggestions = (condition) => {
  const suggestions = {
    Calculus: [
      "Schedule a professional dental scaling and cleaning.",
      "Brush twice a day with tartar-control toothpaste.",
      "Floss daily to prevent plaque buildup.",
      "Consider using an antimicrobial mouthwash."
    ],
    Caries: [
      "Maintain good oral hygiene by brushing with fluoride toothpaste.",
      "Limit frequent sugary foods and drinks.",
      "Consider professional dental evaluation and filling.",
      "Use dental floss to clean between teeth."
    ],
    Gingivitis: [
      "Maintain regular brushing twice a day.",
      "Clean between teeth regularly with floss or interdental brushes.",
      "Maintain good overall oral hygiene.",
      "Consider professional dental evaluation and cleaning."
    ],
    Hypodontia: [
      "Consult an orthodontist or prosthodontist for evaluation.",
      "Maintain excellent hygiene around existing teeth.",
      "Discuss options like dental implants, bridges, or partial dentures.",
      "Attend regular dental check-ups to monitor bite alignment."
    ],
    Mouth_Ulcer: [
      "Avoid spicy, acidic, or rough-textured foods.",
      "Rinse with warm salt water or an alcohol-free mouthwash.",
      "Use over-the-counter topical treatments for discomfort.",
      "If the ulcer persists for more than 2 weeks, consult a dentist."
    ],
    Tooth_Discoloration: [
      "Limit consumption of staining foods/drinks like coffee, tea, and wine.",
      "Maintain regular brushing and flossing.",
      "Consult a dentist about professional whitening options.",
      "Avoid smoking or using tobacco products."
    ]
  };

  const selectedSuggestions = suggestions[condition] || [
    "Maintain good oral hygiene.",
    "Schedule regular dental check-ups.",
    "Consult a dental professional for a comprehensive evaluation."
  ];

  return {
    suggestions: selectedSuggestions,
    disclaimer: "These are general oral-care suggestions and are not a substitute for professional dental advice."
  };
};
