export function getHtml(name: string) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>vite-plugin-vercel example</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
  <h1>${name}</h1>
  <ul>
    <li><a href="/">/</a></li>
    <li><a href="/edge">/edge</a></li>
    <li><a href="/headers">/headers</a></li>
    <li><a href="/isr">/isr</a></li>
  </ul>
</body>
</html>`;
}
