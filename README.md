# Txn Scraper For Ethereum
## What Is This?

A crude transaction data scraper using Etherscan. The script searches between a range of blocks in an iterative fashion.

## How Do I Use This?

1. Clone repository.
1. Run `npm install` or `yarn install` if you are using yarn.
1. Edit the `settings.json` file to fit your needs.
    1. `start_block` is the first block to begin scraping.
    1. `end_block` is what you think it is.
    1. `max_search_range` is the interval you want to search at within `start_block` and `end_block`.
    1. `address` is the address of whoever you are snooping, defaults to CryptoKitties Auction Contract.
    1. `api_key` is your Etherscan API key (optional but does increase available TPS when compared to no key).
    1. `min_time_between_requests` is dependent on your TPS (API key => 0.2 | no API key => 5.0).
5. Run `npm run search` or `yarn run search` to start scraping.

## This Script Sucks

Yes, I know. It's not finished lol.
