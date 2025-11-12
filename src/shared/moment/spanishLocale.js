const spanishLocale = {
  months: 'enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre'.split('_'),
  monthsShort: 'ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.'.split('_'),
  monthsParseExact: true,
  weekdays: 'domingo_lunes_martes_miércoles_jueves_viernes_sábado'.split('_'),
  weekdaysShort: 'dom._lun._mar._mié._jue._vie._sáb.'.split('_'),
  weekdaysMin: 'do_lu_ma_mi_ju_vi_sá'.split('_'),
  weekdaysParseExact: true,
  longDateFormat: {
    LT: 'H:mm',
    LTS: 'H:mm:ss',
    L: 'DD/MM/YYYY',
    LL: 'D [de] MMMM [de] YYYY',
    LLL: 'D [de] MMMM [de] YYYY H:mm',
    LLLL: 'dddd, D [de] MMMM [de] YYYY H:mm'
  },
  calendar: {
    sameDay () {
      return '[hoy a la' + (this.hours() !== 1 ? 's' : '') + '] LT'
    },
    nextDay () {
      return '[mañana a la' + (this.hours() !== 1 ? 's' : '') + '] LT'
    },
    nextWeek () {
      return 'dddd [a la' + (this.hours() !== 1 ? 's' : '') + '] LT'
    },
    lastDay () {
      return '[ayer a la' + (this.hours() !== 1 ? 's' : '') + '] LT'
    },
    lastWeek () {
      return '[el] dddd [pasado a la' + (this.hours() !== 1 ? 's' : '') + '] LT'
    },
    sameElse: 'L'
  },
  relativeTime: {
    future: 'en %s',
    past: 'hace %s',
    s: 'unos segundos',
    ss: '%d segundos',
    m: '1 min',
    mm: '%d min',
    h: '1 h',
    hh: '%d h',
    d: '1 día',
    dd: '%d días',
    M: '1 mes',
    MM: '%d meses',
    y: '1 año',
    yy: '%d años'
  },
  dayOfMonthOrdinalParse: /\d{1,2}º/,
  ordinal: '%dº',
  meridiemParse: /a\.m\.|p\.m\./,
  meridiem: function (hours) {
    return hours < 12 ? 'a.m.' : 'p.m.'
  },
  invalidDate: 'Fecha inválida',
  week: {
    dow: 1,
    doy: 4
  }
}

module.exports = spanishLocale
module.exports.default = spanishLocale
