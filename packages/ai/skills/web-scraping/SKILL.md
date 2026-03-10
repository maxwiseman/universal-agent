---
name: web-scraping
description: Extract content from web pages. Use when the user wants to fetch, parse, or analyze web content.
---

# Web Scraping Skill

Help the user extract and process content from web pages.

## Approach

1. Use the sandbox to write and run a Node.js script that fetches the target URL
2. Parse the HTML response to extract the requested content
3. Return structured data or a summary

## Example Script

```javascript
const res = await fetch("https://example.com");
const html = await res.text();
// Parse and extract content...
console.log(html.slice(0, 500));
```

## Guidelines

- Always respect robots.txt and rate limits
- Handle errors gracefully (timeouts, 404s, etc.)
- For JavaScript-rendered pages, note that the sandbox doesn't have a browser — only static HTML can be fetched
- Prefer structured output (JSON) when extracting data
