import { ethers } from 'ethers';
import abi from './CertificateRegistry.json';
export const CONTRACT_ABI = abi;

export const POLYGON_AMOY_CONFIG = {
  chainId: '0x13882',
  chainName: 'Polygon Amoy Testnet',
  nativeCurrency: {
    name: 'POL',
    symbol: 'POL',
    decimals: 18
  },
  rpcUrls: ['https://rpc-amoy.polygon.technology'],
  blockExplorerUrls: ['https://amoy.polygonscan.com']
};

export const POLYGON_MAINNET_CONFIG = {
  chainId: '0x89',
  chainName: 'Polygon Mainnet',
  nativeCurrency: {
    name: 'POL',
    symbol: 'POL',
    decimals: 18
  },
  rpcUrls: ['https://polygon-rpc.com'],
  blockExplorerUrls: ['https://polygonscan.com']
};

export const PUBLIC_RPC_PROVIDER_URL = 'https://polygon-amoy-bor-rpc.publicnode.com';

const LOCAL_STORAGE_KEY = 'blockchain_simulated_certificates';

function getSimulatedCertificates() {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : {};
}

function saveSimulatedCertificates(certs) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(certs));
}

/**
 * Consulta un certificado. Soporta tanto el contrato real en blockchain como el simulador local.
 */
export async function getCertificateData(id, contractAddress) {
  if (!contractAddress || contractAddress.trim() === '' || contractAddress === '0x0000000000000000000000000000000000000000') {
    const certs = getSimulatedCertificates();
    const cert = certs[id];
    if (!cert) {
      throw new Error('Certificado no encontrado en el sistema de simulación');
    }
    return cert;
  }

  try {
    const provider = new ethers.JsonRpcProvider(PUBLIC_RPC_PROVIDER_URL);
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
    const result = await contract.getCertificate(id);

    return {
      id: result[0],
      recipientName: result[1],
      eventName: result[2],
      issueDate: Number(result[3]),
      issuer: result[4],
      isValid: result[5],
      tokenId: Number(result[6]),
      isRealBlockchain: true
    };
  } catch (error) {
    console.error('Error consultando contrato real, intentando fallback en local:', error);
    const certs = getSimulatedCertificates();
    if (certs[id]) {
      return certs[id];
    }
    throw new Error('Certificado no encontrado en Blockchain ni en simulación local');
  }
}

/**
 * Registra un certificado en la Blockchain (con MetaMask) o localmente.
 */
export async function issueCertificateData(data, contractAddress) {
  const { id, recipientName, eventName, issueDate } = data;

  if (!contractAddress || contractAddress.trim() === '' || contractAddress === '0x0000000000000000000000000000000000000000') {
    const certs = getSimulatedCertificates();
    if (certs[id]) {
      throw new Error('Este ID de certificado ya existe localmente');
    }

    const randomHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const mockIssuer = '0x8b5cf663c084fc90320d3ee06b6d45f65f6f897a';
    const mockTokenId = Object.keys(certs).length + 1;

    const newCert = {
      id,
      recipientName,
      eventName,
      issueDate: Number(issueDate),
      issuer: mockIssuer,
      isValid: true,
      transactionHash: randomHash,
      tokenId: mockTokenId,
      isRealBlockchain: false
    };

    certs[id] = newCert;
    saveSimulatedCertificates(certs);

    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      success: true,
      transactionHash: randomHash,
      tokenId: mockTokenId,
      isRealBlockchain: false
    };
  }

  // --- REGISTRO REAL WEB3 ---
  if (!window.ethereum) {
    throw new Error('MetaMask no está instalado. Instálalo para emitir certificados reales.');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();

  const network = await provider.getNetwork();
  const targetChainId = 80002n;

  if (network.chainId !== targetChainId) {
    const targetConfig = POLYGON_AMOY_CONFIG;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetConfig.chainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [targetConfig],
        });
      } else {
        throw new Error('Cambia tu MetaMask a la red Polygon Amoy');
      }
    }
  }

  const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
  const timestampInSeconds = Math.floor(Number(issueDate) / 1000);
  const tx = await contract.issueCertificate(id, recipientName, eventName, timestampInSeconds);
  const receipt = await tx.wait();
  const tokenId = await contract.getTokenIdByCertId(id);

  return {
    success: true,
    transactionHash: receipt.hash,
    tokenId: Number(tokenId),
    isRealBlockchain: true
  };
}

/**
 * Emite múltiples certificados en batch (una sola transacción).
 * En modo demo guarda todos localmente.
 * En modo real llama a batchIssueCertificates del contrato.
 */
export async function batchIssueCertificatesData(certificatesArray, contractAddress) {
  if (!certificatesArray || certificatesArray.length === 0) {
    throw new Error('Debe proporcionar al menos un certificado');
  }

  // --- MODO DEMO ---
  if (!contractAddress || contractAddress.trim() === '' || contractAddress === '0x0000000000000000000000000000000000000000') {
    const certs = getSimulatedCertificates();
    const results = [];

    for (const data of certificatesArray) {
      const { id, recipientName, eventName, issueDate } = data;

      if (certs[id]) {
        throw new Error(`El ID "${id}" ya existe localmente`);
      }

      const randomHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const mockIssuer = '0x8b5cf663c084fc90320d3ee06b6d45f65f6f897a';
      const mockTokenId = Object.keys(certs).length + 1;

      const newCert = {
        id,
        recipientName,
        eventName,
        issueDate: Number(issueDate),
        issuer: mockIssuer,
        isValid: true,
        transactionHash: randomHash,
        tokenId: mockTokenId,
        isRealBlockchain: false
      };

      certs[id] = newCert;
      results.push(newCert);
    }

    saveSimulatedCertificates(certs);

    // Simular retraso de minado
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      results,
      isRealBlockchain: false
    };
  }

  // --- REGISTRO REAL WEB3 ---
  if (!window.ethereum) {
    throw new Error('MetaMask no está instalado. Instálalo para emitir certificados reales.');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();

  const network = await provider.getNetwork();
  const targetChainId = 80002n;

  if (network.chainId !== targetChainId) {
    const targetConfig = POLYGON_AMOY_CONFIG;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetConfig.chainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [targetConfig],
        });
      } else {
        throw new Error('Cambia tu MetaMask a la red Polygon Amoy');
      }
    }
  }

  const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

  const ids = certificatesArray.map(c => c.id);
  const names = certificatesArray.map(c => c.recipientName);
  const events = certificatesArray.map(c => c.eventName);
  const dates = certificatesArray.map(c => Math.floor(Number(c.issueDate) / 1000));

  const tx = await contract.batchIssueCertificates(ids, names, events, dates);
  const receipt = await tx.wait();

  // Obtener tokenIds para cada certificado
  const results = [];
  for (const cert of certificatesArray) {
    const tokenId = await contract.getTokenIdByCertId(cert.id);
    results.push({
      ...cert,
      issueDate: Number(cert.issueDate),
      transactionHash: receipt.hash,
      tokenId: Number(tokenId),
      issuer: await signer.getAddress(),
      isValid: true,
      isRealBlockchain: true
    });
  }

  return {
    success: true,
    results,
    transactionHash: receipt.hash,
    isRealBlockchain: true
  };
}
