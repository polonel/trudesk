import React from 'react'
import moment from 'moment'
import spanishLocale from '../../shared/moment/spanishLocale'
import translations from '../../shared/translations/es'

const { phrases, words } = translations
const phraseMap = new Map()
Object.keys(phrases).forEach(key => {
  phraseMap.set(key, phrases[key])
})

const wordMap = new Map()
Object.keys(words).forEach(key => {
  wordMap.set(key, words[key])
})

if (typeof moment === 'function' && moment.defineLocale) {
  const locales = typeof moment.locales === 'function' ? moment.locales() : []
  if (!locales || locales.indexOf('es') === -1) {
    moment.defineLocale('es', spanishLocale)
  } else {
    moment.updateLocale('es', spanishLocale)
  }
  moment.locale('es')
}

const ORIGINAL_CREATE_ELEMENT = React.createElement
const TRANSLATABLE_PROP_KEYS = new Set([
  'title',
  'text',
  'label',
  'placeholder',
  'helperText',
  'aria-label',
  'alt',
  'tooltip',
  'buttonText',
  'modalTitle',
  'cancelText',
  'confirmText',
  'submitText',
  'header',
  'emptyText',
  'description',
  'subtitle',
  'name',
  'value'
])

function matchCapitalization (original, translation) {
  if (!translation) return translation
  if (!original) return translation
  if (original === original.toUpperCase()) {
    return translation.toUpperCase()
  }
  if (original === original.toLowerCase()) {
    return translation
  }
  return translation.charAt(0).toUpperCase() + translation.slice(1)
}

function translatePhrase (value) {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return value
  const lower = trimmed.toLowerCase()
  const punctuationMatch = lower.match(/[.!?…]+$/)
  const punctuation = punctuationMatch ? trimmed.slice(trimmed.length - punctuationMatch[0].length) : ''
  const base = punctuationMatch ? trimmed.slice(0, trimmed.length - punctuationMatch[0].length) : trimmed
  const baseLower = base.toLowerCase()
  if (phraseMap.has(baseLower)) {
    let translated = phraseMap.get(baseLower)
    if (base[0] === base[0].toUpperCase()) {
      translated = matchCapitalization(base, translated)
    }
    return value.replace(trimmed, translated + punctuation)
  }
  return null
}

function translateWords (value) {
  if (typeof value !== 'string') return value
  const regex = /([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:'[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)?)/g
  return value.replace(regex, match => {
    const lower = match.toLowerCase()
    if (!wordMap.has(lower)) return match
    const translated = wordMap.get(lower)
    return matchCapitalization(match, translated)
  })
}

function translateText (value) {
  if (typeof value !== 'string') return value
  const phraseTranslation = translatePhrase(value)
  if (phraseTranslation) return phraseTranslation
  return translateWords(value)
}

function translatePropValue (value) {
  if (typeof value === 'string') return translateText(value)
  if (Array.isArray(value)) return value.map(translatePropValue)
  return value
}

React.createElement = function translatedCreateElement (type, props, ...children) {
  let nextProps = props
  if (props) {
    nextProps = { ...props }
    TRANSLATABLE_PROP_KEYS.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(nextProps, key)) {
        nextProps[key] = translatePropValue(nextProps[key])
      }
    })
  }

  const nextChildren = children.map(child => {
    if (typeof child === 'string') return translateText(child)
    if (Array.isArray(child)) return child.map(item => (typeof item === 'string' ? translateText(item) : item))
    return child
  })

  return ORIGINAL_CREATE_ELEMENT.call(React, type, nextProps, ...nextChildren)
}

if (typeof document !== 'undefined' && typeof Node !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    try {
      document.documentElement.setAttribute('lang', 'es')
    } catch (e) {}

    try {
      document.title = translateText(document.title)
    } catch (e) {}

    const translateNode = node => {
      if (!node || !node.childNodes) return
      node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const translated = translateText(child.textContent)
          if (translated !== child.textContent) child.textContent = translated
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          if (child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE') {
            Array.from(child.attributes || []).forEach(attr => {
              const attrName = attr.name.toLowerCase()
              if (TRANSLATABLE_PROP_KEYS.has(attrName)) {
                const translated = translateText(attr.value)
                if (translated !== attr.value) {
                  child.setAttribute(attr.name, translated)
                }
              }
            })
            translateNode(child)
          }
        }
      })
    }

    translateNode(document.body)
  })
}
