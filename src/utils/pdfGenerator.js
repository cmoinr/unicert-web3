import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { JETBRAINS_MONO_REGULAR, JETBRAINS_MONO_BOLD, JETBRAINS_MONO_ITALIC, JETBRAINS_MONO_BOLDITALIC } from './jetbrainsMonoBase64';

export async function generateCertificatePDF({ id, recipientName, eventName, issueDate, issuanceDate, transactionHash, templateConfig }, returnBlob = false) {
  try {
    const verifyUrl = `${window.location.origin}/?id=${id}`;

    const config = templateConfig || { useCustom: false };
    const isDarkText = config.useCustom ? (config.textColor === 'dark') : false;

    // Colores dinámicos del QR según el tema
    const qrDarkColor = isDarkText ? '#0f172a' : '#d946ef'; // Magenta/Púrpura en fondo oscuro, Slate en fondo claro
    const qrLightColor = isDarkText ? '#ffffff' : '#05070f'; // Negro en fondo oscuro, Blanco en fondo claro

    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 250,
      color: {
        dark: qrDarkColor,
        light: qrLightColor
      }
    });

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Registrar fuentes JetBrains Mono
    doc.addFileToVFS('JetBrainsMono-Regular.ttf', JETBRAINS_MONO_REGULAR);
    doc.addFont('JetBrainsMono-Regular.ttf', 'JetBrainsMono', 'normal');

    doc.addFileToVFS('JetBrainsMono-Bold.ttf', JETBRAINS_MONO_BOLD);
    doc.addFont('JetBrainsMono-Bold.ttf', 'JetBrainsMono', 'bold');

    doc.addFileToVFS('JetBrainsMono-Italic.ttf', JETBRAINS_MONO_ITALIC);
    doc.addFont('JetBrainsMono-Italic.ttf', 'JetBrainsMono', 'italic');

    doc.addFileToVFS('JetBrainsMono-BoldItalic.ttf', JETBRAINS_MONO_BOLDITALIC);
    doc.addFont('JetBrainsMono-BoldItalic.ttf', 'JetBrainsMono', 'bolditalic');

    const w = 297;
    const h = 210;

    if (config.useCustom) {
      // --- DISEÑO PERSONALIZADO (CANVA) ---
      if (config.image) {
        doc.addImage(config.image, 'JPEG', 0, 0, w, h);
      } else {
        // Fallback si no hay imagen
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 0, w, h, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(1);
        doc.rect(5, 5, w - 10, h - 10);
      }

      // Colores de texto con alto contraste según la configuración (Claro / Oscuro)
      const textColorRGB = isDarkText ? [15, 23, 42] : [255, 255, 255]; // Negro puro / Blanco puro
      const secondaryTextColorRGB = isDarkText ? [30, 41, 59] : [241, 245, 249]; // Gris muy oscuro / Blanco hueso
      const metadataColorRGB = isDarkText ? [71, 85, 105] : [226, 232, 240]; // Gris medio / Gris claro (más brillante para contraste)

      // 0. Título (Opcional, si no viene integrado en la imagen)
      if (config.showTitle !== false && config.titleText) {
        doc.setTextColor(textColorRGB[0], textColorRGB[1], textColorRGB[2]);
        doc.setFont('JetBrainsMono', 'bold');
        doc.setFontSize(config.titleSize || 24);
        doc.text(config.titleText.toUpperCase(), w / 2, config.titleY || 38, { align: 'center' });

        // Línea divisoria decorativa debajo del título
        doc.setDrawColor(textColorRGB[0], textColorRGB[1], textColorRGB[2]);
        doc.setLineWidth(0.6);
        doc.line(w / 2 - 40, (config.titleY || 38) + 6, w / 2 + 40, (config.titleY || 38) + 6);
      }

      // 1. Nombre del Recipiente
      doc.setTextColor(textColorRGB[0], textColorRGB[1], textColorRGB[2]);
      const nameFont = config.nameFont === 'Times' ? 'Times' : config.nameFont === 'Courier' ? 'Courier' : config.nameFont === 'Helvetica' ? 'Helvetica' : 'JetBrainsMono';
      const nameStyle = config.nameStyle || 'BoldItalic';
      doc.setFont(nameFont, nameStyle.toLowerCase());
      doc.setFontSize(config.nameSize || 36);
      doc.text(recipientName, w / 2, config.nameY || 95, { align: 'center' });

      // 2. Texto de Acreditación (Wording)
      const wordingTemplate = config.customWording || 'Por haber cumplido satisfactoriamente con el {EVENT} el día {DATE}.';
      const dateObj = new Date(Number(issueDate));
      const formattedDate = dateObj.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const wordingText = wordingTemplate
        .replace(/{EVENT}/g, `"${eventName}"`)
        .replace(/{DATE}/g, formattedDate)
        .replace(/{NAME}/g, recipientName);

      doc.setTextColor(secondaryTextColorRGB[0], secondaryTextColorRGB[1], secondaryTextColorRGB[2]);
      doc.setFont('JetBrainsMono', 'normal');
      doc.setFontSize(11);
      const splitWording = doc.splitTextToSize(wordingText, 220);
      doc.text(splitWording, w / 2, config.wordingY || 120, { align: 'center' });

      // 3. Código QR
      let qrSize = 38; // Más grande como fue solicitado (de 30 a 38)
      let qrX = w - 53;
      let qrY = h - 56;
      let drawQr = true;

      switch (config.qrPosition) {
        case 'bottom-right':
          qrX = w - 53;
          qrY = h - 56;
          break;
        case 'bottom-left':
          qrX = 15;
          qrY = h - 56;
          break;
        case 'bottom-center':
          qrX = w / 2 - 19;
          qrY = h - 60;
          break;
        case 'top-right':
          qrX = w - 53;
          qrY = 15;
          break;
        case 'hidden':
          drawQr = false;
          break;
      }

      if (drawQr) {
        doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        doc.setTextColor(metadataColorRGB[0], metadataColorRGB[1], metadataColorRGB[2]);
        doc.setFont('JetBrainsMono', 'bold');
        doc.setFontSize(6.5);
        doc.text('VERIFICACIÓN BLOCKCHAIN', qrX + qrSize / 2, qrY + qrSize + 4, { align: 'center' });
      }

      // 4. Pie de página con Metadatos Criptográficos (Más grandes y más separados del borde inferior)
      doc.setTextColor(metadataColorRGB[0], metadataColorRGB[1], metadataColorRGB[2]);
      doc.setFont('JetBrainsMono', 'normal');
      doc.setFontSize(7.5); // Más grande (de 6.5 a 7.5)
      doc.text(`ID DE CERTIFICADO: ${id}`, 15, h - 14); // Más separado (de h-8 a h-14)
      if (transactionHash) {
        doc.text(`HASH DE TX: ${transactionHash}`, 15, h - 10); // Más separado (de h-5 a h-10)
      } else {
        doc.text(`VERIFICACIÓN CRIPTOGRÁFICA: Registro Centralizado Inmutable`, 15, h - 10);
      }

      const issueDateObj = new Date(Number(issuanceDate || Date.now()));
      const day = String(issueDateObj.getDate()).padStart(2, '0');
      const month = String(issueDateObj.getMonth() + 1).padStart(2, '0');
      const year = issueDateObj.getFullYear();
      const hours = String(issueDateObj.getHours()).padStart(2, '0');
      const minutes = String(issueDateObj.getMinutes()).padStart(2, '0');
      const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}`;

      doc.text(`EMISOR: ${window.location.host || 'UNIVERSIDAD CENTRAL'}`, w - 15, h - 14, { align: 'right' });
      doc.text(`OTORGADO EL: ${formattedDateTime}`, w - 15, h - 10, { align: 'right' });

    } else {
      // --- DISEÑO NEÓN POR DEFECTO (ORIGINAL) ---
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
      doc.setFontSize(config.nameSize || 30);
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

      const issueDateObj = new Date(Number(issuanceDate || Date.now()));
      const day = String(issueDateObj.getDate()).padStart(2, '0');
      const month = String(issueDateObj.getMonth() + 1).padStart(2, '0');
      const year = issueDateObj.getFullYear();
      const hours = String(issueDateObj.getHours()).padStart(2, '0');
      const minutes = String(issueDateObj.getMinutes()).padStart(2, '0');
      const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}`;

      doc.text(`EMISOR OFICIAL: ${window.location.host || 'UNIVERSIDAD CENTRAL'}`, w - 15, h - 14, { align: 'right' });
      doc.text(`OTORGADO EL: ${formattedDateTime}`, w - 15, h - 10, { align: 'right' });
    }

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
