import { Order, OrderConstructorContext } from "./Order";

export class OrderCollection extends Map<string, Order> {

  constructor(orders: Order[]) {
    super(orders.map(order => [order.orderId, order]));
  }

  get saveable(): OrderConstructorContext[] {
    return [...this.values()].map(order => order.toJSON());
  }

}