
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

function getRangeForCursor(e) {
  if (document.caretRangeFromPoint) {
    // edge, chrome, android
    range = document.caretRangeFromPoint(e.clientX, e.clientY)
  } else {
    // firefox
    var pos = [e.rangeParent, e.rangeOffset]
    range = document.createRange()
    range.setStart(...pos);
    range.setEnd(...pos);
  }
  return range;
}

function acceptsTextAndChords(element) {
  return ((element.classList != null) && element.classList.contains("accepts-ch"));
}

function rowOnDrop(e) {
  d = e.dataTransfer.getData("songbook/chord");
  if (d != null && d != "") {
    range = getRangeForCursor(e)
    a=acceptsTextAndChords(range.commonAncestorContainer.parentNode);
    if (a) {
      range.insertNode(createChord(d));
      dropped = true;
    }
    e.preventDefault();
  }
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

function rowOnKeyDown(event) {
  if (event.key == '`' && canInsertChord()) {
    if (insertChordHere("")) {
      event.preventDefault();
    }
  }
}

function rowOnDragOver(e) {
  if (e.dataTransfer.types.includes("songbook/chord")) {
    if (e.altKey) {
      e.dataTransfer.dropEffect = 'copy';
    } else {
      e.dataTransfer.dropEffect = 'move';
    }
    range = getRangeForCursor(e);
    document.getSelection().removeAllRanges();
    document.getSelection().addRange(range);
    if (!canInsertChord()) {
      e.dataTransfer.dropEffect = 'none';
    }
    e.preventDefault();
  }
}

function setCursorBefore(node) {
  let newr=document.createRange();
  newr.setStartBefore(node);
  document.getSelection().removeAllRanges();
  document.getSelection().addRange(newr);
}

function createLyric() {
  rowp = document.createElement("div");
  rowp.className = 'row';
  rowp.contentEditable = true;
  rowp.ondragover = rowOnDragOver;
  rowp.onmousedown=function (e) {
    if (e.detail > 1 && canInsertChord()) {
      console.log("Parent - row - up");
      if (insertChordHere("")) {
        e.preventDefault();
      }
    }
  };
  rowp.oninput = function (e) {
    console.log("Oninput", e);
   // sanitize(e.target);
  }
  rowp.onbeforeinput = function (e) {
    // if (e.inputType == "insertParagraph") {
    //   //document.getSelection().getRangeAt(0).insertNode(document.createElement("br"));
    //   if (document.getSelection().isCollapsed
    //       && document.getSelection().rangeCount == 1
    //       && document.getSelection().getRangeAt(0).startContainer.nodeName==='#text'
    //       && document.getSelection().getRangeAt(0).startContainer.nodeValue[document.getSelection().getRangeAt(0).startOffset]===' ') {
    //     // Don't put additional space if we break just ahead of 'space'
    //     document.execCommand("insertHTML", false, '<br/>')
    //   } else {
    //     document.execCommand("insertHTML", false, '<br/>&nbsp;')
    //   }
    //   e.preventDefault();
    // }
    if (e.inputType == "deleteContentBackward") {
      if (document.getSelection().rangeCount == 1
          && document.getSelection().isCollapsed) {
        let r = document.getSelection().getRangeAt(0);
        // If the previous element is chord, we want to skip and remove the prev letter.
        if (r.startContainer.nodeName == '#text' && r.startOffset == 0
            && r.startContainer.previousSibling != null && r.startContainer.previousSibling.nodeName==='SONG-CH') {
          setCursorBefore(r.startContainer.previousSibling);
          r = document.getSelection().getRangeAt(0);
          // We want to continue in case we want to merge rows.
        }
        if (r.startContainer.nodeName=='SONG-ROW' && r.startOffset==0) {
          if (r.startContainer.previousSibling != null
              && r.startContainer.previousSibling.nodeName ==='SONG-ROW') {
            let first=r.startContainer.childNodes[0];
            let documentFragment = document.createDocumentFragment();
            while (r.startContainer.childNodes.length>0) {
              documentFragment.appendChild(r.startContainer.childNodes[0]);
            }
            r.startContainer.previousSibling.appendChild(documentFragment);
            setCursorBefore(first);
            e.preventDefault();
          }
        }

        //console.log(r, r.startContainer, r.startContainer.nodeName, r.startOffset);
        //   // If the letter is BR, we need to remove it in a special way.
        //   if (r.startContainer.previousSibling.previousSibling.nodeName === 'BR') {
        //     let newr=document.createRange();
        //     newr.selectNode(r.startContainer.previousSibling.previousSibling);
        //     newr.deleteContents();
        //     // document.getSelection().removeAllRanges();
        //     // document.getSelection().addRange(newr);
        //     //
        //     // // document.getSelection().collapse(r.startContainer.previousSibling.previousSibling);
        //     // document.execCommand("insertHTML",false,"Foo");
        //     e.preventDefault();
        //     return;
        //   } else {
        //     let newr=document.createRange();
        //     newr.setStartBefore(r.startContainer.previousSibling);
        //     document.getSelection().removeAllRanges();
        //     document.getSelection().addRange(newr);
        //     e.preventDefault();
        //     return;
        //   }
        // } else if (r.startContainer.nodeName == '#text' && r.startOffset <= 1
        //        &&  r.startContainer.previousSibling.nodeName==='BR') {
        //   let newr=document.createRange();
        //   newr.setStartBefore(r.startContainer.previousSibling);
        //   newr.setEnd(r.startContainer, r.startOffset);
        //   newr.deleteContents();
        //   e.preventDefault();
        // } else if (r.startContainer.nodeName == '#text' && r.startOffset == 0
        //     &&  r.startContainer.previousSibling.nodeName==='#text') {
        //   let newr=document.createRange();
        //   newr.setEndBefore(r.startContainer);
        //   newr.setStart(r.startContainer.previousSibling, r.startContainer.previousSibling.length - 1);
        //   console.log(newr);
        //   newr.deleteContents();
        //   e.preventDefault();
        // }
          //   && r.startContainer.previousSibling != null && r.startContainer.previousSibling.className==='akord') {
          //console.log("START", r.startContainer, r.startOffset, r.startContainer.previousSibling, r.extractContents())
        //}
      }
    }
    let r = document.getSelection().getRangeAt(0);
    console.log(r, r.startContainer, r.startContainer.nodeName, r.startOffset);
    //console.log("BEFORE", e,document.getSelection());
    //console.dir(JSON.stringify(document.getSelection(), null, 4) );
  }
  rowp.spellcheck = false;
  rowp.contentEditable = 'true';

  rowp.ondrop = rowOnDrop;
  rowp.onkeydown = rowOnKeyDown;

  return rowp;
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
      let regex = / /g;
      n.nodeValue = n.nodeValue.replaceAll(regex, "\u00a0");
    } else {
      newRow.appendChild(createChord(node.attributes['a'].value));
    }
  }
  return [newRow];
}

// function sanitize(lyric) {
//   for (let i=0; i < lyric.childNodes.length; ++i) {
//     let node = lyric.childNodes[i]
//     let parent = node.parentNode
//     if (node.nodeName=='DIV') {
//       let next = node.nextSibling;
//       for (let i = node.childNodes.length - 1; i>=0; --i) {
//         if (next) {
//           next = parent.insertBefore( node.childNodes[i], next);
//
//         } else {
//           console.log(node.childNodes[i])
//           next = parent.appendChild(node.childNodes[i]);
//         }
//       }
//       if (next) {
//         parent.insertBefore(document.createElement("br"), next);
//       }
//       node.remove();
//     }
//   }
// }

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

  let lyric = createLyric();
  editor.appendChild(lyric);

  let verses = xmlDoc.getRootNode().childNodes[0].getElementsByTagName('verse');
  for (let vi = 0; vi < verses.length; ++vi) {
    let verse = verses[vi];
    let songVerse = document.createElement("song-verse");
    let d= document.createElement("div");
 //   d.classList.add("accepts-ch")
    lyric.appendChild(songVerse);
    songVerse.appendChild(d);
    let rows = verse.getElementsByTagName('row');
    for (let i = 0; i < rows.length; ++i) {
      d.append(...rowToNodes(rows[i]));
   //   d.append(document.createElement("br"))
    }

    let san = document.createElement("span");
    san.innerText = "[sanitize verse]";
    san.style.color = 'blue';
    san.onclick = function (e) { sanitize(songVerse); }
    lyric.appendChild(san);
  }



}


