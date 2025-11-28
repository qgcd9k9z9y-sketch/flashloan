/**
 * Stellar Classic DEX (Orderbook) Scanner
 * 
 * Fetches prices from Stellar's native orderbook DEX
 */

import { logger } from '../utils/logger';
import { Token } from '../config/tokens';
import axios from 'axios';
import config from '../config/config';

export interface OrderbookPrice {
  tokenA: Token;
  tokenB: Token;
  bidPrice: number; // Best bid (buy) price
  askPrice: number; // Best ask (sell) price
  midPrice: number; // Mid-market price
  bidVolume: number;
  askVolume: number;
  timestamp: number;
}

export class StellarDexScanner {
  private horizonUrl: string;

  constructor() {
    this.horizonUrl = config.network.horizonUrl;
  }

  /**
   * Fetch orderbook for a token pair
   */
  async fetchOrderbook(tokenA: Token, tokenB: Token): Promise<OrderbookPrice | null> {
    try {
      logger.debug('Fetching Stellar orderbook', {
        pair: `${tokenA.symbol}/${tokenB.symbol}`,
      });

      // Build asset identifiers
      const sellingAsset = this.buildAssetParam(tokenA);
      const buyingAsset = this.buildAssetParam(tokenB);

      // Fetch orderbook from Horizon
      const url = `${this.horizonUrl}/order_book?${sellingAsset}&${buyingAsset}&limit=10`;
      const response = await axios.get(url);

      const { bids, asks } = response.data;

      if (!bids || !asks || bids.length === 0 || asks.length === 0) {
        logger.warn('Empty orderbook', { tokenA: tokenA.symbol, tokenB: tokenB.symbol });
        return null;
      }

      // Best bid and ask
      const bestBid = parseFloat(bids[0].price);
      const bestAsk = parseFloat(asks[0].price);
      const midPrice = (bestBid + bestAsk) / 2;

      const bidVolume = bids.reduce((sum: number, bid: any) => sum + parseFloat(bid.amount), 0);
      const askVolume = asks.reduce((sum: number, ask: any) => sum + parseFloat(ask.amount), 0);

      return {
        tokenA,
        tokenB,
        bidPrice: bestBid,
        askPrice: bestAsk,
        midPrice,
        bidVolume,
        askVolume,
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error('Failed to fetch Stellar orderbook', {
        pair: `${tokenA.symbol}/${tokenB.symbol}`,
        error,
      });
      return null;
    }
  }

  /**
   * Build asset parameter for Horizon API
   */
  private buildAssetParam(token: Token): string {
    if (token.isNative) {
      return 'selling_asset_type=native';
    }

    // For issued assets, need asset code and issuer
    // This is simplified - in reality, you'd need the issuer address
    return `selling_asset_type=credit_alphanum12&selling_asset_code=${token.symbol}&selling_asset_issuer=${token.address}`;
  }

  /**
   * Fetch multiple orderbooks in parallel
   */
  async fetchMultipleOrderbooks(
    pairs: Array<{ tokenA: Token; tokenB: Token }>
  ): Promise<OrderbookPrice[]> {
    const promises = pairs.map(({ tokenA, tokenB }) =>
      this.fetchOrderbook(tokenA, tokenB)
    );

    const results = await Promise.allSettled(promises);

    return results
      .filter((r): r is PromiseFulfilledResult<OrderbookPrice | null> => r.status === 'fulfilled')
      .map(r => r.value)
      .filter((p): p is OrderbookPrice => p !== null);
  }
}

export const stellarDexScanner = new StellarDexScanner();
export default stellarDexScanner;
