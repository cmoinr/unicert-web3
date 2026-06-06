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

  // Estados de autorización admin
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
    if (adminPasswordInput === correctPassword) {
      setIsAdminAuthorized(true);
      setPasswordError('');
    } else {
      setPasswordError('Contraseña incorrecta. Inténtalo de nuevo.');
    }
  };

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
      <header className="glass-panel" style={{ margin: '20px 20px 0', padding: '16px 30px', borderRadius: '0px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', border: '2px solid #ffffff', boxShadow: '5px 5px 0px #ff6600', background: '#0a0a0a' }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: isAdminAuthorized ? 'default' : 'pointer' }} 
          onClick={() => {
            if (!isAdminAuthorized) {
              setActiveTab('verify');
            }
          }}
        >
          <div style={{ background: '#ff6600', width: '40px', height: '40px', borderRadius: '0px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #ffffff', boxShadow: '3px 3px 0px #ffffff' }}>
            <Award size={22} style={{ color: '#000000' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.5px' }}>
              Uni<span style={{ color: '#ff6600' }}>Cert</span>
            </h1>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', tracking: '1px', textTransform: 'uppercase', display: 'block', marginTop: '-2px' }}>
              Credenciales Blockchain
            </span>
          </div>
        </div>

        {/* NAVEGACIÓN */}
        <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!isAdminAuthorized && (
            <button 
              className={`nav-link ${activeTab === 'verify' ? 'active' : ''}`}
              onClick={() => setActiveTab('verify')}
              style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem' }}
            >
              Portal de Verificación
            </button>
          )}
          <button 
            className={`nav-link ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
            style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem' }}
          >
            Admin
          </button>
          {isAdminAuthorized && (
            <button 
              className="btn-secondary"
              onClick={() => {
                setIsAdminAuthorized(false);
                setAdminPasswordInput('');
                setActiveTab('verify');
              }}
              style={{ padding: '6px 12px', fontSize: '0.8rem', border: '2px solid #ff3333', color: '#ff3333', boxShadow: '2px 2px 0px #ffffff' }}
            >
              Cerrar Sesión
            </button>
          )}
        </nav>

        {/* BOTÓN CONEXIÓN WALLET */}
        {activeTab === 'admin' && isAdminAuthorized && (
          <div>
            {walletAddress ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#000000', border: '2px solid #ff6600', padding: '8px 16px', borderRadius: '0px', color: '#ff6600', fontSize: '0.85rem', fontWeight: 700, boxShadow: '3px 3px 0px #ffffff' }}>
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
        )}
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ flex: 1, padding: '20px', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
        
        {/* CONTENEDOR DE PESTAÑAS */}
        {activeTab === 'verify' ? (
          <VerificationPortal contractAddress={contractAddress} />
        ) : !isAdminAuthorized ? (
          <div className="glass-panel" style={{ maxWidth: '450px', margin: '60px auto', padding: '40px 30px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', borderRadius: '0px', border: '2px solid #ffffff', boxShadow: '6px 6px 0px #ff6600' }}>
            <div style={{ background: '#000000', width: '60px', height: '60px', borderRadius: '0px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', border: '2px solid #ff6600', boxShadow: '4px 4px 0px #ffffff' }}>
              <ShieldCheck size={30} style={{ color: '#ff6600' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>Acceso Administrativo</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Ingresa la contraseña para gestionar las plantillas y emitir certificados.
              </p>
            </div>
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="password"
                className="custom-input"
                placeholder="Contraseña (de prueba: admin123)"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                style={{ textAlign: 'center', letterSpacing: '0.1em', borderRadius: '0px' }}
                autoFocus
              />
              {passwordError && (
                <span style={{ color: '#ff3333', fontSize: '0.825rem', fontWeight: 700 }}>{passwordError}</span>
              )}
              <button type="submit" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', gap: '8px', width: '100%' }}>
                <span>Ingresar al Panel</span>
              </button>
            </form>
          </div>
        ) : (
          <AdminDashboard 
            contractAddress={contractAddress} 
            setContractAddress={setContractAddress} 
          />
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: '2px solid #ffffff', padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: '#000000' }}>
        <p style={{ fontFamily: 'inherit' }}>© 2026 UniCert. Proyecto de Tokenización de Certificados Académicos.</p>
        <p style={{ marginTop: '4px', color: 'var(--text-muted)' }}>
          Desarrollado para la validación inmutable de credenciales mediante Smart Contracts en redes Blockchain.
        </p>
      </footer>

    </div>
  );
}
