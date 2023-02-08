/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
}

export default {	async fetch(_request: any) {
	const html = `
	<!DOCTYPE html>
	<html>
	<head>
	  <meta charset="utf-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1">
	  <title>ERC20 Permit</title>
	  
	  <script src="https://cdn.jsdelivr.net/npm/@walletconnect/web3-provider@1.8.0/dist/umd/index.min.js"></script>
	  <script src="https://cdn.jsdelivr.net/npm/web3@latest/dist/web3.min.js"></script>
	  <script src="https://cdn.jsdelivr.net/npm/web3modal@1.9.9/dist/index.min.js"></script>
	  
	  <script src="https://bundle.run/buffer@6.0.3"></script>
	  <script src="https://cdn.jsdelivr.net/npm/luxon"></script>
	</head>
	<body>
	  <script type="text/javascript">
		var DateTime = luxon.DateTime;
		window.Buffer = buffer.Buffer // getting this from buffer module for frontend.
	
		const domainName = "MUZA2" // put your token name 
		const domainVersion = "1" // leave this to "1"
		const chainId = 5 // this is for the chain's ID. value is 1 for remix
		const contractAddress = "0x93aD91e3a2cEc1848a40140dda787B78CF640138" // Ka finance token // Put the address here from remix
	
		var account = null;
	
		const domain = {
		  name: domainName,
		  version: domainVersion,
		  verifyingContract: contractAddress,
		  chainId
		}
	
		const domainType = [
		  { name: 'name', type: 'string' },
		  { name: 'version', type: 'string' },
		  { name: 'chainId', type: 'uint256' },
		  { name: 'verifyingContract', type: 'address' },
		]
		
		const connect = async () => {
		  // This helps connect webpage to wallet.
		  const providerOptions = {
			walletconnect: {
			  package: WalletConnectProvider.default, // required
			  options: {
				rpc: {
				  1: "https://cloudflare-eth.com",
				  137: "https://polygon-rpc.com",
				  // ...
				},
			  }
			}
		  };
	
		  const Web3Modal = window.Web3Modal.default;
		  const web3Modal = new Web3Modal({
			network: "goerli", // optional
			cacheProvider: false, // optional
			providerOptions, // required
			theme: "dark"
		  });
	
		  const provider = await web3Modal.connect();
	
		  window.web3 = new Web3(provider);
		  var accounts = await web3.eth.getAccounts();
		  account = accounts[0];
		  console.log(\`account: $\{account\}\`);
		}
	
		const splitSig = (sig) => {
		  // splits the signature to r, s, and v values.
		  const pureSig = sig.replace("0x", "")
	
		  const r = new Buffer(pureSig.substring(0, 64), 'hex')
		  const s = new Buffer(pureSig.substring(64, 128), 'hex')
		  const v = new Buffer((parseInt(pureSig.substring(128, 130), 16)).toString());
	
		  return {
			r, s, v
		  }
		}
	
		const signTyped = (dataToSign) => {
		  // call this method to sign EIP 712 data
		  return new Promise((resolve, reject) => {
			web3.currentProvider.sendAsync({
			  method: "eth_signTypedData_v4",
			  params: [account, dataToSign],
			  from: account
			}, (err, result) => {
			  if (err) return reject(err);
			  resolve(result.result)
			})
		  })
		}
	
		async function createPermit(spender, value, nonce, deadline) {
		  const permit = { owner: account, spender, value, nonce, deadline }
		  const Permit = [
			{ name: "owner", type: "address" },
			{ name: "spender", type: "address" },
			{ name: "value", type: "uint256" },
			{ name: "nonce", type: "uint256" },
			{ name: "deadline", type: "uint256" },
		  ]
		  
		  const dataToSign = JSON.stringify({
			  types: {
				  EIP712Domain: domainType,
				  Permit: Permit
			  },
			  domain: domain,
			  primaryType: "Permit",
			  message: permit
		  });
	
		  const signature = await signTyped(dataToSign)
		  const split = splitSig(signature)
	
		  return {
			...split, signature, dataToSign
		  }
		}
	
		async function main() {
		  await connect()
		  const exportedDate = DateTime.now().plus({days: 5}).toUnixInteger();
		  console.log(\`expired in 5 days on $\{exportedDate\}\`)
		  const permit = await createPermit("0xE356dCdeB27A4C971983137725A1a3a4378F6Ca5", 1000, 0, exportedDate)
		  console.log(\`r: 0x$\{permit.r.toString(\'hex\')}, s: 0x$\{permit.s.toString('hex')\}, v: $\{permit.v\}, sig: $\{permit.signature\}\`)
		  console.log(\`$\{permit.dataToSign\}\`);
		}
	  </script>
	</body>
	</html>
	`;
	return new Response(html, {			headers: {				'content-type': 'text/html;charset=UTF-8',			},		});	},
};

