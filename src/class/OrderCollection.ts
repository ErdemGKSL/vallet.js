import { Order, OrderConstructorContext } from "./Order";

export class OrderCollection extends Map<string, Order> {

  constructor(orders: Order[]) {
    super(orders.map(order => [order.orderId, order]));
  }

  get saveable(): OrderConstructorContext[] {
    return [...this.values()].map(order => order.toJSON());
  }

  find(cb: (order: Order, index: number) => boolean): Order | undefined {
    const iteratableValues = this.values();

    for (let i = 0; i < (this.size + 1); i++) {
      const iteration = iteratableValues.next();
      if (!iteration.done) {
        const value = iteration.value as Order;
        if (cb(value, i)) return value;
      }
    }
  }

}