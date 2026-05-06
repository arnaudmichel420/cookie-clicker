const { createApp } = require("./app");
const { getPort } = require("./config/appConfig");

const app = createApp();
const port = getPort();

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
