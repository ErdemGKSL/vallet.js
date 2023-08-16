### Örnek
```js
const { Client } = require("vallet.js");
const express = require("express");

const client = new Client({
  username: string,
  password: string,
  shopCode: string,
  callbackFailUrl: string,
  callbackOkUrl: string,
  apiHash: string,
  defaults: {
    productName: string | undefined,
    productType: "DIJITAL_URUN" | "FIZIKSEL_URUN" | undefined,
    locale: "tr" | "en" | "de" | "ru" | undefined,
    currency: "TRY" | "USD" | "EUR" | undefined,
  }
});

client.createOrder({
  productName: string | undefined,
  products: [{
    productName: string;
    productPrice: number;
    productType: "DIJITAL_URUN" | "FIZIKSEL_URUN" | undefined;
  }],
  productType: "DIJITAL_URUN" | "FIZIKSEL_URUN" | undefined,
  currency: "TRY" | "USD" | "EUR" | undefined,
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

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

client.bind(app, "/vallet/callback");

client.on("paymentOk", (data) => {
  console.log(data);
});

```