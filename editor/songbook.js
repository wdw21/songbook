import {SongChInit} from './ch.js'
import {SongVerseBisInit, SongVerse} from './verse.js'
import {SongBodyInit} from './songbody.js';
import {createSongBody} from './songbody.js';
import {Sanitize} from './sanitize.js';
import {Save} from './save.js';
import {removeAllChildren} from './utils.js';

export class SongEditor extends HTMLElement {
  constructor() {
    super();

    const template = document.createElement('template');
    template.innerHTML = `
<link rel="stylesheet" href="song.css"/>
<div>
  <div class="toolbar">
    <button id="buttonBis">BIS</button>
    <button id="importantOver">Kluczowe akordy</button>
    <button id="buttonInstr">Wers instrumentalny</button>
    <button id="buttonSave">Save</button>
    <input  id="open" type="file" accept=".xml"/>
  </div>
  <slot id="song-body"/>
</div>
  `;

    const shadow = this.attachShadow({ mode: "closed" });
    shadow.appendChild(template.content.cloneNode(true));

    this.buttonBis=shadow.getElementById("buttonBis");
    this.importantOver=shadow.getElementById("importantOver");
    this.buttonInstr=shadow.getElementById("buttonInstr");
    this.buttonSave=shadow.getElementById("buttonSave");
    this.open=shadow.getElementById("open");

    this.buttonBis.addEventListener("click", (e) => this.body().wrapBis());
    this.importantOver.addEventListener("click", (e) => { this.body().markImportantOver(); this.refreshToolbar(); });
    this.buttonInstr.addEventListener("click", (e) =>  { this.body().toggleInstrumental(); this.refreshToolbar(); });
    this.buttonSave.addEventListener("click", () => Save(this.body()));
    this.open.addEventListener("change", (e) => this.Load(e));

    document.addEventListener('selectionchange', (event) => { this.refreshToolbar(); });
  }

  body() {
    return this.firstChild;
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
      let tmp= document.createElement("div");
      tmp.appendChild(z[0]);
      Sanitize(tmp);
      this.appendChild(tmp.childNodes[0]);
    });
    reader.readAsText(this.open.files[0]);
  }

  refreshToolbar() {
    if (this.body().allSelectedImportant()) {
      this.importantOver.innerText='Mało ważne akordy';
    } else {
      this.importantOver.innerText='Kluczowe akordy';
    }
    if (this.body().allSelectedInstrumental()) {
      this.buttonInstr.innerText='Wers liryczny';
    } else {
      this.buttonInstr.innerText='Wers instrumentalny';
    }
    this.buttonBis.disabled = document.getSelection().rangeCount==0;
  }

  // input(e, songbis) {
  //   songbis.setAttribute("x", e.target.value);
  // }
  //
  // connectedCallback() {
  //   this.attributeChangedCallback();
  // }
  //
  // attributeChangedCallback() {
  //   this.x.value = this.getAttribute("x");
  // }
  //
  // static get observedAttributes() {
  //   return ["x"]
  // }
  //
  // focus() {
  //   this.x.focus();
  // }
}



function songEditorInit() {
  customElements.define("song-editor", SongEditor);
}

function init() {
  SongChInit();
  SongVerseBisInit();
  SongBodyInit();
  songEditorInit();
}

init();


// function OnLoad() {
//   //document.execCommand('defaultParagraphSeparator', false, 'br');
//   let text = '<?xml version="1.0" encoding="utf-8"?>'
//       + `<lyric>
//     <block type="verse">
//       <row important_over="true"><ch a="G"/> Kiedy stałem w przedśw<ch a="D"/>icie a Synaj</row>
//       <row important_over="true"><ch a="C"/> Prawdę głosił przez tr<ch a="e"/>ąby wiatru</row>
//       <row important_over="true"><ch a="G"/> Zasmerczyły się chmury igl<ch a="D"/>iwiem</row>
//       <bis times="3">
//         <row important_over="true"><ch a="e"/> Bure świerki o g<ch a="C"/>óry wsp<ch a="D"/>arte</row>
//         <row important_over="true"><ch a="G"/> I na niebie byłem ja j<ch a="D"/>eden</row>
//         <row important_over="true"><ch a="C"/> Plotąc pieśni w wark<ch a="e"/>ocze bukowe</row>
//       </bis>
//       <row important_over="false"><ch a="G"/> I schodziłem na zi<ch a="D"/>emię za kwestą</row>
//       <row important_over="false"><ch a="e"/> Przez skrzydlącą się br<ch a="C"/>amę Lack<ch a="D"/>owej</row>
//     </block>
//     <blocklink blocknb="1"/>
//     <block type="chorus">
//       <row important_over="true"><ch a="G"/> I był Beskid i b<ch a="C"/>yły sł<ch a="G"/>owa</row>
//       <row important_over="true"><ch a="G"/> Zanurzone po p<ch a="C"/>ępki w cerkwi b<ch a="D"/>aniach</row>
//       <row important_over="true">Rozłoż<ch a="D"/>yście złotych</row>
//       <row important_over="true"><ch a="C"/> Smagających się wi<ch a="D"/>atrem do krw<ch a="G"/>i</row>
//     </block>
//     <block type="verse">
//       <row important_over="false"><ch a="G"/> Moje myśli biegały k<ch a="D"/>ońmi</row>
//       <row important_over="false"><ch a="C"/> Po niebieskich m<ch a="e"/>okrych połon<ch a="G"/>inach</row>
//       <row important_over="false"><ch a="G"/> I modliłem si<ch a="D"/>ę złożywszy dłonie</row>
//       <row important_over="false">Do g<ch a="e"/>ór do madonny brun<ch a="C"/>atnol<ch a="D"/>icej</row>
//       <row important_over="false"><ch a="G"/> A gdy serce kropl<ch a="D"/>ami tęsknoty</row>
//       <row important_over="false"><ch a="C"/> Jęło spadać na g<ch a="e"/>óry sine</row>
//       <row important_over="false"><ch a="G"/> Czarodziejskim kwi<ch a="D"/>atem paproci</row>
//       <row important_over="false"><ch a="e"/> Rozgwieździła si<ch a="C"/>ę bukow<ch a="D"/>ina</row>
//     </block>
//     <blocklink blocknb="2"/>
//   </lyric>`;
//
//   let parser = new DOMParser();
//   let xmlDoc = parser.parseFromString(text, "text/xml");
//
//   let editor = document.getElementById("editor");
//   SongChInit(editor);
//   SongVerseBisInit();
//   //SongBodyInit();
//
//   let body = createSongBody();
//   editor.appendChild(body);
//
//   body.appendChild(xmlDoc.getRootNode().childNodes[0]);
//   Sanitize(body);
// }
//
// OnLoad();
