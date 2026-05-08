const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const FRENET_TOKEN = process.env.FRENET_TOKEN;
const SHOPIFY_TOKEN = process.env.SHOPIFY_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const FRENET_URL = "https://api.frenet.com.br/shipping/quote";
const FUSO = "America/Sao_Paulo";
const CORTE = 10;
const ANTES = 1;
const DEPOIS = 2;

function buffer() {
  const hora = parseInt(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: FUSO,
      hour: "numeric",
      hour12: false
    }).format(new Date()),
    10
  );
  return hora < CORTE ? ANTES : DEPOIS;
}

function dataEntrega(diasUteis) {
  const d = new Date();
  let count = 0;
  while (count < diasUteis) {
    d.setDate(d.getDate() + 1);
    const dia = d.getDay();
    if (dia !== 0 && dia !== 6) count++;
  }
  return d.toISOString();
}

app.post("/shopify/rates", async function(req, res) {
  try {
    const rate = req.body.rate;
    const itens = rate.items;
    const buf = buffer();
    const payload = {
      SellerCEP: rate.origin.postal_code.replace("-", ""),
      RecipientCEP: rate.destination.postal_code.replace("-", ""),
      ShipmentInvoiceValue: itens.reduce(function(a, i) {
        return a + (i.price * i.quantity / 100);
      }, 0),
ShippingItemArray: itens.map(function(i) {
        return {
          Height: 10,
          Length: 15,
          Quantity: i.quantity,
          Weight: i.grams / 1000,
          Width: 10,
          SKU: i.sku || "produto"
        };
      })
    };
    const resp = await axios.post(FRENET_URL, payload, {
      headers: { "Content-Type": "application/json", "token": FRENET_TOKEN }
    });
    const servicos = resp.data.ShippingSevicesArray || [];
    const rates = servicos.filter(function(s) {
      return !s.Error;
    }).map(function(s) {
      const prazo = parseInt(s.DeliveryTime, 10) + buf;
      return {
        service_name: s.ServiceDescription,
        service_code: s.ServiceCode,
        total_price: Math.round(parseFloat(s.ShippingPrice) * 100),
        currency: "BRL",
        min_delivery_date: dataEntrega(prazo),
        max_delivery_date: dataEntrega(prazo)
      };
    });
    return res.json({ rates: rates });
  } catch (err) {
    console.error("Erro rates:", err.message);
    return res.status(500).json({ rates: [] });
  }
});

app.get("/registrar", async function(req, res) {
  try {
    const resp = await axios.post(
      "https://" + SHOPIFY_STORE + "/admin/api/2026-04/carrier_services.json",
      {
        carrier_service: {
          name: "Frenet Middleware",
          callback_url: "https://frenet-middleware-production.up.railway.app/shopify/rates",
          service_discovery: true
        }
      },
      {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_TOKEN,
          "Content-Type": "application/json"
        }
      }
    );
    return res.json({ sucesso: true, data: resp.data });
  } catch (err) {
    return res.status(500).json({ erro: err.response ? err.response.data : err.message });
  }
});

app.get("/", function(req, res) {
  res.json({ status: "ok", message: "Middleware Frenet ativo" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log("Porta " + PORT);
});
