import { getAddress, getNetworkDetails, signMessage } from '@stellar/freighter-api';
import { HistoryError, type HistoryWallet } from './remote-history.ts';

const networkPassphrase = 'Test SDF Network ; September 2015';
export const historyWallet: HistoryWallet = {
  async assertAccount(address) {
    const [account, network] = await Promise.all([getAddress(), getNetworkDetails()]);
    if (account.error || account.address !== address || network.error || network.networkPassphrase !== networkPassphrase) {
      throw new HistoryError('wallet');
    }
  },
  async sign(message, address) {
    await historyWallet.assertAccount(address);
    const result = await signMessage(message, { address, networkPassphrase });
    if (result.error || result.signerAddress !== address || !result.signedMessage) throw new HistoryError('wallet');
    await historyWallet.assertAccount(address);
    if (typeof result.signedMessage === 'string') return result.signedMessage;
    return btoa(Array.from(result.signedMessage, byte => String.fromCharCode(byte)).join(''));
  },
};
