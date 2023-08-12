### Örnek
```js
const { Client } = require("vallet.js");
const client = new Client({
  username: string,
  password: string,
  shopCode: string,
  callbackFailUrl: string,
  callbackOkUrl: string,
  defaults: {
    productName: string | undefined,
    productType: "DIJITAL_URUN" | "FIZIKSEL_URUN" | undefined,
    locale: "tr" | "en" | "de" | "ru" | undefined,
    currency: "TRY" | "USD" | "EUR" | "GBP" | "IRR" | "RUB" | undefined,
  };
});

client.createOrder({
  productName: string | undefined,
  products: {
    productName: string;
    productPrice: number;
    productType: "DIJITAL_URUN" | "FIZIKSEL_URUN" | undefined;
  }[],
  productType: "DIJITAL_URUN" | "FIZIKSEL_URUN" | undefined,
  currency: "TRY" | "USD" | "EUR" | "GBP" | "IRR" | "RUB" | undefined,
  orderId: string,
  locale: "tr" | "en" | "de" | "ru" | undefined,
  conversationId: string | undefined,
  buyer: {
    name: string,
    surname: string,
    gsmNumber: string,
    email: string,
    address: string,
    country: string,
    city: string,
    district: string
  }
});

const router = new Router();

client.bind(router, "/vallet/callback");

client.on("paymentOk", (data) => {
  console.log(data);
});

```