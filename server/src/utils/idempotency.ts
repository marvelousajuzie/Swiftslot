import crypto from "crypto"
import { IdempotencyKey } from "../models"

export class IdempotencyManager {
  /**
   * Check if request is idempotent and return cached response if exists
   */
  static async checkIdempotency(
    key: string,
    scope: string,
    requestData: any,
  ): Promise<{ isReplay: boolean; cachedResponse?: any }> {
    if (!key) {
      return { isReplay: false }
    }

    const existingKey = await IdempotencyKey.findByPk(key)

    if (existingKey) {
      // Verify the request data matches
      const requestHash = this.hashRequest(requestData)

      if (existingKey.responseHash === requestHash) {
        return {
          isReplay: true,
          cachedResponse: existingKey.responseData,
        }
      } else {
        throw new Error("Idempotency key reused with different request data")
      }
    }

    return { isReplay: false }
  }

  /**
   * Store idempotency key with response
   */
  static async storeIdempotency(key: string, scope: string, requestData: any, responseData: any): Promise<void> {
    if (!key) return

    const requestHash = this.hashRequest(requestData)

    await IdempotencyKey.create({
      keyValue: key,
      scope,
      responseHash: requestHash,
      responseData,
    })
  }

  private static hashRequest(data: any): string {
    return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex")
  }
}
