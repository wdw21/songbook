
function onLoad() {
  //document.execCommand('defaultParagraphSeparator', false, 'br');
  text = '<?xml version="1.0" encoding="utf-8"?>'
      + `<lyric>
    <block type="verse">
      <row important_over="true"><ch a="G"/> Kiedy stałem w przedśw<ch a="D"/>icie a Synaj</row>
      <row important_over="true"><ch a="C"/> Prawdę głosił przez tr<ch a="e"/>ąby wiatru</row>
      <row important_over="true"><ch a="G"/> Zasmerczyły się chmury igl<ch a="D"/>iwiem</row>
      <bis times="3">
        <row important_over="true"><ch a="e"/> Bure świerki o g<ch a="C"/>óry wsp<ch a="D"/>arte</row>
        <row important_over="true"><ch a="G"/> I na niebie byłem ja j<ch a="D"/>eden</row>
        <row important_over="true"><ch a="C"/> Plotąc pieśni w wark<ch a="e"/>ocze bukowe</row>
      </bis>
      <row important_over="false"><ch a="G"/> I schodziłem na zi<ch a="D"/>emię za kwestą</row>
      <row important_over="false"><ch a="e"/> Przez skrzydlącą się br<ch a="C"/>amę Lack<ch a="D"/>owej</row>
    </block>
    <blocklink blocknb="1"/>
    <block type="chorus">
      <row important_over="true"><ch a="G"/> I był Beskid i b<ch a="C"/>yły sł<ch a="G"/>owa</row>
      <row important_over="true"><ch a="G"/> Zanurzone po p<ch a="C"/>ępki w cerkwi b<ch a="D"/>aniach</row>
      <row important_over="true">Rozłoż<ch a="D"/>yście złotych</row>
      <row important_over="true"><ch a="C"/> Smagających się wi<ch a="D"/>atrem do krw<ch a="G"/>i</row>
    </block>
    <block type="verse">
      <row important_over="false"><ch a="G"/> Moje myśli biegały k<ch a="D"/>ońmi</row>
      <row important_over="false"><ch a="C"/> Po niebieskich m<ch a="e"/>okrych połon<ch a="G"/>inach</row>
      <row important_over="false"><ch a="G"/> I modliłem si<ch a="D"/>ę złożywszy dłonie</row>
      <row important_over="false">Do g<ch a="e"/>ór do madonny brun<ch a="C"/>atnol<ch a="D"/>icej</row>
      <row important_over="false"><ch a="G"/> A gdy serce kropl<ch a="D"/>ami tęsknoty</row>
      <row important_over="false"><ch a="C"/> Jęło spadać na g<ch a="e"/>óry sine</row>
      <row important_over="false"><ch a="G"/> Czarodziejskim kwi<ch a="D"/>atem paproci</row>
      <row important_over="false"><ch a="e"/> Rozgwieździła si<ch a="C"/>ę bukow<ch a="D"/>ina</row>
    </block>
    <blocklink blocknb="2"/>
  </lyric>`;

  parser = new DOMParser();
  xmlDoc = parser.parseFromString(text, "text/xml");

  let editor = document.getElementById("editor");
  SongChInit(editor);
  SongVerseBisInit();
  SongBodyInit();

  let body = createSongBody();
  editor.appendChild(body);

  body.appendChild(xmlDoc.getRootNode().childNodes[0]);
  Sanitize(body);
}


