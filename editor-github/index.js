// import { Octokit } from "@octokit/rest";
// const { createAppAuth, createOAuthUserAuth } = require("@octokit/auth-app");

const { Octokit } = require("@octokit/rest");
const { createAppAuth, createOAuthUserAuth } = require("@octokit/auth-app");
const functions = require('@google-cloud/functions-framework');


const auth = createAppAuth({
  appId: 249526,
  privateKey: `-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEA67kUgYWqF09F00lyKrXFCWm4YPQgVVQt4vPmNeDqQKZ5qRiE
Qkj0GlcR84eCro6uSbXFVfKDbckoDi6uLcfkPT0E6EfBp9htmhcvaauZ+gAs5nWy
jArTnLBsGpjvU2+p9GCSMfHbCxdNq0bbJ2AwoJR3rE2UpgdOZ4Hdv5DpgWby/jqo
nJ6rpzzKUWq3RBLZuLMxsKdRwziVk0s94S779loM6SsJ1d70kP1vzq71W9UGsk3Y
ZcvRk91UAv13Kq2+5+LykiZoU89winXbRKH9znScR/g8896a/z/+HTW4dasIQEpr
i1I3IE5jLzHvr1sVuexwHMMYw+8tb/RvCfBMzQIDAQABAoIBAGenAN9beUm6sAeS
mkMxnqze8hagAr/CvlK30RkMB7XZ/lFe2HmVPtF+TAR8J/i+AOGkrlt2wlg6RgTG
fgzfgvtyo3/IXd2Ci99gJpcewBxwi03jn1l5QUf7Q+4GJebYiTFObbrMkPc1jg+s
np2X7IoP/vejPaQsPkvBjVK5VBRz6mQaPrlaS030NGVyrC0gBEy7DkxQbyH1Dpbx
9J4sU3aV+p1anW6xEv/FryGkkSDketwpjUKX6MMtRKi76+Qq0ZnRl2zXBNWO5++p
FM4l5eVCe4BVLEGUsxjJ91IG2XjmC4t+p7+ULafGrrWqScbDP8PujV1C894uuz0n
jhvmYMECgYEA/pvEAivLAtvKGEO55T+5P15QqZQDveaKGc2M2/mrCKNUNZxz1tbY
y2BOkQ6hk3C7wvmwJ+nkh0N0dZoCvqtKG7GUm8jYGfvJXrJ9i/XQGXcgYmR89jSZ
uaf9B+LVzggHQWmU1Ci68UTWgSu5vLq0jmbHq1bIslPdXx5tIxzFSbkCgYEA7QLk
EVisPz2e/BcdhS2MmTEMLTAInx9kzNwJODRvzmoyDTWt2NGXFh53V1s6pSb50dlN
kRtUysHrr68HOQ51OoZ1aiXv98eMJDojujeA9uEWo9wMkSW0BcRgAmX0bosi//r8
s0bXC1WTXRSI0NtFROcH1T6lhMp6lMXyS0YfFbUCgYBwJaZBmo6SVMOAypwgSWBM
dDutZj/7rodX9D0+S4u1g1O9RYuUrw/RDTuuEzbCXd6mdBrOieyaU/EBN/RLjeFX
r3GY6O+fClPZfV9lfcHK5bkC/eY5AFRR/ZermJO6a7jebCYdCU/GpB6jyOHIKqkL
LGR4qQI/4kbY9er2k16nKQKBgBD5wggUB9JHwZlgtnaRep6GSs75v8RV5Uxe/jIO
X2uzY35at+btrBqjd/zDxgGKNx52p/2arYoQNadRq/zEMlVMyCAgM33Vxw3ZNDHk
Q9Jq8Movup6yyqAXHqFNWCKKyKj4+xyEGGbxbCqgi+QZsG5s9byqTgSi1ADP5LjL
fvJ5AoGABJ87BRCC7d8ntvymTh0uz41HSbH0v1boDqZtzcMTrSnVN6J8nm93msAP
HRRUQc/Z/3/VHiBiY5vJ/K6lj61oXBPa0oh8avEWTOuXKe87d1YbZp3s/ly+iVZS
SkQzxnAJnstWUPqUKjwdCkwb1SBMaX/8XwygQH8b27qbOWGefOo=
-----END RSA PRIVATE KEY-----`,
  clientId: "Iv1.d8a02a12fcbc45dd",
  clientSecret: "478cb7bf580635475f9dcebbc9716ff3b1ab7487",
  log: console
});

async function app(req) {
  console.log("Code: ", req.query);
// Retrieve JSON Web Token (JWT) to authenticate as app
  const appAuthentication = await auth({  type: "oauth-user",
    code: req.query.code,
    state: req.query.state,
    factory: createOAuthUserAuth});
  console.log(appAuthentication);
  return appAuthentication;
}
//
// https://github.com/login/oauth/authorize?client_id=Iv1.d8a02a12fcbc45dd&state=dhsfidhfiuds&redirect_url=http://localhost:8080

functions.http('helloHttp', async (req, res) => {
  let userOctokit = await app(req);
  // console.log("APP exited", userOctokit);
  // console.log("APP exited2", await userOctokit());

  let auth = await userOctokit();

  const octokit = new Octokit({
    auth: auth.token,
    userAgent: 'songbook v0.0.1',
    log: {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error
    }});

  const {
    data: { login },
  } = await octokit.rest.users.getAuthenticated();
  console.log("Hello, %s", login);

  res.send(`Hello ${req.query.name || req.body.name || 'World'}!`);

  await octokit.request('POST /repos/{owner}/{repo}/pulls', {
    owner: 'wdw21',
    repo: 'songbook',
    title: 'Amazing new feature',
    body: 'Please pull these awesome changes in!',
    head: 'ptabor:20220926-editor',
    base: 'master'
  })
});

https://github.com/wdw21/songbook/compare/main...ptabor:20220926-editor?quick_pull=1&labels=song&title=Piosenka:

// functions.
// function wait(ms){
//   var start = new Date().getTime();
//   var end = start;
//   while(end < start + ms) {
//     end = new Date().getTime();
//   }
// }
//
// app();
//
// wait(2000);
// //const functions = require('@google-cloud/functions-framework');
//
// // functions.http('helloHttp', (req, res) => {
// //   res.send(`Hello ${req.query.name || req.body.name || 'World'}!`);
// // });
// //
// // octokit
//
// // // Create a personal access token at https://github.com/settings/tokens/new?scopes=repo
// // const octokit = new Octokit({ auth: `personal-access-token123` });
// //
// // // Compare: https://docs.github.com/en/rest/reference/users#get-the-authenticated-user
// // const {
// //   data: { login },
// // } = await octokit.rest.users.getAuthenticated();
// // let login="abcd";
// // console.log("Hello, %s", login);
//
// const {
//   createOAuthAppAuth,
//   createOAuthUserAuth,
// } = require("@octokit/auth-oauth-app");
//
// const appAuth = createOAuthAppAuth({
//   clientType: "github-app",
//   clientId: "lv1.1234567890abcdef",
//   clientSecret: "1234567890abcdef1234567890abcdef12345678",
// });
//
// // Create a personal access token at https://github.com/settings/tokens/new?scopes=repo
// const octokit = new Octokit({
//   //auth: `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`,
//   userAgent: 'songbook v0.0.1',
//   log: {
//     debug: console.debug,
//     info: console.info,
//     warn: console.warn,
//     error: console.error
//   }
// });
//
// // // Compare: https://docs.github.com/en/rest/reference/users#get-the-authenticated-user
// const {
//   data: { login },
// } = await octokit.rest.users.getAuthenticated();
// console.log("Hello, %s", login);
//
// console.log("Hello...");
//
// //async () => {
//   const { data: pullRequest } = await octokit.rest.pulls.get({
//         owner: "octokit",
//         repo: "rest.js",
//         pull_number: 123,
//       });
//   console.log("Pull request", pullRequest);
// //}
//
//
// App ID: 249526
//
// Client ID: Iv1.d8a02a12fcbc45dd
//
