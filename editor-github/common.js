import {createOAuthUserAuth} from "@octokit/auth-app";
import {Octokit} from "@octokit/rest";
import {RequestError} from "@octokit/request-error";
import util from "util";
import {graphql}  from "@octokit/graphql";

const USER_AGENT="songbook/0.1.0";

const OAUTH_APP_SECRET = process.env.OAUTH_APP_SECRET;

export const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID;

export const BASE_URL = process.env.BASE_URL;
export const EDITOR_DOMAIN = process.env.EDITOR_DOMAIN;
export const EDITOR_PATH = process.env.EDITOR_PATH;
export const PARENT_DOMAIN = process.env.PARENT_DOMAIN;


export const EDITOR_BASE_URL = EDITOR_DOMAIN + EDITOR_PATH

export const CHANGES_BASE_URL = BASE_URL + "/changes";
export const CONFIG_BASE_URL = BASE_URL + "/config";

export const MAIN_BRANCH_NAME="songeditor-main";


export async function getFileFromBranch(octokit, user, branchName) {
    let diff = await octokit.rest.repos.compareCommitsWithBasehead({
        owner: 'wdw21',
        repo: 'songbook',
        basehead: `main...${user}:songbook:${branchName}`
    });
    return diff.data.files.length>0 ? diff.data.files[0].filename : null;
}

export function htmlPrefix(res) {
    res.write(`<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/html" lang="pl-PL">
  <head>
    <meta charset="UTF-8">
    <title>Edytor piosenek</title>
    <script>
      function deleteBranch(user, branch) {
        if (confirm("Czy na pewno chcesz skasować zmianę: '" +branch + "'?")) {
          let url='${BASE_URL}/users/' + user + '/changes/' + branch;
          fetch(url, {method:'DELETE'})
            .then(() => window.location.reload());
        }
      }
    </script>
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link href="/editor.css" rel="stylesheet">
  </head>
  <body>
    <div>
      <a href="/changes">[Edycje]</a>
      <a href="/users/me/changes:new">[Nowa]</a>
      <a href="${EDITOR_DOMAIN}">[Piosenki]</a>
    </div>
`);
}

export function htmlSuffix(res) {
    res.write(`
  </body>
</html>`);
    res.end();
}

export async function newUserOctokit(req,res) {
    let access_token = req.cookies.session ? req.cookies.session.access_token
        : null;
    let authuser = req.cookies.session ? req.cookies.session.user : null;
    console.log("access token from cookie: ", access_token)
    if (!access_token || !authuser) {
        //TODO(ptab): Compare secret with the cookie.
        const authData = {
            clientId: OAUTH_CLIENT_ID,
            clientSecret: OAUTH_APP_SECRET,
            code: req.query.code,
            state: req.query.state,
            redirectUrl: CHANGES_BASE_URL,
            log: console,
        };

        const auth = await createOAuthUserAuth(authData);
        try {
            const {token} = await auth();
            access_token = token;
        } catch (e) {
            console.log("Catched error(1):", e);
            console.log("Catched error(2):", e.status, e instanceof RequestError);
            res.redirect("/auth");
            return {octkokit: null,authuser:null,user:null,mygraphql:null};
        }
        const octokit = new Octokit({
            userAgent: USER_AGENT,
            auth: access_token,
            log: console,
        });
        const authenticated = await octokit.rest.users.getAuthenticated();
        authuser = authenticated.data.login;
        console.log(util.inspect(authenticated, false, null, false));
        res.cookie("session", {
            "access_token": access_token,
            "user": authuser},
            { maxAge: 3*24*60*60*1000, httpOnly: true, sameSite:'none', secure: true, domain: PARENT_DOMAIN });
        res.cookie("new", "false", { maxAge: 31536000});
    }
    const usr = (!req.params.user || req.params.user === 'me') ? authuser : req.params.user;
    console.log('Acting as user:', usr);
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
        authuser: authuser,
        user: usr
    }
}


export async function fetchBranch(octokit, user, branchName) {
    try {
        return await octokit.rest.repos.getBranch(
            {owner: user, repo: 'songbook', 'branch': branchName});
    } catch (e) {
   //     if (!(e instanceof HttpError) || (e.code !== 404)) {
            console.error(util.inspect(e,false,null,false), e instanceof RequestError);
            
            
   //     }
    }
    return null;
}

export async function prepareMainBranch(octokit, user) {
    let branch = await fetchBranch(octokit, user, MAIN_BRANCH_NAME);
    if (!branch) {
        let originBranch = await fetchBranch(octokit, 'wdw21', 'main');
        console.log(util.inspect(originBranch, false, null, false));
        await octokit.rest.git.createRef({owner: user, repo: 'songbook', "ref": "refs/heads/" + MAIN_BRANCH_NAME, "sha": originBranch.data.commit.sha});
    }
    await octokit.rest.repos.mergeUpstream({owner: user, repo: 'songbook', 'branch': MAIN_BRANCH_NAME});
    return fetchBranch(octokit, user, MAIN_BRANCH_NAME);
}

export async function prepareBranch(octokit, user, branchName) {
    let branch = await fetchBranch(octokit, user, branchName);
    if (branch) {
        return branch;
    }
    let mainBranch = await prepareMainBranch(octokit, user);
    console.log(util.inspect(mainBranch, false, null, false));

    await octokit.rest.git.createRef({owner: user, repo: 'songbook', "ref": "refs/heads/" + branchName, "sha": mainBranch.data.commit.sha});
    return fetchBranch(octokit, user, branchName);
}

export function editorLink(user, branchName, file, autocommit, maybeNew) {
    let url = new URL(EDITOR_BASE_URL);
    url.searchParams.set('baseUrl', BASE_URL);
    url.searchParams.set('branch', branchName);
    url.searchParams.set('file', file);
    url.searchParams.set('user', user);
    if (autocommit) {
        url.searchParams.set('commitOnLoad', 'true');
    }
    if (maybeNew) {
        url.searchParams.set('new', 'maybe');
    }
    return url.href;
}

export function HandleError(e, res) {
    console.log("HttpError", util.inspect(e, false, null, false) );
    if (!res.headersSent && e instanceof RequestError && e.status===401) {
        // HttpError RequestError [HttpError]: Bad credentials
        res.redirect('/auth');
        return;
    }
    if (!res.responsesSent) {
        res.send(`<hr/><detail><summery>Error</summery><pre>`);
        res.send(util.inspect(e, false, null, false));
        res.end(`</pre></detail></body></html>`);
    }
}
