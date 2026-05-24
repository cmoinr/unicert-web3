require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    // Red de pruebas local de Hardhat
    hardhat: {},
    // Red de pruebas de Polygon Amoy
    amoy: {
      url: "https://polygon-amoy-bor-rpc.publicnode.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80002
    }
  }
};
