const { oauthAuthorizationUrl } = require("@octokit/oauth-authorization-url");
const { createAppAuth, createOAuthUserAuth } = require("@octokit/auth-app");

var cors = require('cors')

const USER_AGENT="songbook/0.0.1";

const OAUTH_APP_ID = 2019824;
const OAUTH_APP_SECRET = "542c32a00d9d1ddb184fd96ad120182568b6c502";
const OAUTH_CLIENT_ID = "e1230ada4de9a5ce168b";
const OAUTH_REDIRECT_URL = "http://localhost:8080/newChange";

const {http} = require('@google-cloud/functions-framework');
const { Octokit } = require("@octokit/rest");
const { graphql } = require("@octokit/graphql");
const express = require('express');
const util = require('util');
const crypto = require('crypto');
const cookieParser = require("cookie-parser");

const app = express();

async function newUserOctokit(req,res) {
  let access_token = req.cookies.session ? req.cookies.session.access_token
      : null;
  let user = req.cookies.session ? req.cookies.session.user : null;
  console.log("access token from cookie: ", access_token)
  if (!access_token || !user) {
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
    } catch (e) {
      console.log(e);
      res.redirect("/auth");
      return null;
    }
    const octokit = new Octokit({
      userAgent: USER_AGENT,
      auth: access_token,
      log: console,
    });
    const authenticated = await octokit.rest.users.getAuthenticated();
    console.log(util.inspect(authenticated, false, null, false));
    user = authenticated.data.login;
    res.cookie("session", {"access_token": access_token, "user": user}, { maxAge: 3*24*60*60*1000, httpOnly: true, sameSite:'none', secure: true });
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
    }),
    user: user,
  }
};

app.use(cookieParser());
app.use(cors({origin: "https://ptabor.github.io", credentials: true}));


const MAIN_BRANCH_NAME="songeditor-main";


app.get('/changes:new', async (req, res) => {
  console.log("Starting request /newChange");
  const {octokit,mygraphql, user} = await newUserOctokit(req, res);
  if (!octokit) {
    return;
  }
  const mainBranch = await octokit.rest.repos.getBranch({owner:'ptabor', repo: 'songbook', branch: MAIN_BRANCH_NAME});

    res.write(`<!DOCTYPE html>
  <html xmlns="http://www.w3.org/1999/html" lang="pl-PL">\n
  <head>
   <meta charset="UTF-8">
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
  
  <form action="/changes:new" method="post">
    <input name="file" id='file' type="text" list="files"/>
    <div>
      <input type="submit">Rozpocznij edycję</>
      <a href="/changes">List zmian</a>
    </div>
  </form>
  
  </body>
  </html>`);
    res.end();
});


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

app.post('/changes:new', express.urlencoded({
  extended: true
}),  async(req, res) => {
    console.log("BODY", req.body);
    let file = req.body.file.trim();
    if (!file.toLowerCase().endsWith(".xml")) {
      file = file + ".xml";
    }
    let today = new Date().toISOString().slice(0, 10);
    let rand= Math.floor(Math.random()*10000);
    let branchName = "se-"+ today + "-" + rand + "-" + file;

    const {octokit,mygraphql, user} = await newUserOctokit(req, res);
    const branch = await prepareBranch(octokit, user, branchName)

    let load = 'https://raw.githubusercontent.com/' + encodeURIComponent(user) + '/songbook/' + encodeURIComponent(branchName) + '/songs/' + encodeURIComponent(file);
    let commit = 'http://localhost:8080/save?branch=' + encodeURIComponent(branchName) + '&file=' + encodeURIComponent("songs/" + file);
    res.redirect('https://ptabor.github.io/songbook/editor?load=' + encodeURIComponent(load) + '&commit=' + encodeURIComponent(commit));
});

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

app.get('/changes', async (req, res) => {
  const {octokit, user} = await newUserOctokit(req, res);
  if (!octokit) {
    return;
  }

  const repo = await octokit.rest.repos.get({owner: user, repo: 'songbook'});
  const branches = await  octokit.rest.repos.listBranches({owner: 'ptabor', repo: 'songbook'});
  res.write(`
<html>
  <body>`);

  res.write('Twoje zmiany:');
  res.write('<table>')

  await octokit.rest.repos.mergeUpstream({owner: user, repo: 'songbook', branch: 'main'});

  let songs = await octokit.rest.repos.getContent({owner: user, repo: 'songbook', path: 'songs'})
  res.write(`<pre>${util.inspect(songs,false,null,false)}</pre>`);


  for (let i=0; i< branches.data.length; ++i) {
    let b = branches.data[i];

   let diff = await octokit.rest.repos.compareCommitsWithBasehead({owner: 'wdw21', repo: 'songbook', basehead: `main...${user}:songbook:${b.name}`});

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
});

app.get('/auth', async (req, res) => {
  const state = crypto.randomUUID();
  res.clearCookie("session");
  res.cookie("state", state);

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

http('api', app);