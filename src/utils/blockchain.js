import { ethers } from 'ethers';

// ABI Oficial del Smart Contract CertificateRegistry
export const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "id",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "recipientName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "eventName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "issueDate",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "issuer",
        "type": "address"
      }
    ],
    "name": "CertificateIssued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "id",
        "type": "string"
      }
    ],
    "name": "CertificateRevoked",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "certificateIds",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_id",
        "type": "string"
      }
    ],
    "name": "getCertificate",
    "outputs": [
      {
        "internalType": "string",
        "name": "id",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "recipientName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "eventName",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "issueDate",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "issuer",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "isValid",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_id",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_recipientName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_eventName",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_issueDate",
        "type": "uint256"
      }
    ],
    "name": "issueCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_id",
        "type": "string"
      }
    ],
    "name": "isCertificateValid",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_id",
        "type": "string"
      }
    ],
    "name": "revokeCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalCertificates",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Configuración de red para Polygon Amoy (Testnet)
export const POLYGON_AMOY_CONFIG = {
  chainId: '0x13882', // 80002 en decimal
  chainName: 'Polygon Amoy Testnet',
  nativeCurrency: {
    name: 'POL',
    symbol: 'POL',
    decimals: 18
  },
  rpcUrls: ['https://rpc-amoy.polygon.technology'],
  blockExplorerUrls: ['https://amoy.polygonscan.com']
};

// Proveedor RPC Público por defecto para consultas libres de costo y sin MetaMask
export const PUBLIC_RPC_PROVIDER_URL = 'https://polygon-amoy-bor-rpc.publicnode.com';

// Clave en LocalStorage para certificados simulados en "Modo Demo"
const LOCAL_STORAGE_KEY = 'blockchain_simulated_certificates';

/**
 * Obtiene los certificados guardados localmente (Modo Demo)
 */
function getSimulatedCertificates() {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : {};
}

/**
 * Guarda los certificados localmente (Modo Demo)
 */
function saveSimulatedCertificates(certs) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(certs));
}

/**
 * Consulta un certificado. Soporta tanto el contrato real en blockchain como el simulador local (Modo Demo)
 * 
 * @param {string} id ID único del certificado
 * @param {string} contractAddress Dirección del contrato (opcional)
 * @returns {Promise<Object>} Datos del certificado
 */
export async function getCertificateData(id, contractAddress) {
  // Si no hay dirección de contrato configurada, usamos Modo Demo automáticamente
  if (!contractAddress || contractAddress.trim() === '' || contractAddress === '0x0000000000000000000000000000000000000000') {
    const certs = getSimulatedCertificates();
    const cert = certs[id];
    if (!cert) {
      throw new Error('Certificado no encontrado en el sistema de simulación');
    }
    return cert;
  }

  try {
    // Consulta Real a Blockchain usando Proveedor RPC Público (sin necesidad de MetaMask)
    const provider = new ethers.JsonRpcProvider(PUBLIC_RPC_PROVIDER_URL);
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
    
    // Llamar al método del contrato
    const result = await contract.getCertificate(id);
    
    return {
      id: result[0],
      recipientName: result[1],
      eventName: result[2],
      issueDate: Number(result[3]),
      issuer: result[4],
      isValid: result[5],
      isRealBlockchain: true
    };
  } catch (error) {
    console.error('Error consultando contrato real, intentando fallback en local:', error);
    // Si falla la consulta Web3, buscamos si existe en el local storage
    const certs = getSimulatedCertificates();
    if (certs[id]) {
      return certs[id];
    }
    throw new Error('Certificado no encontrado en Blockchain ni en simulación local');
  }
}

/**
 * Registra/Acuña un certificado en la Blockchain (con MetaMask) o localmente
 * 
 * @param {Object} data Datos del certificado
 * @param {string} contractAddress Dirección del contrato
 * @returns {Promise<Object>} Resultado de la transacción
 */
export async function issueCertificateData(data, contractAddress) {
  const { id, recipientName, eventName, issueDate } = data;

  // Si no está configurado el contrato, acuñamos en Modo Demo (LocalStorage)
  if (!contractAddress || contractAddress.trim() === '' || contractAddress === '0x0000000000000000000000000000000000000000') {
    const certs = getSimulatedCertificates();
    if (certs[id]) {
      throw new Error('Este ID de certificado ya existe localmente');
    }

    // Crear hash de transacción y dirección de emisor ficticios
    const randomHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const mockIssuer = '0x8b5cf663c084fc90320d3ee06b6d45f65f6f897a';
    
    const newCert = {
      id,
      recipientName,
      eventName,
      issueDate: Number(issueDate),
      issuer: mockIssuer,
      isValid: true,
      transactionHash: randomHash,
      isRealBlockchain: false
    };

    certs[id] = newCert;
    saveSimulatedCertificates(certs);
    
    // Simular retraso de minado de bloque para mejorar la experiencia de usuario
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      transactionHash: randomHash,
      isRealBlockchain: false
    };
  }

  // --- REGISTRO REAL WEB3 ---
  if (!window.ethereum) {
    throw new Error('MetaMask no está instalado. Instálalo para emitir certificados reales.');
  }

  // Instanciar proveedor de MetaMask
  const provider = new ethers.BrowserProvider(window.ethereum);
  
  // Solicitar conexión de cuentas
  await provider.send("eth_requestAccounts", []);
  
  const signer = await provider.getSigner();
  
  // Comprobar si está en la red correcta de Polygon Amoy, si no, pedir cambio
  const network = await provider.getNetwork();
  if (network.chainId !== 80002n) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_AMOY_CONFIG.chainId }],
      });
    } catch (switchError) {
      // Si la red no está agregada en MetaMask, la agregamos
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [POLYGON_AMOY_CONFIG],
          });
        } catch (addError) {
          throw new Error('No se pudo agregar la red Polygon Amoy a tu MetaMask');
        }
      } else {
        throw new Error('Por favor, cambia tu MetaMask a la red Polygon Amoy');
      }
    }
  }

  const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
  
  // Ejecutar transacción de emisión del certificado en el Smart Contract
  // Nota: issueDate se envía como timestamp en segundos para Solidity (issueDate / 1000)
  const timestampInSeconds = Math.floor(Number(issueDate) / 1000);
  
  const tx = await contract.issueCertificate(id, recipientName, eventName, timestampInSeconds);
  
  // Esperar confirmación de la transacción (1 bloque)
  const receipt = await tx.wait();
  
  return {
    success: true,
    transactionHash: receipt.hash,
    isRealBlockchain: true
  };
}
