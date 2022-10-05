

function  rowToNodes(row) {
  if (row.nodeName!='row') {
    return [];
  }
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


function onLoad() {
  //document.execCommand('defaultParagraphSeparator', false, 'br');
  text = '<?xml version="1.0" encoding="utf-8"?>'
      + '<song>'
      + ' <verse>'
      + '    <row important_over="false"><ch a="G"/> Kiedy stał<ch a="Gis"/>em w przedśw<ch a="D"/>icie a Synaj</row>'
      + '    <bis times="2">'
      + '      <row important_over="false"><ch a="C"/> Prawdę głosił przez tr<ch a="e"/>ąby wiatru</row>'
      + '      <row important_over="false"><ch a="G"/> Zasmerczyły się chmury igl<ch a="D"/>iwiem</row>'
      + '    </bis>'
      + '    <row important_over="false"><ch a="e"/> Bure świerki o g<ch a="C"/>óry wsp<ch a="D"/>arte</row>'
      + ' </verse>'
      + ' <verse>'
      + '      <row important_over="false"><ch a="G"/> Kiedy stał<ch a="Gis"/>em w przedśw<ch a="D"/>icie a Synaj</row>'
      + '      <row important_over="false"><ch a="C"/> Prawdę głosił przez tr<ch a="e"/>ąby wiatru</row>'
      + '      <row important_over="false"><ch a="G"/> Zasmerczyły się chmury igl<ch a="D"/>iwiem</row>'
      + '      <row important_over="false"><ch a="e"/> Bure świerki o g<ch a="C"/>óry wsp<ch a="D"/>arte</row>'
      + ' </verse>'
      + '</song>';

  parser = new DOMParser();
  xmlDoc = parser.parseFromString(text, "text/xml");

  let editor = document.getElementById("editor");
  SongChInit(editor);
  SongVerseBisInit();
  SongBodyInit();

  let body = createSongBody();
  editor.appendChild(body);

  // let bodydiv = document.createElement("song-verses");
  // body.appendChild(bodydiv);

  let verses = xmlDoc.getRootNode().childNodes[0].getElementsByTagName('verse');
  for (let vi = 0; vi < verses.length; ++vi) {
    let verse = verses[vi];
    let songVerse = document.createElement("song-verse");
    let d= document.createElement("song-rows");

    body.appendChild(songVerse);
    songVerse.appendChild(d);
    let rowsOrBis = verse.childNodes;

    for (let i = 0; i < rowsOrBis.length; ++i) {
      if (rowsOrBis[i].nodeName == 'row') {
        d.append(...rowToNodes(rowsOrBis[i]));
      }

      if (rowsOrBis[i].nodeName == 'bis') {
        bis = rowsOrBis[i];
        b = document.createElement("song-bis");
        b.setAttribute("x", bis.attributes['times'].value);
        let bd= document.createElement("song-rows");
        b.appendChild(bd);
        for (let j=0; j < bis.childNodes.length; ++j) {
          bd.append(...rowToNodes(bis.childNodes[j]));
        }
        d.appendChild(b);
      }
    }
  }

}


