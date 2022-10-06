const nbsp = "\u00a0";
const spaceRegex = / /g;

function findAncestor(p, nodeName) {
  while (p != null) {
    if (p.nodeName === nodeName) {
      return p;
    }
    p = p.parentNode;
  }
}

function  nestToBody(parent) {
  let p = findAncestor(parent, "SONG-BODY");
  if (p) { return p; }
  let body = document.createElement("song-body");
  body.contentEditable=true;
  parent.appendChild(body);
  return body;
}

function  nestToVerse(parent) {
  let p = findAncestor(parent, "SONG-VERSE");
  if (p) { return p; }

  let newParent = nestToBody(parent);
  let verse = document.createElement("song-verse");
  newParent.appendChild(verse);
  return verse;
}

function  nestToVerseOrBis(parent) {
  let p = findAncestor(parent, "SONG-BIS");
  if (p) { return p; }
  return nestToVerse(parent);
}


function  nestToRows(parent) {
  let p = findAncestor(parent, "SONG-ROWS");
  if (p) {
    return p;
  } else {
    let newParent = nestToVerseOrBis(parent);
    let rows = document.createElement("song-rows");
    newParent.appendChild(rows);
    return rows;
  }
}

function nestToRow(parent, forceNew=false) {
  if (parent.nodeName === "SONG-ROW" && !forceNew) {
    return parent;
  } else {
    let newParent = nestToRows(parent);
    let row = document.createElement("song-row");
    newParent.appendChild(row);
    return row;
  }
}


function removeAllChildren(node) {
  while(node.childNodes.length > 0) {
    node.removeChild(node.childNodes[0]);
  }
}

function traverseChilds(parent, childNodes) {
  let ns = [];
  childNodes.forEach( (n) => { ns.push(n); } );
  let newparent = parent;
  for (let i=0; i < ns.length; ++i ) {
    newparent = traverse(newparent, ns[i]);
  }
}

// // parent - is sanitized parent of tag (song, song-verse(div), song-bis(div), song-row(div))
// // the call responsibility is to process the node and put it into parent.
function traverse(parent, node) {
  node.style=null;
  switch (node.nodeName) {

    // BASIC
    case '#text' : {
      let newParent = nestToRow(parent);
      newParent.appendChild(node);
      return newParent;
    }
    case 'SONG-CH': {
      removeAllChildren(node);
      let newParent = nestToRow(parent);
      newParent.appendChild(node);
      return newParent;
    }
    case 'SONG-ROW': {
      let newParent = nestToRows(parent);
      newParent.appendChild(node);
      traverseChilds(node, node.childNodes);
      return newParent;
    }
    case 'SONG-ROWS': {
      let newParent = nestToVerseOrBis(parent);
      newParent.appendChild(node);
      traverseChilds(node, node.childNodes);
      return newParent;
    }
    case 'SONG-BIS': {
      let newParent = nestToRows(parent);
      newParent.appendChild(node);
      traverseChilds(node, node.childNodes);
      return newParent;
    }
    case 'SONG-VERSE': {
      let newParent = nestToBody(parent);
        newParent.appendChild(node);
      traverseChilds(node, node.childNodes);
      return newParent;
    }
    case 'SONG-BODY': {
      let newParent = nestToBody(parent);
      traverseChilds(newParent, node.childNodes);
      return newParent;
    }

    case 'CODE': {
      if (node.className=='an') {
        // Wywrota: <code class="an" data-chord="C" data-suffix="" data-local="C">C</code>
        let ch = createChord(node.attributes['data-chord'].value);
        node.remove();
        let newParent = nestToRow(parent);
        newParent.appendChild(ch);
        return newParent;
      }
    }

    case 'SPAN': {
      if (node.className=='annotated-lyrics') {
        // Wywrota: <span class="annotated-lyrics">Kaszubskie noce, <code class="an" data-chord="A" data-suffix="m" data-local="a">a</code>nad nami lśniące</span>
        let newParent = nestToRow(parent, true);
        traverseChilds(newParent, node.childNodes);
        node.remove();
        return newParent;
      }
    }
  }
  while (node.childNodes.length > 0) {
    let n=node.childNodes[0];
    parent.appendChild(n);
    traverse(parent, n);
  }
  node.remove();
  return parent;
}

function sanitizeRow(row) {
  row.normalize();
  if (!row.textContent.startsWith(nbsp)) {
    if (row.childNodes.length > 0) {
      row.insertBefore(document.createTextNode(nbsp), row.childNodes[0]);
    } else {
      row.appendChild(document.createTextNode(nbsp));
    }
  }
}


function Sanitize(body) {
  if (!lightTraverse(body)) {
    console.log("Full fix...");
    console.log("before fix: ", body.outerHTML);
    traverse(body, body);
    console.log("after fix: ", body.outerHTML);
  }
  let rows = body.getElementsByTagName("SONG-ROW");
  for (let i=0; i < rows.length; ++i) {
    let row = rows[i];
    sanitizeRow(row);
  }
}

// Returns whether tree is valid (is. requires deep validation).
function lightTraverse(node) {
  if (node instanceof Element) {
    node.removeAttribute("style");
  }
  switch (node.nodeName) {
    case '#text' : {
      if (node.parentNode.nodeName!='SONG-ROW') {
        console.log("Misplaced", node);
        return false;
      }
      break;
    }
    case 'SONG-CH': {
      removeAllChildren(node);
      if (node.parentNode.nodeName!='SONG-ROW') {
        console.log("Misplaced", node);
        return false;
      }
      if (node.getAttribute("editor") === "false"
          && node.getAttribute("a").trim().length == 0) {
        node.remove();
      }
      break;
    }
    case 'SONG-ROW': {
      if (node.parentNode.nodeName!='SONG-ROWS') {
        console.log("Misplaced", node);
        return false;
      }
      break;
    }
    case 'SONG-ROWS': {
      if (node.parentNode.nodeName!='SONG-BIS'
        && node.parentNode.nodeName!='SONG-VERSE') {
        console.log("Misplaced", node);
        return false;
      }
      if (node.childNodes.length == 0) {
        node.remove();
      }
      break;
    }
    case 'SONG-BIS': {
      if (node.parentNode.nodeName!='SONG-ROWS') {
        console.log("Misplaced", node);
        return false;
      }
      if (node.childNodes.length == 0
        || node.childNodes[0].nodeName != 'SONG-ROWS') {
        node.remove();
      }
      break;
    }
    case 'SONG-VERSE': {
      if (node.parentNode.nodeName!='SONG-BODY') {
        console.log("Misplaced", node);
        return false;
      }
      if (node.childNodes.length == 0
          || node.childNodes[0].nodeName != 'SONG-ROWS') {
        node.remove();
      }
      break;
    }
    case 'SONG-VERSES': {
      if (node.parentNode.nodeName!='SONG-BODY') {
        console.log("Misplaced", node);
        return false;
      }
      break;
    }
    case 'SONG-BODY': {
      break;
    }
    case 'BR':
    case 'SPAN': {
      // Editor sometimes put empty spans.
      if (node.innerHTML==='') {
        node.remove();
        return true;
      }
      break;
    }
    default:
      console.log("Misplaced unknown", node);
      return false;
  }
  {
    // We buffer nodes to not miss anything if it gets removed.
    let ns = [];
    node.childNodes.forEach((n) => {
      ns.push(n);
    });
    for (let i=0; i < ns.length; ++i) {
      if (!lightTraverse(ns[i])) return false;
    }
  }
  if (node.childNodes.length == 0
    && (node.nodeName==='SONG-ROWS'
      || node.nodeName==='SONG-BIS'
      || node.nodeName==='SONG-VERSE')) {
    node.remove();
  }
  return true;
}