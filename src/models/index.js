const User = require('./user');
const Ticket = require('./ticket');
const TicketType = require('./tickettype');
const Priority = require('./ticketpriority');
const TicketTags = require('./tag');
const Role = require('./role');
const Session = require('./session');
const Setting = require('./setting');
const Group = require('./group');
const Team = require('./team');
const Department = require('./department');
const Message = require('./chat/message');
const Conversation = require('./chat/conversation');
const TCM = require('./tcm');
const TSorting = require('./tsorting');

module.exports = {
  User,
  Ticket,
  TicketType,
  Priority,
  TicketTags,
  Role,
  Session,
  Setting,
  Group,
  Team,
  Department,
  Message,
  Conversation,
  TCM,
  TSorting,
};
