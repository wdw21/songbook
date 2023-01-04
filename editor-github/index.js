import {oauthAuthorizationUrl} from "@octokit/oauth-authorization-url";
import {http} from '@google-cloud/functions-framework';
import {RequestError} from "@octokit/request-error";
import express from 'express';
import util from 'util';
import crypto from 'crypto';
import cookieParser from "cookie-parser";
import cors from 'cors';

import {cleanupChanges, listChanges} from './listChanges.js';
import {
    BASE_URL,
    EDITOR_DOMAIN,
    CHANGES_BASE_URL,
    CONFIG_BASE_URL,
    OAUTH_CLIENT_ID,
    newUserOctokit,
    getFileFromBranch,
    htmlSuffix,
    htmlPrefix,
    MAIN_BRANCH_NAME,
    prepareBranch, editorLink,
    prepareMainBranch,
    HandleError, EDITOR_BASE_URL, PARENT_DOMAIN,
} from './common.js';

const app = express();

console.info("Registering songbook", "baseUrl:" + BASE_URL);
http('songbook', app);
console.info("Registered songbook", "baseUrl:" + BASE_URL);

app.use(cookieParser());
app.use(cors({origin: EDITOR_DOMAIN, credentials: true}));

app.get('/', async (req, res) => {
    if (req.cookies.new === 'false') {
        res.redirect(CHANGES_BASE_URL);
    } else {
        res.redirect("/intro");
    }
});

app.get('/changes', async (req, res) => {
    const {octokit, user} =
        await newUserOctokit(req, res);
    if (!octokit) {
        return;
    }
    res.redirect(`/users/${user}/changes`)
});


app.get('/songs', async (req, res) => {
    const {octokit, user} = await newUserOctokit(req, res);
    if (!octokit) return;
    res.redirect(`/users/${user}/songs`)
});

app.use(express.static('static'));

app.get('/users/:user/changes', listChanges);
app.post('/users/:user/changes[:]cleanup', cleanupChanges);

app.get('/users/:user/changes/:branch[:]edit', async (req, res) => {
    const branchName = req.params.branch;
    const {octokit,  user} = await newUserOctokit(req, res);
    if (!octokit) return;
    let file = await getFileFromBranch(octokit, user, branchName);
    res.redirect(editorLink(user, branchName, file, false, false));
});

app.delete('/users/:user/changes/:branch', async (req, res) => {
    const branchName = req.params.branch;
    const {octokit, user} = await newUserOctokit(req, res);
    if (!octokit) return;

    await octokit.rest.git.deleteRef({owner: user, repo: 'songbook', "ref": "heads/" + branchName});
    res.send("Deleted");
});

async function getPullRequest(octokit, user, branchName) {
    const res = await octokit.request('GET /repos/{owner}/{repo}/pulls{?state,head,base,sort,direction,per_page,page}', {
        owner: 'wdw21',
        repo: 'songbook',
        head: `${user}:${branchName}`,
    })
    console.log("getPullRequest: " + JSON.stringify(res))
    console.log("getPullRequest (no stringify): ", res);
    return res.status=200 && res.data.length>0 ? res.data[0] : null
}

async function getCommitsDifferenceMsg(octokit, user, branchName) {
    const commits = await octokit.request('GET /repos/{owner}/{repo}/compare/{basehead}{?page,per_page}', {
        owner: user,
        repo: 'songbook',
        basehead: `songeditor-main...${branchName}`
    })
    let msg="";
    for (let commit of commits.data.commits) {
        msg+=commit.commit.message + "\n"
    }
    return msg;
}

async function prDescription(octokit, user, branchName) {
    let file = await getFileFromBranch(octokit, user, branchName);
    let link = editorLink(user, branchName, file, false);
    let msg = await getCommitsDifferenceMsg(octokit, user, branchName);
    let body = `
[Link do edytora](${link})\n\n${msg}\n\nZa kilka minut pojawi się tu wyrenderowana piosenka (PDF).
Ktoś też zrecenzuje/zaakceptuje Twoje zmiany. Może też mieć tutaj dodatkowe komentarze/pytania.\n
Możesz zawsze wrócić do [edytora](${link}) by nanieść dodatkowe poprawki.`;
    return { body, file }
}

// We prepare a form, such that user can do final commit.
async function publishByGet(req, res) {
    const {octokit, user} = await newUserOctokit(req, res);
    const branchName = req.params.branch;
    const {body, file} = prDescription(octokit, user, branchName)
    let url = `https://github.com/wdw21/songbook/compare/main...${user}:songbook:${branchName}?title=Piosenka: ${encodeURIComponent(file)}&expand=1&body=${encodeURIComponent(body)}`
    res.redirect(url);
}

async function publishByPost(req, res) {
    const {octokit, user} = await newUserOctokit(req, res);
    const branchName = req.params.branch;
    const existingPr = await getPullRequest(octokit, user, branchName);
    if (existingPr != null) {
        res.redirect(existingPr.html_url);
        return
    }
    const {body, file} = await prDescription(octokit, user, branchName)
    const response = await octokit.request('POST /repos/{owner}/{repo}/pulls', {
        owner: 'wdw21',
        repo:  'songbook',
        title: `Piosenka: ${file}`,
        body: body,
        head: `${user}:${branchName}`,
        base: 'main'
    })
    console.log("Creation of PULL request returned:" + JSON.stringify(response))
    res.redirect(response.data.html_url);
}


app.get('/users/:user/changes/:branch[:]publish', async (req, res) => {
    await publishByPost(req, res);
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
        const {octokit, user} = await newUserOctokit(req, res);
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
      <input name="file" id='file' type="text" list="files" required pattern="[a-zA-Z0-9\\.\\-_()]+" 
        oninvalid="this.setCustomValidity('Pole musi być wypełnione i zawierać wyłącznie podstawowe litery, cyfry, myślnik i podkreślnik.')"
        oninput="this.setCustomValidity('')"/>
      <div>
        <input type="submit" value="Rozpocznij edycję"/>
      </div>
    </form>`);
    } catch (e) {
        HandleError(e, res);
    } finally {
        htmlSuffix(res);
        console.log("!!! /changes:NEW processing finished !!!");
    }
});

function sanitizeBranchName(br) {
    return br.replaceAll(/[^a-zA-Z0-9.\-_]/g, "_");
}

async function newChange(file, req, res) {
    let today = new Date().toISOString().slice(0, 10);
    let rand = Math.floor(Math.random() * 10000);
    let branchName = sanitizeBranchName("se-" + today + "-" + rand + "-" + file);

    const {octokit, user} = await newUserOctokit(req, res);
    await prepareBranch(octokit, user, branchName)

    res.redirect(editorLink(user, branchName, "songs/" + file, true, true));
}

app.post('/users/:user/changes[:]new', express.urlencoded({extended: true}), async (req, res) => {
    console.log("BODY", req.body);
    let file = req.body.file.trim();
    if (!file.toLowerCase().endsWith(".xml")) {
        file = file + ".xml";
    }
    return newChange(file, req, res)
});

app.post('/users/:user/changes/:file[:]new', async (req, res) => {
    let file = req.params.trim();
    return newChange(file, req, res)
});

app.get('/users/:user/songs', async (req, res) => {
    try {
        console.log("Starting request /songs");
        const {octokit, user} = await newUserOctokit(req, res);
        if (!octokit) {
            return;
        }

        htmlPrefix(res);
        res.write(`
      <h1>Lista piosenek</h1>\n
      Wybierz plik, który będziesz edytował:
      `);

        let songs = await getSongs(octokit, user)

        res.write(`<ul>\n`);
        for (const song of songs) {
            res.write(`  <li>${song.title} <form action="/users/${user}/changes:new" method="post"><input type="hidden" name="file" value="${song.filename}"/><input type="submit" value="[ Edytuj ]"/></form></li>\n`);
        }
        res.write(`</ul>\n`);

        res.write(`
    <form action="/users/${user}/changes:new" method="post">
      <input name="file" id='file' type="text" list="files"/>
      <div>
        <input type="submit" value="Dodaj nową"/>
      </div>
    </form>`);
    } catch (e) {
        HandleError(e, res);
    } finally {
        htmlSuffix(res);
        console.log("!!! /songs processing finished !!!");
    }
});

app.get('/config', async (req, res) => {
    const {octokit, authuser} = await newUserOctokit(req, res);

    try {
        await octokit.rest.repos.get({owner: authuser, repo: "songbook"});
    } catch (e) {
        await octokit.rest.repos.createFork({owner: "wdw21", repo: "songbook"});
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
        await delay(3000);
    }

    await prepareMainBranch(octokit, authuser);
    res.redirect(`/users/${authuser}/changes`);
});

function logRequest(req, res, next) {
    console.log("V=============================================================V");
    console.log("REQUEST", req.url)
    next();
    console.log("^=============================================================^");
}

app.use(logRequest)

app.use((err, req, res, next) => {
    console.error("Failed request", req.url, util.inspect(err, false, null, false));
    if (err instanceof RequestError) {
        console.log("RequestError");
    }
    next(res);
})

async function commit(branchName, file, msg, payload, req, res) {
    const {octokit, mygraphql, user} = await newUserOctokit(req, res);
    if (!octokit) {
        return;
    }


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
  `, {
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

app.post('/users/:user/changes/:branchName[:]commit', async (req, res) => {
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

app.post('/users/:user/changes/:branchName/:file([^$]+)', async (req, res) => {
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

app.post('/users/:user/changes/:branchName/:file([^$]+)[:]commitAndPublish', async (req, res) => {
    const branchName = req.params.branchName;
    const msg = req.query.msg ? req.query.msg : "Kolejne zmiany";
    const file = req.params.file.trim()
    const payload = req.body;
    await commit(branchName, file, msg, payload, req, res);
    return publish(res, req);
});

app.get('/users/:user/changes/:branchName/:file([^$]+)', async (req, res) => {
    try {
        const {octokit, user} = await newUserOctokit(req, res);
        if (!octokit) return;

        const branchName = req.params.branchName;
        console.log(branchName);
        let cont = await octokit.rest.repos.getContent(
            {owner: user, repo: 'songbook', path: req.params.file, ref: branchName});

        // res.setHeader('Content-disposition', 'attachment; filename='+req.params.file);
        res.setHeader('Content-type', 'text/xml')
        res.send(new Buffer.from(cont.data.content, "base64").toString('utf-8'));
    } catch (e) {
       if (e instanceof RequestError && e.status===404) {
           res.status(404);
           res.send("Document not found");
       } else {
           HandleError(e, res);
       }
    } finally {
        res.end();
    }
});

// TODO(ptab): - it should redirect back to origin, not to the 'changes' page
app.get('/auth', async (req, res) => {
    const state = crypto.randomUUID();
    res.clearCookie("session", {domain: PARENT_DOMAIN});
    res.cookie("state", state);

    const {url} =
        oauthAuthorizationUrl({
            clientType: "oauth-app",
            clientId: OAUTH_CLIENT_ID,
            redirectUrl: CONFIG_BASE_URL,
            scopes: ["public_repo"],
            state: state,
        });
    res.redirect(url);
});

app.get('/intro', async (req, res) => {
    htmlPrefix(res);
    res.write(`
      <h1>O edytowaniu piosenek w śpiewniku</h1>
      <p>Zachęcamy wszystkich do poprawiania piosenek w naszym śpiewniki i dopisywania nowych.
      Staramy się by było to jak najwygodniejsze, a rezultaty mogły być drukowane (PDF A4 i A5), czytane jako ebook 
      (EPUB) lub <a href="${EDITOR_DOMAIN}">przeglądane na stronie</a>.  
      Gdy twoje propozycje zmian zostaną zatwiedzone (dbamy o jakość), nowa wersja plików (wygenerowana w kilka minut), 
      będzie zawierała te poprawki.
      </p>
      
      <p>Dlatego przygotowaliśmy narzędzie umożliwiające wygodne edytowanie piosenek i dodawanie ich do śpiewnika.
      Jedyny wymaganiem jest założenie bezpłatnego konta w serwisie <a href="https://github.com">github</a>, 
      bo nasza baza piosenek jest przechowywana <a href="https://github.com/wdw21/songbook/tree/main/songs">właśnie tam</a>.
      </p>
      <p>Jeśli chcesz spróbować - <b>przejdź do <a href="/auth">edycji</a></b> - zostaniesz poproszeony o zalogowanie lub/i przyznanie uprawnień naszej aplikacji.</p>
      
      <details>
        <summary>O bezpieczeństwie</summary>
        Możesz odczuwać uzasadniony dyskomfort (w szczególności jeśli masz swoje własne repozytoria githubowe),
        by upoważniać jakąś aplikację by miała do nich dostęp. Mogę Cię tylko zapewnić (ale musisz mi zaufać),
        że ta aplikacja tylko: 
        <ul>
            <li>Tworzy roboczą kopię (fork) repozytorium <a href="https://github.com/wdw21/songbook">wdw21/songbook</a>, jeśli go jeszcze nieposiadasz.</li>
            <li>Dotyka wyłącznie twojej roboczej kopi repozytorium 'songbook'</li>
            <li>Tworzy i kasuje gałęzie (branches) w repozytorium 'songbook' o nazwie zaczynającej się od 'se-'</li>
            <li>Tworzy zapisy (commits) w tych gałęziach, gdy zapisujesz zmiany piosenek.</li>
        </ul>
      </details>
      <details>
        <summary>Tryb samodzielny</summary>
         <p>Jeżeli chcesz użyć lub zapoznać się z samym edytorem piosenek to przejdź do: <a href="${EDITOR_BASE_URL}">samodzielnego edytora</a>. 
         Będziesz mógł/mogła tworzyć nowe piosenki lub otwierać pliki z Twojego dysku lub je zapisywać do plików. Możesz wtedy je przesłać mailem
         lub samodzielnie użyć narzędzia 'git'.
      </p>
      </details> 
      <p>Problemy/uwagi możesz zgłaszać na: <a href="https://github.com/wdw21/songbook/issues">https://github.com/wdw21/songbook/issues</a></p>
      `);
    htmlSuffix(res);
});
