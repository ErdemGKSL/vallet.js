import { EventEmitter } from "stream";
import { Router } from "express";
interface Callback {
  status: "success" | "error";
  hash: string;
  paymentAmount: number;
  paymentType: "KART" | "BANKA_HAVALE" | "YURT_DISI";
  conversationId?: string;
  orderId: string;
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

  public override on(event: string, listener: (...args: Callback[]) => void): this {
    return super.on(event, listener);
  }
  
  bind(router: Router, path: string) {
    router.post(path, (req, res) => {
      const data = req.body;
      this.emit(data.paymentStatus, data);
      res.send({
        ok: true
      })
    });
  }
}