import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, BadgeCheck, Download, ExternalLink, Calendar, User, BookOpen, Fingerprint } from 'lucide-react';
import { getCertificateData } from '../utils/blockchain';
import { generateCertificatePDF } from '../utils/pdfGenerator';
import confetti from 'canvas-confetti';

export default function VerificationPortal({ contractAddress }) {
  const [searchId, setSearchId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [certData, setCertData] = useState(null);
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

    try {
      const result = await getCertificateData(id, contractAddress);
      
      setCertData(result);
      
      // Lanzar confeti de celebración por la autenticidad exitosa
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || 'El certificado no pudo ser verificado. Asegúrate de ingresar un ID válido o configurar el contrato correcto.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!certData) return;
    await generateCertificatePDF({
      id: certData.id,
      recipientName: certData.recipientName,
      eventName: certData.eventName,
      issueDate: certData.issueDate,
      transactionHash: certData.transactionHash
    });
  };

  const isDemo = !certData?.isRealBlockchain;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Sección de Búsqueda */}
      <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
          Portal de Verificación <span className="glow-text-cyan">Blockchain</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
          Valida la autenticidad e integridad de cualquier certificado universitario de forma instantánea.
        </p>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="custom-input"
              placeholder="Ingresa el ID del certificado (Ej: UC-459203)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              style={{ paddingLeft: '45px' }}
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
            {isLoading ? <span className="spinner"></span> : 'Verificar'}
          </button>
        </form>

        {errorMsg && (
          <div 
            style={{ 
              marginTop: '20px', 
              padding: '16px', 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              borderRadius: '12px', 
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontSize: '0.9rem'
            }}
          >
            <ShieldAlert size={20} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Pantalla de Carga Simulada */}
      {isLoading && (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <span className="spinner" style={{ width: '48px', height: '48px', marginBottom: '20px' }}></span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Consultando Libro de la Blockchain...</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '6px' }}>
            Extrayendo datos inmutables y validando firmas criptográficas...
          </p>
        </div>
      )}

      {/* Visualización del Certificado Exitoso */}
      {certData && (
        <div className="certificate-preview-card">
          {/* Badge de Estado Criptográfico */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '30px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="badge-verified" style={{ alignSelf: 'flex-start' }}>
                <BadgeCheck size={18} />
                <span>CERTIFICADO VERIFICADO</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: isDemo ? '#fbbf24' : '#34d399', marginTop: '4px' }}>
                {isDemo 
                  ? '🔒 Validado criptográficamente en el simulador local.' 
                  : '⛓️ Validado en Smart Contract inmutable de Polygon.'
                }
              </span>
            </div>
            
            <button 
              onClick={handleDownloadPDF} 
              className="btn-primary" 
              style={{ 
                background: 'rgba(255,255,255,0.06)', 
                color: 'white', 
                border: '1px solid rgba(255,255,255,0.1)', 
                boxShadow: 'none',
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
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'hsla(var(--secondary), 1)' }}>
                {certData.id}
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <User size={24} style={{ color: 'hsla(var(--primary), 1)' }} />
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block' }}>Nombre del Alumno</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{certData.recipientName}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <BookOpen size={24} style={{ color: 'hsla(var(--primary), 1)' }} />
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block' }}>Evento / Foro Académico</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>"{certData.eventName}"</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Calendar size={24} style={{ color: 'hsla(var(--primary), 1)' }} />
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
              background: 'rgba(255, 255, 255, 0.02)', 
              border: '1px solid rgba(255, 255, 255, 0.04)', 
              borderRadius: '12px', 
              padding: '20px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              fontFamily: 'monospace',
              fontSize: '0.8rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsla(var(--secondary), 1)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', marginBottom: '4px' }}>
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
                    style={{ color: 'hsla(var(--secondary), 1)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>{certData.transactionHash}</span> <ExternalLink size={12} />
                  </a>
                )}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Estado del Registro en Blockchain:</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>ACTIVO / CONFIRMADO (1 Bloque)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
