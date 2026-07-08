const http = require("http");

function get(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: "localhost", port: 3000, path }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, data, cookies: res.headers["set-cookie"] }));
    }).on("error", reject);
  });
}

function post(path, body, cookie) {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams(body).toString();
    const req = http.request(
      {
        hostname: "localhost",
        port: 3000,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(data),
          Cookie: cookie || "",
        },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            location: res.headers.location,
            data: body.slice(0, 300),
          })
        );
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  const providers = await get("/api/auth/providers");
  console.log("providers", providers.status, providers.data.slice(0, 200));

  const csrf = await get("/api/auth/csrf");
  console.log("csrf", csrf.status, csrf.data);
  const token = JSON.parse(csrf.data).csrfToken;
  const cookie = (csrf.cookies || []).map((c) => c.split(";")[0]).join("; ");

  const signin = await post(
    "/api/auth/signin/google",
    { csrfToken: token, callbackUrl: "http://localhost:3000/auth/continue" },
    cookie
  );
  console.log("signin status", signin.status);
  console.log("signin location", signin.location);

  if (signin.location) {
    const u = new URL(signin.location);
    console.log("oauth host", u.hostname);
    console.log("redirect_uri", u.searchParams.get("redirect_uri"));
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
