import EventEmitter from "stream";
import { Client, ClientConstructorContext } from "./Client";
import { Order, OrderConstructorContext } from "./Order";
import { OrderCollection } from "./OrderCollection";

// type OrderManagerConstructorContext = ClientConstructorContext["data"];
type SaveableOrder = OrderConstructorContext & { created: boolean, refunded: boolean }

export class OrderManager extends EventEmitter {
  cache: OrderCollection = new OrderCollection([]);
  constructor(private client: Client) {
    super();
  }

  add(order: Order): Order {
    this.cache.set(order.orderId, order);
    this.emit("add", order);
    return order;
  }

  /**
   * @deprecated instead use OrderManager#resolve
   */
  get(orderId: string): Order | undefined {
    return this.cache.get(orderId);
  }

  resolve(orderId: string): Order | undefined {
    return this.cache.get(orderId);
  }

  remove(orderId: string): boolean {
    if (!this.cache.has(orderId)) return false;
    const order = this.cache.get(orderId);
    this.cache.delete(orderId);
    this.emit("remove", order);
    return true;
  }

  addBulk(orders: SaveableOrder[]): this {
    this.emit("bulkAdd", orders.map(order => new Order(this.client, order, true)));
    return this;
  }

  override on(event: "add", listener: (order: Order) => void): this;
  override on(event: "remove", listener: (order: Order) => void): this;
  override on(event: "bulkAdd", listener: (orders: Order[]) => void): this;

  override on(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  override emit(event: "add", order: Order): boolean;
  override emit(event: "remove", order: Order): boolean;
  override emit(event: "bulkAdd", orders: Order[]): boolean;

  override emit(event: string, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }
}