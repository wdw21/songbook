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

class SongBody extends HTMLElement {
  constructor() {
    super();

    const template = document.createElement('template');
    template.innerHTML = `
<link rel="stylesheet" href="song.css"/>
<div class="songbody" id="songbody" contenteditable="true"><slot/></div>
  `;

    const shadow = this.attachShadow({ mode: "closed" });
    shadow.appendChild(template.content.cloneNode(true));
    this.body=shadow.getElementById("songbody");

    this.body.addEventListener("mousedown", this.mouseDown);
    this.body.addEventListener("dragover", this.dragOver);
    this.body.addEventListener("drop", this.drop);
    this.body.addEventListener("keydown", this.keyDown);
  }

  connectedCallback() {
    this.parentNode.addEventListener("beforeinput", this.beforeInput);
    this.parentNode.addEventListener("input", this.input);
    this.parentNode.addEventListener("keydown", this.keyDown);
    this.parentNode.addEventListener("paste", this.paste);
  }

  disconnectedCallback() {
    this.parentNode.removeEventListener("beforeinput", this.beforeInput);
    this.parentNode.removeEventListener("input", this.input);
    this.parentNode.removeEventListener("keydown", this.keyDown);
  }

  mouseDown(e) {
    if (e.detail > 1 && canInsertChord()) {
      if (insertChordHere("")) {
        e.preventDefault();
      }
    }
  }

  keyDown(e) {
    console.log("keydown...");
    if (e.key == '`' && canInsertChord()) {
      if (insertChordHere("")) {
        e.preventDefault();
      }
    }
  }

  dragOver(e) {
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

  drop(e) {
    let d = e.dataTransfer.getData("songbook/chord");
    if (d != null && d != "") {
      let range = getRangeForCursor(e)
      if (acceptsTextAndChords(range.commonAncestorContainer.parentNode)) {
        range.insertNode(createChord(d));
        dropped = true;
      }
      e.preventDefault();
    }
  }

  beforeInput(e) {
    console.log("BEFORE");
    if (e.inputType == "deleteContentBackward") {
      if (document.getSelection().rangeCount == 1
          && document.getSelection().isCollapsed) {
        let r = document.getSelection().getRangeAt(0);
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
          } else {
            alert("not yet coded1");
          }
        }
        // When we are at the beginning of the ROW, we merge the rows.
        if (r.startContainer.nodeName == 'SONG-ROW' && r.startOffset == 0) {
          if (r.startContainer.previousSibling != null
              && r.startContainer.previousSibling.nodeName === 'SONG-ROW') {
            mergeNodeAfter(r.startContainer.previousSibling, r.startContainer);
            e.preventDefault();
          }
        }
      }
    }
  }

  input(e) {
    console.log("Oninput", e);
  //  Sanitize(e.target);
    // Avoid keeping cursor before the artifical space:
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

  paste(e) {
    console.log(e);
    let p = document.createElement("span");
    p.innerHTML  = e.clipboardData.getData("text/html");
    getSelection().getRangeAt(0).insertNode(p);
    e.preventDefault();
  }

  attributeChangedCallback() {
    console.log("onChange", this);
  }
}

function SongBodyInit() {
  customElements.define("song-body", SongBody);
};
