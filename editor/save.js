import {loadXMLDoc} from './utils.js';

// function docFromNode(node) {
//   let DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
//   factory.setNamespaceAware(true);
//   DocumentBuilder builder = factory.newDocumentBuilder();
//   Document newDocument = builder.newDocument();
//   Node importedNode = newDocument.importNode(node, true);
//   newDocument.appendChild(importedNode);
//   return newDocument;
//}

export function Save(songbody) {
  let xsltProcessor = new XSLTProcessor()
  let xslt = loadXMLDoc('./save.xslt');
  console.log(xslt);
  xsltProcessor.importStylesheet(xslt);

  const src = document.implementation.createDocument("", "", null);
  const clonedNode = src.importNode(songbody, true);
  src.appendChild(clonedNode);

  let resultDocument = xsltProcessor.transformToDocument(src);

  const pi = resultDocument.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8"');
  resultDocument.insertBefore(pi, resultDocument.firstChild);
  console.log(resultDocument);

  let txt=new XMLSerializer().serializeToString(resultDocument);;
  document.getElementById("output").innerText=txt.replaceAll("?><song","?>\n<song");

  const elem = window.document.createElement('a');
  elem.href = window.URL.createObjectURL(new Blob([txt]), {type: 'text/xml'});
  elem.download = 'song.xml';
  elem.text="[download]";
  document.getElementById("output").parentNode.appendChild(elem);
}