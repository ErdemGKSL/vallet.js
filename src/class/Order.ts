import { Client } from "./Client";

export interface OrderConstructorContext {
  /**
   * @description Maximum 200 characters
   */
  productName?: string;
  products: Product[];
  productType?: "DIJITAL_URUN" | "FIZIKSEL_URUN";
  currency?: "TRY" | "USD" | "EUR" | "GBP" | "IRR" | "RUB";
  orderId: string;
  locale?: "tr" | "en" | "de" | "ru";
  /**
   * @description Maximum 200 characters
   */
  conversationId?: string;
  buyer: Buyer;
}

interface Buyer {
  name: string;
  surname: string;
  GsmNumber: string;
  email: string;
  address: string;
  country: string;
  city: string;
  district: string;
}

interface Product {
  productName: string;
  productPrice: number;
  productType?: "DIJITAL_URUN" | "FIZIKSEL_URUN";
}

export class Order implements Required<OrderConstructorContext> {
  productName: string;
  products: Product[];
  productType: "DIJITAL_URUN" | "FIZIKSEL_URUN";
  currency: "TRY" | "USD" | "EUR" | "GBP" | "IRR" | "RUB";
  orderId: string;
  locale: "tr" | "en" | "de" | "ru";
  conversationId: string;
  buyer: Buyer;
  created: boolean = false;
  paymentUrl: URL;
  valletId: number;
  constructor(private client: Client, ctx: OrderConstructorContext) {
    this.productName = ctx.productName ?? this.client.defaults.productName;
    this.products = ctx.products;
    this.productType = ctx.productType ?? this.client.defaults.productType;
    this.currency = ctx.currency ?? this.client.defaults.currency;
    this.orderId = ctx.orderId;
    this.locale = ctx.locale ?? this.client.defaults.locale;
    this.conversationId = ctx.conversationId;
    this.buyer = ctx.buyer;

    if (this.productName.length > 200) throw new Error("[Order] productName cannot be longer than 200 characters");
    if (this.conversationId && this.conversationId.length > 200) throw new Error("[Order] conversationId cannot be longer than 200 characters");
    this.products.forEach((product, i) => {
      if (product.productName.length > 200) throw new Error(`[Order] products[${i}].productName cannot be longer than 200 characters`);
      if (!product.productType) product.productType = this.productType;
    });
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

    body.append("productDate", JSON.stringify(this.products));
    body.append("productsTotalPrice", totalPrice.toString());
    body.append("orderPrice", totalPrice.toString());
    body.append("currency", this.currency);

    body.append("orderId", this.orderId);
    body.append("locale", this.locale);
    this.conversationId && body.append("conversationId", this.conversationId);

    body.append("buyerName", this.buyer.name);
    body.append("buyerSurName", this.buyer.surname);
    body.append("buyerGsmNo", this.buyer.GsmNumber);
    body.append("buyerEmail", this.buyer.email);
    body.append("buyerAdress", this.buyer.address);
    body.append("buyerCountry", this.buyer.country);
    body.append("buyerCity", this.buyer.city);
    body.append("buyerDistrict", this.buyer.district);

    body.append("callbackOkUrl", this.client.callbackOkUrl.toString());
    body.append("callbackFailUrl", this.client.callbackFailUrl.toString());

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
}