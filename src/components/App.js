import React, { Component } from 'react';
import Web3 from 'web3';
import Identicon from 'identicon.js';
import './App.css';
import DecGram from '../abis/DecGram.json'
import Navbar from './Navbar'
import Main from './Main'

const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values

class App extends Component {

  // component will mount
  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  // Load web3
  async loadWeb3() {
    if(window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non Ethereum browser detected. Consider trying Metamask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3
    // Load accounts
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    // Network Id
    const networkId = await web3.eth.net.getId()
    const networkData = DecGram.networks[networkId]
    if (networkData) {
      const decGram = web3.eth.Contract(DecGram.abi, networkData.address)
      this.setState({ decGram: decGram })
      const imageCount = await decGram.methods.imageCount().call()
      this.setState({ imageCount })

      for(var i = 1; i <= imageCount; i++) {
        const image = await decGram.methods.images(i).call()
        this.setState({
          images: [...this.state.images, image]
        })
      }

      // Sort images. Show highest tipped images first
      this.setState({
        images: this.state.images.sort((a, b) => b.tipAmount - a.tipAmount)
      })

      this.setState({ loading: false })
    } else {
      window.alert('DecGram contrac has not been deployed to detected network. Check your network and account in Metamask')
    }
    
  }

  captureFile = event => {
    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)

    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
      console.log('buffer', this.state.buffer)
    }
  } 

  uploadImage = description => {
    console.log('Submitting file to ipfs...')

    //adding file to the IPFS
    ipfs.add(this.state.buffer, (error, result) => {
      console.log('Ipfs result', result)
      if(error) {
        console.log(error)
        return
      }

      this.setState({ loading: true })
      this.state.decGram.methods.uploadImage(result[0].hash, description).send({ from: this.state.account }).on('transactionHash', (hash) => {
        this.setState({ loading: false })
      })
    })
  }

  tipImageOwner = (id, tipAmount) => {
    this.setState({ loading: true })
      this.state.decGram.methods.tipImageOwner(id).send({ from: this.state.account, value: tipAmount }).on('transactionHash', (hash) => {
        this.setState({ loading: false })
      })
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      decGram: null,
      images: [],
      loading: true
    }
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
              images = {this.state.images}
              captureFile = {this.captureFile}
              uploadImage = {this.uploadImage}
              tipImageOwner = {this.tipImageOwner}
            />
          }
        }
      </div>
    );
  }
}

export default App;