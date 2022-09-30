const predefinedChords = ["A", "A2", "A4", "A7", "A7+", "A7/4", "A7/6", "Ais",
  "B", "C", "C0", "C7", "C7+", "C9", "C9/5", "Cis", "Cis0", "D", "D2", "D4",
  "D7", "D7+", "Dis", "E", "E0", "E5+", "E7", "E7/4", "F", "F0", "F7", "F7+",
  "Fis", "Fis0", "Fis7", "G", "G0", "G6", "G7", "GC", "Gis", "H", "H6/7", "H7",
  "a", "a6", "a7", "a7+", "a7/9", "ais", "b", "c", "cis", "cis7", "d", "d2",
  "d6", "e", "e7", "e9", "f", "fis", "fis7", "g", "gis", "gis7", "h", "h0",
  "h7", "h7/5-"];

function predefinedChordsList() {
  let dl = document.createElement("datalist");
  dl.id = "predefinedChords";
  predefinedChords.forEach(
      (ch) => {
        opt = document.createElement("option");
        opt.value = ch;
        dl.appendChild(opt);
      }
  );
  return dl;
}

function getChordNode(node) {
  if (node.className == 'akord') {
    return a.getElementsByTagName('ch')[0];
  }
  while (node != null && node.className != 'ch') {
    console.log('look', node);
    node = node.parentNode;
  }
  return node;
}

let dropped = null;

function createChord(chord) {
  akord = document.createElement("span");
  akord.className = 'akord';
  akord.draggable = true;
  akord.ondragstart = function (e) {
    a = getChordNode(e.target);
    if (a != null) {
      a.opacity = "0.2";
      e.dataTransfer.effectAllowed = "copyMove";
      e.dataTransfer.dropEffect = "move";
      e.dataTransfer.setData("songbook/chord", a.childNodes[0].nodeValue);
      e.dataTransfer.akord = a;
      dropped = false;
    }
  }
  akord.ondragend = function (e) {
    a = getChordNode(e.target);
    if (a != null) {
      this.opacity = '1.0';
    }
    if (dropped && e.dataTransfer.dropEffect == 'move') {
      a.parentNode.remove();
    }
    console.warn(e);
  }
  akord.ondblclick = function (e) {
    let chEditor = createChordEditor(e.target.innerText);
    e.target.parentNode.parentNode.replaceChild(
        chEditor,
        e.target.parentNode);
    chEditor.childNodes[0].focus();
  }
  ch = document.createElement("span");
  ch.className = 'ch';
  ch.innerText = chord;
  ch.contentEditable = 'false';
  akord.appendChild(ch);
  return akord;

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

function rowOnDrop(e) {
  d = e.dataTransfer.getData("songbook/chord");
  if (d != null && d != "") {
    range = getRangeForCursor(e)
    if (range.commonAncestorContainer.parentNode.className == 'row') {
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
  console.warn(r.startContainer);
  let x =
      (r.startContainer.className == 'row')
      || (r.startContainer.nodeName == '#text'
          && r.startContainer.parentNode.className == 'row');
  return x;
}

function insertChordHere(ch) {
  if (canInsertChord()) {
    let chedit = createChordEditor("");
    window.getSelection().getRangeAt(0).insertNode(chedit);
    chedit.childNodes[0].focus();
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
    e.preventDefault();
  }
}

function createLyric() {
  rowp = document.createElement("div");
  rowp.className = 'row';
  rowp.contentEditable = true;
  rowp.ondragover = rowOnDragOver;
  rowp.onmousedown=function (e) {
    if (e.detail > 1 && canInsertChord()) {
      if (insertChordHere("")) {
        e.preventDefault();
      }
    }
  };
  rowp.oninput = function (e) {
   // sanitize(e.target);
  }
  rowp.onbeforeinput = function (e) {
    if (e.inputType=="insertParagraph") {
      //document.getSelection().getRangeAt(0).insertNode(document.createElement("br"));
      document.execCommand("insertHTML",false, '<br/> ')
      e.preventDefault();
    }
    console.log("BEFORE", e);
  }
  rowp.spellcheck = false;
  rowp.contentEditable = 'true';

  rowp.ondrop = rowOnDrop;
  rowp.onkeydown = rowOnKeyDown;

  return rowp;
}

function createChordEditor(v) {
  akord = document.createElement("span");
  akord.className = 'akord';
  chedit = document.createElement("input");
  chedit.className = "ch";
  chedit.type = "search";
  chedit.value = v;
  chedit.setAttribute("list", "predefinedChords");
  chedit.onchange = function (e) {
    console.log("On change");
    console.log(e.target.parentNode);
    let newChord = createChord(chedit.value.trim());
    e.target.parentNode.parentNode.replaceChild(newChord, e.target.parentNode);
    let r = document.createRange();
    r.setStartAfter(newChord);
    document.getSelection().removeAllRanges();
    document.getSelection().addRange(r);
  }
  chedit.onblur = function (e) {
    if (e.target.value.trim()=='') {
      if (e.target.parentNode.parentNode != null) {
        e.target.onblur=null;
        e.target.parentNode.remove();
      }
    }
  }
  chedit.onkeydown = function (e) {
    if (e.key =='Enter' || e.key == 'Escape' || e.key == 'Tab') {
      if (e.target.value.trim() == '') {
        if (e.target.parentNode.parentNode != null) {
          e.target.onblur = null;
          e.target.parentNode.remove();
        }
      }
    }
  }

  // }

  //   if (e.key=='Escape') {
  //     let r = document.createRange();
  //     r.setStartAfter(e.target.parentNode);
  //     document.getSelection().removeAllRanges();
  //     document.getSelection().addRange(r);
  //     e.target.parentNode.remove();
  //     e.preventDefault();
  //   }
  // }
  akord.appendChild(chedit);
  return akord;
}

function  rowToNodes(row) {
  let nodes=[];
  for (let i = 0; i < row.childNodes.length; ++i) {
    let node = row.childNodes[i];
    if (node.nodeName == '#text') {
      nodes.push(node.cloneNode());
    } else {
      nodes.push(createChord(node.attributes['a'].value));
    }
  }
  return nodes;
}

function sanitize(lyric) {
  for (let i=0; i < lyric.childNodes.length; ++i) {
    let node = lyric.childNodes[i]
    let parent = node.parentNode
    if (node.nodeName=='DIV') {
      let next = node.nextSibling;
      for (let i = node.childNodes.length - 1; i>=0; --i) {
        if (next) {
          next = parent.insertBefore( node.childNodes[i], next);

        } else {
          console.log(node.childNodes[i])
          next = parent.appendChild(node.childNodes[i]);
        }
      }
      if (next) {
        parent.insertBefore(document.createElement("br"), next);
      }
      node.remove();
    }
  }
}

function onLoad() {
  //document.execCommand('defaultParagraphSeparator', false, 'br');
  text = '<?xml version="1.0" encoding="utf-8"?>'
      + '<song>'
      + '      <row important_over="false"><ch a="G"/> Kiedy stał<ch a="Gis"/>em w przedśw<ch a="D"/>icie a Synaj</row>'
      + '      <row important_over="false"><ch a="C"/> Prawdę głosił przez tr<ch a="e"/>ąby wiatru</row>'
      + '      <row important_over="false"><ch a="G"/> Zasmerczyły się chmury igl<ch a="D"/>iwiem</row>'
      + '      <row important_over="false"><ch a="e"/> Bure świerki o g<ch a="C"/>óry wsp<ch a="D"/>arte</row>'
      + '</song>';

  parser = new DOMParser();
  xmlDoc = parser.parseFromString(text, "text/xml");

  let editor = document.getElementById("editor");

  let pch = predefinedChordsList();
  editor.appendChild(pch);

  let lyric = createLyric();
  editor.appendChild(lyric);

  let verse = xmlDoc.getRootNode().childNodes[0];
  let rows = verse.getElementsByTagName('row');
  for (let i = 0; i < rows.length; ++i) {
    lyric.append(...rowToNodes(rows[i]));
    lyric.append(document.createElement("br"))
  }
}


