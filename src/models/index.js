const UserModel = require('./user')
const TicketModel = require('./ticket')
const TicketTypeModel = require('./tickettype')
const PriorityModel = require('./ticketpriority')
const TicketTagsModel = require('./tag')
const RoleModel = require('./role')
const SessionModel = require('./session')
const SettingModel = require('./setting')
const GroupModel = require('./group')
const TeamModel = require('./team')
const DepartmentModel = require('./department')
const MessageModel = require('./chat/message')
const ConversationModel = require('./chat/conversation')

module.exports = {
  UserModel,
  TicketModel,
  TicketTypeModel,
  PriorityModel,
  TicketTagsModel,
  RoleModel,
  SessionModel,
  SettingModel,
  GroupModel,
  TeamModel,
  DepartmentModel,
  MessageModel,
  ConversationModel
}
