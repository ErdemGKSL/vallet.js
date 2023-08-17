import { Client } from "./Client";
import { Order, OrderConstructorContext } from "./Order";
import { OrderCollection } from "./OrderCollection";

interface OrderManagerConstructorContext {
  getOrders?: () => Promise<OrderConstructorContext[]>;
  saveOrders?: (orders: OrderConstructorContext[], added?: OrderConstructorContext, removed?: OrderConstructorContext) => Promise<void> | void;
}

export class OrderManager {
  getOrders: () => Promise<OrderConstructorContext[]>;
  saveOrders: (orders: OrderConstructorContext[], added?: OrderConstructorContext, removed?: OrderConstructorContext) => Promise<void> | void;
  cache: OrderCollection;
  constructor(ctx: OrderManagerConstructorContext, private client: Client) {
    this.getOrders = ctx.getOrders ?? (async () => []);
    this.saveOrders = ctx.saveOrders ?? (() => {});
    this.cache = new OrderCollection([]);
    this.getOrders().then(orders => {
      this.cache = new OrderCollection(orders.map(order => new Order(this.client, order)));
    });
  }

  async add(order: Order): Promise<Order> {
    if (this.cache.has(order.orderId)) throw new Error("Order already exists");
    this.cache.set(order.orderId, order);
    await this.saveOrders(this.cache.saveable, order.toJSON(), null);
    return order;
  }

  get(orderId: string): Order | undefined {
    return this.cache.get(orderId);
  }

  async remove(orderId: string): Promise<boolean> {
    if (!this.cache.has(orderId)) return false;
    const order = this.cache.get(orderId);
    this.cache.delete(orderId);
    await this.saveOrders(this.cache.saveable, null, order.toJSON());
    return true;
  }
}