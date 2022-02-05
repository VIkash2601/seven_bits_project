// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
// pragma solidity ^0.8.11;

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

	function getFile(uint _index) public view returns(string memory, string memory, string memory, uint) {
		File memory file = files[msg.sender][_index];
		return (file.ipfsHash, file.fileName, file.fileType, file.fileDate);
	}

	function getLength() public view returns(uint) {
		return files[msg.sender].length;
	}
}