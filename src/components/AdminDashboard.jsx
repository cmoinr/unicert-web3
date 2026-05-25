import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, CheckCircle, Award, Calendar, RefreshCw, Key, Download, PauseCircle, PlayCircle } from 'lucide-react';
import { issueCertificateData, CONTRACT_ABI } from '../utils/blockchain';
import { ethers } from 'ethers';
import { generateCertificatePDF } from '../utils/pdfGenerator';
import confetti from 'canvas-confetti';

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

  // Cargar historial local al iniciar
  useEffect(() => {
    const data = localStorage.getItem('blockchain_simulated_certificates');
    if (data) {
      const parsed = JSON.parse(data);
      setIssuedHistory(Object.values(parsed).reverse());
    }
  }, [successMsg]);

  // Generar un ID único aleatorio
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
        
        // Lanzar confeti de celebración
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

        // Generar PDF inmediatamente
        await generateCertificatePDF({
          id: dataToSubmit.id,
          recipientName: dataToSubmit.recipientName,
          eventName: dataToSubmit.eventName,
          issueDate: dataToSubmit.issueDate,
          transactionHash: result.transactionHash
        });

        // Limpiar formulario y regenerar ID
        setFormData({
          id: '',
          recipientName: '',
          eventName: formData.eventName, // Conservar el nombre del evento para rapidez
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

  // Descarga manual desde el historial
  const handleDownloadPDF = async (cert) => {
    await generateCertificatePDF({
      id: cert.id,
      recipientName: cert.recipientName,
      eventName: cert.eventName,
      issueDate: cert.issueDate,
      transactionHash: cert.transactionHash
    });
  };

  const isDemo = !contractAddress || contractAddress.trim() === '' || contractAddress === '0x0000000000000000000000000000000000000000';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '30px', margin: '40px 0' }}>
      
      {/* Columna Izquierda: Formulario de Emisión */}
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
              Dirección del Smart Contract (Polygon Amoy)
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

      {/* Columna Derecha: Historial y Auditoría del Evento */}
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
            <p style={{ fontSize: '0.85rem' }}>Utiliza el formulario de la izquierda para emitir el primero.</p>
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
