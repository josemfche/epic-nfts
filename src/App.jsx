import React, { useEffect, useState } from 'react';
import './styles/App.css';
import { ethers } from 'ethers';
import myEpicNft from './utils/myEpicNft.json';
import twitterLogo from './assets/twitter-logo.svg';

// Constants
const TWITTER_HANDLE = 'josemfcheo';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = 'https://testnets.opensea.io/collection/josemfcheotwitternfts';
const TOTAL_MINT_COUNT = 50;
const CONTRACT_ADDRESS = '0x6DA6dBCBB8Ffd5Ae8CF3703a240bCEF97c2Ee5E1';

const App = () => {
  const [currentAccount, setCurrentAccount] = useState('');
  const [totalNftsMinted, setTotalNftsMinted] = useState('0x0');
  const [openSeaLink, setOpenSeaLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const checkNetwork = async () => {
    let chainId = await ethereum.request({ method: 'eth_chainId' });
    console.log('Connected to chain ' + chainId);

    // String, hex code of the chainId of the Rinkebey test network
    const rinkebyChainId = '0x4';
    if (chainId !== rinkebyChainId) {
      alert('You are not connected to the Rinkeby Test Network!');
    }
  };

  const checkIfWalletIsConnected = async () => {
    /*
     * First make sure we have access to window.ethereum
     */
    const { ethereum } = window;

    if (!ethereum) {
      console.log('Make sure you have metamask!');
      return;
    } else {
      console.log('We have the ethereum object', ethereum);
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log('Found an authorized account:', account);
      setCurrentAccount(account);

      // Setup listener! This is for the case where a user comes to our site
      // and ALREADY had their wallet connected + authorized.
      setupEventListener();
    } else {
      console.log('No authorized account found');
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Get MetaMask!');
        return;
      }

      /*
       * Fancy method to request access to account.
       */
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

      /*
       * Boom! This should print out public address once we authorize Metamask.
       */
      console.log('Connected', accounts[0]);
      setCurrentAccount(accounts[0]);

      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      setupEventListener();
    } catch (error) {
      console.log(error);
    }
  };

  const checkTotalNfsMinted = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        console.log('Checking cuantity left...');
        let nftsMinted = await connectedContract.getTotalNFTsMintedSoFar();
        console.log(nftsMinted);
        setTotalNftsMinted(nftsMinted);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const askContractToMintNft = async () => {
    setIsLoading(true);
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        console.log('Going to pop wallet now to pay gas...');
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log('Mining...please wait.');
        await nftTxn.wait();

        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
        checkTotalNfsMinted();
        setIsLoading(false);
      } else {
        console.log("Ethereum object doesn't exist!");
        setIsLoading(false);
      }
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on('NewEpicNFTMinted', (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          setOpenSeaLink(`https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`);
          return tokenId.toNumber();
        });

        console.log('Setup event listener!');
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Render Methods
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  /*
   * This runs our function when the page loads.
   */
  useEffect(() => {
    checkIfWalletIsConnected();
    checkNetwork();
    checkTotalNfsMinted();
  }, []);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">NFTs for Twitter fellows</p>
          <p className="sub-text">Because yolo.</p>
          {currentAccount === '' ? (
            renderNotConnectedContainer()
          ) : (
            <button onClick={askContractToMintNft} className="cta-button connect-wallet-button">
              Mint NFT
            </button>
          )}
          <br />
          {openSeaLink !== '' ? (
            <div style={{ margin: '20px 0px' }}>
              <p className="footer-text">
                Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on
                OpenSea.
              </p>
              <a target="_blank" href={openSeaLink} style={{ padding: '10px', textDecoration: 'none' }} className="cta-button connect-wallet-button">
                View your minted Nft in OpenSea
              </a>
            </div>
          ) : (
            <></>
          )}

          <div style={{ margin: '40px 0px' }}>
            <a target="_blank" href={OPENSEA_LINK} style={{ padding: '10px', textDecoration: 'none' }} className="cta-button connect-wallet-button">
              🌊 View Collection on OpenSea
            </a>
          </div>
          {isLoading ? <div class="lds-hourglass"></div> : <></>}
        </div>
        <div className="howto my-1">
          <div className='row'>
            <p>
              <h3 className="my-0 py-0">How to use:</h3>
              <br />
              <strong>Get Metamask:</strong>{' '}
              <a href="https://metamask.io/" target="_blank">
                https://metamask.io/
              </a>
              <br />
              <strong>Change your Metamask Wallet to Rinkeby Testnet: </strong>{' '}
              <a href="https://gist.github.com/tschubotz/8047d13a2d2ac8b2a9faa3a74970c7ef" target="_blank">
                How to change Metamask network to Rinkeby
              </a>
              <br />
              <strong>Get some fake ether:</strong>
              <br />
              <table className="border rounded p-3">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Link</th>
                    <th>Amount</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>MyCrypto</td>
                    <td>
                      <a href="https://app.mycrypto.com/faucet" target="_blank" rel="noreferrer">
                        https://app.mycrypto.com/faucet
                      </a>
                    </td>
                    <td>0.01</td>
                    <td>None</td>
                  </tr>
                  <tr>
                    <td>Buildspace</td>
                    <td>
                      <a href="https://buildspace-faucet.vercel.app/" target="_blank" rel="noreferrer">
                        https://buildspace-faucet.vercel.app/
                      </a>
                    </td>
                    <td>0.025</td>
                    <td>1d</td>
                  </tr>
                  <tr>
                    <td>Official Rinkeby</td>
                    <td>
                      <a href="https://faucet.rinkeby.io/" target="_blank" rel="noreferrer">
                        https://faucet.rinkeby.io/
                      </a>
                    </td>
                    <td>3 / 7.5 / 18.75</td>
                    <td>8h / 1d / 3d</td>
                  </tr>
                  <tr>
                    <td>Chainlink</td>
                    <td>
                      <a href="https://faucets.chain.link/rinkeby" target="_blank" rel="noreferrer">
                        https://faucets.chain.link/rinkeby
                      </a>
                    </td>
                    <td>0.1</td>
                    <td>None</td>
                  </tr>
                </tbody>
              </table>
              <br />
              <strong>Mint!</strong>
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }} className="footer-container">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
            <a className="footer-text" href={TWITTER_LINK} target="_blank" rel="noreferrer">{`built on @${TWITTER_HANDLE}`}</a>
          </div>
          <div className="footer-text">NFTs minted: {totalNftsMinted._hex}</div>
          <div className="footer-text">Max quantity: 0x50</div>
        </div>
      </div>
    </div>
  );
};

export default App;
