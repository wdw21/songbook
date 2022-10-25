import { oauthAuthorizationUrl } from "@octokit/oauth-authorization-url";
import { http }  from '@google-cloud/functions-framework';
import express  from 'express';
import util  from 'util';
import crypto  from 'crypto';
import cookieParser  from "cookie-parser";
import cors  from 'cors';

import {listChanges} from './listChanges.js';
import {
  EDITOR_DOMAIN,
  CHANGES_BASE_URL,
  OAUTH_CLIENT_ID,
  newUserOctokit,
  getFileFromBranch,
  htmlSuffix,
  htmlPrefix,
  MAIN_BRANCH_NAME,
  prepareBranch,editorLink,
} from './common.js';

const app = express();

app.use(cookieParser());
app.use(cors({origin: EDITOR_DOMAIN, credentials: true}));

app.get('/', async  (req, res) => {
  res.redirect(CHANGES_BASE_URL);
});

app.get('/changes', async (req, res) => {
  const {octokit,mygraphql,user} =
      await newUserOctokit(req, res);
  if (!octokit) { return; }
  res.redirect(`/users/${user}/changes`)
} );


app.get('/songs', async (req, res) => {
  const {octokit,mygraphql,user} = await newUserOctokit(req, res);
  if (!octokit) return;
  res.redirect(`/users/${user}/songs`)
} );

app.get('/users/:user/changes', listChanges);

app.get('/users/:user/changes/:branch[:]edit', async (req, res) => {
  const branchName = req.params.branch;
  const {octokit,mygraphql,user} = await newUserOctokit(req, res);
  if (!octokit) return;
  let file = await getFileFromBranch(octokit, user, branchName);
  res.redirect(editorLink(user, branchName, file, false));
});

app.delete('/users/:user/changes/:branch', async (req, res) => {
  const branchName = req.params.branch;
  const {octokit,mygraphql,user} = await newUserOctokit(req, res);
  if (!octokit) return;

  await octokit.rest.git.deleteRef({owner: user, repo: 'songbook', "ref": "heads/" + branchName});
  res.send("Deleted");
});

async function publish(req, res) {
  const branchName = req.params.branch;
  const {octokit,mygraphql, user} = await newUserOctokit(req, res);
  let file = await getFileFromBranch(octokit, user, branchName);
  let link = editorLink(user, branchName, file);
  let body = `{Opisz zmiany w piosence i kliknij "Create pull request". }\n\n\n[Link do edytora](${link})`;
  let url=`https://github.com/wdw21/songbook/compare/main...${user}:songbook:${branchName}?title=Piosenka: ${encodeURIComponent(file)}&expand=1&body=${encodeURIComponent(body)}`
  res.redirect(url);
}

app.get('/users/:user/changes/:branch[:]publish', async (req, res) => {
  publish(req, res);
});


async function getSongs(octokit, user) {
  let songs = await octokit.rest.repos.getContent(
      {owner: user, repo: 'songbook', path: 'songs', ref: MAIN_BRANCH_NAME})
  //console.log(util.inspect(songs, false, null, false));
  let os = [];
  for (let s of songs.data) {
    os.push({
      title: s.name.replaceAll(/.xml$/g, ""),
      filename: s.name,
      path: s.path,
    });
  }
  return os
}

app.get('/users/:user/changes[:]new', async (req, res) => {
  try {
    console.log("Starting request /users/:user/changes[:]new");
    const {octokit, mygraphql, user} = await newUserOctokit(req, res);
    if (!octokit) {
      return;
    }

    htmlPrefix(res);
    res.write(`
      <h1>Nowa edycja</h1>\n
      Wybierz (lub utwórz) plik, który będziesz edytował:
      `);

    let songs = await getSongs(octokit, user)

    res.write(`<datalist id="files">\n`);
    for (const song of songs) {
      res.write(`  <option>${song.title}</option>\n`);
    }
    res.write(`</datalist>\n`);

    res.write(`
    <form action="/users/${user}/changes:new" method="post">
      <input name="file" id='file' type="text" list="files"/>
      <div>
        <input type="submit" value="Rozpocznij edycję"/>
      </div>
    </form>`);
  } finally {
    htmlSuffix(res);
    console.log("!!! /changes processing finished !!!");
  }
});

async function newChange(file, req, res) {
  let today = new Date().toISOString().slice(0, 10);
  let rand= Math.floor(Math.random()*10000);
  let branchName = "se-"+ today + "-" + rand + "-" + file;

  const {octokit,mygraphql,user} = await newUserOctokit(req, res);
  const branch = await prepareBranch(octokit, user, branchName)

  res.redirect(editorLink(user, branchName, "songs/"+file, true));
}

app.post('/users/:user/changes[:]new', express.urlencoded({extended: true }),  async(req, res) => {
  console.log("BODY", req.body);
  let file = req.body.file.trim();
  if (!file.toLowerCase().endsWith(".xml")) {
    file = file + ".xml";
  }
  newChange(file, req, res)
});

app.post('/users/:user/changes/:file[:]new',  async(req, res) => {
  let file = req.params.trim();
  newChange(file, req, res)
});

app.get('/users/:user/songs', async (req, res) => {
  try {
    console.log("Starting request /songs");
    const {octokit, mygraphql, user} = await newUserOctokit(req, res);
    if (!octokit) {
      return;
    }

    htmlPrefix(res);
    res.write(`
      <h1>Nowa edycja</h1>\n
      Wybierz (lub utwórz) plik, który będziesz edytował:
      `);

    let songs = await getSongs(octokit, user)

    res.write(`<ul>\n`);
    for (const song of songs) {
      res.write(`  <li>${song.title} <form action="/changes:new" method="post"><input type="hidden" name="file" value="${song.filename}"/><input type="submit" value="[ Edytuj ]"/></form></li>\n`);
    }
    res.write(`</ul>\n`);

    res.write(`
    <form action="/users/${user}/changes:new" method="post">
      <input name="file" id='file' type="text" list="files"/>
      <div>
        <input type="submit" value="Rozpocznij edycję"/>
      </div>
    </form>`);
  } finally {
    htmlSuffix(res);
    console.log("!!! /changes processing finished !!!");
  }
});

function logRequest(req, res, next) {
  console.log("V=============================================================V");
  console.log("REQUEST", req.url)
  next();
  console.log("^=============================================================^");
}
app.use(logRequest)


async function commit(branchName, file, msg, body, payload, req, res) {
  const {octokit,mygraphql,user} = await newUserOctokit(req, res);
  if (!octokit) { return; }


  console.log('Branch:', branchName);
  const branch = await prepareBranch(octokit, user, branchName)

  console.log(util.inspect(branch, false, null, false));

  return mygraphql(`
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
        "headline": msg.trim()
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
}

app.post('/users/:user/changes/:branchName[:]commit', async (req,res) => {
  const branchName = req.params.branchName;
  const msg = req.query.msg ? req.query.msg : "Kolejne zmiany";
  const file = req.query.file
  const payload = req.body;
  const commitResult = await commit(branchName, file, msg, payload, req, res);
  res.send(
      {
        "status": "committed",
        "commit": commitResult.createCommitOnBranch.commit
      }
  );
  console.log(":commit over")
});

app.post('/users/:user/changes/:branchName/:file([^$]+)', async (req,res) => {
  const branchName = req.params.branchName;
  const msg = req.query.msg ? req.query.msg.trim() : "Kolejne zmiany";
  const file = req.params.file.trim()
  const payload = req.body;
  const commitResult = await commit(branchName, file, msg, payload, req, res);
  res.send(
      {
        "status": "committed",
        "commit": commitResult.createCommitOnBranch.commit
      }
  );
  console.log(":commit over")
});

app.post('/users/:user/changes/:branchName/:file([^$]+)[:]commitAndPublish', async (req,res) => {
  const branchName = req.params.branchName;
  const msg = req.query.msg ? req.query.msg : "Kolejne zmiany";
  const file = req.params.file.trim()
  const payload = req.body;
  await commit(branchName, file, msg, payload, req, res);
  return publish(res, req);
});

app.get('/users/:user/changes/:branchName/:file([^$]+)', async (req,res) => {
  let user = req.params.user;
  if (user==='me') {
    let o=newUserOctokit(req,res);
    if (!o || !o.user) {return}
    user=o.user;
  }
  const branchName = req.params.branchName;
  const file = req.params.file.trim()
  console.log("Reading file", file);
  res.redirect(`https://github.com/${user}/songbook/raw/${branchName}/${file}`);
});

// TODO(ptab): - it should redirect back to origin, not to the 'changes' page
app.get('/auth', async (req, res) => {
  const state = crypto.randomUUID();
  res.clearCookie("session");
  res.cookie("state", state);

  const {url} =
      oauthAuthorizationUrl({
        clientType: "oauth-app",
        clientId: OAUTH_CLIENT_ID,
        redirectUrl: CHANGES_BASE_URL,
        scopes: ["repo"],
        state: state,
      });
  res.redirect(url);
});

http('api', app);