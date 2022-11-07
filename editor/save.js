import {loadXMLDoc, nbsp} from './utils.js';

export function Serialize(songeditor) {
  let xsltProcessor = new XSLTProcessor()
  let xslt = loadXMLDoc('./save.xslt');
  console.log(xslt);
  xsltProcessor.importStylesheet(xslt);

  const src = document.implementation.createDocument("", "", null);
  const clonedNode = src.importNode(songeditor, true);
  src.appendChild(clonedNode);

  let resultDocument = xsltProcessor.transformToDocument(src);
  if (!resultDocument) {
    alert("XSLT transformation failed")
  }
  const pi = resultDocument.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8"');
  resultDocument.insertBefore(pi, resultDocument.firstChild);
  console.log(resultDocument);

  let txt=new XMLSerializer().serializeToString(resultDocument);;
  txt = txt.replaceAll("?><song","?>\n<song")
      .replaceAll(nbsp," ");

  if (songeditor.tabs) {
    txt = txt.replaceAll(/(?<=^ *)  /gm,"\t");
  }

  txt = txt + "\n";

  if (songeditor.shadow.getElementById("lastSerialized")) {
    songeditor.shadow.getElementById("lastSerialized").innerText=txt;
  }
  return txt;
}

export function Save(songeditor) {
  let txt = Serialize(songeditor);

  let download = window.document.createElement('a');
  download.id="download";
  download.text="[download]";

  let title = songeditor.getAttribute("title");
  if (!title || title.trim()==='') {
    title='song';
  }

  let url=window.URL.createObjectURL(new Blob([txt]), {type: 'text/xml'});
  download.href=url;
  download.download=title+".xml";
  download.click();
}