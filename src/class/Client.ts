import stuffs from "stuffs";
import { Order, OrderConstructorContext } from "./Order";
import { CallbackData, CallbackManager } from "./CallbackManager";
import { OrderManager } from "./OrderManager";
import { Router, Express } from "express";

export interface ClientConstructorContext {
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

  orders: OrderManager;

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
    
    this.orders = new OrderManager(this);
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

  override bind<T extends Router | Express>(router: T, path: string): T {
    return super.bind(router, path, this);
  }
  
  override parseRequest(data: Omit<CallbackData, "checkHash" | "calculateHash" | "paymentTime"> & { paymentStatus: "paymentWait" | "paymentVerification" | "paymentOk" | "paymentNotPaid" }): { status: "paymentWait" | "paymentVerification" | "paymentOk" | "paymentNotPaid", order: Order | undefined, data: CallbackData } {
      return super.parseRequest(data, this);
  }
};