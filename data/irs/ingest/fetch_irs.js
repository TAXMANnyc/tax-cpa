// ingest/fetch_irs.js
import fs from "fs";
import path from "path";
import https from "https";

const OUTPUT_DIR = "data/irs";
const URL = "https://www.irs.gov/forms-pubs/about-publication-17";

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const html = await fetch(URL);

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "pub17_raw.html"),
    html,
    "utf8"
  );

  console.log("Fetched IRS Publication 17");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
