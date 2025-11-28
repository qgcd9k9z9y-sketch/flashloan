/**
 * Stellar/Soroban Client Wrapper
 * 
 * Provides simplified interface to Stellar network and Soroban RPC
 */

import { 
  Keypair, 
  Networks, 
  SorobanRpc, 
  TransactionBuilder,
  Contract,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk';
import config from '../config/config';
import { logger } from './logger';

export class StellarClient {
  private rpcServer: SorobanRpc.Server;
  private keypair: Keypair;
  private network: Networks;

  constructor() {
    this.rpcServer = new SorobanRpc.Server(config.network.sorobanRpc);
    
    // Load keypair from config
    if (!config.wallet.secretKey) {
      throw new Error('Bot secret key not configured');
    }
    
    this.keypair = Keypair.fromSecret(config.wallet.secretKey);
    this.network = config.network.isTestnet ? Networks.TESTNET : Networks.PUBLIC;
    
    logger.info('Stellar client initialized', { 
      publicKey: this.keypair.publicKey(),
      network: config.network.isTestnet ? 'testnet' : 'mainnet',
    });
  }

  /**
   * Get account information
   */
  async getAccount() {
    return await this.rpcServer.getAccount(this.keypair.publicKey());
  }

  /**
   * Get contract instance
   */
  getContract(contractId: string): Contract {
    return new Contract(contractId);
  }

  /**
   * Build a transaction for simulation (without signing)
   */
  buildTransaction(operations: any[]): any {
    // For now, create a simple transaction builder
    // This will be used for simulation/read-only calls
    return new TransactionBuilder(
      {
        accountId: () => this.keypair.publicKey(),
        sequenceNumber: () => '0',
        incrementSequenceNumber: () => {},
      } as any,
      {
        fee: '100',
        networkPassphrase: this.network,
      }
    ).setTimeout(30);
  }

  /**
   * Get RPC server instance
   */
  get server(): SorobanRpc.Server {
    return this.rpcServer;
  }

  /**
   * Build and submit a transaction
   */
  async buildAndSubmitTransaction(
    operations: any[],
    memo?: string
  ): Promise<SorobanRpc.Api.GetTransactionResponse> {
    try {
      const account = await this.getAccount();
      
      const txBuilder = new TransactionBuilder(account, {
        fee: '1000000', // 1 XLM max fee
        networkPassphrase: this.network,
      });

      // Add operations
      operations.forEach(op => txBuilder.addOperation(op));

      // Add memo if provided (skip for now)
      // if (memo) {
      //   txBuilder.addMemo(memo);
      // }

      // Build and sign
      const tx = txBuilder.setTimeout(30).build();
      tx.sign(this.keypair);

      // Submit
      logger.info('Submitting transaction', { hash: tx.hash().toString('hex') });
      const response = await this.rpcServer.sendTransaction(tx);

      if (response.status === 'ERROR') {
        throw new Error(`Transaction failed: ${response.errorResult}`);
      }

      // Wait for confirmation
      let getResponse = await this.rpcServer.getTransaction(response.hash);
      const startTime = Date.now();
      const timeout = config.execution.txTimeoutSeconds * 1000;

      while (getResponse.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
        if (Date.now() - startTime > timeout) {
          throw new Error('Transaction confirmation timeout');
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        getResponse = await this.rpcServer.getTransaction(response.hash);
      }

      if (getResponse.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
        logger.info('Transaction confirmed', { hash: response.hash });
      } else {
        logger.error('Transaction failed', { status: getResponse.status });
      }

      return getResponse;
    } catch (error) {
      logger.error('Transaction error', { error });
      throw error;
    }
  }

  /**
   * Invoke a contract function
   */
  async invokeContract(
    contractId: string,
    method: string,
    args: any[]
  ): Promise<any> {
    try {
      const contract = this.getContract(contractId);
      const account = await this.getAccount();

      // Build operation
      const operation = contract.call(method, ...args.map(arg => nativeToScVal(arg)));

      // Simulate first
      const txBuilder = new TransactionBuilder(account, {
        fee: '100000',
        networkPassphrase: this.network,
      });

      txBuilder.addOperation(operation);
      const tx = txBuilder.setTimeout(30).build();

      const simulated = await this.rpcServer.simulateTransaction(tx);

      if (SorobanRpc.Api.isSimulationError(simulated)) {
        throw new Error(`Simulation failed: ${simulated.error}`);
      }

      // Execute
      const response = await this.buildAndSubmitTransaction([operation]);

      // Parse result
      if (response.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS && response.returnValue) {
        return scValToNative(response.returnValue);
      }

      throw new Error('Contract invocation failed');
    } catch (error) {
      logger.error('Contract invocation error', { contractId, method, error });
      throw error;
    }
  }

  /**
   * Get network fees
   */
  async getNetworkFees(): Promise<number> {
    try {
      // const latestLedger = await this.rpcServer.getLatestLedger();
      return 100; // Default base fee
    } catch (error) {
      logger.warn('Failed to fetch network fees, using default', { error });
      return 100;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(tokenAddress?: string): Promise<string> {
    try {
      const account = await this.getAccount();
      
      if (!tokenAddress) {
        // Native XLM balance
        const balance = (account as any).balances?.find((b: any) => b.asset_type === 'native');
        return balance ? balance.balance : '0';
      }

      // Token balance (would need to call token contract)
      // TODO: Implement token balance fetching
      return '0';
    } catch (error) {
      logger.error('Failed to fetch balance', { error });
      throw error;
    }
  }

  /**
   * Get public key
   */
  getPublicKey(): string {
    return this.keypair.publicKey();
  }

  /**
   * Get RPC server
   */
  getRpcServer(): SorobanRpc.Server {
    return this.rpcServer;
  }
}

// Singleton instance
export const stellarClient = new StellarClient();

// Helper function to get client instance
export function getStellarClient(): StellarClient {
  return stellarClient;
}

export default stellarClient;
