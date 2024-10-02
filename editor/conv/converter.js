
const { JSDOM } = require('jsdom')


const Node = new JSDOM('').window.Node;

function createChordElement(doc, chord) {
    let ch = doc.createElement('ch');
    ch.setAttribute('a', chord);
    return ch;
}

function rowIsInstrumental(row) {
    return row.textContent.trim().length === 0;
}

function processRow(doc, span) {
    row =  doc.createElement('row');
    row.setAttribute('important_over', 'false');
    //let hasChord = false;
    let isChorus = false;
    let bis = 1;
    span.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.length > 0) {
            row.appendChild(doc.createTextNode(node.textContent.replaceAll(' ', ' ').replaceAll(/\s\s+/g, ' ').replaceAll("\n","")));
        } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'CODE' && node.hasAttribute('data-local')) {
            let chord = node.getAttribute('data-local');
            row.appendChild(createChordElement(doc, chord));
            hasChord = true;
        } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SPAN' && node.classList.contains('text-muted')) {
            if (node.textContent.toLowerCase().includes('ref')) {
                isChorus = true
            }
            let extractBis = /.*x([0-9]*).*/g;
            let res = extractBis.exec(node.textContent);

            if (res && res.length>1) {
                bis = parseInt(res[1], 10)
            }
        }
    });
    if (rowIsInstrumental(row)) {
        row.setAttribute("style", "instr")
    }
    if (row.innerHTML.trim() === '') {
        return {row: null, isChorus, bis};
    } else {
        return {row, isChorus, bis}
    }
}

function interpretationContent2lyric(docHtml, docXml) {
    let lyric = docXml.createElement('lyric');
    let blockElements = docHtml.querySelector('.interpretation-content');
    if (!blockElements) {
        return null
    }
    blockElements.appendChild(docXml.createElement("EOF"));

    let implicitRow = docXml.createElement('span');
    let br_cnt=0;
    let currentBlock = docXml.createElement("block");
    let currentBlockBis=1;

    currentBlock.setAttribute("type", "verse")
    blockElements.childNodes.forEach(node => {
        //console.debug("processing Node:", node.outerHTML)

        if (node.nodeType === Node.ELEMENT_NODE && node.className === 'annotated-lyrics') {
            let {row, isChorus, bis} = processRow(docXml, node)
            if (row) {
                br_cnt = 0;
                if (bis === 1) {
                    currentBlock.appendChild(docXml.createTextNode("\n      "));
                    currentBlock.appendChild(row)
                } else {
                    currentBlock.appendChild(docXml.createTextNode("\n    "));
                    bisTag = docXml.createElement("bis")
                    bisTag.setAttribute("times", bis)
                    bisTag.appendChild(row)
                    currentBlock.appendChild(bisTag)
                }
            }
            if (isChorus) {
                currentBlock.setAttribute("type", "chorus")
            }
        } else if (node.nodeType === Node.ELEMENT_NODE && (node.tagName === 'BR' || node.tagName === 'EOF')) {
            br_cnt++;
            let {row, isChorus, bis} = processRow(docXml, implicitRow)
            implicitRow=docXml.createElement('span');
            if (row) {
                br_cnt = 1;
                currentBlock.appendChild(docXml.createTextNode("\n      "));
                currentBlock.appendChild(row)
            }
            if (isChorus) {
                currentBlock.setAttribute("type", "chorus")
            }
            if (bis) {
                currentBlockBis=bis
            }

            if ((br_cnt > 1 || node.tagName === 'EOF') && currentBlock.childNodes.length > 0) {
                //console.log("Flushing...", br_cnt);
                instrumentalOnly = true
                currentBlock.childNodes.forEach(row => {
                    if (!rowIsInstrumental(row)) {
                        instrumentalOnly = false
                    }
                })
                if (currentBlockBis > 1) {
                    bisTag = docXml.createElement("bis")
                    bisTag.setAttribute("times", currentBlockBis)
                    bisTag.append(...currentBlock.childNodes)
                    currentBlock.appendChild(docXml.createTextNode("\n    "));
                    currentBlock.appendChild(bisTag)
                }
                if (instrumentalOnly && currentBlock.getAttribute('type') !== 'chorus') {
                    currentBlock.setAttribute('type', 'other')
                }
                lyric.appendChild(docXml.createTextNode("\n  "));
                lyric.appendChild(currentBlock);

                currentBlock = docXml.createElement("block");
                currentBlock.setAttribute("type", "verse")
                br_cnt = 0;
            }
        } else {
            implicitRow.appendChild(node.cloneNode(deep=true))
         //   console.log("node:",node, node.outerHTML, node.textContent)
        }
    });

    docXml.appendChild(lyric);
    return lyric
    //return new dom.window.XMLSerializer().serializeToString(docXml);
}

// `
// <?xml version="1.0" encoding="utf-8"?>
// <song xmlns="http://21wdh.staszic.waw.pl" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://21wdh.staszic.waw.pl https://songbook.21wdw.org/song.xsd" title="Śliczna higieniczna">
//   <comment/>
//   <artist type="solo"/>
//   <lyric>
//   <music metre="">
//     <guitar barre="0"/>
//   </music>
// </song>
// `
// function html2xml(dom, parser, html, song) {
//     //const dom = new JSDOM();
//     // let parser = new dom.window.DOMParser();
//     //let parser = new DOMParser();
//     //let docHtml = parser.parseFromString(html, 'text/html');
//
// }

function html2xmlstr(html) {
    const dom = new JSDOM();
    let parser = new dom.window.DOMParser();
    let docHtml = parser.parseFromString(html, 'text/html');
    let docXml = dom.window.document.implementation.createDocument('http://21wdh.staszic.waw.pl', '', null);
    let song = docXml.createElement("song");
    let lyric = interpretationContent2lyric(docHtml, docXml)
    if (!lyric) {
        return null;
    }
    song.appendChild(lyric)
    docXml.appendChild(song);
    return new dom.window.XMLSerializer().serializeToString(docXml);
}



module.exports = { interpretationContent2lyric, html2xmlstr};
