/*! UIkit 2.25.0 | http://www.getuikit.com | (c) 2014 YOOtheme | MIT License */
;(function (addon) {
  var component

  if (window.UIkit) {
    component = addon(UIkit)
  }

  if (typeof define == 'function' && define.amd) {
    define('uikit-datepicker', ['uikit'], function () {
      return component || addon(UIkit)
    })
  }
})(function (UI) {
  'use strict'

  // Datepicker

  var active = false,
    dropdown,
    moment

  UI.component('datepicker', {
    defaults: {
      mobile: false,
      weekstart: 1,
      i18n: {
        months: [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December'
        ],
        weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      },
      format: 'YYYY-MM-DD',
      offsettop: 5,
      maxDate: false,
      minDate: false,
      pos: 'auto',
      template: function (data, opts) {
        var content = '',
          i

        content += '<div class="uk-datepicker-nav">'
        content += '<a href="" class="no-ajaxy uk-datepicker-previous"></a>'
        content += '<a href="" class="no-ajaxy uk-datepicker-next"></a>'

        if (UI.formSelect) {
          var currentyear = new Date().getFullYear(),
            options = [],
            months,
            years,
            minYear,
            maxYear

          for (i = 0; i < opts.i18n.months.length; i++) {
            if (i == data.month) {
              options.push('<option value="' + i + '" selected>' + opts.i18n.months[i] + '</option>')
            } else {
              options.push('<option value="' + i + '">' + opts.i18n.months[i] + '</option>')
            }
          }

          months =
            '<span class="uk-form-select">' +
            opts.i18n.months[data.month] +
            '<select class="update-picker-month">' +
            options.join('') +
            '</select></span>'

          // --

          options = []

          minYear = data.minDate ? data.minDate.year() : currentyear - 50
          maxYear = data.maxDate ? data.maxDate.year() : currentyear + 20

          for (i = minYear; i <= maxYear; i++) {
            if (i == data.year) {
              options.push('<option value="' + i + '" selected>' + i + '</option>')
            } else {
              options.push('<option value="' + i + '">' + i + '</option>')
            }
          }

          years =
            '<span class="uk-form-select">' +
            data.year +
            '<select class="update-picker-year">' +
            options.join('') +
            '</select></span>'

          content += '<div class="uk-datepicker-heading">' + months + ' ' + years + '</div>'
        } else {
          content += '<div class="uk-datepicker-heading">' + opts.i18n.months[data.month] + ' ' + data.year + '</div>'
        }

        content += '</div>'

        content += '<table class="uk-datepicker-table">'
        content += '<thead>'
        for (i = 0; i < data.weekdays.length; i++) {
          if (data.weekdays[i]) {
            content += '<th>' + data.weekdays[i] + '</th>'
          }
        }
        content += '</thead>'

        content += '<tbody>'
        for (i = 0; i < data.days.length; i++) {
          if (data.days[i] && data.days[i].length) {
            content += '<tr>'
            for (var d = 0; d < data.days[i].length; d++) {
              if (data.days[i][d]) {
                var day = data.days[i][d],
                  cls = []

                if (!day.inmonth) cls.push('uk-datepicker-table-muted')
                if (day.selected) cls.push('uk-active')
                if (day.disabled) cls.push('uk-datepicker-date-disabled uk-datepicker-table-muted')

                content +=
                  '<td><a href="" class="no-ajaxy ' +
                  cls.join(' ') +
                  '" data-date="' +
                  day.day.format() +
                  '">' +
                  day.day.format('D') +
                  '</a></td>'
              }
            }
            content += '</tr>'
          }
        }
        content += '</tbody>'

        content += '</table>'

        return content
      }
    },

    boot: function () {
      UI.$win.on('resize orientationchange', function () {
        if (active) {
          active.hide()
        }
      })

      // init code
      UI.$html.on('focus.datepicker.uikit', '[data-uk-datepicker]', function (e) {
        var ele = UI.$(this)

        if (!ele.data('datepicker')) {
          e.preventDefault()
          UI.datepicker(ele, UI.Utils.options(ele.attr('data-uk-datepicker')))
          ele.trigger('focus')
        }
      })

      UI.$html.on('click focus', '*', function (e) {
        var target = UI.$(e.target)

        if (
          active &&
          target[0] != dropdown[0] &&
          !target.data('datepicker') &&
          !target.parents('.uk-datepicker:first').length
        ) {
          active.hide()
        }
      })
    },

    init: function () {
      // use native datepicker on touch devices
      if (UI.support.touch && this.element.attr('type') == 'date' && !this.options.mobile) {
        return
      }

      var $this = this

      this.current = this.element.val() ? moment(this.element.val(), this.options.format) : moment()

      this.on('click focus', function () {
        if (active !== $this) $this.pick(this.value ? this.value : $this.options.minDate ? $this.options.minDate : '')
      }).on('change', function () {
        if ($this.element.val() && !moment($this.element.val(), $this.options.format).isValid()) {
          $this.element.val(moment().format($this.options.format))
        }
      })

      // init dropdown
      if (!dropdown) {
        dropdown = UI.$('<div class="uk-dropdown uk-datepicker"></div>')

        dropdown.on('click', '.uk-datepicker-next, .uk-datepicker-previous, [data-date]', function (e) {
          e.stopPropagation()
          e.preventDefault()

          var ele = UI.$(this)

          if (ele.hasClass('uk-datepicker-date-disabled')) return false

          if (ele.is('[data-date]')) {
            active.current = moment(ele.data('date'))
            active.element.val(active.current.format(active.options.format)).trigger('change')
            active.hide()
          } else {
            active.add(ele.hasClass('uk-datepicker-next') ? 1 : -1, 'months')
          }
        })

        dropdown.on('change', '.update-picker-month, .update-picker-year', function () {
          var select = UI.$(this)
          active[select.is('.update-picker-year') ? 'setYear' : 'setMonth'](Number(select.val()))
        })

        dropdown.appendTo('body')
      }
    },

    pick: function (initdate) {
      var offset = this.element.offset(),
        css = { left: offset.left, right: '' }

      this.current = isNaN(initdate) ? moment(initdate, this.options.format) : moment()
      this.initdate = this.current.format('YYYY-MM-DD')

      this.update()

      if (UI.langdirection == 'right') {
        css.right = window.innerWidth - (css.left + this.element.outerWidth())
        css.left = ''
      }

      var posTop =
          offset.top -
          this.element.outerHeight() +
          this.element.height() -
          this.options.offsettop -
          dropdown.outerHeight(),
        posBottom = offset.top + this.element.outerHeight() + this.options.offsettop

      css.top = posBottom

      if (this.options.pos == 'top') {
        css.top = posTop
      } else if (
        this.options.pos == 'auto' &&
        (window.innerHeight - posBottom - dropdown.outerHeight() < 0 && posTop >= 0)
      ) {
        css.top = posTop
      }

      dropdown.css(css).show()
      this.trigger('show.uk.datepicker')

      active = this
    },

    add: function (unit, value) {
      this.current.add(unit, value)
      this.update()
    },

    setMonth: function (month) {
      this.current.month(month)
      this.update()
    },

    setYear: function (year) {
      this.current.year(year)
      this.update()
    },

    update: function () {
      var data = this.getRows(this.current.year(), this.current.month()),
        tpl = this.options.template(data, this.options)

      dropdown.html(tpl)

      this.trigger('update.uk.datepicker')
    },

    getRows: function (year, month) {
      var opts = this.options,
        now = moment().format('YYYY-MM-DD'),
        days = [
          31,
          (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28,
          31,
          30,
          31,
          30,
          31,
          31,
          30,
          31,
          30,
          31
        ][month],
        before = new Date(year, month, 1, 12).getDay(),
        data = { month: month, year: year, weekdays: [], days: [], maxDate: false, minDate: false },
        row = []

      if (opts.maxDate !== false) {
        data.maxDate = isNaN(opts.maxDate) ? moment(opts.maxDate, opts.format) : moment().add(opts.maxDate, 'days')
      }

      if (opts.minDate !== false) {
        data.minDate = isNaN(opts.minDate) ? moment(opts.minDate, opts.format) : moment().add(opts.minDate - 1, 'days')
      }

      data.weekdays = (function () {
        for (var i = 0, arr = []; i < 7; i++) {
          var day = i + (opts.weekstart || 0)

          while (day >= 7) {
            day -= 7
          }

          arr.push(opts.i18n.weekdays[day])
        }

        return arr
      })()

      if (opts.weekstart && opts.weekstart > 0) {
        before -= opts.weekstart
        if (before < 0) {
          before += 7
        }
      }

      var cells = days + before,
        after = cells

      while (after > 7) {
        after -= 7
      }

      cells += 7 - after

      var day, isDisabled, isSelected, isToday, isInMonth

      for (var i = 0, r = 0; i < cells; i++) {
        day = new Date(year, month, 1 + (i - before), 12)
        isDisabled = (data.minDate && data.minDate > day) || (data.maxDate && day > data.maxDate)
        isInMonth = !(i < before || i >= days + before)

        day = moment(day)

        isSelected = this.initdate == day.format('YYYY-MM-DD')
        isToday = now == day.format('YYYY-MM-DD')

        row.push({ selected: isSelected, today: isToday, disabled: isDisabled, day: day, inmonth: isInMonth })

        if (++r === 7) {
          data.days.push(row)
          row = []
          r = 0
        }
      }

      return data
    },

    hide: function () {
      if (active && active === this) {
        dropdown.hide()
        active = false

        this.trigger('hide.uk.datepicker')
      }
    }
  })

  moment = window.moment
  UI.Utils.moment = moment

  // require(['moment'], function(moment) {
  //     if (typeof moment === 'function')
  //         UI.Utils.moment = moment;
  //     else
  //         UI.Utils.moment = window.moment;
  // });

  return UI.datepicker
})
