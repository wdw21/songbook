import {findAncestor, getRangeForCursor,nbsp,removeAllChildren,loadXMLDoc} from './utils.js';
import {createChord} from './ch.js'
import {Sanitize} from './sanitize.js'
import {Save} from './save.js'

function acceptsTextAndChords(element) {
  return element.nodeName=="SONG-ROW";
}

function canInsertChord() {
  if (window.getSelection().rangeCount < 1) {return false; }
  let r = window.getSelection().getRangeAt(0);
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
  newr.setEndBefore(node);
  document.getSelection().removeAllRanges();
  document.getSelection().addRange(newr);
  console.log("New selection:", document.getSelection(), newr);
}

function flattenBis(node) {
  if (!node) {
    return;
  }
  let rows = node.childNodes[0].childNodes;
  while (rows.length > 0) {
    node.parentNode.insertBefore(rows[0], node);
  }
  node.remove();
}

export default class SongBody extends HTMLElement {
  constructor() {
    super();

    const template = document.createElement('template');
    template.innerHTML = `
<link rel="stylesheet" href="./song.css"/>
<div class="toolbar">
  <button id="buttonBis">BIS</button>
  <button id="importantOver">Kluczowe akordy</button>
  <button id="buttonInstr">Wers instrumentalny</button>
  <button id="buttonSave">Save</button>
  <input  id="open" type="file" accept=".xml"/>
</div>
<div class="songbody" id="songbody"><slot/></div>
  `;

    const shadow = this.attachShadow({ mode: "closed" });
    shadow.appendChild(template.content.cloneNode(true));
    this.body=shadow.getElementById("songbody");
    this.buttonBis=shadow.getElementById("buttonBis");
    this.importantOver=shadow.getElementById("importantOver");
    this.buttonInstr=shadow.getElementById("buttonInstr");
    this.buttonSave=shadow.getElementById("buttonSave");
    this.open=shadow.getElementById("open");

    this.body.addEventListener("mousedown", this.mouseDown);
    this.body.addEventListener("dragover", (e) => {this.dragOver(e, this); });
    this.body.addEventListener("dragstart", (e) => {this.dragStart(e, this); });
    this.body.addEventListener("dragend", (e) => {this.dragEnd(e, this); });
    this.body.addEventListener("drop", (e) => {this.drop(e, this); });
  //  this.body.addEventListener("keydown", (e) => { this.keyDown(e, this); });
    this.body.addEventListener("focusout", (e) => {this.focusout(e, this); });

    this.buttonBis.addEventListener("click", (e) => this.wrapBis());
    this.importantOver.addEventListener("click", (e) => this.markImportantOver());
    this.buttonInstr.addEventListener("click", (e) => this.toggleInstrumental());
    this.buttonSave.addEventListener("click", () => Save(this));
    this.open.addEventListener("change", (e) => this.Load(e));

    document.addEventListener('selectionchange', (event) => { this.refreshToolbar(); });
  }

  focusout(e, songbook) {
    console.log("focusout", e);
    if (e.target.nodeName==='SONG-BIS'
        && (e.target.getAttribute("x").trim()==="1"
            || e.target.getAttribute("x").trim()===""
            || e.target.getAttribute("x").trim()==="0")) {
      flattenBis(e.target);
    }
    Sanitize(songbook);
  }

  Load(e) {
    console.log("LOADING", e);
    let parser = new DOMParser();

    // setting up the reader
    var reader = new FileReader();
    reader.addEventListener('load', (event) => {
      let parser = new DOMParser();
      let xmlDoc = parser.parseFromString(event.target.result, "text/xml");
      let z=xmlDoc.getElementsByTagName("lyric");
      removeAllChildren(this);
      this.appendChild(z[0]);
      Sanitize(this);
    });
    reader.readAsText(this.open.files[0]);
  }

  connectedCallback() {
    this.parentNodeBackup = this.parentNode;
    this.beforeInputHandler = (e) => { this.beforeInput(e, this); };
    this.parentNode.addEventListener("beforeinput", this.beforeInputHandler);
    this.inputHandler = (e) => { this.input(e, this); };
    this.parentNode.addEventListener("input", this.inputHandler);
    this.keyDownHandler = (e) => this.keyDown(e, this);
    this.parentNode.addEventListener("keydown", this.keyDownHandler);
    this.pasteHandler = (e) => { this.paste(e, this); };
    this.parentNode.addEventListener("paste", this.pasteHandler);
  }

  disconnectedCallback() {
    if (this.parentNodeBackup) {
      this.parentNodeBackup.removeEventListener("beforeinput", this.beforeInputHandler);
      this.parentNodeBackup.removeEventListener("input", this.inputHandler);
      this.parentNodeBackup.removeEventListener("keydown", this.keyDownHandler);
      this.parentNodeBackup.removeEventListener("paste", this.pasteHandler);
    }
  }

  selectedRows() {
    if (document.getSelection().rangeCount == 0) {
      return [];
    }
    let r = document.getSelection().getRangeAt(0);
    let result=[];

    let songRowsParent = findAncestor(r.commonAncestorContainer,"SONG-ROWS");
    if (songRowsParent) {
      let rows = songRowsParent.getElementsByTagName("SONG-ROW");
    //  let parentRow = findAncestor(r.commonAncestorContainer, "SONG-ROW");
      for (let i = 0; i < rows.length; ++i) {
        let row = rows[i];
        if (r.intersectsNode(row)) {
          result.push(row);
        }
      }
    }
    return result;
  }


  wrapBis() {
    let selRows = this.selectedRows();
    if (selRows.length>0) {
      let r = document.getSelection().getRangeAt(0);
      let songRowsParent = findAncestor(r.commonAncestorContainer,"SONG-ROWS");
      if (songRowsParent) {
        let selRows = this.selectedRows();

        flattenBis(findAncestor(r.startContainer, "SONG-BIS"));
        flattenBis(findAncestor(r.endContainer, "SONG-BIS"));

        let biss = songRowsParent.getElementsByTagName("SONG-BIS");
        for (let i = 0; i < biss.length; ++i) {
          console.log("Considering", biss[i]);
          if (r.intersectsNode(biss[i])) {
            flattenBis(biss[i]);
          }
        }

        if (selRows.length > 0) {
          songRowsParent = selRows[0].parentNode;
          let bis = document.createElement("song-bis");
          bis.setAttribute("x", "2");
          let bisRows = document.createElement("song-rows");
          bis.appendChild(bisRows);
          songRowsParent.insertBefore(bis, selRows[0]);
          bisRows.append(...selRows);
          bis.focus();
        }
      }
    }
  }

  markImportantOver() {
    let allImportant = this.allSelectedImportant();
    let selRows = this.selectedRows();
    for (let i = 0; i < selRows.length; ++i) {
      selRows[i].setAttribute("important_over", !allImportant);
    }
    this.refreshToolbar();
  }

  makeRowInstrumental(row) {
    let text=nbsp;
    for (let i=0; i < row.childNodes.length; ++i) {
      let n = row.childNodes[i];
      if (n.nodeName==='SONG-CH') {
        text+=n.getAttribute("a") + nbsp;
      }
    }
    row.setAttribute("type", "instr");
    row.innerText=text;
  }

  makeRowNotInstrumental(row) {
    let chords = row.innerText.replaceAll(' ', nbsp).split(nbsp);
    console.log(chords);
    row.removeAttribute("type");
    removeAllChildren(row);
    for (let i=0; i<chords.length; ++i) {
      row.appendChild(createChord(chords[i]));
      row.appendChild(document.createTextNode(nbsp + nbsp));
    }
  }

  toggleInstrumental() {
    let allInstrumental = this.allSelectedInstrumental();
    let selRows = this.selectedRows();
    for (let i = 0; i < selRows.length; ++i) {
      if (allInstrumental) {
        this.makeRowNotInstrumental(selRows[i]);
      } else {
        this.makeRowInstrumental(selRows[i])
      }
    }
    console.log(this);
    Sanitize(findAncestor(this, "SONG-BODY"));
    this.refreshToolbar();
  }

  allSelectedImportant() {
    let selRows = this.selectedRows();
    let allImportant=true;
    for (let i=0; i<selRows.length; ++i) {
      allImportant &&= selRows[i].getAttribute("important_over")==="true";
    }
    return allImportant;
  }

  allSelectedInstrumental() {
    let selRows = this.selectedRows();
    let allInstrumental=true;
    for (let i=0; i<selRows.length; ++i) {
      allInstrumental &&= selRows[i].getAttribute("type")==="instr";
    }
    return allInstrumental;
  }

  refreshToolbar() {
    if (this.allSelectedImportant()) {
      this.importantOver.innerText='Mało ważne akordy';
    } else {
      this.importantOver.innerText='Kluczowe akordy';
    }
    if (this.allSelectedInstrumental()) {
      this.buttonInstr.innerText='Wers liryczny';
    } else {
      this.buttonInstr.innerText='Wers instrumentalny';
    }
    this.buttonBis.disabled = document.getSelection().rangeCount==0;
  }

  dragStart(e, songbook) {
    songbook.toRemoveWhenDropped = getSelection().getRangeAt(0).cloneRange();
    e.dataTransfer.effectAllowed="copyMove";
  }
  dragEnd(e, songbook) {
    songbook.toRemoveWhenDropped = null;
  }

  mouseDown(e) {
    console.log("mouseDown", e);
    if (e.detail > 1 && canInsertChord() && e.target.nodeName==='SONG-ROW') {
      if (insertChordHere("")) {
        e.preventDefault();
      }
    }
  }

  keyDown(e,songBook) {
    console.log("keydown...",e, document.getSelection());
    if (e.key == '`' && canInsertChord()) {
      if (insertChordHere("")) {
        e.preventDefault();
      }
    }
    if (e.key == 'Backspace'){
      if (document.getSelection().isCollapsed
          && document.getSelection().rangeCount == 1
          && document.getSelection().type === 'Range') {
        let r = document.getSelection().getRangeAt(0);
        if (r.startOffset < r.startContainer.childNodes.length &&
            r.startContainer.childNodes[r.startOffset].nodeName=='SONG-CH') {
          r.startContainer.childNodes[r.startOffset].remove();
          e.preventDefault();
        }
      }
    }
    if (e.key == 'b'  && e.metaKey) {
      songBook.wrapBis();
      e.preventDefault();
    }
  }

  dragOver(e, songbook) {
    if (e.dataTransfer.types.includes("songbook/chord")) {
      if (e.altKey) {
        e.dataTransfer.dropEffect = 'copy';
      } else {
        e.dataTransfer.dropEffect = 'move';
      }
      let range = getRangeForCursor(e);
      document.getSelection().removeAllRanges();
      document.getSelection().addRange(range);
      if (!canInsertChord()) {
        e.dataTransfer.dropEffect = 'none';
      };
      e.preventDefault();
    }
  }

  drop(e, songbody) {
    let d = e.dataTransfer.getData("songbook/chord");
    if (d != null && d != "") {
      let range = getRangeForCursor(e)
      if (acceptsTextAndChords(range.commonAncestorContainer.parentNode)) {
        range.insertNode(createChord(d));
        songbody.dropped = true;
      }
      e.preventDefault();
      Sanitize(songbody);
      return;
    }

    d = e.dataTransfer.getData("text/html");
    if (d != null && d != "") {
      console.log("Special!!!", e.dataTransfer.dropEffect);

      if ((e.dataTransfer.dropEffect === 'move'
              || !e.altKey) &&
          songbody.toRemoveWhenDropped != null) {
        songbody.toRemoveWhenDropped.deleteContents();
      }

      let range = getRangeForCursor(e)
      let span = document.createElement("span");
      span.innerHTML=d;
      range.insertNode(span);
      Sanitize(songbody);
      e.preventDefault();

      return;
    }

  }

  beforeInput(e, songbody) {
    if (e.inputType == "deleteContentBackward"
       && e.target == songbody.parentNode) {
      if (document.getSelection().rangeCount == 1
          && document.getSelection().isCollapsed) {
        let r = document.getSelection().getRangeAt(0);
        console.log(document.getSelection(), r.startContainer.nodeName, r.startContainer, r.startOffset)
        // If the previous element is chord, we want to skip and remove the prev letter.
        if (r.startContainer.nodeName == '#text' && r.startOffset == 0
            && r.startContainer.previousSibling != null
            && r.startContainer.previousSibling.nodeName === 'SONG-CH') {
          setCursorBefore(r.startContainer.previousSibling);
          r = document.getSelection().getRangeAt(0);
          // We want to continue in case we want to merge rows.
        }
        // If we are after the trailing space... we want to remove it as well.
        if (r.startContainer.nodeName == '#text' && r.startOffset == 1
            && r.startContainer.previousSibling == null
            && r.startContainer.nodeValue.startsWith(nbsp)) {
          r.startContainer.nodeValue = r.startContainer.nodeValue.substring(1);
          if (r.startContainer.parentNode.previousSibling != null) {
            mergeNodeAfter(r.startContainer.parentNode.previousSibling,
                r.startContainer.parentNode);
            e.preventDefault();
          }
        }
        // When we are at the beginning of the ROW, we merge the rows.
        if (r.startContainer.nodeName == 'SONG-ROW' && r.startOffset == 0) {
          if (r.startContainer.previousSibling != null
              && r.startContainer.previousSibling.nodeName === 'SONG-ROW') {
            // There is previous line:
            mergeNodeAfter(r.startContainer.previousSibling, r.startContainer);
            e.preventDefault();
          } if (r.startContainer.previousSibling != null
              && r.startContainer.previousSibling.nodeName === 'SONG-BIS') {
            // Previous line is within bis.
            mergeNodeAfter(r.startContainer.previousSibling.childNodes[0].lastChild, r.startContainer);
            e.preventDefault();
          } else if (r.startContainer.previousSibling == null
              && r.startContainer.parentNode.parentNode != null
              && r.startContainer.parentNode.parentNode.nodeName === 'SONG-BIS'
              && r.startContainer.parentNode.parentNode.previousSibling != null
              && r.startContainer.parentNode.parentNode.previousSibling.nodeName == 'SONG-ROW' ) {
            // Previous line is outside of bis.
            mergeNodeAfter(r.startContainer.parentNode.parentNode.previousSibling,
                r.startContainer);
            e.preventDefault();
          } else if (r.startContainer.previousSibling == null
              && r.startContainer.parentNode.parentNode.previousSibling != null
              && r.startContainer.parentNode.parentNode.previousSibling.nodeName === 'SONG-VERSE') {
            // Previous line is in another verse.
            mergeNodeAfter(r.startContainer.parentNode.parentNode.previousSibling.childNodes[0],
                r.startContainer.parentNode);
            r.startContainer.remove();
            e.preventDefault();
          }
        }
        if (r.startContainer.nodeName == 'SONG-ROW' && r.startOffset == 1) {
          if (r.startContainer.previousSibling != null
              && r.startContainer.previousSibling.nodeName === 'SONG-ROW'
              && r.startContainer.childNodes[0].nodeName==='#text'
              && r.startContainer.childNodes[0].nodeValue===nbsp) {
            r.startContainer.childNodes[0].remove();
            mergeNodeAfter(r.startContainer.previousSibling, r.startContainer);
            e.preventDefault();
          }
        }
        // When we are at the beginning of the ROW, we merge the rows.
        if (r.startContainer.nodeName == '#text' && r.startOffset == 0) {
          if (r.startContainer.previousSibling == null
              && r.startContainer.parentNode.nodeName === 'SONG-ROW'
              &&  r.startContainer.parentNode.previousSibling != null
              &&  r.startContainer.parentNode.previousSibling.nodeName === 'SONG-ROW') {
            mergeNodeAfter(r.startContainer.parentNode.previousSibling, r.startContainer.parentNode);
            e.preventDefault();
          }
          if (r.startContainer.previousSibling == null
              && r.startContainer.parentNode.nodeName === 'SONG-ROW'
              &&  r.startContainer.parentNode.previousSibling == null
              &&  r.startContainer.parentNode.parentNode.parentNode.nodeName === 'SONG-VERSE'
              &&  r.startContainer.parentNode.parentNode.parentNode.previousSibling
              &&  r.startContainer.parentNode.parentNode.parentNode.previousSibling.nodeName === 'SONG-VERSE') {
            mergeNodeAfter(r.startContainer.parentNode.parentNode.parentNode.previousSibling.childNodes[0], r.startContainer.parentNode.parentNode);
            e.preventDefault();
          }
          if (r.startContainer.previousSibling == null
              && r.startContainer.parentNode.nodeName === 'SONG-ROW'
              &&  r.startContainer.parentNode.previousSibling == null
              &&  r.startContainer.parentNode.parentNode.parentNode.nodeName === 'SONG-BIS'
              &&  !r.startContainer.parentNode.parentNode.parentNode.previousSibling
              &&  r.startContainer.parentNode.parentNode.parentNode.parentNode.parentNode.nodeName === 'SONG-VERSE'
              &&  r.startContainer.parentNode.parentNode.parentNode.parentNode.parentNode.previousSibling
              &&  r.startContainer.parentNode.parentNode.parentNode.parentNode.parentNode.previousSibling.nodeName === 'SONG-VERSE') {
            mergeNodeAfter(r.startContainer.parentNode.parentNode.parentNode.parentNode.parentNode.previousSibling.childNodes[0], r.startContainer.parentNode.parentNode.parentNode.parentNode);
            e.preventDefault();
          }

        }

        r= document.getSelection().getRangeAt(0);
        if (r.startContainer.nodeName === 'SONG-ROWS'
            || r.startContainer.nodeName === 'SONG-VERSE'
            || r.startContainer.nodeName === 'SONG-BIS'
            || r.startContainer.nodeName === 'SONG-BODY') {
          console.log("Preventing deletion of whole: ", r);
          if (r.startContainer.childNodes[r.startOffset] != null
            && r.startContainer.childNodes[r.startOffset].firstChild != null) {
            setCursorBefore(
                r.startContainer.childNodes[r.startOffset].firstChild);
          }
          e.preventDefault();
        }
      }
      Sanitize(songbody);
    }
  }

  input(e, songbody) {
     console.log("Oninput", e);
     if (e.target == songbody.parentNode) {
       Sanitize(songbody);
//    Avoid keeping cursor before the artifical space:
       if (document.getSelection().isCollapsed
           && document.getSelection().rangeCount == 1) {
         let r = document.getSelection().getRangeAt(0);
         //console.log("ON INPUT", document.getSelection(), r.startContainer.nodeName, r.startOffset, r.startContainer);
         if (r.startContainer.nodeName === "#text"
             && r.startOffset == 0
             && r.startContainer.nodeValue.startsWith(nbsp)
             && r.startContainer.previousSibling == null) {
           let newr = document.createRange();
           newr.setStart(r.startContainer, 1);
           document.getSelection().removeAllRanges();
           document.getSelection().addRange(newr);
         }
       }
     }
  }

  paste(e, songbody) {
    console.log(e);
    console.log("types", e.clipboardData.types);
    let p = document.createElement("span");
    let data = e.clipboardData.getData("text/html");
    console.log(data);
    p.innerHTML  = data;
    getSelection().getRangeAt(0).insertNode(p);
    e.preventDefault();
    Sanitize(songbody);
  }

  attributeChangedCallback() {
    console.log("onChange", this);
  }
}

function SongBodyInit() {
  if (!customElements.get("song-body")) {
    customElements.define("song-body", SongBody);
  }
};

export function createSongBody() {
  return document.createElement("song-body");
}

SongBodyInit();