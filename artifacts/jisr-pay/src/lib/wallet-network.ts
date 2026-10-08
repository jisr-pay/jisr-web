import { AppError } from '@workspace/jisr-sdk';

/** A missing network report is not evidence that the wallet is on Testnet. */
export function assertWalletNetwork(details: unknown, expectedPassphrase: string): void {
  if (!details || typeof details !== 'object' || !('networkPassphrase' in details) ||
      'error' in details && details.error || typeof details.networkPassphrase !== 'string' || !details.networkPassphrase) {
    throw new AppError('NETWORK', 'Could not verify the wallet network. Reconnect Freighter on Test Net.');
  }
  if (details.networkPassphrase !== expectedPassphrase) {
    throw new AppError('WRONG_NETWORK', 'Freighter is set to the wrong network. Switch it to Test Net and try again.');
  }
}
