// function traverse() {
//
// }
//
// enum Level {
//   SONG,
//   VERSE,
//   BIS,
//   ROW
// }
//
// function sanitize(dom) {
//
// }
//
// function nodeType(node) {
//   if (node.nodeName==='DIV') {
//     return "DIV." + node.className;
//   } else {
//     node.nodeName;
//   }
// }

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

function  nestToVerseOrBis(parent) {
  let p = findAncestor(parent, "SONG-BIS");
  if (p) { return p; }
  p = findAncestor(parent, "SONG-VERSE");
  if (p) { return p; }

  let newParent = nestToBody(parent);
  let verse = document.createElement("song-verse");
  newParent.appendChild(verse);
  return verse;
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
//
//   switch parent.nodeName {
//     case "SONG-BODY":
//
//     case "SONG-ROW":
//       return parent;
//     case "SONG-BIS":
//     case "SONG-VERSE":
//       // not yet supported
//       row = document.createElement("song-row");
//       parent.appendChild(row);
//       return row;
//     default:
//       verse = document.createElement("song-verse");
//       return verse;
//   }
// }
//
function removeAllChildren(node) {
  while(node.childNodes.length > 0) {
    node.removeChild(node.childNodes[0]);
  }
}

function traverseChilds(parent, childNodes) {
  let ns = [];
  childNodes.forEach( (n) => { ns.push(n); } );
  ns.forEach( (n) => { traverse(parent, n); } );
}

// // parent - is sanitized parent of tag (song, song-verse(div), song-bis(div), song-row(div))
// // the call responsibility is to process the node and put it into parent.
function traverse(parent, node) {
  node.style=null;
  switch (node.nodeName) {

    // BASIC
    case '#text' : {
      let newParent = nestToRow(parent);
   //   if (newParent != node.parentNode) {
        newParent.appendChild(node);
   //   }
      return;
    }
    case 'SONG-CH': {
      removeAllChildren(node);
      let newParent = nestToRow(parent);
   //   if (newParent != node.parentNode) {
        newParent.appendChild(node);
   //   }
      return;
    }
    case 'SONG-ROW': {
      let newParent = nestToRows(parent);
  //    if (newParent != node.parentNode) {
        newParent.appendChild(node);
   //   }
      traverseChilds(node, node.childNodes);
      return;
    }
    case 'SONG-ROWS': {
      let newParent = nestToVerseOrBis(parent);
  //    if (parent != newParent) {
        newParent.appendChild(node);
  //    }
      traverseChilds(node, node.childNodes);
      return;
    }
    case 'SONG-BIS': {
      let newParent = nestToVerse(parent);
  //    if (parent != newParent) {
        newParent.appendChild(node);
  //    }
      traverseChilds(node, node.childNodes);
      return;
    }
    case 'SONG-VERSE': {
      let newParent = nestToBody(parent);
    //  if (parent != newParent) {
        newParent.appendChild(node);
  //    }
      traverseChilds(node, node.childNodes);
      return;
    }
    case 'SONG-BODY': {
      let newParent = nestToBody(parent);
      traverseChilds(newParent, node.childNodes);
      return;
    }

    case 'CODE': {
      if (node.className=='an') {
        // Wywrota: <code class="an" data-chord="C" data-suffix="" data-local="C">C</code>
        let ch = createChord(node.attributes['data-chord'].value);
        node.remove();
        let newParent = nestToRow(parent);
        newParent.appendChild(ch);
        return;
      }
    }

    case 'SPAN': {
      if (node.className=='annotated-lyrics') {
        // Wywrota: <span class="annotated-lyrics">Kaszubskie noce, <code class="an" data-chord="A" data-suffix="m" data-local="a">a</code>nad nami lśniące</span>
        let newParent = nestToRow(parent, true);
        traverseChilds(newParent, node.childNodes);
        node.remove();
        return;
      }
    }
  }
  while (node.childNodes.length > 0) {
    let n=node.childNodes[0];
    parent.appendChild(n);
    traverse(parent, n);
  }
  node.remove();
}

function Sanitize(body) {
  newBody = document.createElement("song-body");
  newBody.contentEditable=true;
  newBody.spellcheck=false;
  traverse(newBody, body);
 // removeAllChildren(body);
  body.parentNode.replaceChild(newBody, body);
}