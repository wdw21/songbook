const { oauthAuthorizationUrl } = require("@octokit/oauth-authorization-url");
const { createAppAuth, createOAuthUserAuth } = require("@octokit/auth-app");

var cors = require('cors')

const USER_AGENT="songbook/0.0.1";

const OAUTH_APP_ID = 2019824;
const OAUTH_APP_SECRET = "542c32a00d9d1ddb184fd96ad120182568b6c502";
const OAUTH_CLIENT_ID = "e1230ada4de9a5ce168b";
const CHANGES_BASE_URL = "http://localhost:8080/changes";
const OAUTH_REDIRECT_URL = CHANGES_BASE_URL;

const {http} = require('@google-cloud/functions-framework');
const { Octokit } = require("@octokit/rest");
const { graphql } = require("@octokit/graphql");
const express = require('express');
const util = require('util');
const crypto = require('crypto');
const cookieParser = require("cookie-parser");

const MAIN_BRANCH_NAME="songeditor-main";
const SONGEDITOR_BRANCH_REGEXP=/^se-.*/g;

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

app.get('/changes', async (req, res) => {
  try {
  const {octokit, user, mygraphql} = await newUserOctokit(req, res);
  if (!octokit) {
    return;
  }
  let r = await mygraphql(`query ($user:String!, $repo:String!){
  repository(owner:$user,name:$repo) {
    url
    parent {
      id
      name
      owner {
        id
        login
      }
    }
    refs(last: 100, refPrefix:"refs/heads/", orderBy: {field:TAG_COMMIT_DATE, direction:DESC}) {
      nodes {
        id
        name
        associatedPullRequests(last:5) {
          edges {
            node {
              id
              title
              number
              url
              closed
              closedAt
              changedFiles
              merged
            }
          }
        }
        target {
        ... on Commit {
            changedFilesIfAvailable,
                commitSHA: oid
            committedDate,
            commitUrl,
            url,
                history(first: 2) {
              nodes {
                id
                oid
                commitUrl
                messageHeadline
                committedDate
              }
            }
          }
        }
      }
    }
  }
}`,
      {
        user: user,
        repo: "songbook"
      });

  const diffs = new Map();
  const refs = r.repository.refs.nodes;

  refs.sort( (a,b) => {
    if (!a || !a.target || !a.target.committedDate) {
      return 1;
    }
    if (!b || !b.target || !a.target.committedDate) {
      return -1;
    }
    return -a.target.committedDate.localeCompare(b.target.committedDate)} ) ;

  for (let i = 0; i < refs.length; ++i) {
    let branch = refs[i];
    if (SONGEDITOR_BRANCH_REGEXP.test(branch.name)) {
      diffs.set(branch.name, octokit.rest.repos.compareCommitsWithBasehead({
        owner: 'wdw21',
        repo: 'songbook',
        basehead: `main...${user}:songbook:${branch.name}`
      }));
    }
  }

  res.write(`
<html>
  <head>
   <meta charset="UTF-8">
    <script>      
      function deleteBranch(branch) {
        if (confirm("Czy na pewno chcesz skasować zmianę: '" +branch + "'?")) {
          fetch("${CHANGES_BASE_URL}/"+branch, {method:'DELETE'})
            .then((response) => window.location.reload());
        }
      }
    </script>
    </head>
  <body>
    <table>`);

  for (let i = 0; i < refs.length; ++i) {
    let branch = refs[i];
    if (SONGEDITOR_BRANCH_REGEXP.test(branch.name)) {
      const diff = await diffs.get(branch.name);
      if (!diff || diff.data.files.length < 1) {
        continue;
      }


      res.write(`<td>${diff.data.files[0].status == 'added'? 'Nowy:':''} ${diff.data.files[0].filename.replaceAll("songs/","")}</td>`)

      res.write(`<td>${new Date(branch.target.committedDate).toLocaleString("pl-PL")}</td>`)


      res.write(`<td>
        <a href="/changes/${branch.name}:edit">[Edytuj]</a>
        <button onclick="deleteBranch('${branch.name}')">Usuń</button></td>`);

      res.write(`<td>`);
      if (branch.associatedPullRequests.edges.length > 0) {
        let pr = branch.associatedPullRequests.edges[0].node;
        res.write(`<a href="${pr.url}">[W recenzji]</a>`);
      } else {
        res.write(`<a href="/changes/${branch.name}:publish">[Wyślij do recenzji]</a>`);
      }
      res.write(`</td>`);

      res.write(`<td>
         <b>${branch.name}</b>
         <a href="${r.repository.url}/tree/${branch.name}">[branch]</a><br/>
         <a href="${branch.target.commitUrl}">[commit]</a>
      </td>`);
      res.write(`</tr>`);
    }
  }

  // Let's delete empty & merged branches.
  for (let i = 0; i < refs.length; ++i) {
    let branch = refs[i];
    if (SONGEDITOR_BRANCH_REGEXP.test(branch.name)) {
      const diff = await diffs.get(branch.name);
      if (!diff || diff.data.files.length == 0) {
        octokit.rest.git.deleteRef({owner: user, repo: 'songbook', "ref": "heads/" + branch.name});
        continue;
      }
      if (branch.associatedPullRequests.edges.length>0) {
        merged = true;
        for (const edge of branch.associatedPullRequests.edges) {
          if (!edge.node.closed || !edge.node.merged) {
            merged = false;
          }
        }
        if (merged) {
          octokit.rest.git.deleteRef({owner: user, repo: 'songbook', "ref": "heads/" + branch.name});
          continue;
        }
      }
    }
  }

  // <pre>${util.inspect(diff, false, null, false)}</pre>
  res.write(`
    </table>

    <a id="newChange" href="/changes:new">[Nowa zmiana]</a>

    <details>
      <summary>[Magia pod spodem]</summary>
      <pre>${util.inspect(r, false, null, false)}</pre>`);

    for (let [key, value] of diffs) {
      res.write(`<hr/><h3>diff: ${key}</h3><pre>${util.inspect(await value, false, null, false)}</pre>\n`);
    }

  res.write(`    
    </details>
  </body>
</html>
`);
  } finally {
    res.end();
  }
})

async function getFileFromBranch(octokit, user, branchName) {
  diff = await octokit.rest.repos.compareCommitsWithBasehead({
    owner: 'wdw21',
    repo: 'songbook',
    basehead: `main...${user}:songbook:${branchName}`
  });
  return diff.data.files.length>0 ? diff.data.files[0].filename : null;
}

app.get('/changes/:branch[:]edit', async (req, res) => {
  const branchName = req.params.branch;
  const {octokit,mygraphql, user} = await newUserOctokit(req, res);
  let file = getFileFromBranch(octokit, user, branchName);
  res.redirect(editorLink(user, branchName, file, false));
});

app.delete('/changes/:branch', async (req, res) => {
  const branchName = req.params.branch;
  const {octokit,mygraphql, user} = await newUserOctokit(req, res);
  await octokit.rest.git.deleteRef({owner: user, repo: 'songbook', "ref": "heads/" + branchName});
  res.send("Deleted");
});

app.get('/changes/:branch[:]publish', async (req, res) => {
  const branchName = req.params.branch;
  const {octokit,mygraphql, user} = await newUserOctokit(req, res);
  let file = await getFileFromBranch(octokit, user, branchName);
  let link = editorLink(user, branchName, file);
  let body = `{Opisz zmiany w piosence i kliknij "Create pull request". }\n\n\n[Link do edytora](${link})`;
  let url=`https://github.com/wdw21/songbook/compare/main...${user}:songbook:${branchName}?title=Piosenka: ${encodeURIComponent(file)}&expand=1&body=${encodeURIComponent(body)}`
  res.redirect(url);
});


app.get('/changes[:]new', async (req, res) => {
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

function editorLink(user, branchName, file, autocommit) {
  let load = 'https://raw.githubusercontent.com/' + encodeURIComponent(user) + '/songbook/' + encodeURIComponent(branchName) + '/' + encodeURIComponent(file);
  let commit = 'http://localhost:8080/changes/'+branchName+':commit?&file=' + encodeURIComponent(file);
  return 'https://ptabor.github.io/songbook/editor?load=' + encodeURIComponent(load) + '&commit=' + encodeURIComponent(commit) + (autocommit?'&commitOnLoad=true':'');
}

app.post('/changes[:]new', express.urlencoded({
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

    res.redirect(editorLink(user, branchName, "songs/"+file, true));
});

app.post('/changes/:branchName:commit', async (req,res) => {
  const {octokit,mygraphql, user} = await newUserOctokit(req, res);
  if (!octokit) { return; }

  const branchName = req.params.branchName;
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