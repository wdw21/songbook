import {loadXMLDoc} from './utils.js';

export function Save(songeditor) {
  let xsltProcessor = new XSLTProcessor()
  let xslt = loadXMLDoc('./save.xslt');
  console.log(xslt);
  xsltProcessor.importStylesheet(xslt);

  const src = document.implementation.createDocument("", "", null);
  const clonedNode = src.importNode(songeditor, true);
  src.appendChild(clonedNode);

  let resultDocument = xsltProcessor.transformToDocument(src);

  const pi = resultDocument.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8"');
  resultDocument.insertBefore(pi, resultDocument.firstChild);
  console.log(resultDocument);

  let txt=new XMLSerializer().serializeToString(resultDocument);;
  document.getElementById("output").innerText=txt.replaceAll("?><song","?>\n<song");

  let download = document.getElementById("download");
  if (!download) {
    download = window.document.createElement('a');
    download.id="download";
    download.text="[download]";
    document.getElementById("output").parentNode.appendChild(download);
  }
  let title = songeditor.getAttribute("title");
  if (!title || title.trim()==='') {
    title='song';
  }
  download.download = title.replaceAll(' ','_')+'.xml';
  download.href = window.URL.createObjectURL(new Blob([txt]), {type: 'text/xml'});
}