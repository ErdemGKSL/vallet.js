import stuffs from "stuffs";
import { Order, OrderConstructorContext } from "./Order";
import { CallbackManager } from "./CallbackManager";

interface ClientConstructorContext {
  username: string;
  password: string;
  shopCode: string;
  callbackFailUrl: string;
  callbackOkUrl: string;
  apiHash: string;
  defaults?: ClientConstructorDefaults;
}

interface ClientConstructorDefaults {
  /**
   * @description Maximum 200 characters
   * @default "Ödeme"
   */
  productName?: string;
  /**
   * @default "DIJITAL_URUN"
   */
  productType?: "DIJITAL_URUN" | "FIZIKSEL_URUN";
  /**
   * @default "tr"
   */
  locale?: "tr" | "en" | "de" | "ru";
  /**
   * @default "TRY"
   */
  currency?: "TRY" | "USD" | "EUR";
}

export class Client extends CallbackManager {
  username: string;
  password: string;
  shopCode: string;
  callbackOkUrl: URL;
  callbackFailUrl: URL;
  /** @private */
  callbackOkUrlString: string;
  /** @private */
  callbackFailUrlString: string;
  apiHash: string;
  defaults?: Required<ClientConstructorDefaults>;
  constructor(ctx: ClientConstructorContext) {
    super();
    this.username = ctx.username;
    this.password = ctx.password;
    this.shopCode = ctx.shopCode;
    this.apiHash = ctx.apiHash;
    this.callbackOkUrl = new URL(ctx.callbackOkUrl);
    this.callbackFailUrl = new URL(ctx.callbackFailUrl);
    this.callbackOkUrlString = ctx.callbackOkUrl;
    this.callbackFailUrlString = ctx.callbackFailUrl;
    this.defaults = stuffs.defaultify(ctx.defaults ?? {}, {
      productName: "Ödeme",
      productType: "DIJITAL_URUN",
      locale: "tr",
      currency: "TRY"
    }, true);
  }

  async createOrder(ctx: OrderConstructorContext): Promise<Order> {
    const order = new Order(this, ctx);
    await order.create();
    return order;
  }

  /**
   * @param args string arguments
   * @example
   * const hash = await client.fetchHash(client.username, client.password, client.shopCode, client.apiHash);
   */
  async fetchHash(...args: string[]): Promise<string> {
    const total = args.join("");

    const headers = new Headers();
    const body = new URLSearchParams();

    headers.append("Content-Type", "application/x-www-form-urlencoded");
    headers.append("Referer", this.callbackOkUrl.host);

    body.append("userName", this.username);
    body.append("password", this.password);
    body.append("shopCode", this.shopCode);

    body.append("string", total);

    const res = await fetch("https://www.vallet.com.tr/api/v1/generate-hash", {
      method: "POST",
      headers,
      body
    }).then(res => res.json());

    if (res.status !== "success") throw new Error(res.errorMessage);

    return res.hash_string;
  }
};