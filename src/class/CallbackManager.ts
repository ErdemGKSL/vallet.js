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

  public override on(event: paymentStatus, listener: (data: Callback) => void): this {
    return super.on(event, listener);
  }

  public override emit(event: paymentStatus, data: Callback): boolean {
    return super.emit(event, data);
  }
  
  bind<T extends Router | Express>(router: T, path: string): T {
    return (router as any).post(path, (req, res) => {
      const data = (req.body as (Callback & { paymentStatus: paymentStatus }));
      const status = data.paymentStatus;
      delete data.paymentStatus;
      res.send({
        ok: true
      });
      this.emit(status, data);
    });
  }
}