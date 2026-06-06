import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export async function generateCertificatePDF({ id, recipientName, eventName, issueDate, transactionHash }, returnBlob = false) {
  try {
    const verifyUrl = `${window.location.origin}/?id=${id}`;

    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 250,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const w = 297;
    const h = 210;

    doc.setFillColor(11, 14, 26);
    doc.rect(0, 0, w, h, 'F');

    doc.setFillColor(139, 92, 246);
    for (let r = 80; r > 0; r -= 5) {
      doc.setGState(new doc.GState({ opacity: 0.005 }));
      doc.circle(w / 2, h / 2, r, 'F');
    }
    doc.setGState(new doc.GState({ opacity: 1.0 }));

    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(1.2);
    doc.rect(8, 8, w - 16, h - 16);

    doc.setDrawColor(34, 211, 238);
    doc.setLineWidth(0.4);
    doc.rect(10, 10, w - 20, h - 20);

    doc.setFillColor(139, 92, 246);
    doc.rect(8, 8, 12, 1.5, 'F');
    doc.rect(8, 8, 1.5, 12, 'F');
    doc.rect(w - 20, 8, 12, 1.5, 'F');
    doc.rect(w - 9.5, 8, 1.5, 12, 'F');
    doc.rect(8, h - 9.5, 12, 1.5, 'F');
    doc.rect(8, h - 20, 1.5, 12, 'F');
    doc.rect(w - 20, h - 9.5, 12, 1.5, 'F');
    doc.rect(w - 9.5, h - 20, 1.5, 12, 'F');

    doc.setTextColor(248, 250, 252);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('CERTIFICADO DE ASISTENCIA', w / 2, 38, { align: 'center' });

    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(0.8);
    doc.line(w / 2 - 40, 45, w / 2 + 40, 45);

    doc.setTextColor(148, 163, 184);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(13);
    doc.text('Por cuanto se hace constar que de forma meritoria y oficial se otorga a:', w / 2, 60, { align: 'center' });

    doc.setTextColor(34, 211, 238);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(30);
    doc.text(recipientName.toUpperCase(), w / 2, 78, { align: 'center' });

    doc.setTextColor(148, 163, 184);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(13);
    doc.text('Su valiosa asistencia y participacion activa en el evento academico de la universidad:', w / 2, 94, { align: 'center' });

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`"${eventName}"`, w / 2, 108, { align: 'center' });

    doc.setTextColor(148, 163, 184);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    const dateObj = new Date(Number(issueDate));
    const formattedDate = dateObj.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    doc.text(`Realizado y emitido bajo registro inmutable el dia ${formattedDate}`, w / 2, 122, { align: 'center' });

    doc.setDrawColor(71, 85, 105);
    doc.setLineWidth(0.4);
    doc.line(35, 165, 105, 165);

    doc.setFillColor(139, 92, 246);
    doc.setGState(new doc.GState({ opacity: 0.15 }));
    doc.circle(70, 155, 10, 'F');
    doc.setGState(new doc.GState({ opacity: 1.0 }));

    doc.setTextColor(148, 163, 184);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('COMITE ORGANIZADOR', 70, 170, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Autoridad Academica Universitaria', 70, 174, { align: 'center' });

    doc.addImage(qrCodeDataUrl, 'PNG', w - 85, 132, 38, 38);

    doc.setTextColor(148, 163, 184);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('VERIFICACION BLOCKCHAIN', w - 66, 175, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Escanea el codigo QR para validar la', w - 66, 179, { align: 'center' });
    doc.text('autenticidad inmutable del certificado', w - 66, 182, { align: 'center' });

    doc.setTextColor(71, 85, 105);
    doc.setFont('Courier', 'normal');
    doc.setFontSize(7);

    doc.text(`ID DE CERTIFICADO: ${id}`, 15, h - 14);
    if (transactionHash) {
      doc.text(`HASH DE TX BLOCKCHAIN: ${transactionHash}`, 15, h - 10);
    } else {
      doc.text(`VERIFICACION CRIPTOGRAFICA: Registro Centralizado Inmutable`, 15, h - 10);
    }

    doc.text(`EMISOR OFICIAL: ${window.location.host || 'UNIVERSIDAD CENTRAL'}`, w - 15, h - 10, { align: 'right' });

    if (returnBlob) {
      return doc.output('blob');
    }

    const cleanedName = recipientName.toLowerCase().replace(/\s+/g, '-');
    doc.save(`certificado-${cleanedName}.pdf`);

    return true;
  } catch (error) {
    console.error('Error al generar el PDF del certificado:', error);
    throw error;
  }
}
