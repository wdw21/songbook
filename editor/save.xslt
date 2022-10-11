<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0"
    xmlns="http://21wdh.staszic.waw.pl"    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <xsl:output method="xml" indent="yes"/>

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
      <xsl:apply-templates select="@important_over|node()"/>
    </row>
  </xsl:template>

  <xsl:template match="xhtml:song-ch">
    <ch>
      <xsl:attribute name="a"><xsl:value-of select="@a"/></xsl:attribute>
    </ch>
  </xsl:template>


</xsl:stylesheet>