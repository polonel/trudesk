/*
 * File:        jquery.dataTables.grouping.js
 * Version:     1.2.9.
 * Author:      Jovan Popovic
 *
 * Copyright 2013 Jovan Popovic, all rights reserved.
 *
 * This source file is free software, under either the GPL v2 license or a
 * BSD style license, as supplied with this software.
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.
 * Parameters:
 * @iGroupingColumnIndex                                 Integer             Index of the column that will be used for grouping - default 0
 * @sGroupingColumnSortDirection                         Enumeration         Sort direction of the group
 * @iGroupingOrderByColumnIndex                          Integer             Index of the column that will be used for ordering groups
 * @sGroupingClass                                       String              Class that will be associated to the group row. Default - "group"
 * @sGroupItemClass                                      String              Class that will be associated to the group row of group items. Default - "group-item"
 * @bSetGroupingClassOnTR                                Boolean             If set class will be set to the TR instead of the TD withing the grouping TR
 * @bHideGroupingColumn                                  Boolean             Hide column used for grouping once results are grouped. Default - true
 * @bHideGroupingOrderByColumn                           Boolean             Hide column used for ordering groups once results are grouped. Default - true
 * @sGroupBy                                             Enumeration         Type of grouping that should be applied. Values "name"(default), "letter", "year"
 * @sGroupLabelPrefix                                    String              Prefix that will be added to each group cell
 * @bExpandableGrouping                                  Boolean             Attach expand/collapse handlers to the grouping rows
 * @bExpandSingleGroup                                   Boolean             Use accordon grouping
 * @iExpandGroupOffset                                   Integer             Number of pixels to set scroll position above the currently selected group. If -1 scroll will be alligned to the table
 * General settings
 * @sDateFormat: "dd/MM/yyyy"                            String              Date format used for grouping
 * @sEmptyGroupLabel                                     String              Lable that will be placed as group if grouping cells are empty. Default "-"

 * Parameters used in the second level grouping
 * @iGroupingColumnIndex2                                Integer             Index of the secondary column that will be used for grouping - default 0
 * @sGroupingColumnSortDirection2                        Enumeration         Sort direction of the secondary group
 * @iGroupingOrderByColumnIndex2                         Integer             Index of the column that will be used for ordering secondary groups
 * @sGroupingClass2                                      String              Class that will be associated to the secondary group row. Default "subgroup"
 * @sGroupItemClass2                                     String              Class that will be associated to the secondary group row of group items. Default "subgroup-item"
 * @bHideGroupingColumn2                                 Boolean             Hide column used for secondary grouping once results are grouped. Default - true,
 * @bHideGroupingOrderByColumn2                          Boolean             Hide column used for ordering secondary groups once results are grouped. Default - true,
 * @sGroupBy2                                            Enumeration         Type of grouping that should be applied to secondary column. Values "name"(default), "letter", "year",
 * @sGroupLabelPrefix2                                   String              Prefix that will be added to each secondary group cell
 * @fnOnGrouped                                          Function            Function that is called when grouping is finished. Function has no parameters.
 */
;(function (a) {
  a.fn.rowGrouping = function (e) {
    function b () {}
    function c (j, h, i) {}
    function d (j, h, i) {}
    function g (i) {
      var h = [
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
      ]
      return h[i - 1]
    }
    var f = {
      iGroupingColumnIndex: 0,
      sGroupingColumnSortDirection: '',
      iGroupingOrderByColumnIndex: -1,
      sGroupingClass: 'group',
      sGroupItemClass: 'group-item',
      bHideGroupingColumn: true,
      bHideGroupingOrderByColumn: true,
      sGroupBy: 'name',
      sGroupLabelPrefix: '',
      fnGroupLabelFormat: function (h) {
        return h
      },
      bExpandableGrouping: false,
      bExpandSingleGroup: false,
      iExpandGroupOffset: 100,
      asExpandedGroups: null,
      sDateFormat: 'dd/MM/yyyy',
      sEmptyGroupLabel: '-',
      bSetGroupingClassOnTR: false,
      iGroupingColumnIndex2: -1,
      sGroupingColumnSortDirection2: '',
      iGroupingOrderByColumnIndex2: -1,
      sGroupingClass2: 'subgroup',
      sGroupItemClass2: 'subgroup-item',
      bHideGroupingColumn2: true,
      bHideGroupingOrderByColumn2: true,
      sGroupBy2: 'name',
      sGroupLabelPrefix2: '',
      fnGroupLabelFormat2: function (h) {
        return h
      },
      bExpandableGrouping2: false,
      fnOnGrouped: b,
      fnOnGroupCreated: c,
      fnOnGroupCompleted: d,
      oHideEffect: null,
      oShowEffect: null,
      bUseFilteringForGrouping: false
    }
    return this.each(function (s, J) {
      var E = a(J).dataTable()
      var B = new Array()
      a(this).dataTableExt.aoGroups = B
      function q (T, i, P) {
        var R = document.createElement('tr')
        var S = document.createElement('td')
        R.id = 'group-id-' + E.attr('id') + '_' + T
        var Q = {
          id: R.id,
          key: T,
          text: i,
          level: 0,
          groupItemClass: '.group-item-' + T,
          dataGroup: T,
          aoSubgroups: new Array()
        }
        if (t.bSetGroupingClassOnTR) {
          R.className = t.sGroupingClass + ' ' + T
        } else {
          S.className = t.sGroupingClass + ' ' + T
        }
        S.colSpan = P
        S.innerHTML = t.sGroupLabelPrefix + t.fnGroupLabelFormat(i == '' ? t.sEmptyGroupLabel : i, Q)
        if (t.bExpandableGrouping) {
          if (!I(T)) {
            S.className += ' expanded-group'
            Q.state = 'expanded'
          } else {
            S.className += ' collapsed-group'
            Q.state = 'collapsed'
          }
          S.className += ' group-item-expander'
          a(S).attr('data-group', Q.dataGroup)
          a(S).attr('data-group-level', Q.level)
          a(S).click(h)
        }
        R.appendChild(S)
        B[T] = Q
        Q.nGroup = R
        t.fnOnGroupCreated(Q, T, 1)
        return Q
      }
      function w (R, Q, P, T) {
        var i = document.createElement('tr')
        i.id = T.id + '_' + R
        var V = document.createElement('td')
        var U = T.dataGroup + '_' + R
        var S = {
          id: i.id,
          key: R,
          text: Q,
          level: T.level + 1,
          groupItemClass: '.group-item-' + U,
          dataGroup: U,
          aoSubgroups: new Array()
        }
        if (t.bSetGroupingClassOnTR) {
          i.className = t.sGroupingClass2 + ' ' + R
        } else {
          V.className = t.sGroupingClass2 + ' ' + R
        }
        V.colSpan = P
        V.innerHTML = t.sGroupLabelPrefix2 + t.fnGroupLabelFormat2(Q == '' ? t.sEmptyGroupLabel : Q, S)
        if (t.bExpandableGrouping) {
          i.className += ' group-item-' + T.dataGroup
        }
        if (t.bExpandableGrouping && t.bExpandableGrouping2) {
          if (!I(S.dataGroup)) {
            V.className += ' expanded-group'
            S.state = 'expanded'
          } else {
            V.className += ' collapsed-group'
            S.state = 'collapsed'
          }
          V.className += ' group-item-expander'
          a(V).attr('data-group', S.dataGroup)
          a(V).attr('data-group-level', S.level)
          a(V).click(h)
        }
        i.appendChild(V)
        T.aoSubgroups[S.dataGroup] = S
        B[S.dataGroup] = S
        S.nGroup = i
        t.fnOnGroupCreated(S, R, 2)
        return S
      }
      function I (i) {
        if (B[i] != null) {
          return B[i].state == 'collapsed'
        } else {
          if (i.indexOf('_') > -1) {
            true
          } else {
            if (l && (j == null || j.length == 0)) {
              return false
            } else {
              return a.inArray(i, j) == -1
            }
          }
        }
      }
      function L (i) {
        if (i.length < x + K) {
          return i
        } else {
          return i.substr(x, K)
        }
      }
      function y (i) {
        return i
      }
      function M (i) {
        return i.substr(0, 1)
      }
      function O (i) {
        return L(i)
      }
      function C (i) {
        return i.substr(x, K) + ' ' + g(i.substr(r, H))
      }
      function u (i) {
        if (i === '') {
          return '-'
        }
        return i.toLowerCase().replace(/[^a-zA-Z0-9\u0080-\uFFFF]+/g, '-')
      }
      function D (R, P, i) {
        if (R.nTable.id !== E[0].id) {
          return true
        }
        var Q = P[t.iGroupingColumnIndex]
        if (typeof Q === 'undefined') {
          Q = P[R.aoColumns[t.iGroupingColumnIndex].mDataProp]
        }
        if (I(u(Q))) {
          if (E.fnIsOpen(E.fnGetNodes(i))) {
            if (t.fnOnRowClosed != null) {
              t.fnOnRowClosed(this)
            }
            E.fnClose(E.fnGetNodes(i))
          }
          return false
        }
        return true
      }
      function p (i) {
        B[i].state = 'expanded'
        a("td[data-group^='" + i + "']").removeClass('collapsed-group')
        a("td[data-group^='" + i + "']").addClass('expanded-group')
        if (t.bUseFilteringForGrouping) {
          E.fnDraw()
          return
        }
        if (jQuery.inArray(i, j) == -1) {
          j.push(i)
        }
        if (t.oHideEffect != null) {
          a('.group-item-' + i, E)[t.oShowEffect.method](t.oShowEffect.duration, t.oShowEffect.easing, function () {})
        } else {
          a('.group-item-' + i, E).show()
        }
      }
      function m (i) {
        B[i].state = 'collapsed'
        a("td[data-group^='" + i + "']").removeClass('expanded-group')
        a("td[data-group^='" + i + "']").addClass('collapsed-group')
        if (t.bUseFilteringForGrouping) {
          E.fnDraw()
          return
        }
        a('.group-item-' + i).each(function () {
          if (E.fnIsOpen(this)) {
            if (t.fnOnRowClosed != null) {
              t.fnOnRowClosed(this)
            }
            E.fnClose(this)
          }
        })
        if (t.oHideEffect != null) {
          a('.group-item-' + i, E)[t.oHideEffect.method](t.oHideEffect.duration, t.oHideEffect.easing, function () {})
        } else {
          a('.group-item-' + i, E).hide()
        }
      }
      function h (T) {
        var Q = a(this).attr('data-group')
        var S = a(this).attr('data-group-level')
        var R = !I(Q)
        if (t.bExpandSingleGroup) {
          if (!R) {
            var P = a('td.expanded-group').attr('data-group')
            m(P)
            p(Q)
            if (t.iExpandGroupOffset != -1) {
              var i = a('#group-id-' + E.attr('id') + '_' + Q).offset().top - t.iExpandGroupOffset
              window.scroll(0, i)
            } else {
              var i = E.offset().top
              window.scroll(0, i)
            }
          }
        } else {
          if (R) {
            m(Q)
          } else {
            p(Q)
          }
        }
        T.preventDefault()
      }
      function A (V) {
        if (E.fnSettings().oFeatures.bServerSide) {
          l = true
        }
        var Z = false
        if (t.iGroupingColumnIndex2 != -1) {
          Z = true
        }
        if (V.aiDisplayMaster.length == 0) {
          return
        }
        var T = a('tbody tr', E)
        var Q = 0
        for (var ae = 0; ae < V.aoColumns.length; ae++) {
          if (V.aoColumns[ae].bVisible) {
            Q += 1
          }
        }
        var ah = null
        var aa = null
        if (V.aiDisplay.length > 0) {
          for (var ag = 0; ag < T.length; ag++) {
            var U = V._iDisplayStart + ag
            if (E.fnSettings().oFeatures.bServerSide) {
              U = ag
            }
            var S = ''
            var af = null
            var P = ''
            var Y = null
            S = this.fnGetData(T[ag], t.iGroupingColumnIndex)
            var af = S
            if (t.sGroupBy != 'year') {
              af = N(S)
            }
            if (Z) {
              P = V.aoData[V.aiDisplay[U]]._aData[t.iGroupingColumnIndex2]
              if (P == undefined) {
                P = V.aoData[V.aiDisplay[U]]._aData[V.aoColumns[t.iGroupingColumnIndex2].mDataProp]
              }
              if (t.sGroupBy2 != 'year') {
                Y = N(P)
              }
            }
            if (ah == null || u(af) != u(ah)) {
              var ab = u(af)
              if (ah != null) {
                t.fnOnGroupCompleted(B[u(ah)])
              }
              if (t.bAddAllGroupsAsExpanded && jQuery.inArray(ab, j) == -1) {
                j.push(ab)
              }
              var W = q(ab, af, Q)
              var R = W.nGroup
              if (T[ag].parentNode != null) {
                T[ag].parentNode.insertBefore(R, T[ag])
              } else {
                a(T[ag]).before(R)
              }
              ah = af
              aa = null
            }
            a(T[ag]).attr('data-group', B[ab].dataGroup)
            a(T[ag]).addClass(t.sGroupItemClass)
            a(T[ag]).addClass('group-item-' + ab)
            if (t.bExpandableGrouping) {
              if (I(ab) && !t.bUseFilteringForGrouping) {
                a(T[ag]).hide()
              }
            }
            if (Z) {
              if (aa == null || u(Y) != u(aa)) {
                var X = u(af) + '-' + u(Y)
                var ac = w(X, Y, Q, B[ab])
                var ad = ac.nGroup
                T[ag].parentNode.insertBefore(ad, T[ag])
                aa = Y
              }
              a(T[ag])
                .attr('data-group', ac.dataGroup)
                .addClass(t.sGroupItemClass2)
                .addClass('group-item-' + ac.dataGroup)
            }
          }
        }
        if (ah != null) {
          t.fnOnGroupCompleted(B[u(ah)])
        }
        t.fnOnGrouped(B)
        l = false
      }
      var x = 6
      var K = 4
      var j = new Array()
      var l = true
      var t = a.extend(f, e)
      if (t.iGroupingOrderByColumnIndex == -1) {
        t.bCustomColumnOrdering = false
        t.iGroupingOrderByColumnIndex = t.iGroupingColumnIndex
      } else {
        t.bCustomColumnOrdering = true
      }
      if (t.sGroupingColumnSortDirection == '') {
        if (t.sGroupBy == 'year') {
          t.sGroupingColumnSortDirection = 'desc'
        } else {
          t.sGroupingColumnSortDirection = 'asc'
        }
      }
      if (t.iGroupingOrderByColumnIndex2 == -1) {
        t.bCustomColumnOrdering2 = false
        t.iGroupingOrderByColumnIndex2 = t.iGroupingColumnIndex2
      } else {
        t.bCustomColumnOrdering2 = true
      }
      if (t.sGroupingColumnSortDirection2 == '') {
        if (t.sGroupBy2 == 'year') {
          t.sGroupingColumnSortDirection2 = 'desc'
        } else {
          t.sGroupingColumnSortDirection2 = 'asc'
        }
      }
      x = t.sDateFormat.toLowerCase().indexOf('yy')
      K = t.sDateFormat.toLowerCase().lastIndexOf('y') - t.sDateFormat.toLowerCase().indexOf('y') + 1
      var r = t.sDateFormat.toLowerCase().indexOf('mm')
      var H = t.sDateFormat.toLowerCase().lastIndexOf('m') - t.sDateFormat.toLowerCase().indexOf('m') + 1
      var N = y
      switch (t.sGroupBy) {
        case 'letter':
          N = M
          break
        case 'year':
          N = O
          break
        case 'month':
          N = C
          break
        default:
          N = y
          break
      }
      if (t.asExpandedGroups != null) {
        if (t.asExpandedGroups == 'NONE') {
          t.asExpandedGroups = []
          j = t.asExpandedGroups
          l = false
        } else {
          if (t.asExpandedGroups == 'ALL') {
            t.bAddAllGroupsAsExpanded = true
          } else {
            if (t.asExpandedGroups.constructor == String) {
              var k = t.asExpandedGroups
              t.asExpandedGroups = new Array()
              t.asExpandedGroups.push(u(k))
              j = t.asExpandedGroups
              l = false
            } else {
              if (t.asExpandedGroups.constructor == Array) {
                for (var G = 0; G < t.asExpandedGroups.length; G++) {
                  j.push(u(t.asExpandedGroups[G]))
                  if (t.bExpandSingleGroup) {
                    break
                  }
                }
                l = false
              }
            }
          }
        }
      } else {
        t.asExpandedGroups = new Array()
        t.bAddAllGroupsAsExpanded = true
      }
      if (t.bExpandSingleGroup) {
        var o = a('tbody tr', E)
        var n = E.fnGetData(o[0], t.iGroupingColumnIndex)
        var F = n
        if (t.sGroupBy != 'year') {
          F = N(n)
        }
        var z = u(F)
        t.asExpandedGroups = new Array()
        t.asExpandedGroups.push(z)
      }
      E.fnSetColumnVis(t.iGroupingColumnIndex, !t.bHideGroupingColumn)
      if (t.bCustomColumnOrdering) {
        E.fnSetColumnVis(t.iGroupingOrderByColumnIndex, !t.bHideGroupingOrderByColumn)
      }
      if (t.iGroupingColumnIndex2 != -1) {
        E.fnSetColumnVis(t.iGroupingColumnIndex2, !t.bHideGroupingColumn2)
      }
      if (t.bCustomColumnOrdering2) {
        E.fnSetColumnVis(t.iGroupingOrderByColumnIndex2, !t.bHideGroupingOrderByColumn2)
      }
      E.fnSettings().aoDrawCallback.push({ fn: A, sName: 'fnRowGrouping' })
      var v = new Array()
      v.push([t.iGroupingOrderByColumnIndex, t.sGroupingColumnSortDirection])
      if (t.iGroupingColumnIndex2 != -1) {
        v.push([t.iGroupingOrderByColumnIndex2, t.sGroupingColumnSortDirection2])
      }
      E.fnSettings().aaSortingFixed = v
      switch (t.sGroupBy) {
        case 'name':
          break
        case 'letter':
          E.fnSettings().aoColumns[t.iGroupingOrderByColumnIndex].sSortDataType = 'rg-letter'
          a.fn.dataTableExt.afnSortData['rg-letter'] = function (Q, P) {
            var i = []
            a('td:eq(' + P + ')', Q.oApi._fnGetTrNodes(Q)).each(function () {
              i.push(M(this.innerHTML))
            })
            return i
          }
          break
        case 'year':
          E.fnSettings().aoColumns[t.iGroupingOrderByColumnIndex].sSortDataType = 'rg-date'
          a.fn.dataTableExt.afnSortData['rg-date'] = function (R, P) {
            var i = []
            var Q = R.oApi._fnGetTrNodes(R)
            for (G = 0; G < Q.length; G++) {
              i.push(L(E.fnGetData(Q[G], P)))
            }
            return i
          }
          break
        default:
          break
      }
      if (t.bUseFilteringForGrouping) {
        a.fn.dataTableExt.afnFiltering.push(D)
      }
      E.fnDraw()
    })
  }
})(jQuery)
