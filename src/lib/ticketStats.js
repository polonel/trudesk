import _ from 'lodash'
import moment from 'moment'

export const buildGraphData = (arr, days) => {
  const graphData = []
  if (arr.length < 1) {
    return graphData
  }
  const today = moment()
    .hour(23)
    .minute(59)
    .second(59)
  const timespanArray = []
  for (var i = days; i--; ) {
    timespanArray.push(i)
  }

  arr = _.map(arr, function (i) {
    return moment(i.date).format('YYYY-MM-DD')
  })

  let counted = _.countBy(arr)

  for (let k = 0; k < timespanArray.length; k++) {
    const obj = {}
    const day = timespanArray[k]
    const d = today.clone().subtract(day, 'd')
    obj.date = d.format('YYYY-MM-DD')

    obj.value = counted[obj.date] === undefined ? 0 : counted[obj.date]

    graphData.push(obj)
  }

  counted = null

  return graphData
}

export const buildAvgResponse = ticketArray => {
  const $ticketAvg = []
  for (let i = 0; i < ticketArray.length; i++) {
    const ticket = ticketArray[i]
    if (ticket.comments === undefined || ticket.comments.length < 1) continue

    const ticketDate = moment(ticket.date)
    const firstCommentDate = moment(ticket.comments[0].date)

    const diff = firstCommentDate.diff(ticketDate, 'seconds')
    $ticketAvg.push(diff)
  }

  const ticketAvgTotal = _.reduce(
    $ticketAvg,
    function (m, x) {
      return m + x
    },
    0
  )

  const tvt = moment.duration(Math.round(ticketAvgTotal / _.size($ticketAvg)), 'seconds').asHours()
  return Math.floor(tvt)
}

export const buildMostRequester = ticketArray => {
  let requesters = ticketArray.map(ticket => (ticket.owner ? ticket.owner.fullname : null))
  requesters = _.compact(requesters)

  let r = _.countBy(requesters, function (k) {
    return k
  })
  r = _(r).value()

  r = _.map(r, function (v, k) {
    return { name: k, value: v }
  })

  r = _.sortBy(r, function (o) {
    return -o.value
  })

  return _.first(r)
}

function flatten (arr) {
  return arr.reduce(function (flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten)
  }, [])
}

export const buildMostComments = ticketArray => {
  let commenters = ticketArray.map(ticket => {
    return ticket.comments.map(comment => (comment.owner ? comment.owner.fullname : null))
  })
  commenters = flatten(commenters)

  let c = _.countBy(commenters, function (k) {
    return k
  })

  c = _(c).value()

  c = _.map(c, function (v, k) {
    return { name: k, value: v }
  })

  c = _.sortBy(c, function (o) {
    return -o.value
  })

  return _.first(c)
}

export const buildMostAssignee = ticketArray => {
  ticketArray = _.reject(ticketArray, function (v) {
    return _.isUndefined(v.assignee) || _.isNull(v.assignee)
  })

  const assignees = _.map(ticketArray, function (m) {
    return m.assignee.fullname
  })

  let a = _.countBy(assignees, function (k) {
    return k
  })

  a = _(a).value()

  a = _.map(a, function (v, k) {
    return { name: k, value: v }
  })

  a = _.sortBy(a, function (o) {
    return -o.value
  })

  return _.first(a)
}
