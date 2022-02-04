import React, { Component } from "react";
// import SimpleStorageContract from "./contracts/SimpleStorage.json";
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
      let uploaded = await contract.methods.add(result[0].hash, file.name, type, timestamp).send({from: accounts[0], gas: 300000})
      console.log(uploaded);
      this.getFiles();
    } catch (error) {
      console.log(error);
    }
  };

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
