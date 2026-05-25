import hre from "hardhat";

async function main() {
  const network = hre.network.name;
  console.log(`Desplegando CertificateRegistry en la red: ${network}...`);

  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const contract = await CertificateRegistry.deploy();
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("=========================================");
  console.log("¡CONTRATO DESPLEGADO CON ÉXITO!");
  console.log("Dirección:", contractAddress);
  console.log("Red:", network, network === "polygon" ? "(Polygon Mainnet)" : network === "amoy" ? "(Polygon Amoy Testnet)" : "");
  console.log("Owner:", await contract.owner());
  console.log("=========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
