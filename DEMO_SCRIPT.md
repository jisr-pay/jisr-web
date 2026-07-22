# Jisr-Pay Demo Video Script (2 Minutes)

This script is designed to be recorded as a continuous screen-share demo. It highlights the problem, the solution, and the technical implementation of the AI agents and Stellar integration.

---

### [0:00-0:15] Introduction (Screen: Jisr-Pay Landing Page)
**Speaker:**
> "Hi, I'm [Your Name]. Welcome to Jisr-Pay. Traditional cross-border payments are broken—they take days to settle and cost upwards of 7% in fees. We built Jisr-Pay to fix this by combining Stellar's near-instant network with autonomous AI agents that handle the complex routing and settlement for you."

### [0:15-0:35] The Problem & Dashboard (Screen: Click 'Launch App', show the Dashboard)
**Speaker:**
> "Let me show you how it works. When I open the app, I get a clean, zero-knowledge interface. The user doesn't need to know about liquidity pools or blockchains. They just want to send money."
*(Action: Click 'Connect Wallet' and select Freighter. Show that your wallet is connected.)*
> "I've connected my Freighter wallet on the Stellar Testnet. Let's send $50."
*(Action: Type '50' into the amount input and click 'Initialize Transfer'.)*

### [0:35-1:10] The AI Agents in Action (Screen: The Agent Pipeline UI)
**Speaker:**
> "This is where the magic happens. Under the hood, a pipeline of three specialized AI agents takes over."
*(Action: Highlight the screen as 'Rate-Scout' runs.)*
> "First, the **Rate-Scout Agent** analyzes traditional fiat rails like Bank Wire and Western Union against the Stellar network. It mathematically guarantees the cheapest route—saving me over $15 on this transaction."
*(Action: Highlight the screen as 'Router' runs and Freighter pops up.)*
> "Next, the **Router Agent** takes that optimal path, constructs the Stellar transaction envelope, validates my keys, and securely requests my signature."
*(Action: Click 'Approve' in the Freighter wallet popup.)*

### [1:10-1:30] Settlement & Verification (Screen: Reconciler runs, Success screen appears)
**Speaker:**
> "Finally, the **Reconciler Agent** takes over. It broadcasts the signed transaction to the Horizon network and listens for cryptographical consensus. Once settled, it locks the state."
*(Action: Point to the transaction hash and the 'Download Receipt' button.)*
> "In under 5 seconds, the transaction is fully settled on-chain. We provide the exact transaction hash right here."

### [1:30-2:00] The PDF Receipt & Conclusion (Screen: Click 'Download Receipt', open the PDF)
**Speaker:**
> "The Reconciler also generates an immutable, branded PDF receipt proving the settlement and highlighting the exact savings compared to a bank wire."
*(Action: Open the downloaded PDF receipt on screen.)*
> "As you can see, Jisr-Pay entirely abstracts away the complexity of crypto. It provides a Web2-like experience powered by AI agents, settling instantly on Stellar Web3 rails. Thank you for watching!"

---

### Tips for Recording:
- Practice the flow once or twice before recording to ensure Freighter pops up smoothly.
- Ensure your Freighter wallet is on the **Testnet** and has test XLM/USDC from the Stellar Laboratory.
- Keep the energy high and highlight the speed when the transaction settles!
