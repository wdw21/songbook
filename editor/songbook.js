
function getChordNode(node) {
  if (node.className=='akord') { return a.getElementsByTagName('ch')[0]; }
  while (node != null && node.className != 'ch') {
    console.log('look', node);
    node = node.parentNode;
  }
  return node;
}

let dropped=null;

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
      // window.getSelection().removeAllRanges();
      // r=document.createRange()
      // r.setStartBefore(e.target.parentNode.parentNode);
      // r.setEndAfter(e.target.parentNode.parentNode);
      // window.getSelection().addRange(r);
      // console.log(e.target.parentNode.parentNode.outerHTML)
      console.log(e)
      e.dataTransfer.setData("songbook/chord", a.childNodes[0].nodeValue);
      e.dataTransfer.akord=a;
      console.log(e);
      dropped = false;
    }
  }
  akord.ondragend = function (e) {
    a = getChordNode(e.target);
    if (a != null) {
      this.opacity = '1.0';
    }
    if (dropped && e.dataTransfer.dropEffect=='move') {
      console.log("REMOVING");
      a.remove();
    }
    console.warn(e);
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

function createRow(row) {
  rowp=document.createElement("div");
  rowp.className='row';
  rowp.contentEditable=true;
  rowp.ondragover = function (e) {
    if (e.altKey) {
      e.dataTransfer.dropEffect='copy';
    } else {
      e.dataTransfer.dropEffect='move';
    }
    range = getRangeForCursor(e);
    document.getSelection().removeAllRanges();
    document.getSelection().addRange(range);
    e.preventDefault();
  }
  rowp.ondrop= function (e) {
    d = e.dataTransfer.getData("songbook/chord");
    if (d != null && d != "") {
      range = getRangeForCursor(e);
      if (range.commonAncestorContainer.parentNode.className=='row') {
        range.insertNode(createChord(d));
        dropped = true;
      }
      e.preventDefault();
    }
  }

  for (let i=0; i<row.childNodes.length; ++i) {
    let node = row.childNodes[i];
    if (node.nodeName=='#text') {
      rowp.appendChild(node.cloneNode());
    } else {
      rowp.appendChild(createChord(node.attributes['a'].value));
    }
  }

  return rowp;
}

//   // p = document.createElement('p');
//   // p.appendChild(document.createTextNode(new XMLSerializer().serializeToString(row)));
//   // targetDiv.appendChild(p)
//   let text = '';
//   let chords = [];
//   row.childNodes.forEach(function (node) {
//         if (node.nodeName === '#text') {
//           text += node.nodeValue;
//         }
//         if (node.nodeName === "ch") {
//           chords.push({'ch': node.attributes['a'].nodeValue, 'pos': text.length})
//         }
//       }
//   );
//
//   let chordBox = document.createElement("div")
//   chordBox.style.height = '20px'
//   let input = document.createElement("div");
//   input.contentEditable = true;
//   input.type = 'text'
//   input.maxLength = 200;
//   input.value = text;
//   input.style.width = 400;
//   input.oninput = (() => {onInput(input)});
//   // TODO: These can be lighter ... to just check caret position.
//   input.onfocus = (() => {onInput(input)});
//   input.onselect = (() => {onInput(input)});
//   input.onkeydown = (() => {onInput(input)});
//   input.onmousedown = (() => {onInput(input)});
//   input.onpaste = (() => {onInput(input)});
//   input.oncut = (() => {onInput(input)});
//   input.onmousemove = (() => {onInput(input)});
//   input.onselectstart = (() => {onInput(input)});
//   input.className="lyric"
//   targetDiv.appendChild(chordBox)
//   targetDiv.appendChild(input);
//
//   chordBox.style.width = input.style.width
//   chordBox.style.background = "yellow"
//   chordBox.ondragover = handleDragOver
//
//   const rect = input.getBoundingClientRect();
//   console.log(rect)
//
//   for (let i = 0; i < chords.length; i++) {
//     let p=getCaretCoordinates(input, chords[i].pos);
//
//     var ch = document.createElement('div');
//     ch.id = 'bookingLayer';
//     ch.style.position = 'absolute';
//     ch.style.left = (rect.x + window.scrollX + p.left) + 'px';
//     ch.style.top = (rect.y + window.scrollY + p.top - 15) + 'px';
//     ch.innerHTML = chords[i].ch;
//     ch.className = 'ch'
//     ch.draggable = true;
//     ch.ondragstart = handleDragStart
//     ch.ondragend = handleDragEnd
//     ch.pos = chords[i].pos
//     targetDiv.appendChild(ch)
//   }
//
//
// //  console.log(chords);
// }
//

function onLoad() {
  text = '<?xml version="1.0" encoding="utf-8"?>'
      + '<song>'
      + '      <row important_over="false"><ch a="G"/> Kiedy stał<ch a="Gis"/>em w przedśw<ch a="D"/>icie a Synaj</row>'
      + '      <row important_over="false"><ch a="C"/> Prawdę głosił przez tr<ch a="e"/>ąby wiatru</row>'
      + '      <row important_over="false"><ch a="G"/> Zasmerczyły się chmury igl<ch a="D"/>iwiem</row>'
      + '      <row important_over="false"><ch a="e"/> Bure świerki o g<ch a="C"/>óry wsp<ch a="D"/>arte</row>'
      + '</song>';

  parser = new DOMParser();
  xmlDoc = parser.parseFromString(text, "text/xml");

  let verse = xmlDoc.getRootNode().childNodes[0];
  let rows = verse.getElementsByTagName('row');
  for (let i=0; i<rows.length; ++i)
  {
    document.getElementById("editor").appendChild( createRow(rows[i]));
  }
}