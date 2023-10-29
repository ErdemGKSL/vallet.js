import { Client } from "./Client";
import Crypto from "crypto";
import { OrderManager } from "./OrderManager";

export interface OrderConstructorContext {
  /**
   * @description Sipariş yada Fatura Adı (Maximum 200 characters)
   */
  productName?: string;
  /**
   * @description Sepetteki ürünlerin listesi
   */
  products: Product[];
  /**
   * @description Ürünleriniz Kargo yoluyla gönderilecekse kesinlikle fiziksel ürün seçilmelidir.
   */
  productType?: "DIJITAL_URUN" | "FIZIKSEL_URUN";
  /**
   * @description Para Birimi TRY,EUR,USD Varsayılan Değer: TRY
   * @default "TRY"
   */
  currency?: "TRY" | "USD" | "EUR";
  /**
   * @description İlgili siparişinizin sizin sisteminiz tarafındaki sipariş ID yada Sipariş Kodu. Ödenmemiş bir sipariş yada benzersiz olmalıdır. (Maximum 50 characters)
   */
  orderId: string;
  locale?: "tr" | "en" | "de" | "ru";
  /**
   * @description İstekte gönderilirse response olarak size geri döndürülür. Request/response eşlemesi yapmak için kullanılır. (Maximum 200 characters)
   */
  conversationId?: string;
  buyer: Buyer;

  paymentUrl?: URL;
  valletId?: number;
}

export interface Buyer {
  name: string;
  surname: string;
  gsmNumber: string;
  email: string;
  address: string;
  country: string;
  city: string;
  district: string;
  ip: string;
}

export interface Product {
  productName: string;
  productPrice: number;
  productType?: "DIJITAL_URUN" | "FIZIKSEL_URUN";
}

export class Order implements Required<OrderConstructorContext> {
  productName: string;
  products: Product[];
  productType: "DIJITAL_URUN" | "FIZIKSEL_URUN";
  currency: "TRY" | "USD" | "EUR";
  orderId: string;
  locale: "tr" | "en" | "de" | "ru";
  conversationId: string;
  buyer: Buyer;
  created: boolean = false;
  refunded: boolean = false;
  paymentUrl: URL;
  valletId: number;

  constructor(private client: Client, ctx: OrderConstructorContext, mute: boolean = false) {
    this.productName = ctx.productName ?? this.client.defaults.productName;
    this.products = ctx.products;
    this.productType = ctx.productType ?? this.client.defaults.productType;
    this.currency = ctx.currency ?? this.client.defaults.currency;
    this.orderId = ctx.orderId;
    this.locale = ctx.locale ?? this.client.defaults.locale;
    this.conversationId = ctx.conversationId;
    this.buyer = ctx.buyer;

    this.paymentUrl = ctx.paymentUrl;
    this.valletId = ctx.valletId;

    if (this.productName.length > 200) throw new Error("[Order] productName cannot be longer than 200 characters");
    if (this.conversationId && this.conversationId.length > 200) throw new Error("[Order] conversationId cannot be longer than 200 characters");
    this.products.forEach((product, i) => {
      if (product.productName.length > 200) throw new Error(`[Order] products[${i}].productName cannot be longer than 200 characters`);
      if (!product.productType) product.productType = this.productType;
    });
    
    if (mute) this.client.orders.cache.set(this.orderId, this);
    else this.client.orders.add(this);
  }

  async create(): Promise<Order> {
    if (this.created) throw new Error("Order already created");

    const headers = new Headers();
    const body = new URLSearchParams();

    headers.append("Content-Type", "application/x-www-form-urlencoded");
    headers.append("Referer", this.client.callbackOkUrl.host);

    body.append("userName", this.client.username);
    body.append("password", this.client.password);
    body.append("shopCode", this.client.shopCode);

    const totalPrice = this.products.reduce((acc, product) => acc + product.productPrice, 0);

    body.append("productName", this.productName);

    body.append("hash",
      this.client.calculateHash(
        this.client.username,
        this.client.password,
        this.client.shopCode,
        this.orderId,
        this.currency,
        totalPrice.toString(),
        totalPrice.toString(),
        this.productType,
        this.client.callbackOkUrlString,
        this.client.callbackFailUrlString,
        this.client.apiHash
      )
    );

    body.append("productData", JSON.stringify(this.products));
    body.append("productType", this.productType);

    body.append("productsTotalPrice", totalPrice.toString());
    body.append("orderPrice", totalPrice.toString());
    body.append("currency", this.currency);

    body.append("orderId", this.orderId);
    body.append("locale", this.locale);
    this.conversationId && body.append("conversationId", this.conversationId);

    body.append("buyerName", this.buyer.name);
    body.append("buyerSurName", this.buyer.surname);
    body.append("buyerGsmNo", this.buyer.gsmNumber);
    body.append("buyerMail", this.buyer.email);
    body.append("buyerIp", this.buyer.ip);
    body.append("buyerAdress", this.buyer.address);
    body.append("buyerCountry", this.buyer.country);
    body.append("buyerCity", this.buyer.city);
    body.append("buyerDistrict", this.buyer.district);

    body.append("callbackOkUrl", this.client.callbackOkUrlString);
    body.append("callbackFailUrl", this.client.callbackFailUrlString);


    const response = await fetch("https://www.vallet.com.tr/api/v1/create-payment-link", {
      method: "POST",
      headers,
      body
    }).then(res => res.json());

    if (response.status !== "success") throw new Error(response.errorMessage);

    this.paymentUrl = new URL(response.payment_page_url);
    this.valletId = Number(response.ValletOrderId) || undefined;

    this.created = true;

    return this;
  }

  async refund(amount?: number): Promise<Order> {
    if (!this.created) throw new Error("Order not created");
    if (this.refunded) throw new Error("Order already refunded");

    const headers = new Headers();
    const body = new URLSearchParams();

    headers.append("Content-Type", "application/x-www-form-urlencoded");
    headers.append("Referer", this.client.callbackOkUrl.host);

    body.append("userName", this.client.username);
    body.append("password", this.client.password);
    body.append("shopCode", this.client.shopCode);

    body.append("valletOrderId", this.valletId.toString());
    body.append("orderId", this.orderId);

    const totalPrice = this.products.reduce((acc, product) => acc + product.productPrice, 0);
    const amountStr = amount?.toString() ?? totalPrice.toString();

    body.append("amount", amountStr);

    body.append("hash",
      this.client.calculateHash(
        this.client.username,
        this.client.password,
        this.client.shopCode,
        this.valletId.toString(),
        this.orderId,
        amountStr,
        this.client.apiHash
      )
    );

    const data = await fetch("https://www.vallet.com.tr/api/v1/create-refund", {
      method: "POST",
      headers,
      body
    }).then(res => res.json());

    if (data?.status !== "success") throw {
      message: data?.errorMessage,
      data
    };

    if (data?.status === "success") this.refunded = true;
    return this;
  }

  toJSON(): Required<OrderConstructorContext & { created: boolean, refunded: boolean }> {
    return {
      productName: this.productName,
      products: this.products,
      productType: this.productType,
      currency: this.currency,
      orderId: this.orderId,
      locale: this.locale,
      conversationId: this.conversationId,
      buyer: this.buyer,
      created: this.created,
      refunded: this.refunded,
      paymentUrl: this.paymentUrl,
      valletId: this.valletId
    };
  }

  static fromJSON(client: Client, json: Required<OrderConstructorContext & { created: boolean, refunded: boolean }>): Order {
    const order = new Order(client, json);
    order.created ??= json.created;
    order.refunded ??= json.refunded;
    return order;
  }
}