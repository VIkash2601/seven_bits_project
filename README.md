<<<<<<< HEAD
# Add or drop file to store in IPFS
![alt text](https://github.com/VIkash2601/eth_ipfs_file_upload/blob/master/drop_file.png)

# Files Uploaded on IPFS
![alt text](https://github.com/VIkash2601/eth_ipfs_file_upload/blob/master/added_files.png)

# Prerequisites
**OS: Ubuntu linux**<br />
**VS Code(IDE)(Optional)**

# Setup
**Installing Dependencies**
1. [Install node.js and npm package manager](https://www.geeksforgeeks.org/installation-of-node-js-on-linux/)
```
sudo apt install nodejs
sudo apt install npm
```
2. [Install Truffle](https://www.trufflesuite.com/docs/truffle/getting-started/installation)
```
npm install truffle
OR
npm install -g truffle (to install globally)
```
3. [Unbox react box](https://www.trufflesuite.com/boxes/react)
```
truffle unbox react
```
4. Install [web3](https://www.npmjs.com/package/web3)
```
npm install web3
```
5. [Install ganache](https://www.trufflesuite.com/ganache)
```
downlaod .AppImage from the above link and run that file as executable
```
6. [ipfs-desktop](https://github.com/ipfs-shipyard/ipfs-desktop#install), [ipfs](https://www.npmjs.com/package/ipfs)
```
snap install ipfs-dektop
npm install ipfs
```
7. [Install Metamask](https://metamask.io/download.html)

# Changes in code
**1. truffle-config.js**
```
change host and port to host and port at which the ganache running and 
compile and migrate the contract [here](# Compile and Run)
```
**2. app.js**
```
import React, { Component } from "react";
import IpfsFileUploadContract from "./contracts/IpfsFileUpload.json";
import getWeb3 from "./getWeb3";

import { StyledDropZone } from 'react-drop-zone';
import 'react-drop-zone/dist/styles.css';
import 'bootstrap/dist/css/bootstrap.css';

import { Table } from 'reactstrap';
import FileIcon, {defaultStyles} from 'react-file-icon';

import fileReaderPullStream from 'pull-file-reader';
import Moment from "react-moment";

import ipfs from './ipfs';

import "./App.css";

class App extends Component {
  state = { ipfsFileUpload: [], web3: null, accounts: null, contract: null };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = IpfsFileUploadContract.networks[networkId];
      const instance = new web3.eth.Contract(
        IpfsFileUploadContract.abi,
        deployedNetwork && deployedNetwork.address
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.getFiles);
      web3.currentProvider.publicConfigStore.on('update', async () => {
        const changedAccounts = await web3.eth.getAccounts();
        this.setState({accounts: changedAccounts});
        this.getFiles();
      })
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  getFiles = async () => {
    try {
      const { accounts, contract } = this.state;
      let filesLength = await contract.methods
        .getLength()
        .call({ from: accounts[0] });
      let files = [];
      for (let i = 0; i < filesLength; i++) {
        let file = await contract.methods.getFile(i).call({ from: accounts[0] });
        files.push(file);
      }
      this.setState({ ipfsFileUpload: files });
    } catch (error) {
     console.log(error);
    }
  };

  onDrop = async (file) => {
    try {
      const {contract, accounts} = this.state;
      const stream = fileReaderPullStream(file);
      const result = await ipfs.add(stream);
      const timestamp = Math.round(+new Date() / 1000);
      const type = file.name.substr(file.name.lastIndexOf(".")+1);
      let uploaded = await contract.methods.add(
        result[0].hash, file.name, type, timestamp).send({from: accounts[0], gas: 300000})
      console.log(uploaded);
      this.getFiles();
    } catch (error) {
      console.log(error);
    }
  };
```
**And The Frontend**
```
  render() {
    const {ipfsFileUpload} = this.state;
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <div className="Container pt-3">
          <StyledDropZone onDrop={this.onDrop} />
          <Table>
            <thead>
              <tr>
                <th width="7%" scope="row">Type</th>
                <th className="text-left">File Name</th>
                <th className="text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              { ipfsFileUpload !== [] ? ipfsFileUpload.map((item, key) => (
                <tr>
                  <th>
                    <FileIcon 
                    size={30} 
                    extension={item[2]} 
                    {...defaultStyles[item[2]]}
                    />
                    </th>
                  <th className="text-left">
                  <a href={"https://ipfs.io/ipfs/"+item[0]}>{item[1]}</a>
                  </th>
                  <th className="text-right">
                  <Moment format="DD/MM/YYYY" unix>{item[3]}</Moment>
                  </th>
                </tr>
              )) : null }
            </tbody>
          </Table>
        </div>  
        </div>
    );
  }
}

export default App;
```
**3. getweb3.js**
```
import Web3 from "web3";

const getWeb3 = () =>
  new Promise((resolve, reject) => {
    // Wait for loading completion to avoid race conditions with web3 injection timing.
    window.addEventListener("load", async () => {
      // Modern dapp browsers...
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          // Request account access if needed
          await window.ethereum.enable();
          // Acccounts now exposed
          resolve(web3);
        } catch (error) {
          reject(error);
        }
      }
      // Legacy dapp browsers...
      else if (window.web3) {
        // Use Mist/MetaMask's provider.
        const web3 = window.web3;
        console.log("Injected web3 detected.");
        resolve(web3);
      }
      // Fallback to localhost; use dev console port by default...
      else {
        const provider = new Web3.providers.HttpProvider(
          "http://127.0.0.1:7545"
        );
        const web3 = new Web3(provider);
        console.log("No web3 instance injected, using Local web3.");
        resolve(web3);
      }
    });
  });

export default getWeb3;
```
**4. Create IpfsFileUpload.sol**
```
pragma solidity >=0.4.21 <0.7.0;

contract IpfsFileUpload {
	struct File {
		string ipfsHash;
		string fileName;
		string fileType;
		uint fileDate;
	}

	mapping(address => File[]) files;

	function add(string memory _ipfsHash, string memory _fileName, 
		string memory _fileType, uint _fileDate) public {
		files[msg.sender].push(File({ipfsHash: _ipfsHash, fileName: _fileName,
    fileType: _fileType, fileDate: _fileDate
		}));
	}

	function getFile(uint _index) public view returns(
    string memory, string memory, string memory, uint) {
		File memory file = files[msg.sender][_index];
		return (file.ipfsHash, file.fileName, file.fileType, file.fileDate);
	}

	function getLength() public view returns(uint) {
		return files[msg.sender].length;
	}
}
```
**5.Create ipfs.js**
```
const IPFS = require("ipfs-api");
const ipfs = new IPFS({ host: 'inpfs.infura.io', port: 5001, protocol: 'https' })
export default ipfs;
```

# Compile and Run
  **1. Compile contract**
```
truffle compile
```
  **2. Migrate contract**
```
truffle migrate --reset
```
  **3. Run the node**
```
cd client
npm start

This will open start the development server and open localhost at 3000 port.
```
  **4. Drop or open file**
```
In the browser click on drop section to select a file or directly drop the file to upload.
```
=======
# Add or drop file to store in IPFS
![alt text](https://github.com/VIkash2601/eth_ipfs_file_upload/blob/master/drop_file.png)

# Files Uploaded on IPFS
![alt text](https://github.com/VIkash2601/eth_ipfs_file_upload/blob/master/added_files.png)

# Prerequisites
**OS: Ubuntu linux**<br />
**VS Code(IDE)(Optional)**

# Setup
**Installing Dependencies**
1. [Install node.js and npm package manager](https://www.geeksforgeeks.org/installation-of-node-js-on-linux/)
```
sudo apt install nodejs
sudo apt install npm
```
2. [Install Truffle](https://www.trufflesuite.com/docs/truffle/getting-started/installation)
```
npx install truffle
OR
npx install -g truffle (to install globally)
```
3. [Unbox react box](https://www.trufflesuite.com/boxes/react)
```
truffle unbox react
```
4. Install [web3](https://www.npmjs.com/package/web3)
```
npm install web3
```
5. [Install ganache](https://www.trufflesuite.com/ganache)
```
downlaod .AppImage from the above link and run that file as executable
```
6. [ipfs-desktop](https://github.com/ipfs-shipyard/ipfs-desktop#install), [ipfs](https://www.npmjs.com/package/ipfs)
```
snap install ipfs-dektop
npm install ipfs
```
7. [Install Metamask](https://metamask.io/download.html)

# Changes in code
**1. truffle-config.js**
```
change host and port to host and port at which the ganache running and 
compile and migrate the contract [here](# Compile and Run)
```
**2. app.js**
```
import React, { Component } from "react";
import IpfsFileUploadContract from "./contracts/IpfsFileUpload.json";
import getWeb3 from "./getWeb3";

import { StyledDropZone } from 'react-drop-zone';
import 'react-drop-zone/dist/styles.css';
import 'bootstrap/dist/css/bootstrap.css';

import { Table } from 'reactstrap';
import FileIcon, {defaultStyles} from 'react-file-icon';

import fileReaderPullStream from 'pull-file-reader';
import Moment from "react-moment";

import ipfs from './ipfs';

import "./App.css";

class App extends Component {
  state = { ipfsFileUpload: [], web3: null, accounts: null, contract: null };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = IpfsFileUploadContract.networks[networkId];
      const instance = new web3.eth.Contract(
        IpfsFileUploadContract.abi,
        deployedNetwork && deployedNetwork.address
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.getFiles);
      web3.currentProvider.publicConfigStore.on('update', async () => {
        const changedAccounts = await web3.eth.getAccounts();
        this.setState({accounts: changedAccounts});
        this.getFiles();
      })
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  getFiles = async () => {
    try {
      const { accounts, contract } = this.state;
      let filesLength = await contract.methods
        .getLength()
        .call({ from: accounts[0] });
      let files = [];
      for (let i = 0; i < filesLength; i++) {
        let file = await contract.methods.getFile(i).call({ from: accounts[0] });
        files.push(file);
      }
      this.setState({ ipfsFileUpload: files });
    } catch (error) {
     console.log(error);
    }
  };

  onDrop = async (file) => {
    try {
      const {contract, accounts} = this.state;
      const stream = fileReaderPullStream(file);
      const result = await ipfs.add(stream);
      const timestamp = Math.round(+new Date() / 1000);
      const type = file.name.substr(file.name.lastIndexOf(".")+1);
      let uploaded = await contract.methods.add(
        result[0].hash, file.name, type, timestamp).send({from: accounts[0], gas: 300000})
      console.log(uploaded);
      this.getFiles();
    } catch (error) {
      console.log(error);
    }
  };
```
**And The Frontend**
```
  render() {
    const {ipfsFileUpload} = this.state;
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <div className="Container pt-3">
          <StyledDropZone onDrop={this.onDrop} />
          <Table>
            <thead>
              <tr>
                <th width="7%" scope="row">Type</th>
                <th className="text-left">File Name</th>
                <th className="text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              { ipfsFileUpload !== [] ? ipfsFileUpload.map((item, key) => (
                <tr>
                  <th>
                    <FileIcon 
                    size={30} 
                    extension={item[2]} 
                    {...defaultStyles[item[2]]}
                    />
                    </th>
                  <th className="text-left">
                  <a href={"https://ipfs.io/ipfs/"+item[0]}>{item[1]}</a>
                  </th>
                  <th className="text-right">
                  <Moment format="DD/MM/YYYY" unix>{item[3]}</Moment>
                  </th>
                </tr>
              )) : null }
            </tbody>
          </Table>
        </div>  
        </div>
    );
  }
}

export default App;
```
**3. getweb3.js**
```
import Web3 from "web3";

const getWeb3 = () =>
  new Promise((resolve, reject) => {
    // Wait for loading completion to avoid race conditions with web3 injection timing.
    window.addEventListener("load", async () => {
      // Modern dapp browsers...
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          // Request account access if needed
          await window.ethereum.enable();
          // Acccounts now exposed
          resolve(web3);
        } catch (error) {
          reject(error);
        }
      }
      // Legacy dapp browsers...
      else if (window.web3) {
        // Use Mist/MetaMask's provider.
        const web3 = window.web3;
        console.log("Injected web3 detected.");
        resolve(web3);
      }
      // Fallback to localhost; use dev console port by default...
      else {
        const provider = new Web3.providers.HttpProvider(
          "http://127.0.0.1:7545"
        );
        const web3 = new Web3(provider);
        console.log("No web3 instance injected, using Local web3.");
        resolve(web3);
      }
    });
  });

export default getWeb3;
```
**4. Create IpfsFileUpload.sol**
```
pragma solidity >=0.4.21 <0.7.0;

contract IpfsFileUpload {
	struct File {
		string ipfsHash;
		string fileName;
		string fileType;
		uint fileDate;
	}

	mapping(address => File[]) files;

	function add(string memory _ipfsHash, string memory _fileName, 
		string memory _fileType, uint _fileDate) public {
		files[msg.sender].push(File({ipfsHash: _ipfsHash, fileName: _fileName,
    fileType: _fileType, fileDate: _fileDate
		}));
	}

	function getFile(uint _index) public view returns(
    string memory, string memory, string memory, uint) {
		File memory file = files[msg.sender][_index];
		return (file.ipfsHash, file.fileName, file.fileType, file.fileDate);
	}

	function getLength() public view returns(uint) {
		return files[msg.sender].length;
	}
}
```
**5.Create ipfs.js**
```
const IPFS = require("ipfs-api");
const ipfs = new IPFS({ host: 'inpfs.infura.io', port: 5001, protocol: 'https' })
export default ipfs;
```

# Compile and Run
  **1. Compile contract**
```
truffle compile
```
  **2. Migrate contract**
```
truffle migrate --reset
```
  **3. Run the node**
```
cd client
npm start

This will open start the development server and open localhost at 3000 port.
```
  **4. Drop or open file**
```
In the browser click on drop section to select a file or directly drop the file to upload.
```
>>>>>>> 1d02351989c2f54557b5fed3a945f3c12c1361d0
