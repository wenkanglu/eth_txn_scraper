import * as fs from "fs";

const ETHERSCAN_MAX_PAGE_SIZE = 10000;

let settingsJson;

try {
  let settingsFile = fs.readFileSync("settings.json");
  settingsJson = JSON.parse(settingsFile);
} catch (e) {
  console.log("Settings file not found - using defaults");

  settingsJson = {
    start_block: 4605169, // CryptoKitties genesis
    end_block: 15186229,
    max_search_range: 50000,
    address: "0xb1690c08e213a35ed9bab7b318de14420fb57d8c",
    api_key: "",
    min_time_between_requests: 0.2,
  };
}

if (settingsJson.api_key === "") {
  settingsJson.min_time_between_requests = 5.0;
}

let currentBlock = settingsJson.start_block;
let currentRange = settingsJson.max_search_range;
let finished = false;

let data = [];
let log = "";

let startTime = new Date().getTime();

if (!fs.existsSync("bin")) {
  fs.mkdirSync("bin");
}

while (!finished) {
  log = log.concat(
    `==========\nTimestamp: ${startTime}\nquerying between blocks ${currentBlock} and ${
      currentBlock + currentRange
    }...\n`
  );

  const start = new Date();

  // Get transaction data from Etherscan
  const result = await fetch(
    `https://api.etherscan.io/api?module=account&action=txlist&address=${
      settingsJson.address
    }&startblock=${currentBlock}&endblock=${Math.min(
      currentBlock + currentRange,
      settingsJson.end_block
    )}&sort=asc${
      settingsJson.api_key ? "&apiKey=" + settingsJson.api_key : ""
    }}`
  );

  const resultJson = await result.json();

  // 1 seems to be the OK status so we will only continue if we get a 1
  if (resultJson.status === "1") {
    // The pagination system of Etherscan API calls is busted so our strategy
    // is to reduce our search range by half every time we receive a full page
    // of items so that we know for a fact that all transactions for a given
    // range is returned in one call.
    if (resultJson.result.length === ETHERSCAN_MAX_PAGE_SIZE) {
      log = log.concat(
        `querying between blocks ${currentBlock} and ${
          currentBlock + currentRange
        } gave a full page - trying with smaller range\n`
      );
      currentRange = Math.floor(currentRange / 2);
    } else {
      log = log.concat(
        "received results less than max page size - writing to file...\n"
      );

      resultJson.result.forEach((r) => {
        data.push(r);
      });

      fs.writeFileSync(`bin/data-${startTime}.json`, JSON.stringify(data));

      currentBlock += currentRange;

      if (currentBlock >= settingsJson.end_block) {
        finished = true;
      }

      currentRange = settingsJson.max_search_range;
    }
  } else {
    log = log.concat(
      `received status other than 1 - message:\n${resultJson.message}\n`
    );
  }

  // Setting minimum time between calls to settingsJson.min_time_between_requests
  // (Etherscan provides 5 TPS when using a free API key and 0.2 TPS with no key)
  const end = new Date();
  const diffMilli = end.getTime() - start.getTime();

  if (diffMilli / 1000 < settingsJson.min_time_between_requests) {
    await new Promise((resolve) =>
      setTimeout(resolve, settingsJson.min_time_between_requests * 1000)
    );
  }

  log = log.concat(
    `Seconds since start: ${(new Date().getTime() - startTime) / 1000}\n`
  );

  fs.appendFileSync(`bin/log-${startTime}.txt`, log);
  log = "";
}
