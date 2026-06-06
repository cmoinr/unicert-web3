import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Plus, CheckCircle, Award, Calendar, Key, Download, Upload, PauseCircle, PlayCircle, FileSpreadsheet, Loader, FileDown } from 'lucide-react';
import { issueCertificateData, batchIssueCertificatesData, CONTRACT_ABI } from '../utils/blockchain';
import { ethers } from 'ethers';
import { generateCertificatePDF } from '../utils/pdfGenerator';
import confetti from 'canvas-confetti';
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
        issueDate: new Date(formData.issueDate).getTime()
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

        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

        await generateCertificatePDF({
          id: dataToSubmit.id,
          recipientName: dataToSubmit.recipientName,
          eventName: dataToSubmit.eventName,
          issueDate: dataToSubmit.issueDate,
          transactionHash: result.transactionHash
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
      transactionHash: cert.transactionHash
    });
  };

  // --- MANEJO DE ARCHIVO EXCEL ---
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBatchErrorMsg('');
    setBatchSuccessMsg('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

        if (jsonData.length === 0) {
          setBatchErrorMsg('El archivo Excel está vacío o no tiene datos válidos.');
          return;
        }

        const students = jsonData.map((row, index) => {
          const name = row['nombre'] || row['Nombre'] || row['NOMBRE'] || row['name'] || row['Name'] || row['alumno'] || row['Alumno'] || '';
          const docId = row['documento'] || row['Documento'] || row['DOCUMENTO'] || row['id'] || row['ID'] || row['Id'] || '';
          const event = row['evento'] || row['Evento'] || row['EVENTO'] || row['event'] || row['Event'] || '';
          const dateRaw = row['fecha'] || row['Fecha'] || row['FECHA'] || row['date'] || row['Date'] || '';

          const certId = docId ? `UC-${docId}` : `UC-${String(index + 1).padStart(6, '0')}`;

          let parsedDate = new Date().getTime();
          if (dateRaw) {
            const d = new Date(dateRaw);
            if (!isNaN(d.getTime())) parsedDate = d.getTime();
          }

          return {
            id: certId,
            recipientName: String(name).trim(),
            eventName: String(event).trim(),
            issueDate: parsedDate
          };
        }).filter(s => s.recipientName.length > 0);

        if (students.length === 0) {
          setBatchErrorMsg('No se encontraron nombres de estudiantes en el archivo. Asegúrate de que las columnas se llamen "nombre", "Nombre" o "name".');
          return;
        }

        setBatchStudents(students);

        if (students[0].eventName) {
          setBatchEventName(students[0].eventName);
        }
      } catch (err) {
        console.error(err);
        setBatchErrorMsg('Error al leer el archivo Excel. Verifica que sea un archivo .xlsx o .xls válido.');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

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
        issueDate: new Date(batchIssueDate).getTime()
      }));

      const result = await batchIssueCertificatesData(certificates, contractAddress);

      if (result.success) {
        setBatchSuccessMsg(
          `¡${certificates.length} certificados emitidos exitosamente en la Blockchain!`
        );

        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.5 }
        });

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
          transactionHash: cert.transactionHash
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', margin: '40px 0' }}>

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
                    <span style={{ color: 'hsla(var(--secondary), 1)' }}>{batchProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${batchProgress}%`, height: '100%', background: 'linear-gradient(90deg, hsla(var(--primary), 1), hsla(var(--secondary), 1))', borderRadius: '4px', transition: 'width 0.3s' }}></div>
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
