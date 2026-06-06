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
      issuanceDate: Date.now(),
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
        issuanceDate: Date.now(),
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
      issuanceDate: Date.now(),
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

/**
 * Determina cuál es el próximo sufijo libre para una cédula antes de emitir,
 * comprobando localmente y en el contrato.
 */
export async function getNextAvailableSuffix(cedula, contractAddress) {
  const cleanCedula = cedula.trim().toUpperCase().replace(/^UC-/, '');
  
  // 1. Revisar en local primero (siempre es rápido y sirve de caché/fallback)
  const localCerts = localStorage.getItem(LOCAL_STORAGE_KEY);
  const certsObj = localCerts ? JSON.parse(localCerts) : {};
  
  // Determinar qué sufijos ya están tomados en local
  const localTaken = new Set();
  if (certsObj[`UC-${cleanCedula}`] || certsObj[cleanCedula]) {
    localTaken.add(0); // El ID base ya está tomado
  }
  
  for (let s = 1; s <= 50; s++) {
    if (certsObj[`UC-${cleanCedula}-${s}`] || certsObj[`${cleanCedula}-${s}`]) {
      localTaken.add(s);
    }
  }

  // Si no hay blockchain real, retornamos basándonos en lo local
  if (!contractAddress || contractAddress.trim() === '' || contractAddress === '0x0000000000000000000000000000000000000000') {
    if (!localTaken.has(0)) return 0; // Si el base está libre, usamos el base
    let suffix = 1;
    while (localTaken.has(suffix)) {
      suffix++;
    }
    return suffix;
  }

  // Si hay blockchain real, validamos contra el contrato
  try {
    const provider = new ethers.JsonRpcProvider(PUBLIC_RPC_PROVIDER_URL);
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);

    // ¿El ID base está tomado en blockchain?
    let baseTaken = false;
    try {
      await contract.getTokenIdByCertId(`UC-${cleanCedula}`);
      baseTaken = true;
    } catch (e) {
      try {
        await contract.getTokenIdByCertId(cleanCedula);
        baseTaken = true;
      } catch (e2) {}
    }

    if (!baseTaken && !localTaken.has(0)) {
      return 0; // Usar ID base sin sufijo
    }

    let suffix = 1;
    while (suffix <= 50) {
      if (localTaken.has(suffix)) {
        suffix++;
        continue;
      }

      try {
        await contract.getTokenIdByCertId(`UC-${cleanCedula}-${suffix}`);
        suffix++;
      } catch (e) {
        // Si falló, significa que no existe en el contrato, por ende está libre
        return suffix;
      }
    }
    return suffix;
  } catch (err) {
    console.error('Error consultando contrato para sufijo, usando local:', err);
    if (!localTaken.has(0)) return 0;
    let suffix = 1;
    while (localTaken.has(suffix)) {
      suffix++;
    }
    return suffix;
  }
}

/**
 * Busca todos los certificados asociados a una cédula (o ID exacto).
 * Comprueba ID base y sufijos del 1 al 20.
 */
export async function getCertificatesByCedula(cedula, contractAddress) {
  const results = [];
  const cleanCedula = cedula.trim().toUpperCase().replace(/^UC-/, '');

  // 1. Intentar con el ID base (con y sin prefijo UC-)
  try {
    const cert = await getCertificateData(`UC-${cleanCedula}`, contractAddress);
    results.push(cert);
  } catch (e) {
    try {
      const cert = await getCertificateData(cleanCedula, contractAddress);
      results.push(cert);
    } catch (e2) {}
  }

  // 2. Intentar con sufijos secuenciales (-1, -2, -3, etc.)
  let suffix = 1;
  let consecutiveFailures = 0;
  // Buscamos hasta sufijo 20, deteniéndonos si hay 2 fallas consecutivas para no hacer llamadas infinitas
  while (suffix <= 20 && consecutiveFailures < 2) {
    try {
      const cert = await getCertificateData(`UC-${cleanCedula}-${suffix}`, contractAddress);
      if (!results.some(r => r.id === cert.id)) {
        results.push(cert);
      }
      consecutiveFailures = 0;
    } catch (e) {
      consecutiveFailures++;
    }
    suffix++;
  }

  if (results.length === 0) {
    throw new Error('Certificado no encontrado en el sistema. Asegúrate de ingresar un ID o Cédula válidos.');
  }

  return results;
}

