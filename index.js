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
