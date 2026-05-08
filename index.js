const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const FRENET_TOKEN = process.env.FRENET_TOKEN;
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
  return hora < CORTE_HORA ? DIAS_ANTES : DIAS_DEPOIS;
}

app.post("/quote", async (req, res) => {
  try {
    const payload = req.body;
    const buffer = calcularBufferDias();

    const frenetResponse = await axios.post(FRENET_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "token": FRENET_TOKEN,
      },
    });

    const data = frenetResponse.data;

    if (Array.isArray(data.ShippingSevicesArray)) {
      data.ShippingSevicesArray = data.ShippingSevicesArray.map(function(servico) {
        if (servico.DeliveryTime != null) {
          const original = parseInt(servico.DeliveryTime, 10);
          const ajustado = original + buffer;
          return Object.assign({}, servico, { DeliveryTime: ajustado });
        }
        return servico;
      });
    }

    return res.json(data);
  } catch (err) {
    console.error("Erro Frenet:", err.message);
    return res.status(500).json({ error: "Erro ao consultar a Frenet." });
  }
});

app.get("/", function(req, res) {
  res.json({ status: "ok", message: "Middleware Frenet ativo" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log("Middleware rodando na porta " + PORT);
});
