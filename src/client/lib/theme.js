/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    8/6/22 9:57 PM
 *  Copyright (c) 2022 Trudesk, Inc. All rights reserved.
 */

import color from 'color'

function automaticTextColor (bgColor, primary, muted) {
  if (color(bgColor).isLight()) {
    if (muted) return '#757575'
    return color(primary)
      .lighten(0.08)
      .hex()
      .toString()
  } else {
    if (muted) {
      return color(primary)
        .fade(0.4)
        .toString()
    }

    return '#f7f8fa'
  }
}

function automaticLinkColor (bgColor, tertiary) {
  if (color(bgColor).isLight() && color(tertiary).isLight())
    return color(tertiary)
      .darken(0.3)
      .hex()
      .toString()

  return color(tertiary)
    .lighten(0.1)
    .hex()
    .toString()
}

const setTheme = colorScheme => {
  if (!colorScheme) return
  const html = document.getElementsByTagName('html')[0]
  if (!html) return

  const headerBg = colorScheme.headerBG
  const headerPrimary = colorScheme.headerPrimary
  const primary = colorScheme.primary
  const secondary = colorScheme.secondary
  const tertiary = colorScheme.tertiary
  const quaternary = colorScheme.quaternary

  const tertiaryFade = color(tertiary)
    .fade(0.15)
    .toString()

  const tertiaryLight5 = color(tertiary)
    .lighten(0.05)
    .hex()
    .toString()

  const tertiaryDark10 = color(tertiary)
    .darken(0.1)
    .hex()
    .toString()

  const sidebarText = color(quaternary).isDark() ? '#f7f8fa' : primary
  const sidebarItemHover = (color(quaternary).isDark() ? color(quaternary).lighten(0.2) : color(quaternary).darken(0.1))
    .hex()
    .toString()
  const sidebarBorderColor = (color(quaternary).isDark()
    ? color(quaternary).lighten(0.15)
    : color(quaternary).darken(0.15)
  )
    .hex()
    .toString()
  const sidebarSubnavBG = (color(quaternary).isDark() ? color(quaternary).lighten(0.1) : color(quaternary).darken(0.05))
    .hex()
    .toString()

  const sidebarSubnavHover = (color(sidebarSubnavBG).isDark()
    ? color(sidebarItemHover).lighten(0.1)
    : color(sidebarItemHover)
  )
    .hex()
    .toString()

  const topbarBorder = color(headerBg)
    .darken(0.1)
    .hex()
    .toString()

  const topbarIconHover = (color(headerPrimary).isDark()
    ? color(headerPrimary).lighten(0.2)
    : color(headerPrimary).darken(0.2)
  )
    .hex()
    .toString()

  const pageContentLight5 = color(secondary)
    .lighten(0.05)
    .hex()
    .toString()
  const pageContentLight10 = color(secondary)
    .lighten(0.1)
    .hex()
    .toString()
  const pageContentLight20 = color(secondary)
    .lighten(0.2)
    .hex()
    .toString()
  const pageContentDark5 = color(secondary)
    .darken(0.05)
    .hex()
    .toString()
  const pageContentDark10 = color(secondary)
    .darken(0.1)
    .hex()
    .toString()

  html.style.setProperty('--headerbackground', headerBg)
  html.style.setProperty('--headerprimary', headerPrimary)
  html.style.setProperty('--primary', primary)
  html.style.setProperty('--secondary', secondary)
  html.style.setProperty('--tertiary', tertiary)
  html.style.setProperty('--tertiaryfade', tertiaryFade)
  html.style.setProperty('--tertiarylight5', tertiaryLight5)
  html.style.setProperty('--tertiarydark10', tertiaryDark10)
  html.style.setProperty('--quaternary', quaternary)

  html.style.setProperty('--mutedtext', automaticTextColor(secondary, primary, 'muted'))

  html.style.setProperty('--topbarborder', topbarBorder)
  html.style.setProperty('--topbariconhover', topbarIconHover)

  html.style.setProperty('--sidebartext', sidebarText)
  html.style.setProperty('--sidebaritemhover', sidebarItemHover)
  html.style.setProperty('--sidebarborder', 'rgba(0,0,0,0.2)')
  html.style.setProperty('--sidebarsubnavbg', sidebarSubnavBG)
  html.style.setProperty('--sidebarsubnavhover', sidebarSubnavHover)

  html.style.setProperty('--pagecontentbg', secondary)
  html.style.setProperty('--pagecontentborder', 'rgba(0,0,0,0.15)')
  html.style.setProperty('--pagecontentlight5', pageContentLight5)
  html.style.setProperty('--pagecontentlight10', pageContentLight10)
  html.style.setProperty('--pagecontentlight20', pageContentLight20)
  html.style.setProperty('--pagecontentdark5', pageContentDark5)
  html.style.setProperty('--pagecontentdark10', pageContentDark10)
  html.style.setProperty('--pagecontentbuttontext', automaticTextColor(pageContentLight10, primary))
}

export default setTheme
