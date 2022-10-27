import {createOAuthUserAuth} from "@octokit/auth-app";
import {Octokit} from "@octokit/rest";
import util from "util";
import {graphql}  from "@octokit/graphql";

const USER_AGENT="songbook/0.1.0";

const OAUTH_APP_SECRET = process.env.OAUTH_APP_SECRET;

export const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID;

export const BASE_URL = process.env.BASE_URL;
export const EDITOR_DOMAIN = process.env.EDITOR_DOMAIN;
export const EDITOR_BASE_URL = EDITOR_DOMAIN + '/songbook/editor'

// export const EDITOR_DOMAIN = 'http://localhost:63342'
// export const EDITOR_BASE_URL = EDITOR_DOMAIN + '/editor/songbook'

//http://localhost:63342/editor/songbook/index.html?_ijt=1gb48nh9nfnchi9pkou1v8tffm&_ij_reload=RELOAD_ON_SAVE

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
  </head>
  <body>
    <div>
      <a href="/changes">[Edycje]</a>
      <a href="/users/me/changes:new">[Nowa]</a>
      <a href="/songs">[Piosenki]</a>
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
        authuser = authenticated.data.login;
        console.log(util.inspect(authenticated, false, null, false));
        res.cookie("session", {"access_token": access_token, "user": authuser}, { maxAge: 3*24*60*60*1000, httpOnly: true, sameSite:'none', secure: true });
    }
    const usr = (!req.param.user || req.param.user === 'me') ? authuser : req.param.user;
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
            console.error(e);
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

export function editorLink(user, branchName, file, autocommit) {
    //let load = 'https://raw.githubusercontent.com/' + encodeURIComponent(user) + '/songbook/' + encodeURIComponent(branchName) + '/' + encodeURIComponent(file);
    //let commit = CHANGES_BASE_URL + '/'+branchName+':commit';
    // return EDITOR_BASE_URL+'?load=' + encodeURIComponent(load) + '&change=' + encodeURIComponent(commit) + (autocommit?'&commitOnLoad=true':'') + '&changesUrl=' + encodeURIComponent(CHANGES_BASE_URL) + "&songsUrl=" + encodeURIComponent(SONGS_BASE_URL) + "&file=" + encodeURIComponent(file);
    return EDITOR_BASE_URL + '?' +
        '&baseUrl=' + encodeURIComponent(BASE_URL) +
        '&branch=' + encodeURIComponent(branchName) +
        '&file=' + encodeURIComponent(file) +
        '&user=' + encodeURIComponent(user) +
        (autocommit?'&commitOnLoad=true':'');
}
