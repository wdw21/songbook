
const nbsp = "\u00a0";
const spaceRegex = / /g;


let dropped = null;

function createChord(chord) {
  ch = document.createElement("song-ch");
  ch.draggable = true;
  ch.ondragstart = (e) => {
    e.target.opacity = "0.2";
    e.dataTransfer.effectAllowed = "copyMove";
    e.dataTransfer.dropEffect = "move";
    e.dataTransfer.setData("songbook/chord", e.target.getAttribute("a"));
    dropped = false;
  }
  ch.ondragend = (e) => {
    e.target.opacity = '1.0';
    if (dropped && e.dataTransfer.dropEffect == 'move') {
      e.target.remove();
    }
  }
  ch.setAttribute('a', chord);
  ch.draggable = true;
  ch.style.userSelect='all';
  return ch;
  return ch;
}

function createSongBody() {
  return document.createElement("song-body");
}

function acceptsTextAndChords(element) {
  return element.nodeName="SONG-ROW";
}

function canInsertChord() {
  //console.warn(window.getSelection().getRangeAt(0));
  if (window.getSelection().rangeCount < 1) {return false; }
  let r = window.getSelection().getRangeAt(0);
 // console.warn(r.startContainer);
  let x =
      //acceptsTextAndChords(r.startContainer);
      (r.startContainer.nodeName == '#text'
           && acceptsTextAndChords(r.startContainer.parentNode));
  return x;
}

function insertChordHere(ch) {
  if (canInsertChord()) {
    let chedit = createChord("");
    chedit.setAttribute("editing", "true");
    window.getSelection().getRangeAt(0).insertNode(chedit);
    chedit.focus();
    return true;
  }
  return  false;
}

function setCursorBefore(node) {
  let newr=document.createRange();
  newr.setStartBefore(node);
  document.getSelection().removeAllRanges();
  document.getSelection().addRange(newr);
}

function mergeNodeAfter(target, source) {
  let first=source.childNodes[0];
  let documentFragment = document.createDocumentFragment();
  while (source.childNodes.length>0) {
    documentFragment.appendChild(source.childNodes[0]);
  }
  target.appendChild(documentFragment);
  source.remove();
  setCursorBefore(first);
}



function  rowToNodes(row) {
  let newRow = document.createElement("song-row");
  newRow.classList.add("accepts-ch");
  let nodes=[];
  for (let i = 0; i < row.childNodes.length; ++i) {
    let node = row.childNodes[i];
    if (node.nodeName == '#text') {
      let n = node.cloneNode();
      newRow.appendChild(n);
      n.nodeValue = n.nodeValue.replaceAll(spaceRegex, nbsp);
    } else {
      newRow.appendChild(createChord(node.attributes['a'].value));
    }
  }
  return [newRow];
}

// function sanitizeRow(row) {
//   for (let i=0; i < row.childNodes.length; ++i) {
//     let node = row.childNodes[i];
//     if (node.nodeName === '#text') {
//       node.nodeValue = node.nodeValue.replaceAll(spaceRegex, nbsp);
//     } else if (node.nodeName == 'SONG-CH') {
//       while (node.childNodes.length > 0) {
//         node.removeChild(node.childNodes[0]);
//       }
//     } else {
//       row.replaceChild(document.createTextNode(node.textContent), node);
//     }
//   }
//   if (!row.textContent.startsWith(nbsp)) {
//     if (row.childNodes.length > 0) {
//       row.insertBefore(document.createTextNode(nbsp), row.childNodes[0]);
//     } else {
//       row.appendChild(document.createTextNode(nbsp));
//     }
//   }
//   row.normalize();
// }
//
// function sanitize(lyric) {
//   let rows = lyric.getElementsByTagName("song-row");
//
//   for (let i=0; i < rows.length; ++i) {
//     let row = rows[i];
//     sanitizeRow(row);
//   }




  // for (let i=0; i < lyric.childNodes.length; ++i) {
  //
  //   if ()
  //
    // let node = lyric.childNodes[i]
    // let parent = node.parentNode
    // if (node.nodeName=='DIV') {
    //   let next = node.nextSibling;
    //   for (let i = node.childNodes.length - 1; i>=0; --i) {
    //     if (next) {
    //       next = parent.insertBefore( node.childNodes[i], next);
    //
    //     } else {
    //       console.log(node.childNodes[i])
    //       next = parent.appendChild(node.childNodes[i]);
    //     }
    //   }
    //   if (next) {
    //     parent.insertBefore(document.createElement("br"), next);
    //   }
    //   node.remove();
    // }
 // }
//}

function onLoad() {

  //document.execCommand('defaultParagraphSeparator', false, 'br');
  text = '<?xml version="1.0" encoding="utf-8"?>'
      + '<song>'
      + ' <verse>'
      + '      <row important_over="false"><ch a="G"/> Kiedy stał<ch a="Gis"/>em w przedśw<ch a="D"/>icie a Synaj</row>'
      + '      <row important_over="false"><ch a="C"/> Prawdę głosił przez tr<ch a="e"/>ąby wiatru</row>'
      + ' </verse><verse>'
      + '      <row important_over="false"><ch a="G"/> Zasmerczyły się chmury igl<ch a="D"/>iwiem</row>'
      + '      <row important_over="false"><ch a="e"/> Bure świerki o g<ch a="C"/>óry wsp<ch a="D"/>arte</row>'
      + ' </verse>'
      + '</song>';

  parser = new DOMParser();
  xmlDoc = parser.parseFromString(text, "text/xml");

  let editor = document.getElementById("editor");
  SongChInit(editor);
  SongVerseInit();
  SongBodyInit();

  let body = createSongBody();
  editor.appendChild(body);

  let bodydiv = document.createElement("song-verses");
  body.appendChild(bodydiv);

  let verses = xmlDoc.getRootNode().childNodes[0].getElementsByTagName('verse');
  for (let vi = 0; vi < verses.length; ++vi) {
    let verse = verses[vi];
    let songVerse = document.createElement("song-verse");
    let d= document.createElement("song-rows");

    bodydiv.appendChild(songVerse);
    songVerse.appendChild(d);
    let rows = verse.getElementsByTagName('row');
    for (let i = 0; i < rows.length; ++i) {
      d.append(...rowToNodes(rows[i]));
    }

    let san = document.createElement("span");
    san.innerText = "[sanitize verse]";
    san.style.color = 'blue';
    san.onclick = function (e) { Sanitize(songVerse); }
    bodydiv.appendChild(san);
  }

}


