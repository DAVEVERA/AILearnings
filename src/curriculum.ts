import { DifficultyLevel } from './types';

export interface CurriculumStep {
  title: string;
  description: string;
}

export const AI_CURRICULUM: Record<DifficultyLevel, CurriculumStep[]> = {
  beginner: [
    { title: "Wat is AI eigenlijk?", description: "De basisprincipes van kunstmatige intelligentie simpel uitgelegd." },
    { title: "Mogelijkheden van AI", description: "Wat kan AI wel en wat kan het (nog) niet?" },
    { title: "AI in de Praktijk", description: "Hoe AI vandaag de dag al effectief wordt ingezet." },
    { title: "Veilig werken met AI", description: "De do's en don'ts voor een veilige AI-ervaring." },
    { title: "Ethiek & Kwaliteit", description: "Waarom kritisch blijven op AI-output cruciaal is." },
    { title: "Jij & AI: De Eerste Stap", description: "Ontdek hoe jij persoonlijk kunt profiteren van AI." },
    { title: "AI Toollandschap", description: "Een overzicht van de belangrijkste tools voor jouw vakgebied." },
    { title: "Prompt Engineering Basis", description: "Leer hoe je betere vragen stelt aan een AI." },
    { title: "Data Privacy & AI", description: "Hoe we informatie beschermen in een AI-wereld." },
    { title: "Jouw AI Toekomst", description: "Reflectie op de eerste stappen en blik vooruit." }
  ],
  gemiddeld: [
    { title: "Generatieve AI Diepgang", description: "Hoe taalmodellen en beeldgeneratoren echt werken." },
    { title: "Advanced Prompting", description: "Technieken zoals Chain-of-Thought en Few-Shot prompting." },
    { title: "Procesautomatisering", description: "Identificeer en automatiseer repetitieve taken met AI." },
    { title: "AI als Strategische Partner", description: "AI inzetten voor complexere probleemoplossing." },
    { title: "AI-Assisted Besluitvorming", description: "Data-gedreven keuzes maken met hulp van AI." },
    { title: "Multimodale AI", description: "Werken met tekst, beeld, audio en data tegelijkertijd." },
    { title: "Systeemvalstrikken", description: "De diepere valkuilen en biases van complexe modellen." },
    { title: "AI Workflows Optimaliseren", description: "Het bouwen van efficiënte werkstromen met AI-integratie." },
    { title: "Team Collaboratie & AI", description: "Samenwerken in een door AI ondersteunde omgeving." },
    { title: "Visie op 2030", description: "Strategische voorbereiding op de volgende AI-golf." }
  ],
  gevorderd: [
    { title: "Strategische AI Implementatie", description: "Van experiment naar schaalbare AI-oplossingen." },
    { title: "AI Governance & Compliance", description: "Beleid en regels voor organisatiebreed AI-gebruik." },
    { title: "Impact & ROI Meten", description: "Het kwantificeren van de waarde van AI projecten." },
    { title: "Custom Agents & GPTs", description: "Het bouwen van je eigen gespecialiseerde AI assistenten." },
    { title: "AI in Change Management", description: "Mensen meenemen in de AI-transformatie." },
    { title: "AI-First Organisatie", description: "De blauwdruk voor de afdeling van de toekomst." },
    { title: "Psychologie van AI Adoptie", description: "Begrijp en overwin weerstand tegen nieuwe technologie." },
    { title: "Innovatie Lab", description: "Snelle experimenten en prototyping met cutting-edge AI." },
    { title: "AI Leadership", description: "Leidinggeven in een technologisch veranderend landschap." },
    { title: "The AI Roadmap", description: "Een concreet actieplan voor jouw blijvende AI-succes." }
  ]
};
