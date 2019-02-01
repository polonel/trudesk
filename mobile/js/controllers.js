;(function () {
  return angular.module('trudesk.controllers', [
    'trudesk.controllers.login',
    'trudesk.controllers.dashboard',
    'trudesk.controllers.tickets',
    'trudesk.controllers.ticketDetails',
    'trudesk.controllers.accounts',
    'trudesk.controllers.messages',
    'trudesk.controllers.messages.conversation',

    'trudesk.controllers.imgCrop',
    'trudesk.controllers.graphs'
  ])
})()
