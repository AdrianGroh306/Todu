const { exec } = require("child_process");
const url = "http://localhost:3000/?splash=1";

const cmd =
  process.platform === "darwin"
    ? "open"
    : process.platform === "win32"
      ? "start"
      : "xdg-open";

exec(`${cmd} "${url}"`);
console.log("Opening splash preview... (dev server must be running)");
