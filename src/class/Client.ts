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
  callbackFailUrl: URL;
  callbackOkUrl: URL;
  apiHash: string;
  defaults?: Required<ClientConstructorDefaults>;
  constructor(ctx: ClientConstructorContext) {
    super();
    this.username = ctx.username;
    this.password = ctx.password;
    this.shopCode = ctx.shopCode;
    this.apiHash = ctx.apiHash;
    this.callbackFailUrl = new URL(ctx.callbackFailUrl);
    this.callbackOkUrl = new URL(ctx.callbackOkUrl);
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
};