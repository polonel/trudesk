/*! DataTables Foundation integration
 * ©2011-2014 SpryMedia Ltd - datatables.net/license
 */
;(function (c, a, d) {
  var b = function (f, e) {
    f.extend(e.ext.classes, { sWrapper: 'dataTables_wrapper dt-foundation' })
    f.extend(true, e.defaults, {
      dom: "<'row'<'small-6 columns'l><'small-6 columns'f>r>t<'row'<'small-6 columns'i><'small-6 columns'p>>",
      renderer: 'foundation'
    })
    e.ext.renderer.pageButton.foundation = function (k, r, q, p, o, j) {
      var n = new e.Api(k)
      var l = k.oClasses
      var i = k.oLanguage.oPaginate
      var h, g
      var m = function (t, x) {
        var v, s, w, u
        var y = function (z) {
          z.preventDefault()
          if (z.data.action !== 'ellipsis') {
            n.page(z.data.action).draw(false)
          }
        }
        for (v = 0, s = x.length; v < s; v++) {
          u = x[v]
          if (f.isArray(u)) {
            m(t, u)
          } else {
            h = ''
            g = ''
            switch (u) {
              case 'ellipsis':
                h = '&hellip;'
                g = 'unavailable'
                break
              case 'first':
                h = i.sFirst
                g = u + (o > 0 ? '' : ' unavailable')
                break
              case 'previous':
                h = i.sPrevious
                g = u + (o > 0 ? '' : ' unavailable')
                break
              case 'next':
                h = i.sNext
                g = u + (o < j - 1 ? '' : ' unavailable')
                break
              case 'last':
                h = i.sLast
                g = u + (o < j - 1 ? '' : ' unavailable')
                break
              default:
                h = u + 1
                g = o === u ? 'current' : ''
                break
            }
            if (h) {
              w = f('<li>', {
                class: l.sPageButton + ' ' + g,
                'aria-controls': k.sTableId,
                tabindex: k.iTabIndex,
                id: q === 0 && typeof u === 'string' ? k.sTableId + '_' + u : null
              })
                .append(f('<a>', { href: '#' }).html(h))
                .appendTo(t)
              k.oApi._fnBindAction(w, { action: u }, y)
            }
          }
        }
      }
      m(
        f(r)
          .empty()
          .html('<ul class="pagination"/>')
          .children('ul'),
        p
      )
    }
    if (e.TableTools) {
      f.extend(true, e.TableTools.classes, {
        container: 'DTTT button-group',
        buttons: { normal: 'button', disabled: 'disabled' },
        collection: { container: 'DTTT_dropdown dropdown-menu', buttons: { normal: '', disabled: 'disabled' } },
        select: { row: 'active' }
      })
      f.extend(true, e.TableTools.DEFAULTS.oTags, { collection: { container: 'ul', button: 'li', liner: 'a' } })
    }
  }
  if (typeof define === 'function' && define.amd) {
    define(['jquery', 'datatables'], b)
  } else {
    if (typeof exports === 'object') {
      b(require('jquery'), require('datatables'))
    } else {
      if (jQuery) {
        b(jQuery, jQuery.fn.dataTable)
      }
    }
  }
})(window, document)
