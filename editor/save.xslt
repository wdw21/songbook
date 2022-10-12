<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0"
    xmlns="http://21wdh.staszic.waw.pl"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <xsl:output method="xml" indent="yes" omit-xml-declaration="no" standalone="yes"/>

  <xsl:template match="@*|node()">
    <xsl:copy>
      <xsl:apply-templates select="@*|node()"/>
    </xsl:copy>
  </xsl:template>

  <xsl:template match="xhtml:song-body">
    <song>
      <lyric>
        <xsl:apply-templates select="xhtml:song-verse"/>
      </lyric>
    </song>
  </xsl:template>

  <xsl:template match="xhtml:song-verse">
    <xsl:if test="not(@blocknb)">
      <block>
        <xsl:apply-templates select="xhtml:song-rows|@type"/>
      </block>
    </xsl:if>
    <xsl:if test="@blocknb">
      <blocklink>
        <xsl:variable name="bn" select="@blocknb"/>
        <xsl:attribute name="blocknb">
          <xsl:value-of select='count(//xhtml:song-verse[@id=$bn]/preceding-sibling::xhtml:song-verse[not(@blocknb)])+1'/>
        </xsl:attribute>
      </blocklink>
    </xsl:if>
  </xsl:template>


  <xsl:template match="xhtml:song-bis">
    <bis>
      <xsl:attribute name="times"><xsl:value-of select="@x"/></xsl:attribute>
      <xsl:apply-templates select="xhtml:song-rows"/>
    </bis>
  </xsl:template>

  <xsl:template match="xhtml:song-rows">
    <xsl:apply-templates select="xhtml:song-row|xhtml:song-bis"/>
  </xsl:template>

  <xsl:template match="xhtml:song-row">
    <row>
      <xsl:if test="@type">
        <xsl:attribute name='style'><xsl:value-of select="@type"/></xsl:attribute>
      </xsl:if>
      <xsl:if test="@type='instr'">
        <xsl:call-template name="splitInstrumental">
          <xsl:with-param name="datalist" select="normalize-space(text())"/>
        </xsl:call-template>
        <xsl:text> </xsl:text> <!--prevent line breaks within row when formatting-->
      </xsl:if>
      <xsl:if test="not(@type='instr')">
        <xsl:attribute name="important_over"><xsl:value-of select="@important_over='true'"/></xsl:attribute>
        <xsl:apply-templates select="node()"/>
      </xsl:if>
    </row>
  </xsl:template>

  <xsl:template match="xhtml:song-ch">
    <ch>
      <xsl:attribute name="a"><xsl:value-of select="@a"/></xsl:attribute>
    </ch>
  </xsl:template>


  <xsl:template name="splitInstrumental">
    <xsl:param name="datalist"/>
    <xsl:choose>
      <xsl:when test="contains($datalist,'&#160;')">
        <xsl:if test="substring-before($datalist,'&#160;')">
          <ch><xsl:attribute name="a"><xsl:value-of select="substring-before($datalist,'&#160;')"/></xsl:attribute></ch>
        </xsl:if>
        <xsl:call-template name="splitInstrumental">
          <xsl:with-param name="datalist" select="substring-after($datalist,'&#160;')"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:when test="string-length($datalist)=1">
        <xsl:if test="$datalist">
          <ch><xsl:attribute name="a"><xsl:value-of select="$datalist"/></xsl:attribute></ch>
        </xsl:if>
      </xsl:when>
    </xsl:choose>
  </xsl:template>

</xsl:stylesheet>