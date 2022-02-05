// var SimpleStorage = artifacts.require("./SimpleStorage.sol");
var IpfsFileUpload = artifacts.require("./IpfsFileUpload.sol");

module.exports = function(deployer) {
  deployer.deploy(IpfsFileUpload);
};