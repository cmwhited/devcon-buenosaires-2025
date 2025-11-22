import { AuthTokenClaims, PrivyClient, User } from "@privy-io/server-auth"
import { Address, getAddress } from "viem"

import { env } from "./env/server.ts"

class AuthClient extends PrivyClient {
  async verifyAuthTokenAndFetchUser(token: string): Promise<
    Readonly<{
      claims: AuthTokenClaims
      user: User
    }>
  > {
    const claims = await this.verifyAuthToken(token)
    const user = await this.getUserById(claims.userId)

    return {
      claims,
      user,
    } as const
  }

  fetchUserAddress(user: User): Address | string {
    if (user.smartWallet?.address) {
      return getAddress(user.smartWallet.address)
    }
    if (user.wallet?.address) {
      return getAddress(user.wallet.address)
    }
    return user.id
  }
}

export const authClient = new AuthClient(env.PRIVY_APP_ID, env.PRIVY_APP_SECRET)
