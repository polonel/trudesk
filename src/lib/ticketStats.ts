import _ from 'lodash'
import moment from 'moment'

interface GraphDataItem {
  date: string
  value: number
}

interface TicketStatsItem {
  name: string
  value: number
}

export const buildGraphData = (arr: Array<{ date: string }>, days: number): GraphDataItem[] => {
  const graphData: GraphDataItem[] = []
  if (arr.length < 1) {
    return graphData
  }

  const today = moment()
    .hour(23)
    .minute(59)
    .second(59)
  const timespanArray: number[] = []
  for (var i = days; i--; ) {
    timespanArray.push(i)
  }

  const mapped = _.map(arr, function (i) {
    return moment(i.date).format('YYYY-MM-DD')
  })

  const counted = _.countBy(mapped)

  for (let k = 0; k < timespanArray.length; k++) {
    const obj: GraphDataItem = { date: '', value: 0 }
    const day = timespanArray[k]
    const d = today.clone().subtract(day, 'd')
    obj.date = d.format('YYYY-MM-DD')

    obj.value = counted[obj.date] === undefined ? 0 : counted[obj.date]!

    graphData.push(obj)
  }

  return graphData
}

export const buildAvgResponse = (ticketArray: Array<{ date: string; comments?: Array<{ date: string }> }>): number => {
  const $ticketAvg: number[] = []
  for (let i = 0; i < ticketArray.length; i++) {
    const ticket = ticketArray[i]
    if (!ticket || ticket.comments === undefined || ticket.comments.length < 1) continue

    const ticketDate = moment(ticket.date)
    const firstCommentDate = moment(ticket.comments[0]!.date)

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

export const buildMostRequester = (ticketArray: Array<{ owner?: { fullname: string } }>): TicketStatsItem | null => {
  const requesters = _.compact(ticketArray.map(ticket => (ticket.owner ? ticket.owner.fullname : null)))

  let r: any = _.countBy(requesters, function (k) { return k })
  r = _.map(r, function (v: number, k: string) { return { name: k, value: v } })
  r = _.sortBy(r, function (o: TicketStatsItem) { return -o.value })

  return _.first(r) ?? null
}

function flatten(arr: any[]): any[] {
  return arr.reduce(function (flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten)
  }, [])
}

export const buildMostComments = (ticketArray: Array<{ comments?: Array<{ owner?: { fullname: string } }> }>): TicketStatsItem | null => {
  const commenters = flatten(ticketArray.map(ticket => {
    return ticket.comments?.map(comment => (comment.owner ? comment.owner.fullname : null))
  }))

  let c: any = _.countBy(commenters, function (k: string) { return k })
  c = _.map(c, function (v: number, k: string) { return { name: k, value: v } })
  c = _.sortBy(c, function (o: TicketStatsItem) { return -o.value })

  return _.first(c) ?? null
}

export const buildMostAssignee = (ticketArray: Array<{ assignee?: { fullname: string } }>): TicketStatsItem | null => {
  const filtered = _.reject(ticketArray, function (v) {
    return _.isUndefined(v.assignee) || _.isNull(v.assignee)
  })

  const assignees = _.map(filtered, function (m) { return m.assignee?.fullname })

  let a: any = _.countBy(assignees, function (k: string) { return k })
  a = _.map(a, function (v: number, k: string) { return { name: k, value: v } })
  a = _.sortBy(a, function (o: TicketStatsItem) { return -o.value })

  return _.first(a) ?? null
}