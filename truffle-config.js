const path = require("path");
var HDWalletProvider = require("@truffle/hdwallet-provider");

var infura_api_key = "057649c370794cde890dae67bcd5e9b6";
var mnemonic = "student wink elegant crystal fly soccer horn siege miracle autumn quit hero";

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/v3/"+infura_api_key)
      },
      network_id: 3,
      gas: 4698712
    }
  }
};
