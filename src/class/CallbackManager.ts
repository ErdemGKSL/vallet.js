import { EventEmitter } from "stream";
import { Router, Express } from "express";
import { Order } from "./Order";
import { Client } from "./Client";

type paymentStatus = "paymentWait" | "paymentVerification" | "paymentOk" | "paymentNotPaid";

export interface CallbackData {
  status: "success" | "error";
  /**
   * @description OrderID,currency,orderPrice,productsTotalPrice,productType,shopCode,MAGAZA_HASH değişkenlerinden birleştirilerek oluşturulan metnin işyeri hash kodunuzla şifrelenmiş halidir. Örnek Kod İnceleyiniz.
   */
  hash: string;
  /**
   * @type Ödenen sipariş tutarı
   */
  paymentAmount: number;
  orderPrice: number;
  productsTotalPrice: number;
  paymentCurrency: "TRY" | "USD" | "EUR";
  paymentType: "KART" | "BANKA_HAVALE" | "YURT_DISI";
  productType: "DIJITAL_URUN" | "FIZIKSEL_URUN";
  paymentTime: Date;
  /**
   * @description Sipariş oluştururken geri cevapta olmasını istediğiniz veri
   */
  conversationId?: string;
  /**
   * @description Siparişi oluştururken gönderdiğiniz, sisteminize ait sipariş numarası
   */
  orderId: string;
  /**
   * @description Mağaza kodunuz
   */
  shopCode: string;
  /**
   * @description Sipariş oluştururken gönderdiğiniz, siparişin para birimi
   */
  /**
   * @description Vallet tarafından oluşturulan sipariş numarası
   */
  valletOrderId: string;
  valletOrderNumber: string;
}

export class CallbackManager extends EventEmitter {
  constructor() {
    super();
  }

  public override on(event: paymentStatus, listener: (order: Order, data: CallbackData) => void): this {
    return super.on(event, listener);
  }

  public override emit(event: paymentStatus, order: Order, data: CallbackData): boolean {
    return super.emit(event, order, data);
  }
  
  bind<T extends Router | Express>(router: T, path: string, client: Client): T {
    return (router as any).post(path, (req, res) => {
      //@ts-ignore
      this.emit("raw", { ...(req.body ?? {})});
      const data = (req.body as (CallbackData & { paymentStatus: paymentStatus }));
      if (data.paymentTime) data.paymentTime = new Date(data.paymentTime + " GMT+3");
      const status = data.paymentStatus;
      delete data.paymentStatus;
      this.emit(status, client.orders.cache.get(data.orderId), data);
      res.send('OK');
    });
  }
}