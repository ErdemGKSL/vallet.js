import { EventEmitter } from "stream";
import { Router, Express } from "express";

type paymentStatus = "paymentWait" | "paymentVerification" | "paymentOk" | "paymentNotPaid";

interface Callback {
  status: "success" | "error";
  /**
   * @description OrderID,currency,orderPrice,productsTotalPrice,productType,shopCode,MAGAZA_HASH değişkenlerinden birleştirilerek oluşturulan metnin işyeri hash kodunuzla şifrelenmiş halidir. Örnek Kod İnceleyiniz.
   */
  hash: string;
  /**
   * @type Ödenen sipariş tutarı
   */
  paymentAmount: number;
  paymentType: "KART" | "BANKA_HAVALE" | "YURT_DISI";
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
}

export class CallbackManager extends EventEmitter {
  constructor() {
    super();
  }

  public override on(event: "paymentWait", listener: (data: Callback) => void): this;
  public override on(event: "paymentVerification", listener: (data: Callback) => void): this;
  public override on(event: "paymentOk", listener: (data: Callback) => void): this;
  public override on(event: "paymentNotPaid", listener: (data: Callback) => void): this;

  public override on(event: paymentStatus, listener: (...args: Callback[]) => void): this {
    return super.on(event, listener);
  }

  public override emit(event: "paymentWait", data: Callback): boolean;
  public override emit(event: "paymentVerification", data: Callback): boolean;
  public override emit(event: "paymentOk", data: Callback): boolean;
  public override emit(event: "paymentNotPaid", data: Callback): boolean;

  public override emit(event: paymentStatus, ...args: Callback[]): boolean {
    return super.emit(event, ...args);
  }

  
  bind(router: Router | Express, path: string) {
    (router as any).post(path, (req, res) => {
      const data = (req.body as (Callback & { paymentStatus: paymentStatus }));
      const status = data.paymentStatus;
      delete data.paymentStatus;
      res.send({
        ok: true
      });
      this.emit(status as any, data);
    });
  }
}