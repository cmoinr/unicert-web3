import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Plus, CheckCircle, Award, Calendar, Key, Download, Upload, PauseCircle, PlayCircle, FileSpreadsheet, Loader, FileDown, Settings, Image, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { issueCertificateData, batchIssueCertificatesData, CONTRACT_ABI, getNextAvailableSuffix } from '../utils/blockchain';
import { ethers } from 'ethers';
import { generateCertificatePDF } from '../utils/pdfGenerator';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

export default function AdminDashboard({ contractAddress, setContractAddress }) {
  const [formData, setFormData] = useState({
    id: '',
    recipientName: '',
    eventName: '',
    issueDate: new Date().toISOString().split('T')[0]
  });

  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [issuedHistory, setIssuedHistory] = useState([]);

  // Estado para batch
  const [batchStudents, setBatchStudents] = useState([]);
  const [batchEventName, setBatchEventName] = useState('');
  const [batchIssueDate, setBatchIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState('');
  const [batchErrorMsg, setBatchErrorMsg] = useState('');
  const [batchProgress, setBatchProgress] = useState(0);

  // Configuración de la Plantilla Personalizada
  const DEFAULT_TEMPLATE_CONFIG = {
    useCustom: false,
    image: '', // base64
    textColor: 'light', // 'dark' o 'light'
    qrPosition: 'bottom-center', // 'bottom-right', 'bottom-left', 'bottom-center', 'top-right', 'hidden'
    nameFont: 'JetBrainsMono',
    nameStyle: 'BoldItalic',
    nameY: 105,
    nameSize: 40, // Tamaño de letra por defecto para el nombre en pt
    wordingY: 120,
    customWording: 'Por haber cumplido satisfactoriamente con el Conversatorio Práctico {EVENT} (duración: 5hrs), llevado a cabo el 18 de mayo de 2026 en el Decanato de Investigación de la UNERG.',
    showTitle: false,
    titleText: 'CERTIFICADO DE RECONOCIMIENTO',
    titleY: 38,
    titleSize: 24
  };

  const [templateConfig, setTemplateConfig] = useState(() => {
    const saved = localStorage.getItem('unicert_custom_template_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error cargando configuración guardada:', e);
      }
    }
    return DEFAULT_TEMPLATE_CONFIG;
  });

  useEffect(() => {
    localStorage.setItem('unicert_custom_template_config', JSON.stringify(templateConfig));
  }, [templateConfig]);

  useEffect(() => {
    if (templateConfig.image && templateConfig.image.startsWith('data:image/png')) {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 2000;
        const MAX_HEIGHT = 2000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setTemplateConfig(prev => ({ ...prev, image: dataUrl }));
      };
      img.src = templateConfig.image;
    }
  }, [templateConfig.image]);

  const [isConfigExpanded, setIsConfigExpanded] = useState(false);

  const handleTemplateImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 2000;
        const MAX_HEIGHT = 2000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setTemplateConfig(prev => ({ ...prev, image: dataUrl }));
        setIsConfigExpanded(true);
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  };

  const loadDemoTemplate = async () => {
    try {
      const response = await fetch('/template-certificado-ais.png');
      if (!response.ok) throw new Error('No se pudo encontrar el archivo demo.');
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 2000;
          const MAX_HEIGHT = 2000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

          setTemplateConfig(prev => ({
            ...prev,
            useCustom: true,
            image: dataUrl,
            textColor: 'light',
            nameFont: 'JetBrainsMono',
            nameStyle: 'BoldItalic',
            nameY: 105,
            nameSize: 40,
            wordingY: 120,
            qrPosition: 'bottom-center',
            customWording: 'Por haber cumplido satisfactoriamente con el Conversatorio Práctico {EVENT} (duración: 5hrs), llevado a cabo el 18 de mayo de 2026 en el Decanato de Investigación de la UNERG.',
            showTitle: false, // La demo de AIS ya trae el título en el diseño de Canva
            titleText: 'CERTIFICADO DE RECONOCIMIENTO',
            titleY: 38,
            titleSize: 24
          }));
          setIsConfigExpanded(true);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Error cargando plantilla demo:', err);
      alert('Error al cargar la plantilla demo. Asegúrate de que existe en el servidor local.');
    }
  };

  useEffect(() => {
    const data = localStorage.getItem('blockchain_simulated_certificates');
    if (data) {
      const parsed = JSON.parse(data);
      setIssuedHistory(Object.values(parsed).reverse());
    }
  }, [successMsg, batchSuccessMsg]);

  const generateRandomId = () => {
    const prefix = "UC-";
    const random = Math.floor(100000 + Math.random() * 900000);
    setFormData(prev => ({ ...prev, id: `${prefix}${random}` }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setTxHash('');

    if (!formData.id.trim()) {
      setErrorMsg('Por favor, ingresa o genera un ID de certificado');
      setIsLoading(false);
      return;
    }

    try {
      const dataToSubmit = {
        id: formData.id.trim(),
        recipientName: formData.recipientName.trim(),
        eventName: formData.eventName.trim(),
        issueDate: (() => {
          if (!formData.issueDate) return new Date().getTime();
          const [y, m, d] = formData.issueDate.split('-').map(Number);
          const dateObj = new Date(y, m - 1, d);
          const now = new Date();
          dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
          return dateObj.getTime();
        })()
      };

      const result = await issueCertificateData(dataToSubmit, contractAddress);

      if (result.success) {
        setTxHash(result.transactionHash);
        const isReal = result.isRealBlockchain;
        setSuccessMsg(
          isReal
            ? '¡Certificado registrado con éxito en la Blockchain de Polygon Amoy!'
            : '¡Certificado emitido con éxito en el Registro de Simulación Criptográfica!'
        );

        await generateCertificatePDF({
          id: dataToSubmit.id,
          recipientName: dataToSubmit.recipientName,
          eventName: dataToSubmit.eventName,
          issueDate: dataToSubmit.issueDate,
          issuanceDate: Date.now(),
          transactionHash: result.transactionHash,
          templateConfig
        });

        setFormData({
          id: '',
          recipientName: '',
          eventName: formData.eventName,
          issueDate: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || 'Ocurrió un error inesperado al emitir el certificado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async (cert) => {
    await generateCertificatePDF({
      id: cert.id,
      recipientName: cert.recipientName,
      eventName: cert.eventName,
      issueDate: cert.issueDate,
      issuanceDate: cert.issuanceDate,
      transactionHash: cert.transactionHash,
      templateConfig
    });
  };

  // --- MANEJO DE ARCHIVO EXCEL ---
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBatchErrorMsg('');
    setBatchSuccessMsg('');
    setIsBatchLoading(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        // Leer como array bidimensional para detectar filas de títulos/cabeceras
        const sheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

        if (sheetData.length === 0) {
          setBatchErrorMsg('El archivo Excel está vacío o no tiene datos válidos.');
          setIsBatchLoading(false);
          return;
        }

        // Buscar fila de cabecera detectando palabras clave
        let headerRowIndex = -1;
        let nameColIndex = -1;
        let docColIndex = -1;
        let eventColIndex = -1;
        let dateColIndex = -1;

        for (let r = 0; r < Math.min(sheetData.length, 10); r++) {
          const row = sheetData[r];
          if (!row || !Array.isArray(row)) continue;

          for (let c = 0; c < row.length; c++) {
            const cellVal = String(row[c] || '').trim().toLowerCase();
            if (['nombre', 'nombre y apellidos', 'alumno', 'name', 'student', 'nombre completo'].includes(cellVal) || cellVal.includes('nombre')) {
              nameColIndex = c;
            }
            if (['cedula', 'cédula', 'documento', 'id', 'identificación', 'identificacion', 'dni'].includes(cellVal) || cellVal.includes('cedula') || cellVal.includes('documento')) {
              docColIndex = c;
            }
            if (['evento', 'conferencia', 'curso', 'talleres', 'event'].includes(cellVal)) {
              eventColIndex = c;
            }
            if (['fecha', 'fecha de emisión', 'date'].includes(cellVal)) {
              dateColIndex = c;
            }
          }

          if (nameColIndex !== -1 || docColIndex !== -1) {
            headerRowIndex = r;
            break;
          }
        }

        let rawStudentsList = [];

        if (headerRowIndex !== -1) {
          // Extraer a partir de la fila siguiente a la cabecera
          for (let r = headerRowIndex + 1; r < sheetData.length; r++) {
            const row = sheetData[r];
            if (!row || !Array.isArray(row)) continue;
            if (row.every(cell => String(cell || '').trim() === '')) continue;

            const name = nameColIndex !== -1 ? String(row[nameColIndex] || '').trim() : '';
            const docId = docColIndex !== -1 ? String(row[docColIndex] || '').trim() : '';
            const event = eventColIndex !== -1 ? String(row[eventColIndex] || '').trim() : '';
            const dateRaw = dateColIndex !== -1 ? row[dateColIndex] : '';

            if (!name) continue;

            rawStudentsList.push({
              name,
              docId,
              event,
              dateRaw
            });
          }
        } else {
          // Fallback al método clásico si no se autodetecta cabecera
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
          rawStudentsList = jsonData.map((row) => {
            const name = row['nombre'] || row['Nombre'] || row['NOMBRE'] || row['name'] || row['Name'] || row['alumno'] || row['Alumno'] || '';
            const docId = row['documento'] || row['Documento'] || row['DOCUMENTO'] || row['id'] || row['ID'] || row['Id'] || '';
            const event = row['evento'] || row['Evento'] || row['EVENTO'] || row['event'] || row['Event'] || '';
            const dateRaw = row['fecha'] || row['Fecha'] || row['FECHA'] || row['date'] || row['Date'] || '';

            return {
              name: String(name).trim(),
              docId: String(docId).trim(),
              event: String(event).trim(),
              dateRaw
            };
          }).filter(s => s.name.length > 0);
        }

        if (rawStudentsList.length === 0) {
          setBatchErrorMsg('No se encontraron nombres de estudiantes válidos en el archivo. Asegúrate de tener una columna de nombres.');
          setIsBatchLoading(false);
          return;
        }

        // Asignación asíncrona de sufijos secuenciales para evitar colisiones
        const students = [];
        const localCedulaCounts = {};

        for (const s of rawStudentsList) {
          const cleanDoc = s.docId.trim();
          let certId = '';

          if (cleanDoc) {
            if (localCedulaCounts[cleanDoc] === undefined) {
              localCedulaCounts[cleanDoc] = 0;
            }

            // Consultar el próximo sufijo disponible
            const nextSuffix = await getNextAvailableSuffix(cleanDoc, contractAddress);
            const finalSuffix = nextSuffix === 0 && localCedulaCounts[cleanDoc] === 0
              ? 0
              : (nextSuffix === 0 ? localCedulaCounts[cleanDoc] : nextSuffix + localCedulaCounts[cleanDoc]);

            certId = finalSuffix === 0
              ? `UC-${cleanDoc}`
              : `UC-${cleanDoc}-${finalSuffix}`;

            localCedulaCounts[cleanDoc]++;
          } else {
            // Si no tiene cédula, se le genera un ID secuencial autoincremental simple
            certId = `UC-${String(students.length + 1).padStart(6, '0')}`;
          }

          let parsedDate = new Date().getTime();
          if (s.dateRaw) {
            const d = new Date(s.dateRaw);
            if (!isNaN(d.getTime())) parsedDate = d.getTime();
          }

          students.push({
            id: certId,
            recipientName: s.name,
            eventName: s.event,
            issueDate: parsedDate
          });
        }

        setBatchStudents(students);

        if (students.length > 0 && students[0].eventName) {
          setBatchEventName(students[0].eventName);
        }
      } catch (err) {
        console.error(err);
        setBatchErrorMsg('Error al leer o procesar el archivo Excel. Verifica el formato.');
      } finally {
        setIsBatchLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [contractAddress]);

  const clearBatch = () => {
    setBatchStudents([]);
    setBatchEventName('');
    setBatchIssueDate(new Date().toISOString().split('T')[0]);
    setBatchSuccessMsg('');
    setBatchErrorMsg('');
    setBatchProgress(0);
  };

  const handleBatchMint = async () => {
    if (batchStudents.length === 0) return;

    if (!batchEventName.trim()) {
      setBatchErrorMsg('Debes especificar un nombre de evento para todos los certificados.');
      return;
    }

    setIsBatchLoading(true);
    setBatchErrorMsg('');
    setBatchSuccessMsg('');
    setBatchProgress(0);

    try {
      const certificates = batchStudents.map(s => ({
        ...s,
        eventName: batchEventName.trim(),
        issueDate: (() => {
          if (!batchIssueDate) return new Date().getTime();
          const [y, m, d] = batchIssueDate.split('-').map(Number);
          const dateObj = new Date(y, m - 1, d);
          const now = new Date();
          dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
          return dateObj.getTime();
        })()
      }));

      const result = await batchIssueCertificatesData(certificates, contractAddress);

      if (result.success) {
        setBatchSuccessMsg(
          `¡${certificates.length} certificados emitidos exitosamente en la Blockchain!`
        );

        setBatchProgress(0);

        handleBatchDownloadAll(result.results);
      }
    } catch (error) {
      console.error(error);
      setBatchErrorMsg(error.message || 'Ocurrió un error al emitir los certificados en batch.');
    } finally {
      setIsBatchLoading(false);
      setBatchProgress(0);
    }
  };

  const handleBatchDownloadAll = async (certificates) => {
    const list = certificates || batchStudents;
    if (list.length === 0) return;

    const zip = new JSZip();
    const total = list.length;

    for (let i = 0; i < total; i++) {
      const cert = list[i];
      try {
        const pdfBlob = await generateCertificatePDF({
          id: cert.id,
          recipientName: cert.recipientName,
          eventName: cert.eventName || batchEventName,
          issueDate: cert.issueDate,
          issuanceDate: cert.issuanceDate,
          transactionHash: cert.transactionHash,
          templateConfig
        }, true);

        if (pdfBlob) {
          const cleanedName = cert.recipientName.toLowerCase().replace(/\s+/g, '-');
          zip.file(`certificado-${cleanedName}.pdf`, pdfBlob);
        }

        setBatchProgress(Math.round(((i + 1) / total) * 100));
      } catch (err) {
        console.error(`Error generando PDF para ${cert.recipientName}:`, err);
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    const eventSlug = batchEventName.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 30);
    link.download = `certificados-${eventSlug || 'batch'}.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const isDemo = !contractAddress || contractAddress.trim() === '' || contractAddress === '0x0000000000000000000000000000000000000000';

  let qrCssPosition = {};
  switch (templateConfig.qrPosition) {
    case 'bottom-right':
      qrCssPosition = { bottom: '10%', right: '5%' };
      break;
    case 'bottom-left':
      qrCssPosition = { bottom: '10%', left: '5%' };
      break;
    case 'bottom-center':
      qrCssPosition = { bottom: '12%', left: '50%', transform: 'translateX(-50%)' };
      break;
    case 'top-right':
      qrCssPosition = { top: '8%', right: '5%' };
      break;
    case 'hidden':
      qrCssPosition = { display: 'none' };
      break;
    default:
      qrCssPosition = { bottom: '10%', right: '5%' };
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', margin: '40px 0' }}>

      {/* --- CONFIGURACIÓN DE PLANTILLA DE CERTIFICADO --- */}
      <div className="glass-panel" style={{ padding: '24px 30px' }}>
        <div 
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setIsConfigExpanded(!isConfigExpanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Settings size={32} style={{ color: 'hsla(var(--primary), 1)' }} />
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Configuración del Diseño de Certificado
                {templateConfig.useCustom && (
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255, 102, 0, 0.1)', color: '#ff6600', padding: '2px 8px', borderRadius: '0px', border: '1px solid rgba(255, 102, 0, 0.2)' }}>
                    Plantilla Personalizada Activa
                  </span>
                )}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Elige entre el tema original UniCert Neón o sube un fondo personalizado diseñado en Canva.
              </p>
            </div>
          </div>
          <button className="btn-secondary" style={{ padding: '6px', cursor: 'pointer', border: 'none', background: 'none' }} type="button">
            {isConfigExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {isConfigExpanded && (
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px', borderTop: '1px solid var(--border-glass)', paddingTop: '24px' }}>
            
            {/* TIPO DE PLANTILLA */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                type="button"
                className={!templateConfig.useCustom ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, padding: '12px', textAlign: 'center' }}
                onClick={() => setTemplateConfig(prev => ({ ...prev, useCustom: false }))}
              >
                Tema Neón UniCert (Por Defecto)
              </button>
              <button 
                type="button"
                className={templateConfig.useCustom ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, padding: '12px', textAlign: 'center' }}
                onClick={() => setTemplateConfig(prev => ({ ...prev, useCustom: true }))}
              >
                Plantilla Personalizada (Canva / Imagen)
              </button>
            </div>

            {templateConfig.useCustom && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                
                {/* COLUMNA IZQUIERDA: CARGA Y PREVENTAS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Cargar Fondo de Certificado (Resolución recomendada: 3508 x 2480 px)
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleTemplateImageUpload}
                        style={{ display: 'none' }}
                        id="template-image-input"
                      />
                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={() => document.getElementById('template-image-input').click()}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <Image size={18} /> Subir Imagen
                      </button>
                      
                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={loadDemoTemplate}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(255, 102, 0, 0.1)', borderColor: 'rgba(255, 102, 0, 0.3)' }}
                      >
                        <Sparkles size={18} /> Usar Demo (AIS)
                      </button>
                    </div>
                  </div>

                  {templateConfig.image ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Previsualización en Tiempo Real:
                      </p>
                      
                      {/* CONTENEDOR DEL CERTIFICADO CON ASPECT RATIO DE A4 LANDSCAPE (1.414:1) */}
                      <div style={{ 
                        position: 'relative', 
                        width: '100%', 
                        paddingBottom: '70.7%', // Aspect ratio 297:210 (A4)
                        background: '#000000',
                        backgroundImage: `url(${templateConfig.image})`,
                        backgroundSize: '100% 100%',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                        overflow: 'hidden',
                        userSelect: 'none',
                        containerType: 'inline-size'
                      }}>
                        {/* 1. TÍTULO DIBUJADO (OPCIONAL) */}
                        {templateConfig.showTitle !== false && templateConfig.titleText && (
                          <div style={{
                            position: 'absolute',
                            top: `${(templateConfig.titleY / 210) * 100}%`,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '80%',
                            textAlign: 'center',
                            color: templateConfig.textColor === 'dark' ? '#0f172a' : '#ffffff',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 'bold',
                            fontSize: `calc(${(templateConfig.titleSize || 24)} * 0.1188cqw)`,
                            lineHeight: '1.2',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                          }}>
                            {templateConfig.titleText.toUpperCase()}
                            <div style={{
                              width: '35%',
                              height: '1px',
                              background: templateConfig.textColor === 'dark' ? '#0f172a' : '#ffffff',
                              marginTop: '4px'
                            }}></div>
                          </div>
                        )}

                        {/* 2. NOMBRE DEL RECIPIENTE */}
                        <div style={{
                          position: 'absolute',
                          top: `${(templateConfig.nameY / 210) * 100}%`,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '90%',
                          textAlign: 'center',
                          color: templateConfig.textColor === 'dark' ? '#0f172a' : '#ffffff',
                          fontFamily: templateConfig.nameFont === 'JetBrainsMono' ? "'JetBrains Mono', monospace" : templateConfig.nameFont === 'Times' ? "Times New Roman, Georgia, serif" : templateConfig.nameFont === 'Courier' ? "Courier New, Courier, monospace" : "Helvetica, Arial, sans-serif",
                          fontWeight: (templateConfig.nameStyle === 'Bold' || templateConfig.nameStyle === 'BoldItalic') ? 'bold' : 'normal',
                          fontStyle: (templateConfig.nameStyle === 'Italic' || templateConfig.nameStyle === 'BoldItalic') ? 'italic' : 'normal',
                          fontSize: `calc(${(templateConfig.nameSize || 36)} * 0.1188cqw)`,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {formData.recipientName.trim() || 'JUAN PRADO (ALUMNO)'}
                        </div>

                        {/* 3. TEXTO DE ACREDITACIÓN (WORDING) */}
                        <div style={{
                          position: 'absolute',
                          top: `${(templateConfig.wordingY / 210) * 100}%`,
                          left: '10%',
                          width: '80%',
                          textAlign: 'center',
                          color: templateConfig.textColor === 'dark' ? '#334155' : '#f1f5f9',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 'calc(11 * 0.1188cqw)',
                          lineHeight: '1.4'
                        }}>
                          {templateConfig.customWording
                            .replace(/{EVENT}/g, formData.eventName ? `"${formData.eventName}"` : '"CONVERSATORIO BLOCKCHAIN DAY UNERG"')
                            .replace(/{DATE}/g, formData.issueDate ? new Date(formData.issueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '6 de junio de 2026')
                            .replace(/{NAME}/g, formData.recipientName || 'Juan Prado')
                          }
                        </div>

                        {/* 4. CÓDIGO QR MÁS GRANDE Y COLORIDO */}
                        {templateConfig.qrPosition !== 'hidden' && (
                          <div style={{
                            position: 'absolute',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '13%', // De 10% a 13% para verse más grande
                            ...qrCssPosition
                          }}>
                            <div style={{
                              width: '100%',
                              aspectRatio: '1',
                              background: templateConfig.textColor === 'dark' ? '#ffffff' : '#05070f', // Fondo a tono
                              padding: '5%',
                              borderRadius: '4px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%', fill: templateConfig.textColor === 'dark' ? '#0f172a' : '#d946ef' }}>
                                <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 15h6v6H3v-6zm2 2v2h2v-2H5zm10 0h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v-2h-2v2zm4-4h2v2h-2v-2zm-2-2h2v2h-2v-2zm-4 0h2v2h-2v-2zm6-2h2v2h-2V9zm-2 4h2v-2h-2v2zm-4-4h2v2h-2V9zm2-2h2v2h-2V7z"/>
                              </svg>
                            </div>
                            <span style={{ 
                              fontSize: 'calc(6.5 * 0.1188cqw)', 
                              fontWeight: 'bold', 
                              color: templateConfig.textColor === 'dark' ? '#475569' : '#cbd5e1', 
                              marginTop: '3px', 
                              fontFamily: "'JetBrains Mono', monospace",
                              textTransform: 'uppercase', 
                              letterSpacing: '0.05em', 
                              whiteSpace: 'nowrap',
                              textAlign: 'center'
                            }}>
                              VERIFICACIÓN BLOCKCHAIN
                            </span>
                          </div>
                        )}

                        {/* 5. METADATOS PIE DE PÁGINA (Más grandes, más arriba y en JetBrains Mono) */}
                        <div style={{
                          position: 'absolute',
                          bottom: '6.5%', // Más separado del fondo (de 3% a 6.5%)
                          left: '5%',
                          color: templateConfig.textColor === 'dark' ? '#475569' : '#e2e8f0', // Más claro y contrastante
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 'calc(7.5 * 0.1188cqw)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1px',
                          pointerEvents: 'none',
                          textAlign: 'left'
                        }}>
                          <span>ID DE CERTIFICADO: UC-257333</span>
                          <span>HASH DE TX: 0x31cfa055f581b0acedbe56a30a919a2aba1bb5d7...</span>
                        </div>

                        <div style={{
                          position: 'absolute',
                          bottom: '6.5%', // Más separado del fondo (de 3% a 6.5%)
                          right: '5%',
                          color: templateConfig.textColor === 'dark' ? '#475569' : '#e2e8f0', // Más claro y contrastante
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 'calc(7.5 * 0.1188cqw)', // Más grande (de 3.5px a 4.2px)
                          pointerEvents: 'none',
                          textAlign: 'right',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1px'
                        }}>
                          <span>EMISOR: {window.location.host || 'localhost:5173'}</span>
                          <span>OTORGADO EL: {(() => {
                            let dateObj = new Date();
                            if (formData.issueDate) {
                              const parts = formData.issueDate.split('-');
                              if (parts.length === 3) {
                                const y = Number(parts[0]);
                                const m = Number(parts[1]);
                                const d = Number(parts[2]);
                                if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
                                  dateObj = new Date(y, m - 1, d);
                                }
                              }
                            }
                            const day = String(dateObj.getDate()).padStart(2, '0');
                            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                            const year = dateObj.getFullYear();
                            const now = new Date();
                            const hours = String(now.getHours()).padStart(2, '0');
                            const minutes = String(now.getMinutes()).padStart(2, '0');
                            return `${day}/${month}/${year} ${hours}:${minutes}`;
                          })()}</span>
                        </div>

                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button 
                          type="button" 
                          className="btn-secondary" 
                          onClick={() => setTemplateConfig(prev => ({ ...prev, image: '' }))}
                          style={{ padding: '6px 14px', fontSize: '0.75rem', color: '#f87171' }}
                        >
                          Remover Imagen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ border: '2px dashed var(--border-glass)', borderRadius: '12px', padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No se ha cargado ninguna imagen de fondo. Sube tu diseño o carga el diseño de prueba de AIS.
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Texto de Acreditación (Wording)
                    </label>
                    <textarea 
                      className="custom-input"
                      rows={3}
                      value={templateConfig.customWording}
                      onChange={(e) => setTemplateConfig(prev => ({ ...prev, customWording: e.target.value }))}
                      placeholder="Usa {EVENT} y {DATE} para datos dinámicos..."
                      style={{ fontFamily: 'inherit', fontSize: '0.85rem', resize: 'vertical' }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Etiquetas: <strong>{"{EVENT}"}</strong> (nombre del evento) y <strong>{"{DATE}"}</strong> (fecha formateada).
                    </span>
                  </div>
                </div>

                {/* COLUMNA DERECHA: CONFIGURACIÓN VISUAL */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* COLOR Y TIPOGRAFÍA */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Color de Texto Dinámico
                      </label>
                      <select 
                        className="custom-input"
                        value={templateConfig.textColor}
                        onChange={(e) => setTemplateConfig(prev => ({ ...prev, textColor: e.target.value }))}
                      >
                        <option value="dark">Oscuro (Fondo claro)</option>
                        <option value="light">Claro (Fondo oscuro)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Posición del Código QR
                      </label>
                      <select 
                        className="custom-input"
                        value={templateConfig.qrPosition}
                        onChange={(e) => setTemplateConfig(prev => ({ ...prev, qrPosition: e.target.value }))}
                      >
                        <option value="bottom-center">Abajo Centro</option>
                        <option value="bottom-right">Abajo Derecha</option>
                        <option value="bottom-left">Abajo Izquierda</option>
                        <option value="top-right">Arriba Derecha</option>
                        <option value="hidden">Ocultar código QR</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Fuente de Nombre
                      </label>
                      <select 
                        className="custom-input"
                        value={templateConfig.nameFont}
                        onChange={(e) => setTemplateConfig(prev => ({ ...prev, nameFont: e.target.value }))}
                      >
                        <option value="JetBrainsMono">JetBrains Mono (Sleek Monospace)</option>
                        <option value="Times">Times New Roman (Serif)</option>
                        <option value="Helvetica">Helvetica (Sans-Serif)</option>
                        <option value="Courier">Courier (Monospace)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Estilo de Nombre
                      </label>
                      <select 
                        className="custom-input"
                        value={templateConfig.nameStyle}
                        onChange={(e) => setTemplateConfig(prev => ({ ...prev, nameStyle: e.target.value }))}
                      >
                        <option value="BoldItalic">Negrita Itálica</option>
                        <option value="Bold">Negrita</option>
                        <option value="Italic">Itálica</option>
                        <option value="Normal">Normal</option>
                      </select>
                    </div>
                  </div>

                  {/* POSICIÓN Y DEL NOMBRE */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Posición Vertical Nombre (Y)
                      </label>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        {templateConfig.nameY || 95} mm
                      </span>
                    </div>
                    <input 
                      type="range"
                      min="50"
                      max="180"
                      value={templateConfig.nameY || 95}
                      onChange={(e) => setTemplateConfig(prev => ({ ...prev, nameY: parseInt(e.target.value) }))}
                      style={{ width: '100%', accentColor: 'hsla(var(--primary), 1)' }}
                    />
                  </div>

                  {/* TAMAÑO DE FUENTE NOMBRE */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Tamaño de Letra Nombre
                      </label>
                      <span style={{ fontSize: '0.85rem', color: 'hsla(var(--primary), 1)', fontFamily: 'monospace' }}>
                        {templateConfig.nameSize || 36} pt
                      </span>
                    </div>
                    <input 
                      type="range"
                      min="18"
                      max="100"
                      value={templateConfig.nameSize || 36}
                      onChange={(e) => setTemplateConfig(prev => ({ ...prev, nameSize: parseInt(e.target.value) }))}
                      style={{ width: '100%', accentColor: 'hsla(var(--primary), 1)' }}
                    />
                  </div>

                  {/* POSICIÓN Y DEL TEXTO DE ACREDITACIÓN */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Posición Vertical Texto (Y)
                      </label>
                      <span style={{ fontSize: '0.85rem', color: 'hsla(var(--secondary), 1)', fontFamily: 'monospace' }}>
                        {templateConfig.wordingY || 120} mm
                      </span>
                    </div>
                    <input 
                      type="range"
                      min="60"
                      max="190"
                      value={templateConfig.wordingY || 120}
                      onChange={(e) => setTemplateConfig(prev => ({ ...prev, wordingY: parseInt(e.target.value) }))}
                      style={{ width: '100%', accentColor: 'hsla(var(--secondary), 1)' }}
                    />
                  </div>

                  {/* CONFIGURACIÓN DEL TÍTULO DIBUJADO */}
                  <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <input 
                        type="checkbox" 
                        id="show-title-checkbox"
                        checked={templateConfig.showTitle !== false}
                        onChange={(e) => setTemplateConfig(prev => ({ ...prev, showTitle: e.target.checked }))}
                        style={{ width: '18px', height: '18px', accentColor: 'hsla(var(--primary), 1)', cursor: 'pointer' }}
                      />
                      <label htmlFor="show-title-checkbox" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                        Dibujar título del certificado en el PDF
                      </label>
                    </div>

                    {templateConfig.showTitle !== false && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '26px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Texto del Título
                          </label>
                          <input 
                            type="text"
                            className="custom-input"
                            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                            value={templateConfig.titleText || ''}
                            onChange={(e) => setTemplateConfig(prev => ({ ...prev, titleText: e.target.value }))}
                            placeholder="Ej: CERTIFICADO DE RECONOCIMIENTO"
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                Altura Título (Y)
                              </label>
                              <span style={{ fontSize: '0.75rem', color: 'hsla(var(--primary), 1)', fontFamily: 'monospace' }}>
                                {templateConfig.titleY || 38} mm
                              </span>
                            </div>
                            <input 
                              type="range"
                              min="20"
                              max="80"
                              value={templateConfig.titleY || 38}
                              onChange={(e) => setTemplateConfig(prev => ({ ...prev, titleY: parseInt(e.target.value) }))}
                              style={{ width: '100%', accentColor: 'hsla(var(--primary), 1)' }}
                            />
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                Tamaño de Letra
                              </label>
                              <span style={{ fontSize: '0.75rem', color: 'hsla(var(--secondary), 1)', fontFamily: 'monospace' }}>
                                {templateConfig.titleSize || 24} pt
                              </span>
                            </div>
                            <input 
                              type="range"
                              min="14"
                              max="36"
                              value={templateConfig.titleSize || 24}
                              onChange={(e) => setTemplateConfig(prev => ({ ...prev, titleSize: parseInt(e.target.value) }))}
                              style={{ width: '100%', accentColor: 'hsla(var(--secondary), 1)' }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

          </div>
        )}
      </div>

      {/* --- EMISIÓN INDIVIDUAL --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '30px' }}>
        <div className="glass-panel" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <ShieldCheck size={32} style={{ color: 'hsla(var(--primary), 1)' }} />
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Emitir Certificado</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Registra un nuevo asistente en el libro inmutable.
              </p>
            </div>
          </div>

          <form onSubmit={handleEmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Dirección del Smart Contract
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  className="custom-input"
                  placeholder="Ej: 0x71C...897a (Dejar vacío para MODO DEMO)"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}
                />
              </div>
              {isDemo ? (
                <span style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '6px', display: 'block' }}>
                  ⚠️ Ejecutando en <strong>MODO DEMO SIMULADO</strong>. Los certificados se guardan en el navegador.
                </span>
              ) : (
                <span style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '6px', display: 'block' }}>
                  🟢 Ejecutando en <strong>RED REAL POLYGON AMOY</strong>. Requiere firma de MetaMask.
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                ID de Certificado Único
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  name="id"
                  className="custom-input"
                  placeholder="Ej: UC-459203"
                  value={formData.id}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={generateRandomId}
                  style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  title="Generar ID aleatorio"
                >
                  <Key size={16} /> Auto
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Nombre del Alumno (Destinatario)
              </label>
              <input
                type="text"
                name="recipientName"
                className="custom-input"
                placeholder="Ej: Juan Pérez Martínez"
                value={formData.recipientName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Nombre del Foro o Evento
              </label>
              <input
                type="text"
                name="eventName"
                className="custom-input"
                placeholder="Ej: I Foro de Innovación Tecnológica Universitaria"
                value={formData.eventName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Fecha del Evento
              </label>
              <input
                type="date"
                name="issueDate"
                className="custom-input"
                value={formData.issueDate}
                onChange={handleInputChange}
                required
              />
            </div>

            {errorMsg && (
              <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', color: '#f87171', fontSize: '0.875rem' }}>
                <strong>Error:</strong> {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', color: '#34d399', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <CheckCircle size={18} /> <span>{successMsg}</span>
                </div>
                {txHash && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflowWrap: 'anywhere' }}>
                    Tx Hash: {isDemo ? (
                      <span style={{ fontFamily: 'monospace' }}>{txHash}</span>
                    ) : (
                      <a
                        href={`https://amoy.polygonscan.com/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'hsla(var(--secondary), 1)', textDecoration: 'underline' }}
                      >
                        {txHash}
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '10px' }}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  <span>Procesando en Blockchain...</span>
                </>
              ) : (
                <>
                  <Plus size={20} />
                  <span>Emitir Certificado y Descargar PDF</span>
                </>
              )}
            </button>
          </form>

          {!isDemo && (
            <EmergencyControls contractAddress={contractAddress} />
          )}
        </div>

        <div className="glass-panel" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Award size={32} style={{ color: 'hsla(var(--secondary), 1)' }} />
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Certificados Emitidos</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Historial de credenciales emitidas en esta sesión o simulador.
              </p>
            </div>
          </div>

          {issuedHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p>No se han emitido certificados todavía.</p>
              <p style={{ fontSize: '0.85rem' }}>Utiliza el formulario de la izquierda o la carga por Excel para emitir.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '530px', overflowY: 'auto', paddingRight: '6px' }}>
              {issuedHistory.map((cert) => (
                <div
                  key={cert.id}
                  className="glass-panel"
                  style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'hsla(var(--secondary), 1)' }}>{cert.id}</span>
                      <span style={{
                        fontSize: '0.7rem',
                        background: cert.isRealBlockchain ? 'rgba(52, 211, 153, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                        color: cert.isRealBlockchain ? '#34d399' : '#c084fc',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        border: cert.isRealBlockchain ? '1px solid rgba(52, 211, 153, 0.2)' : '1px solid rgba(139, 92, 246, 0.2)'
                      }}>
                        {cert.isRealBlockchain ? 'Red Real' : 'Demo Local'}
                      </span>
                    </div>
                    <h4 style={{ fontWeight: 600, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cert.recipientName}
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cert.eventName}
                    </p>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      Emitido: {new Date(cert.issueDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={() => handleDownloadPDF(cert)}
                      className="btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      title="Descargar PDF"
                    >
                      <Download size={14} /> PDF
                    </button>
                    <a
                      href={`/?id=${cert.id}`}
                      className="btn-primary"
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        textAlign: 'center',
                        textDecoration: 'none',
                        boxShadow: 'none',
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
                        border: '1px solid rgba(139, 92, 246, 0.3)'
                      }}
                    >
                      Verificar
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- EMISIÓN POR LOTES (EXCEL) --- */}
      <div className="glass-panel" style={{ padding: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <FileSpreadsheet size={32} style={{ color: 'hsla(var(--primary), 1)' }} />
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Carga Masiva por Excel</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Sube un archivo Excel con los datos de los estudiantes para emitir todos los certificados de una sola vez. Cada estudiante será un NFT único (soulbound) en la blockchain.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <div
              style={{
                border: '2px dashed rgba(139, 92, 246, 0.3)',
                borderRadius: '16px',
                padding: '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                background: 'rgba(139, 92, 246, 0.03)'
              }}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.8)'; }}
              onDragLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)'; }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                const file = e.dataTransfer.files[0];
                if (file) {
                  const input = document.getElementById('excel-upload');
                  const dt = new DataTransfer();
                  dt.items.add(file);
                  input.files = dt.files;
                  handleFileUpload({ target: { files: dt.files } });
                }
              }}
              onClick={() => document.getElementById('excel-upload').click()}
            >
              <Upload size={48} style={{ color: 'hsla(var(--primary), 0.5)', margin: '0 auto 16px' }} />
              <p style={{ fontWeight: 600, marginBottom: '8px' }}>
                {batchStudents.length > 0
                  ? `${batchStudents.length} estudiantes cargados`
                  : 'Haz clic o arrastra un archivo Excel aquí'}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Formatos aceptados: .xlsx, .xls
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Columnas esperadas: <strong>nombre</strong> (obligatorio), <strong>documento</strong> (opcional, se usa como ID), <strong>evento</strong> (opcional), <strong>fecha</strong> (opcional)
              </p>
              <input
                id="excel-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>

            {batchStudents.length > 0 && (
              <div style={{ marginTop: '16px', maxHeight: '200px', overflowY: 'auto' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Vista previa ({batchStudents.length} estudiantes):
                </p>
                {batchStudents.slice(0, 50).map((s, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: '12px' }}>
                    <span style={{ color: 'hsla(var(--secondary), 0.7)', fontFamily: 'monospace', minWidth: '100px' }}>{s.id}</span>
                    <span style={{ color: 'var(--text-primary)' }}>{s.recipientName}</span>
                  </div>
                ))}
                {batchStudents.length > 50 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    ... y {batchStudents.length - 50} más
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Nombre del Evento (para todos los certificados)
                </label>
                <input
                  type="text"
                  className="custom-input"
                  placeholder="Ej: I Foro de Innovación Tecnológica Universitaria"
                  value={batchEventName}
                  onChange={(e) => setBatchEventName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Fecha del Evento
                </label>
                <input
                  type="date"
                  className="custom-input"
                  value={batchIssueDate}
                  onChange={(e) => setBatchIssueDate(e.target.value)}
                />
              </div>

              {batchErrorMsg && (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', color: '#f87171', fontSize: '0.875rem' }}>
                  <strong>Error:</strong> {batchErrorMsg}
                </div>
              )}

              {batchSuccessMsg && (
                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', color: '#34d399', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={18} /> <span>{batchSuccessMsg}</span>
                  </div>
                </div>
              )}

              {isBatchLoading && batchProgress > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Generando PDFs...</span>
                    <span style={{ color: '#ffffff' }}>{batchProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#000000', border: '2px solid #ffffff', overflow: 'hidden', borderRadius: '0px' }}>
                    <div style={{ width: `${batchProgress}%`, height: '100%', background: '#ff6600', transition: 'width 0.3s', borderRadius: '0px' }}></div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={handleBatchMint}
                  className="btn-primary"
                  disabled={isBatchLoading || batchStudents.length === 0}
                  style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                >
                  {isBatchLoading ? (
                    <>
                      <Loader size={20} className="spinner" />
                      <span>{batchProgress > 0 ? 'Generando PDFs...' : 'Minteando en Blockchain...'}</span>
                    </>
                  ) : (
                    <>
                      <FileDown size={20} />
                      <span>Mintear {batchStudents.length > 0 ? `${batchStudents.length} ` : ''}Tokens y Descargar PDFs</span>
                    </>
                  )}
                </button>
                <button
                  onClick={clearBatch}
                  className="btn-secondary"
                  disabled={isBatchLoading}
                  style={{ padding: '0 20px' }}
                >
                  Limpiar
                </button>
              </div>

              {batchStudents.length > 0 && (
                <div style={{ padding: '12px', background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.15)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <p>Se emitirán <strong style={{ color: '#34d399' }}>{batchStudents.length} certificados</strong> como NFTs soulbound (no transferibles).</p>
                  <p style={{ marginTop: '4px' }}>Al hacer clic en "Mintear", se ejecutará una transacción batch en la blockchain y luego se descargarán todos los PDFs en un archivo ZIP.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function EmergencyControls({ contractAddress }) {
  const [paused, setPaused] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkPaused();
  }, [contractAddress]);

  const checkPaused = async () => {
    try {
      const provider = new ethers.JsonRpcProvider('https://polygon-amoy-bor-rpc.publicnode.com');
      const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
      const isPaused = await contract.paused();
      setPaused(isPaused);
    } catch {
      setPaused(null);
    }
  };

  const togglePause = async () => {
    if (!window.ethereum) return alert('Conecta MetaMask primero');
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
      const tx = paused ? await contract.unpause() : await contract.pause();
      await tx.wait();
      await checkPaused();
    } catch (err) {
      alert('Error: ' + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (paused === null) return null;

  return (
    <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', background: paused ? 'rgba(239,68,68,0.08)' : 'rgba(52,211,153,0.08)', border: `1px solid rgba(${paused ? '239,68,68' : '52,211,153'},0.2)` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {paused ? <PauseCircle size={18} style={{ color: '#f87171' }} /> : <PlayCircle size={18} style={{ color: '#34d399' }} />}
            {paused ? 'Contrato Pausado' : 'Contrato Activo'}
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {paused ? 'No se pueden emitir ni revocar certificados.' : 'Funcionando con normalidad.'}
          </p>
        </div>
        <button onClick={togglePause} disabled={loading} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
          {loading ? <span className="spinner"></span> : paused ? 'Reanudar' : 'Pausar Emergencia'}
        </button>
      </div>
    </div>
  );
}
