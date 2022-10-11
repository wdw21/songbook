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
  //let src = loadXMLDoc("./save.xslt");
  //let src = Document(songbody.cloneNode(true));


  const src = document.implementation.createDocument("", "", null);
  const clonedNode = src.importNode(songbody, true);
  src.appendChild(clonedNode);

  let resultDocument = xsltProcessor.transformToDocument(src);
  console.log(resultDocument);

  document.getElementById("example").innerText=new XMLSerializer().serializeToString(resultDocument);
}