// Type declaration for optional @raydium-io/raydium-sdk dependency
// This allows the code to compile even if the package is not installed
declare module '@raydium-io/raydium-sdk' {
  export interface RaydiumConfig {
    connection: any;
    owner: any;
    disableLoadToken?: boolean;
  }

  export class Raydium {
    static load(config: RaydiumConfig): Promise<Raydium>;
    liquidity: {
      createPool(params: any): Promise<any>;
    };
  }

  export const RaydiumSDK: any;
  export default { Raydium, RaydiumSDK };
}

