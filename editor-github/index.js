const { oauthAuthorizationUrl } = require("@octokit/oauth-authorization-url");
const { createAppAuth, createOAuthUserAuth } = require("@octokit/auth-app");
const { createTokenAuth } = require("@octokit/auth-token");

var cors = require('cors')

const USER_AGENT="songbook/0.0.1";

const OAUTH_APP_ID = 2019824;
const OAUTH_APP_SECRET = "542c32a00d9d1ddb184fd96ad120182568b6c502";
const OAUTH_CLIENT_ID = "e1230ada4de9a5ce168b";
const OAUTH_REDIRECT_URL = "http://localhost:8080/newChange";


//const { OAuthApp, createNodeMiddleware } = require("@octokit/oauth-app");

//const {createAppAuth} = require('@octokit/auth-app');
const {http} = require('@google-cloud/functions-framework');
const { Octokit } = require("@octokit/rest");
const { graphql } = require("@octokit/graphql");
const express = require('express');
const util = require('util');
const crypto = require('crypto');
const cookieParser = require("cookie-parser");

const { request } = require("@octokit/request");

//
const app = express();
//
const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
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
-----END RSA PRIVATE KEY-----`;
const APP_ID = 249526;
const CLIENT_ID = "Iv1.d8a02a12fcbc45dd";
const CLIENT_SECRET = "478cb7bf580635475f9dcebbc9716ff3b1ab7487";

async function newUserOctokit(req,res) {
  let access_token = req.cookies.session ? req.cookies.session.access_token
      : null;
  console.log("access token from cookie: ", access_token)
  if (!access_token) {

    //TODO(ptab): Compare secret with the cookie.
    const authData = {
      clientId: OAUTH_CLIENT_ID,
      clientSecret: OAUTH_APP_SECRET,
      code: req.query.code,
      state: req.query.state,
      redirectUrl: OAUTH_REDIRECT_URL,
      log: console,
    };

    const auth = await createOAuthUserAuth(authData);
    try {
      const {token} = await auth();
      access_token = token;
      res.cookie("session", {"access_token": access_token}, { maxAge: 3*24*60*60*1000, httpOnly: true, sameSite:'none', secure: true });
    } catch (e) {
      console.log(e);
      res.redirect("/auth");
      return null;
    }
  }
  return {
    octokit: new Octokit({
      userAgent: USER_AGENT,
      auth: access_token,
      log: console,
    }),
    mygraphql: graphql.defaults({
      headers: {
        "Authorization": "bearer " + access_token
      },
      // request: {
      //   async hook(request, options) {
      //     console.log(request);
      //     console.log(options);
      //     res = await request(request(options));
      //     console.log(res);
      //     return res;
      //   }
      // }
    }),
    user: 'ptabor',
  }


};

// function appAuthOctokit() {
//   return new Octokit({
//     auth: {
//       appId: APP_ID,
//       privateKey: PRIVATE_KEY,
//       clientId: OAUTH_CLIENT_ID,
//       clientSecret: OAUTH_APP_SECRET,
//     },
//     authStrategy: createAppAuth,
//     userAgent: 'songbook v0.0.1',
//     log: {
//       debug: console.debug,
//       info: console.info,
//       warn: console.warn,
//       error: console.error
//     }
//   });
// }

app.use(cookieParser());

const MAIN_BRANCH_NAME="songeditor-main";


// TODO: Rename: /changes:new
app.get('/newChange', async (req, res) => {
  console.log("Starting request /newChange");
  const {octokit,mygraphql, user} = await newUserOctokit(req, res);
  if (!octokit) {
    console.log("!!! abandoned");
    return;
  }
  console.log("!!! continuing");
  const mainBranch = await octokit.rest.repos.getBranch({owner:'ptabor', repo: 'songbook', branch: MAIN_BRANCH_NAME});

  console.log(util.inspect(mainBranch,false,null,false));

    res.write(`<!DOCTYPE html>
  <html xmlns="http://www.w3.org/1999/html" lang="pl-PL">\n
  <head>
   <meta charset="UTF-8">
    <script>
      function edit() {
        let today = new Date().toISOString().slice(0, 10);
        let rand= Math.floor(Math.random()*10000);
        let branch = "se-"+ today + "-" + rand + "-" + document.getElementById('file').value;
        let load = 'https://raw.githubusercontent.com/wdw21/songbook/main/songs/' + document.getElementById('file').value;
        let commit = 'http://localhost:8080/save?branch=' + encodeURIComponent(branch) + '&file=' + encodeURIComponent("songs/"+document.getElementById('file').value);
        window.open('https://ptabor.github.io/songbook/editor?load=' + encodeURIComponent(load) + '&commit=' + encodeURIComponent(commit), '_self')
      }
    </script>
  </head>
  <body>\n
  <h1>Nowa zmiana</h1>\n
  Wybierz (lub utwórz) plik, który będziesz edytował:
  `);

    let songs = await octokit.rest.repos.getContent({owner: user, repo: 'songbook', path: 'songs', ref: MAIN_BRANCH_NAME})
    console.log(util.inspect(songs,false,null,false));

    res.write(`<datalist id="files">\n`);
    for (let i=0; i<songs.data.length; ++i) {
      res.write(`  <option>${songs.data[i].name}</option>\n`);
    }
    res.write(`</datalist>\n`);

    res.write(`
  
  <input id='file' type="text" list="files"/>
  
  <div>
    <button onclick="edit();">Rozpocznij edycję</button>
    <a href="/changes">List zmian</a>
  </div>
  
  </body>
  </html>`);
    res.end();
});
//MAIN_BRANCH_NAME

app.use(cors({origin: "https://ptabor.github.io", credentials: true}));

function logRequest(req, res, next) {
  console.log("==============================================================");
  console.log("REQUEST", req.url)
  next();
}
app.use(logRequest)

async function fetchBranch(octokit, user, branchName) {
  try {
    branch = await octokit.rest.repos.getBranch(
        {owner: user, repo: 'songbook', 'branch': branchName});
    return branch;
  } catch (e) {
    if (!(typeof e == 'HttpError') || e.code != 404) {
      console.error(e);
    }
  }
  return null;
}

async function prepareMainBranch(octokit, user) {
  let branch = await fetchBranch(octokit, user, MAIN_BRANCH_NAME);
  if (!branch) {
    let originBranch = await fetchBranch(octokit, 'wdw21', 'main');
    console.log(util.inspect(originBranch, false, null, false));
    await octokit.rest.git.createRef({owner: user, repo: 'songbook', "ref": "refs/heads/" + MAIN_BRANCH_NAME, "sha": originBranch.data.commit.sha});
  }
  await octokit.rest.repos.mergeUpstream({owner: user, repo: 'songbook', 'branch': MAIN_BRANCH_NAME});
  return fetchBranch(octokit, user, MAIN_BRANCH_NAME);
}

async function prepareBranch(octokit, user, branchName) {
  branch = await fetchBranch(octokit, user, branchName);
  if (branch) {
    return branch;
  }
  let mainBranch = await prepareMainBranch(octokit, user);
  console.log(util.inspect(mainBranch, false, null, false));

  await octokit.rest.git.createRef({owner: user, repo: 'songbook', "ref": "refs/heads/" + branchName, "sha": mainBranch.data.commit.sha});
  return fetchBranch(octokit, user, branchName);
}


app.post('/save', async (req,res) => {
  const {octokit,mygraphql, user} = await newUserOctokit(req, res);
  if (!octokit) { return; }

  const branchName = req.query.branch;
  const msg = req.query.msg ? req.query.msg : "Kolejne zmiany";
  const file = req.query.file
  console.log('Branch:', branchName);
  const payload = req.body.toString().replaceAll(/(?<=^ *)  /gm,"\t");
  const branch = await prepareBranch(octokit, user, branchName)

  console.log(util.inspect(branch, false, null, false));

  //console.log("GRAPHQL", await mygraphql("{ viewer { login } }"));

  const commitResult = await mygraphql(`
  mutation ($input: CreateCommitOnBranchInput!) {
    createCommitOnBranch(input: $input) {
      commit {
        url
      }
    }
  }
  `,{
    "input": {
      "branch": {
        "repositoryNameWithOwner": user + "/songbook",
        "branchName": branchName
      },
      "message": {
        "headline": msg
      },
      "fileChanges": {
        "additions": [
          {
            "path": file,
            "contents": Buffer.from(payload).toString("base64")
          }
        ]
      },
      "expectedHeadOid": branch.data.commit.sha
    }
  });

  res.send(
      {
        "status": "committed",
        "commit": commitResult.createCommitOnBranch.commit
      }
  );
});

app.get('/config', async (req, res) => {
  const octokit = await newUserOctokit(req, res);
  if (!octokit) {
    return;
  }

  // TODO(ptab): Load from cookies.
  const user = 'ptabor'

  const repo = await octokit.rest.repos.get({owner: user, repo: 'songbook'});
  const branches = await  octokit.rest.repos.listBranches({owner: 'ptabor', repo: 'songbook'});
  res.write(`
<html>
  <body>`);

  res.write('Twoje zmiany:');
  res.write('<table>')

  await octokit.rest.repos.mergeUpstream({owner: user, repo: 'songbook', branch: 'main'});

  //await octokit.rest.git.createRef({owner: user, repo: 'songbook', "ref": "refs/heads/songeditor-main", "sha": "a4feb814182f26dc82dba070029e6f36b954b514"});

  let songs = await octokit.rest.repos.getContent({owner: user, repo: 'songbook', path: 'songs'})
  res.write(`<pre>${util.inspect(songs,false,null,false)}</pre>`);


  for (let i=0; i< branches.data.length; ++i) {
    let b = branches.data[i];

   let diff = await octokit.rest.repos.compareCommitsWithBasehead({owner: 'wdw21', repo: 'songbook', basehead: `main...${user}:songbook:${b.name}`});

   // "commit": { "committer": { "date": "2011-04-14T16:00:49Z" },
   //
//    let diff = await octokit.rest.repos.compareCommitsWithBasehead({owner: user, repo: 'songbook', basehead: `main...${b.name}`});

// merge-upstream

    //let branch = await octokit.rest.repos.getBranch({owner: user, repo: 'songbook', branch: b.name});
    res.write(`<tr><td>${b.name}</td>
       <td><pre>DIFF: ${util.inspect(diff,false, null, false)}</pre></td>
       <td><pre>BRANCH: ${util.inspect(b, false, null, false)}</pre></td></tr>`);
  }
  res.write('</table>')

  res.write(`<hr/>
     Repo found: ${repo != null}<br/>
     Repo details: <pre>${util.inspect(repo, false, null, false)}</pre><br/>
     Repo source: ${repo.data.source.full_name}
     <hr/>
     Branches: <pre>${util.inspect(branches, false, null, false)}</pre>`
  );

  for (let i=0; i< branches.data.length; ++i) {
    let b = branches.data[i];
    let branch = await octokit.rest.repos.getBranch({owner: user, repo: 'songbook', branch: b.name});
    res.write(`<pre>BRANCH: ${util.inspect(branch, false, null, false)}</pre>>`);
  }

  res.write(`
</body>
</html>`);
  res.end();
  //console.log(await octokit.rest.users.getAuthenticated());

});

  // const auth = createOAuthUserAuth({
  //   clientId: OAUTH_CLIENT_ID,
  //   clientSecret: OAUTH_APP_SECRET,
  //   code: req.query.code,
  //   // optional
  //   state: req.query.state,
  //   //redirectUrl: "https://acme-inc.com/login",
  // });

// Exchanges the code for the user access token authentication on first call
// and caches the authentication for successive calls
//   const { token } = await auth();
//   console.log("TOKEN", token);

  // const appAuthentication = await auth({  type: "oauth-user",
  //   code: req.query.code,
  //   state: req.query.state,
  //   factory: createOAuthUserAuth});
  //
  // console.log(await appAuthentication());

  //let appOctokit = appAuthOctokit();
  // const tokenRes = await appOctokit.request(
  //     'POST /login/oauth/access_token',
  //     { clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, code: req.query.code }
  // );
  // console.log("TOKEN", tokenRes.body);

  //   console.log("Code: ", req.query);
// // Retrieve JSON Web Token (JWT) to authenticate as app
//   const appAuthentication = await auth({  type: "oauth-user",
//     code: req.query.code,
//     state: req.query.state,
//     factory: createOAuthUserAuth});
//   console.log(appAuthentication);
//   return appAuthentication;
// }

  //code=a6f79f31d9c422af115b&state=1ceeb51b-b5ad-4d66-afaf-197663c1f451
  // const octokit = new Octokit({
  //      //auth: `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`,
  //      auth: OAUTH_APP_SECRET,
  //   //   authStrategy: createAppAuth,
  //      userAgent: 'songbook v0.0.1',
  //      log: {
  //        debug: console.debug,
  //        info: console.info,
  //        warn: console.warn,
  //        error: console.error
  //      }
  //    });
  //    let x = await octokit.rest.users.getAuthenticated();
  //    console.log("Hello, %s", util.inspect(x, false, null, true));
//      res.send(`Hello ${req.query.name || req.body.name || 'World'}!`);
// });

app.get('/auth', async (req, res) => {
  const state = crypto.randomUUID();
  res.clearCookie("session");
  res.cookie("state", state);

 //  const octokit = new Octokit({
 //    //auth: `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`,
 //    auth: OAUTH_APP_SECRET,
 // //   authStrategy: createAppAuth,
 //    userAgent: 'songbook v0.0.1',
 //    log: {
 //      debug: console.debug,
 //      info: console.info,
 //      warn: console.warn,
 //      error: console.error
 //    }
 //  });
 //  let x = await octokit.rest.users.getAuthenticated();
 //  console.log("Hello, %s", util.inspect(x, false, null, true));
 //  res.send(`Hello ${req.query.name || req.body.name || 'World'}!`);

  const {url} =
      oauthAuthorizationUrl({
        clientType: "oauth-app",
        clientId: OAUTH_CLIENT_ID,
        redirectUrl: OAUTH_REDIRECT_URL,
        scopes: ["repo"],
        state: state,
      });
  res.redirect(url);
});

app.get('/songBranches', async (req, res) => {
  console.log("Mamy to:", req.params);
  // let a = await auth;
  // let b = await a;
  // console.log("b:", b())
  const octokit = new Octokit({
    //auth: `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`,
    auth: AUTH_CONFIG,
    authStrategy: createAppAuth,
    userAgent: 'songbook v0.0.1',
    log: {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error
    }
  });

  let x = await octokit.rest.apps.getUserInstallation();///users.getAuthenticated();
   console.log("Hello, %s", util.inspect(x, false, null, true));
  res.send(`Hello ${req.query.name || req.body.name || 'World'}!`);
});

http('api', app);



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


// const app = new OAuthApp({
//   clientType: "github-app",
//   clientId: "lv1.1234567890abcdef",
//   clientSecret: "1234567890abcdef1234567890abcdef12345678",
// });
//
// app.on("token", async ({ token, octokit, expiresAt }) => {
//   const { data } = await octokit.request("GET /user");
//   console.log(`Token retrieved for ${data.login}`);
// });
//
// app.
//
// require("http")
//     .createServer(createNodeMiddleware(app))
//     .listen(8080);




// import { Octokit } from "@octokit/rest";
// const { createAppAuth, createOAuthUserAuth } = require("@octokit/auth-app");

// const { Octokit } = require("@octokit/rest");
// const { createAppAuth, createOAuthUserAuth } = require("@octokit/auth-app");
// const functions = require('@google-cloud/functions-framework');
//
//
// const auth = createAppAuth({
//   appId: 249526,
//   privateKey: `-----BEGIN RSA PRIVATE KEY-----
// MIIEogIBAAKCAQEA67kUgYWqF09F00lyKrXFCWm4YPQgVVQt4vPmNeDqQKZ5qRiE
// Qkj0GlcR84eCro6uSbXFVfKDbckoDi6uLcfkPT0E6EfBp9htmhcvaauZ+gAs5nWy
// jArTnLBsGpjvU2+p9GCSMfHbCxdNq0bbJ2AwoJR3rE2UpgdOZ4Hdv5DpgWby/jqo
// nJ6rpzzKUWq3RBLZuLMxsKdRwziVk0s94S779loM6SsJ1d70kP1vzq71W9UGsk3Y
// ZcvRk91UAv13Kq2+5+LykiZoU89winXbRKH9znScR/g8896a/z/+HTW4dasIQEpr
// i1I3IE5jLzHvr1sVuexwHMMYw+8tb/RvCfBMzQIDAQABAoIBAGenAN9beUm6sAeS
// mkMxnqze8hagAr/CvlK30RkMB7XZ/lFe2HmVPtF+TAR8J/i+AOGkrlt2wlg6RgTG
// fgzfgvtyo3/IXd2Ci99gJpcewBxwi03jn1l5QUf7Q+4GJebYiTFObbrMkPc1jg+s
// np2X7IoP/vejPaQsPkvBjVK5VBRz6mQaPrlaS030NGVyrC0gBEy7DkxQbyH1Dpbx
// 9J4sU3aV+p1anW6xEv/FryGkkSDketwpjUKX6MMtRKi76+Qq0ZnRl2zXBNWO5++p
// FM4l5eVCe4BVLEGUsxjJ91IG2XjmC4t+p7+ULafGrrWqScbDP8PujV1C894uuz0n
// jhvmYMECgYEA/pvEAivLAtvKGEO55T+5P15QqZQDveaKGc2M2/mrCKNUNZxz1tbY
// y2BOkQ6hk3C7wvmwJ+nkh0N0dZoCvqtKG7GUm8jYGfvJXrJ9i/XQGXcgYmR89jSZ
// uaf9B+LVzggHQWmU1Ci68UTWgSu5vLq0jmbHq1bIslPdXx5tIxzFSbkCgYEA7QLk
// EVisPz2e/BcdhS2MmTEMLTAInx9kzNwJODRvzmoyDTWt2NGXFh53V1s6pSb50dlN
// kRtUysHrr68HOQ51OoZ1aiXv98eMJDojujeA9uEWo9wMkSW0BcRgAmX0bosi//r8
// s0bXC1WTXRSI0NtFROcH1T6lhMp6lMXyS0YfFbUCgYBwJaZBmo6SVMOAypwgSWBM
// dDutZj/7rodX9D0+S4u1g1O9RYuUrw/RDTuuEzbCXd6mdBrOieyaU/EBN/RLjeFX
// r3GY6O+fClPZfV9lfcHK5bkC/eY5AFRR/ZermJO6a7jebCYdCU/GpB6jyOHIKqkL
// LGR4qQI/4kbY9er2k16nKQKBgBD5wggUB9JHwZlgtnaRep6GSs75v8RV5Uxe/jIO
// X2uzY35at+btrBqjd/zDxgGKNx52p/2arYoQNadRq/zEMlVMyCAgM33Vxw3ZNDHk
// Q9Jq8Movup6yyqAXHqFNWCKKyKj4+xyEGGbxbCqgi+QZsG5s9byqTgSi1ADP5LjL
// fvJ5AoGABJ87BRCC7d8ntvymTh0uz41HSbH0v1boDqZtzcMTrSnVN6J8nm93msAP
// HRRUQc/Z/3/VHiBiY5vJ/K6lj61oXBPa0oh8avEWTOuXKe87d1YbZp3s/ly+iVZS
// SkQzxnAJnstWUPqUKjwdCkwb1SBMaX/8XwygQH8b27qbOWGefOo=
// -----END RSA PRIVATE KEY-----`,
//   clientId: "Iv1.d8a02a12fcbc45dd",
//   clientSecret: "478cb7bf580635475f9dcebbc9716ff3b1ab7487",
//   log: console
// });
//
// async function app(req) {
//   console.log("Code: ", req.query);
// // Retrieve JSON Web Token (JWT) to authenticate as app
//   const appAuthentication = await auth({  type: "oauth-user",
//     code: req.query.code,
//     state: req.query.state,
//     factory: createOAuthUserAuth});
//   console.log(appAuthentication);
//   return appAuthentication;
// }
// //
// // https://github.com/login/oauth/authorize?client_id=Iv1.d8a02a12fcbc45dd&state=dhsfidhfiuds&redirect_url=http://localhost:8080
//
// functions.http('helloHttp', async (req, res) => {
//   let userOctokit = await app(req);
//   // console.log("APP exited", userOctokit);
//   // console.log("APP exited2", await userOctokit());
//
//   let auth = await userOctokit();
//
//   const octokit = new Octokit({
//     auth: auth.token,
//     userAgent: 'songbook v0.0.1',
//     log: {
//       debug: console.debug,
//       info: console.info,
//       warn: console.warn,
//       error: console.error
//     }});
//
//   // const {
//   //   data: { login },
//   // } =
//   let x = await octokit.rest.users.getAuthenticated();
//   console.log("Hello, %s", x.data);
//   // https://api.github.com/repos/ptabor/songbook
//   // "full_name": "wdw21/songbook",
//
//   await octokit.request('POST /repos/{owner}/{repo}/forks', {
//     owner: 'wdw21',
//     repo: 'songbook',
//     name: 'Hello-World',
//     default_branch_only: true
//   })
//
// //  res.send(`Hello ${req.query.name || req.body.name || 'World'}!`);
//
//   // await octokit.request('POST /repos/{owner}/{repo}/pulls', {
//   //   owner: 'wdw21',
//   //   repo: 'songbook',
//   //   title: 'Amazing new feature',
//   //   body: 'Please pull these awesome changes in!',
//   //   head: 'ptabor:20220926-editor',
//   //   base: 'master'
//   // })
//   // res.redirect("https://github.com/wdw21/songbook/compare/main...ptabor:20221017-gh-editor?quick_pull=1&labels=song&title=Piosenka");
// });

//https://github.com/wdw21/songbook/compare/main...ptabor:20220926-editor?quick_pull=1&labels=song&title=Piosenka:

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
