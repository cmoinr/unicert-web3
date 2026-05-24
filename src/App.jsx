import React, { useState, useEffect } from 'react';
import { ShieldCheck, Award, Wallet, Cpu, ExternalLink } from 'lucide-react';
import AdminDashboard from './components/AdminDashboard';
import VerificationPortal from './components/VerificationPortal';
import { ethers } from 'ethers';

export default function App() {
  const [activeTab, setActiveTab] = useState('verify'); // 'verify' o 'admin'
  const [contractAddress, setContractAddress] = useState(
    localStorage.getItem('blockchain_contract_address') || ''
  );
  const [walletAddress, setWalletAddress] = useState('');

  // Guardar dirección del contrato automáticamente
  useEffect(() => {
    localStorage.setItem('blockchain_contract_address', contractAddress);
  }, [contractAddress]);

  // Si hay un ID en la URL al cargar (?id=XYZ), cambiamos a la pestaña de verificación
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('id')) {
      setActiveTab('verify');
    }
  }, []);

  // Verificar conexión de MetaMask al iniciar
  useEffect(() => {
    checkWalletConnection();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress('');
        }
      });
    }
  }, []);

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setWalletAddress(accounts[0].address);
        }
      } catch (err) {
        console.error('Error comprobando wallet connected:', err);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('MetaMask no está instalado. Por favor instálalo para interactuar con la Blockchain real.');
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
      }
    } catch (err) {
      console.error('Error conectando MetaMask:', err);
    }
  };

  const isDemo = !contractAddress || contractAddress.trim() === '' || contractAddress === '0x0000000000000000000000000000000000000000';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER DE LA APLICACIÓN */}
      <header className="glass-panel" style={{ margin: '20px 20px 0', padding: '16px 30px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('verify')}>
          <div style={{ background: 'linear-gradient(135deg, hsla(var(--primary), 1) 0%, hsla(var(--secondary), 1) 100%)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)' }}>
            <Award size={22} style={{ color: 'white' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.5px' }}>
              UniCert <span className="glow-text-purple">Web3</span>
            </h1>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', tracking: '1px', textTransform: 'uppercase', display: 'block', marginTop: '-2px' }}>
              Blockchain Credentials
            </span>
          </div>
        </div>

        {/* NAVEGACIÓN */}
        <nav style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`nav-link ${activeTab === 'verify' ? 'active' : ''}`}
            onClick={() => setActiveTab('verify')}
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem' }}
          >
            Portal de Verificación
          </button>
          <button 
            className={`nav-link ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem' }}
          >
            Panel Administrativo (Universidad)
          </button>
        </nav>

        {/* BOTÓN CONEXIÓN WALLET */}
        <div>
          {walletAddress ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.2)', padding: '8px 16px', borderRadius: '12px', color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
              <Wallet size={16} />
              <span>{walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}</span>
            </div>
          ) : (
            <button className="btn-secondary" onClick={connectWallet} style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet size={16} />
              <span>Conectar MetaMask</span>
            </button>
          )}
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ flex: 1, padding: '20px', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
        
        {/* BANNER DE BIENVENIDA E INSTRUCCIONES */}
        <div className="glass-panel" style={{ padding: '24px 30px', marginBottom: '30px', borderLeft: isDemo ? '4px solid #fbbf24' : '4px solid #34d399', background: 'linear-gradient(90deg, rgba(13,17,30,0.5) 0%, rgba(255,255,255,0.01) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={18} style={{ color: isDemo ? '#fbbf24' : '#34d399' }} />
                <span>Estado del Entorno: {isDemo ? 'Modo Demostración (Simulado)' : 'Modo Blockchain Real (Polygon Amoy)'}</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px', lineHeight: 1.6 }}>
                {isDemo 
                  ? 'Esta aplicación se está ejecutando de forma local y simulada. Puedes emitir certificados y verificar sus códigos QR sin MetaMask de forma didáctica. Para conectar tu propio Smart Contract en la testnet, dirígete al "Panel Administrativo" y pega la dirección de tu contrato desplegado.'
                  : `¡Conectado exitosamente al Smart Contract real en Polygon Amoy! Todas las emisiones requerirán la firma del Rector/Administrador en MetaMask y los certificados se registrarán de forma inmutable.`
                }
              </p>
            </div>
            {!isDemo && (
              <a 
                href={`https://amoy.polygonscan.com/address/${contractAddress}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              >
                <span>Ver Contrato</span> <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>

        {/* CONTENEDOR DE PESTAÑAS */}
        {activeTab === 'verify' ? (
          <VerificationPortal contractAddress={contractAddress} />
        ) : (
          <AdminDashboard 
            contractAddress={contractAddress} 
            setContractAddress={setContractAddress} 
          />
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border-glass)', padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'rgba(5,7,15,0.4)', backdropFilter: 'blur(10px)' }}>
        <p>© 2026 UniCert Web3. Proyecto de Tokenización de Certificados Académicos.</p>
        <p style={{ marginTop: '4px', color: 'var(--text-muted)' }}>
          Desarrollado para la validación inmutable de credenciales mediante Smart Contracts en redes Blockchain.
        </p>
      </footer>

    </div>
  );
}
