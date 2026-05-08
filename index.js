const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const FRENET_TOKEN = process.env.FRENET_TOKEN;
const SHOPIFY_TOKEN = process.env.SHOPIFY_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const FRENET_API_URL = "https://api.frenet.com.br/shipping/quote";
const FUSO_HORARIO = "America/Sao_Paulo";
const CORTE_HORA = 10;
const DIAS_ANTES = 1;
const DIAS_DEPOIS = 2;

function calcularBufferDias() {
  const agora = new Date();
  const horaLocal = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO_HORARIO,
    hour: "numeric",
    hour12: false,
  }).format(agora);
  const hora = parseInt(horaLocal, 10);
  re
