import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { LegalPrompt } from '@shared/schema';

export async function exportToPDF(prompt: LegalPrompt) {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const lineHeight = 7;
  let yPosition = margin;

  // Helper function to add text with word wrapping
  const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
    pdf.setFontSize(fontSize);
    if (isBold) {
      pdf.setFont('helvetica', 'bold');
    } else {
      pdf.setFont('helvetica', 'normal');
    }

    const textLines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
    const textHeight = textLines.length * lineHeight;

    // Check if we need a new page
    if (yPosition + textHeight > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.text(textLines, margin, yPosition);
    yPosition += textHeight + 5;
  };

  // Header
  addText('PROMPT JURÍDICO', 18, true);
  yPosition += 10;

  // Document type
  addText(`Tipo de Documento: ${prompt.documentType}`, 14, true);

  // Area tags
  if (prompt.areaTags.length > 0) {
    addText(`Áreas: ${prompt.areaTags.join(', ')}`, 12);
  }

  // Date
  const timeAgo = formatDistanceToNow(new Date(prompt.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });
  addText(`Criado: ${timeAgo}`, 10);

  yPosition += 10;

  // Original request
  addText('SOLICITAÇÃO ORIGINAL:', 14, true);
  addText(prompt.userRequest, 12);

  yPosition += 10;

  // Legal prompt
  addText('PROMPT JURÍDICO GERADO:', 14, true);
  addText(prompt.legalPrompt, 12);

  // Footer
  yPosition = pdf.internal.pageSize.getHeight() - 30;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Gerado por Prompts Jurídicos - promptsjuridicos.com.br', margin, yPosition);
  pdf.text(`Data de exportação: ${new Date().toLocaleDateString('pt-BR')}`, margin, yPosition + 10);

  // Save the PDF
  pdf.save(`prompt-juridico-${prompt.id}.pdf`);
}

export async function exportToWord(prompt: LegalPrompt) {
  const timeAgo = formatDistanceToNow(new Date(prompt.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: 'PROMPT JURÍDICO',
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 },
          }),

          // Document type
          new Paragraph({
            children: [
              new TextRun({
                text: 'Tipo de Documento: ',
                bold: true,
              }),
              new TextRun({
                text: prompt.documentType,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Area tags
          ...(prompt.areaTags.length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Áreas: ',
                  bold: true,
                }),
                new TextRun({
                  text: prompt.areaTags.join(', '),
                }),
              ],
              spacing: { after: 200 },
            }),
          ] : []),

          // Date
          new Paragraph({
            children: [
              new TextRun({
                text: 'Criado: ',
                bold: true,
              }),
              new TextRun({
                text: timeAgo,
                size: 20,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Original request section
          new Paragraph({
            text: 'SOLICITAÇÃO ORIGINAL',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            text: prompt.userRequest,
            spacing: { after: 400 },
          }),

          // Legal prompt section
          new Paragraph({
            text: 'PROMPT JURÍDICO GERADO',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            text: prompt.legalPrompt,
            spacing: { after: 400 },
          }),

          // Footer
          new Paragraph({
            children: [
              new TextRun({
                text: 'Gerado por Prompts Jurídicos - promptsjuridicos.com.br',
                size: 16,
                italics: true,
              }),
            ],
            spacing: { before: 800, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Data de exportação: ${new Date().toLocaleDateString('pt-BR')}`,
                size: 16,
                italics: true,
              }),
            ],
          }),
        ],
      },
    ],
  });

  // Generate and save the document
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `prompt-juridico-${prompt.id}.docx`);
}