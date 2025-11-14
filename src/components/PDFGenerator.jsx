import jsPDF from 'jspdf';

const PDFGenerator = {
generateRegistrationPDF: (data, qrCodeUrl) => {
const doc = new jsPDF();

// Configuration
const pageWidth = doc.internal.pageSize.width;
const pageHeight = doc.internal.pageSize.height;
const margin = 20;

// Couleurs
const primaryBlue ="#003f5c";
const secondaryBlue ="#7a5195";
const greenHighlight ="#4ecdc4";

// En-tête avec bordure
doc.setFillColor(...primaryBlue);
doc.rect(0, 0, pageWidth, 40, 'F');

// Titre
doc.setTextColor(255, 255, 255);
doc.setFontSize(24);
doc.setFont('helvetica', 'bold');
doc.text('SÉMINAIRE AN-NOUR 7.0', pageWidth / 2, 20, { align: 'center' });

doc.setFontSize(12);
doc.setFont('helvetica', 'normal');
doc.text('Fiche d\'Inscription', pageWidth / 2, 30, { align: 'center' });

// QR Code
if (qrCodeUrl) {
  try {
    doc.addImage(qrCodeUrl, 'PNG', pageWidth - margin - 40, 50, 40, 40);
  } catch (error) {
    console.error('Erreur ajout QR code au PDF:', error);
  }
}

// Matricule en grand
doc.setTextColor(...primaryBlue);
doc.setFontSize(16);
doc.setFont('helvetica', 'bold');
doc.text('MATRICULE', margin, 60);

doc.setFontSize(20);
doc.setTextColor(...secondaryBlue);
doc.text(data.dormitoryInfo.matricule, margin, 72);

// Ligne de séparation
doc.setDrawColor(...greenHighlight);
doc.setLineWidth(0.5);
doc.line(margin, 80, pageWidth - margin, 80);

// Informations du participant
let yPos = 95;
const lineHeight = 10;

doc.setTextColor(0, 0, 0);
doc.setFontSize(14);
doc.setFont('helvetica', 'bold');
doc.text('INFORMATIONS DU PARTICIPANT', margin, yPos);

yPos += 15;
doc.setFontSize(11);
doc.setFont('helvetica', 'normal');

const fields = [
  { label: 'Nom', value: data.personalInfo.nom },
  { label: 'Prénom', value: data.personalInfo.prenom },
  { label: 'Sexe', value: data.personalInfo.sexe === 'M' ? 'Masculin' : 'Féminin' },
  { label: 'Âge', value: `${data.personalInfo.age} ans` },
  { label: 'Niveau Académique', value: data.personalInfo.niveauAcademique },
  { label: 'Dortoir', value: data.dormitoryInfo.dortoir },
  { label: 'Allergie', value: data.healthInfo.allergie },
  { label: 'Antécédent Médical', value: data.healthInfo.antecedentMedical }
];

fields.forEach(field => {
  doc.setFont('helvetica', 'bold');
  doc.text(`${field.label}:`, margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(field.value, margin + 60, yPos);
  yPos += lineHeight;
});

// Statut paiement
yPos += 5;
doc.setFillColor(...greenHighlight);
doc.roundedRect(margin, yPos - 5, 80, 12, 3, 3, 'F');
doc.setTextColor(0, 0, 0);
doc.setFont('helvetica', 'bold');
doc.text('✓ PAIEMENT VALIDÉ', margin + 5, yPos + 3);
doc.setTextColor(0, 0, 0);
doc.setFont('helvetica', 'normal');
doc.text('7 000 FCFA', margin + 90, yPos + 3);

// Informations pratiques
yPos = pageHeight - 80;
doc.setDrawColor(...secondaryBlue);
doc.setLineWidth(0.5);
doc.line(margin, yPos, pageWidth - margin, yPos);

yPos += 10;
doc.setFontSize(12);
doc.setFont('helvetica', 'bold');
doc.text('INFORMATIONS PRATIQUES', margin, yPos);

yPos += 10;
doc.setFontSize(10);
doc.setFont('helvetica', 'normal');

const practicalInfo = [
  '📅 Dates : 20 au 25 Décembre 2025',
  '📍 Lieu : Lycée Moderne Cocody Angré, Abidjan',
  '🕐 Arrivée : Vendredi 20 Décembre à partir de 14h00',
  '📞 Contact : 05 45 84 41 35 / 01 42 08 05 37'
];

practicalInfo.forEach(info => {
  doc.text(info, margin, yPos);
  yPos += 7;
});

// Footer
doc.setFontSize(9);
doc.setTextColor(100, 100, 100);
doc.text(
  'AEEMCI - Secrétariat Régional Abidjan Est',
  pageWidth / 2,
  pageHeight - 15,
  { align: 'center' }
);
doc.text(
  'Sous-comité de Bingerville et de Cocody 1',
  pageWidth / 2,
  pageHeight - 10,
  { align: 'center' }
);

// Télécharger
doc.save(`fiche-inscription-${data.dormitoryInfo.matricule}.pdf`);
}
};

export default PDFGenerator;