import "dotenv/config";

/** @type {import('hardhat/config').HardhatUserConfig} */
const config = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      type: "edr-simulated"
    },
    polygon: {
      type: "http",
      url: process.env.RPC_URL || "https://polygon-rpc.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 137
    },
    amoy: {
      type: "http",
      url: "https://polygon-amoy-bor-rpc.publicnode.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80002
    }
  }
};

export default config;
