import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, BadgeCheck, Download, ExternalLink, Calendar, User, BookOpen, Fingerprint } from 'lucide-react';
import { getCertificatesByCedula } from '../utils/blockchain';
import { generateCertificatePDF } from '../utils/pdfGenerator';

export default function VerificationPortal({ contractAddress }) {
  const [searchId, setSearchId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [certData, setCertData] = useState(null);
  const [certificatesList, setCertificatesList] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-verificar si hay un ID en la URL de la página (?id=XYZ)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');
    if (idParam) {
      setSearchId(idParam);
      verifyCertificate(idParam);
    }
  }, [contractAddress]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    verifyCertificate(searchId.trim());
  };

  const verifyCertificate = async (id) => {
    setIsLoading(true);
    setErrorMsg('');
    setCertData(null);
    setCertificatesList([]);
    setSelectedIndex(0);

    try {
      const results = await getCertificatesByCedula(id, contractAddress);
      
      setCertificatesList(results);
      setCertData(results[0]);
      
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || 'El certificado no pudo ser verificado. Asegúrate de ingresar un ID o Cédula válidos o configurar el contrato correcto.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!certData) return;

    let templateConfig = null;
    const saved = localStorage.getItem('unicert_custom_template_config');
    if (saved) {
      try {
        templateConfig = JSON.parse(saved);
      } catch (e) {
        console.error('Error loading template config in portal:', e);
      }
    }

    await generateCertificatePDF({
      id: certData.id,
      recipientName: certData.recipientName,
      eventName: certData.eventName,
      issueDate: certData.issueDate,
      issuanceDate: certData.issuanceDate,
      transactionHash: certData.transactionHash,
      templateConfig
    });
  };


  const isDemo = !certData?.isRealBlockchain;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Sección de Búsqueda */}
      <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
          Portal de Verificación <span style={{ color: '#ff6600' }}>Blockchain</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
          Valida la autenticidad e integridad de tu certificado.
        </p>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="custom-input"
              placeholder="Cédula o ID del certificado"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              style={{ paddingLeft: '45px', borderRadius: '0px' }}
              disabled={isLoading}
            />
            <Search 
              size={20} 
              style={{ 
                position: 'absolute', 
                left: '16px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-muted)' 
              }} 
            />
          </div>
          <button type="submit" className="btn-primary" disabled={isLoading} style={{ minWidth: '120px' }}>
            {isLoading ? <span className="spinner"></span> : 'Buscar'}
          </button>
        </form>

        {errorMsg && (
          <div 
            style={{ 
              marginTop: '20px', 
              padding: '16px', 
              background: '#000000', 
              border: '2px solid #ff3333', 
              borderRadius: '0px', 
              color: '#ff3333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontSize: '0.9rem',
              boxShadow: '4px 4px 0px #ff3333'
            }}
          >
            <ShieldAlert size={20} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Pantalla de Carga Simulada */}
      {isLoading && (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', border: '2px solid #ffffff', borderRadius: '0px', boxShadow: '5px 5px 0px #ff6600' }}>
          <span className="spinner" style={{ width: '48px', height: '48px', marginBottom: '20px' }}></span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Consultando Libro de la Blockchain...</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '6px' }}>
            Extrayendo datos inmutables y validando firmas criptográficas...
          </p>
        </div>
      )}

      {/* Selector de Certificados Múltiples */}
      {certificatesList.length > 1 && (
        <div className="glass-panel" style={{ padding: '24px 30px', textAlign: 'left', border: '2px solid #ffffff', borderRadius: '0px', boxShadow: '5px 5px 0px #ff6600', background: '#0a0a0a' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ff6600' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '0px', backgroundColor: '#ffffff', display: 'inline-block' }}></span>
            Se encontraron {certificatesList.length} certificados para este estudiante:
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {certificatesList.map((cert, index) => {
              const isSelected = selectedIndex === index;
              return (
                <button
                  key={cert.id}
                  type="button"
                  onClick={() => {
                    setSelectedIndex(index);
                    setCertData(cert);
                  }}
                  className={isSelected ? 'btn-primary' : 'btn-secondary'}
                  style={{
                    textAlign: 'left',
                    padding: '16px',
                    fontSize: '0.875rem',
                    borderRadius: '0px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <span style={{ fontWeight: 700, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.5rem', lineHeight: '1.25rem' }}>
                    {cert.eventName}
                  </span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                    Emitido: {new Date(cert.issueDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Visualización del Certificado Exitoso */}
      {certData && (
        <div className="certificate-preview-card" style={{ border: '2px solid #ffffff', borderRadius: '0px', boxShadow: '6px 6px 0px #ff6600', background: '#0a0a0a', padding: '40px' }}>
          {/* Badge de Estado Criptográfico */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '30px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="badge-verified" style={{ alignSelf: 'flex-start' }}>
                <BadgeCheck size={18} />
                <span>CERTIFICADO VERIFICADO</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: isDemo ? '#ff6600' : '#ffffff', marginTop: '6px', fontWeight: 'bold' }}>
                {isDemo 
                  ? '⚡ Validado criptográficamente en el simulador local.' 
                  : '⛓️ Validado en Smart Contract inmutable de Polygon.'
                }
              </span>
            </div>
            
            <button 
              onClick={handleDownloadPDF} 
              className="btn-primary" 
              style={{ 
                padding: '8px 16px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Download size={16} /> Descargar PDF
            </button>
          </div>

          {/* Información del Diploma */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', tracking: '1px', display: 'block', marginBottom: '4px' }}>
                ID del Certificado
              </span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ff6600' }}>
                {certData.id}
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <User size={24} style={{ color: '#ff6600' }} />
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block' }}>Nombre del Alumno</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{certData.recipientName}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <BookOpen size={24} style={{ color: '#ff6600' }} />
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block' }}>Evento / Foro Académico</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>"{certData.eventName}"</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Calendar size={24} style={{ color: '#ff6600' }} />
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block' }}>Fecha de Emisión</span>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {new Date(certData.issueDate).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Detalles Criptográficos de Blockchain */}
          <div 
            style={{ 
              background: '#000000', 
              border: '2px solid #ffffff', 
              borderRadius: '0px', 
              padding: '20px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              fontSize: '0.8rem',
              boxShadow: '4px 4px 0px #ff6600'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff6600', borderBottom: '2px solid #ffffff', paddingBottom: '8px', marginBottom: '4px' }}>
              <Fingerprint size={16} />
              <span style={{ fontWeight: 700 }}>PRUEBAS CRIPTOGRÁFICAS (BLOCKCHAIN DATA)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Dirección de la Entidad Emisora:</span>
              <span style={{ color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>{certData.issuer}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>ID único de Transacción (Hash):</span>
              <span style={{ color: 'var(--text-primary)', overflowWrap: 'anywhere', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {isDemo ? (
                  <span>{certData.transactionHash}</span>
                ) : (
                  <a 
                    href={`https://amoy.polygonscan.com/tx/${certData.transactionHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#ff6600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
                  >
                    <span>{certData.transactionHash}</span> <ExternalLink size={12} />
                  </a>
                )}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Estado del Registro en Blockchain:</span>
              <span style={{ color: '#ff6600', fontWeight: 700 }}>ACTIVO / CONFIRMADO (1 Bloque)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
