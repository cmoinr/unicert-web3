const hre = require("hardhat");

async function main() {
  console.log("Iniciando el despliegue del Smart Contract...");

  // 1. Obtener la fábrica del contrato inteligente
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  
  // 2. Desplegar el contrato
  const contract = await CertificateRegistry.deploy();

  // 3. Esperar a que se complete el despliegue
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log("=========================================");
  console.log("¡CONTRATO DESPLEGADO CON ÉXITO!");
  console.log("Dirección del Smart Contract:", contractAddress);
  console.log("Red: Polygon Amoy Testnet (ID de red: 80002)");
  console.log("=========================================");
  console.log("\nPróximos Pasos:");
  console.log("1. Copia la dirección del contrato anterior.");
  console.log("2. Pégala en el Panel Administrativo de UniCert para interactuar con la red real.");
  console.log("3. ¡Disfruta de tus certificados inmutables!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error durante el despliegue:", error);
    process.exit(1);
  });
