const path = require("path");
const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("pages/home", {
    title: "Cookie Clicker",
    message: "Projet Express initialise avec EJS."
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
