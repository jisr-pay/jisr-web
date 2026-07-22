# Jisr-Pay: Autonomous AI Agents for Cross-Border Payments

## 🚀 Pitch
Cross-border payments today are plagued by high fees, slow settlement times, and opaque routing. Traditional money transmitters often take 3-7% and multiple days to settle a transaction. 

**Jisr-Pay** fundamentally reimagines this architecture by combining **Stellar's near-instant, low-cost network** with **Autonomous AI Agents**. Instead of static routing, Jisr-Pay dynamically scouts, executes, and verifies transactions on-chain in seconds.

## 🤖 The Multi-Agent Architecture
Jisr-Pay operates using a pipeline of three specialized, autonomous AI agents working in sequence:

1. **Rate-Scout Agent**: Analyzes global liquidity pools and traditional fiat rails (Bank Wire, Mobile Money, Cash Pickup) against Stellar corridors. It mathematically guarantees the cheapest and fastest route.
2. **Router Agent**: Takes the optimal path identified by Rate-Scout and constructs the on-chain Stellar transaction. It validates wallet signatures, connects to the Freighter wallet, and securely signs and submits the payload to the network.
3. **Reconciler Agent**: Listens to the Stellar Horizon network to cryptographically verify the ledger state. Once the transaction hits consensus, the Reconciler generates a mathematically verifiable, branded PDF receipt confirming settlement.

## 🌟 Key Features
* **Live On-Chain Settlement**: Fully integrated with the Stellar testnet using `@stellar/stellar-sdk` and `@stellar/freighter-api`.
* **Zero-Knowledge UI**: Users simply input amounts; the AI agents handle the complexity of network fees, transaction enveloping, and ledger polling.
* **Branded PDF Receipts**: Auto-generated receipts via `jsPDF` providing immutable proof of the transaction hash and savings compared to traditional bank wires.
* **Client-Side Hardening**: Built-in rate limiting, error normalization, and network-mismatch detection to ensure safe transaction broadcasting.

## 🛠 Tech Stack
* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Radix UI.
* **Blockchain**: Stellar SDK, Freighter API, Horizon RPC.
* **Design**: Framer Motion (micro-animations), Canvas Confetti, custom UI components.
* **Deployment**: Vercel.

## 🌐 Live Demo & Testing
**Live URL**: [Insert your Vercel URL here]

### How to test:
1. Install the **Freighter Wallet** extension and switch it to **Testnet**.
2. Fund your wallet using the [Stellar Laboratory Faucet](https://laboratory.stellar.org/#account-creator).
3. Open the Jisr-Pay app and click **Launch App**.
4. Connect your Freighter wallet.
5. Enter a test amount to send and click **Initialize Transfer**.
6. Watch the AI Agents work in real-time, approve the transaction in Freighter, and download your branded PDF receipt once settled!
