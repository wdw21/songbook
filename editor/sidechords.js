// import {findAncestor, nbsp} from "./utils.js";
//
// const predefinedChords = ["A", "A2", "A4", "A7", "A7+", "A7/4", "A7/6", "Ais",
//     "B", "C", "C0", "C7", "C7+", "C9", "C9/5", "Cis", "Cis0", "D", "D2", "D4",
//     "D7", "D7+", "Dis", "E", "E0", "E5+", "E7", "E7/4", "F", "F0", "F7", "F7+",
//     "Fis", "Fis0", "Fis7", "G", "G0", "G6", "G7", "GC", "Gis", "H", "H6/7", "H7",
//     "a", "a6", "a7", "a7+", "a7/9", "ais", "b", "c", "cis", "cis7", "d", "d2",
//     "d6", "e", "e7", "e9", "f", "fis", "fis7", "g", "gis", "gis7", "h", "h0",
//     "h7", "h7/5-"];

//const sidechordstemplate = document.createElement('template');

import {getChordsFromRow} from "./verse.js";

export default class SideChordsRow extends HTMLElement {
    constructor() {
        super();

        const template = document.createElement('template');
        template.innerHTML = `
<link rel="stylesheet" href="./sidechords.css"/>
<link href="https://fonts.googleapis.com/css?family=Material+Icons|Material+Icons+Outlined|Material+Icons+Round"
      rel="stylesheet"/>
<div id="sidechords">
  <div id="type">
<!--      <span id="chords_type"  class="material-icons">auto_awesome</span>-->
      <select id="select_type">
          <option value="important">Kluczowe nad</option><!--First chorus only-->
          <option value="available">Dostępne nad</option><-- Szkoda miejsca-->
          <option value="never">Tylko z boku</option><!-- never - np. nie ustawione prawidłowo-->
      </select>
  </div>
  <input type="text" id="sch"/>
  <button class="material-icons">sync_alt</button>
</div>
  `;

        const shadow = this.attachShadow({ mode: "closed" });
        shadow.appendChild(template.content.cloneNode(true));

        // this.chordsType = shadow.getElementById("chords_type");
        this.selectType = shadow.getElementById("select_type");
        this.chinput = shadow.getElementById("sch");
        // this.chordsType.addEventListener("click", () => {
        //     this.chordsType.style.display = "none";
        //     this.selectType.hidden=false;
        //     this.selectType.style.display = "inline";
        // });
        this.selectType.addEventListener("change", () => {
            this.pushRowType();

          //  this.chordsType.style.display = "inline";
          //   this.selectType.style.display = "none";
          //   this.selectType.hidden=true;
        });
    }

    setRow(row) {
        this.row=row;
    }

    connectedCallback() {
        this.loadRow();
    }

    pushRowType() {
        switch (this.selectType.value) {
            case "important":
                this.row.setAttribute('important_over', 'true');
                break;
            case "available":
                this.row.setAttribute('important_over', 'false');
                break;
            case "never":
                this.row.setAttribute('important_over', 'never');
                break;
        }
    }

    loadRow() {
        this.chinput.value = getChordsFromRow(this.row);
        let impOver=this.row.getAttribute("important_over");
        if (impOver=="true") {
            this.selectType.value="important"
        } else if (impOver=="false") {
            this.selectType.value="available"
        } if (impOver=="never") {
            this.selectType.value="never"
        }
  //      this.refreshRowType();
    }

    // getSongBody() {
    //     return this.closest('song-body');
    // }
    //
    // isEditing() {
    //     return this.getAttribute("editing")==="true";
    // }
    //
    // select(row, toSelect) {
    //     row.focus();
    //     let r = document.createRange();
    //     if (!toSelect) {
    //         let t=document.createTextNode(nbsp);
    //         row.appendChild(t);
    //         r.selectNodeContents(t);
    //     } else {
    //         r.setStartBefore(toSelect);
    //     }
    //     document.getSelection().removeAllRanges();
    //     document.getSelection().addRange(r);
    // }
    //
    // selectParent(storedParent) {
    //     this.select(storedParent, this.nextSibling);
    // }
    //
    // connectedCallback() {
    //     const songBody = findAncestor(this, "SONG-BODY");
    //     new ResizeObserver(() => songBody.recomputeChordsOffsets()).observe(this.ch);
    // }
    //
    // recomputeOffset() {
    //     if (this.offset) {
    //         return this.offset;
    //     }
    //     if (this.previousSibling && this.previousSibling.nodeName==='SONG-CH') {
    //         this.offset = this.previousSibling.recomputeOffset() + this.previousSibling.ch.getBoundingClientRect().width + 1;
    //     } else {
    //         this.offset = 0;
    //     }
    //     this.cho.style.left = this.offset + "px";
    //     return this.offset;
    // }
    //
    // resetOffset() {
    //     this.offset=null;
    // }
    //
    // updateEditing() {
    //     this.che.hidden=!this.isEditing();
    //     this.che.style.display = this.isEditing() ? 'inline' : 'none';
    //     this.ch.hidden=this.isEditing();
    //     this.ch.style.display = !this.isEditing() ? 'inline' : 'none';
    //     if (this.isEditing()) {
    //         this.che.value = this.getAttribute("a");
    //         //    this.che.select();
    //         this.che.focus();
    //     }
    // }
    //
    // focus(options) {
    //     //super.focus(options);
    //     if (this.isEditing()) {
    //         this.che.focus();
    //     }
    // }
    //
    // static get observedAttributes() {
    //     return ['a', "editing"];
    // }
    //
    // attributeChangedCallback() {
    //     this.updateChord();
    //     this.updateEditing();
    // }
    //
    // updateChord() {
    //     this.ch.innerText=this.getAttribute("a");
    //     this.che.value=this.getAttribute("a");
    // }
}
//
// function predefinedChordsList() {
//     let dl = document.createElement("datalist");
//     dl.id = "predefinedChords";
//     predefinedChords.forEach(
//         (ch) => {
//             let opt = document.createElement("option");
//             opt.value = ch;
//             dl.appendChild(opt);
//         }
//     );
//     return dl;
// }

export function SideChordsInit() {
    customElements.define("song-side-chords", SideChordsRow);
}
//
// export function createChord(chord) {
//     let ch = document.createElement("song-ch");
//     ch.setAttribute('a', chord);
//     return ch;
// }
