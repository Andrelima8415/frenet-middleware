const express = require("express");
const app = express();
app.use(express.json());

app.get("/", function(req, res) {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log("Porta " + PORT);
});
