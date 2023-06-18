import { getModelForClass } from '@typegoose/typegoose'
import Ticket from './ticket'
import { TicketTypeClass } from './tickettype'
import { TicketPriorityClass } from './ticketpriority'
import { TicketTagClass } from './tag'
import Role from './role'
import RoleOrder from './roleorder'
import Session from './session'
import Setting from './setting'
import { GroupModelClass } from './group'
import { TeamModelClass } from './team'
import { UserModelClass } from './user'
import { DepartmentModelClass } from './department'
import Message from './chat/message'
import { ConversationModelClass } from './chat/conversation'
import Notice from './notice'
import { NotificationModelClass } from './notification'
import Template from './template'

export const TicketModel = Ticket
export const TicketTypeModel = getModelForClass(TicketTypeClass)
export const PriorityModel = getModelForClass(TicketPriorityClass)
export const TicketTagModel = getModelForClass(TicketTagClass)
export const RoleModel = Role
export const RoleOrderModel = RoleOrder
export const SessionModel = Session
export const SettingModel = Setting
export const GroupModel = getModelForClass(GroupModelClass)
export const TeamModel = getModelForClass(TeamModelClass)
export const UserModel = getModelForClass(UserModelClass)
export const DepartmentModel = getModelForClass(DepartmentModelClass)
export const MessageModel = Message
export const ConversationModel = getModelForClass(ConversationModelClass)
export const NoticeModel = Notice
export const NotificationModel = getModelForClass(NotificationModelClass)
export const TemplateModel = Template

export default {
  UserModel,
  TicketModel: Ticket,
  TicketTypeModel,
  PriorityModel,
  TicketTagModel,
  RoleModel: Role,
  RoleOrderModel: RoleOrder,
  SessionModel: Session,
  SettingModel: Setting,
  GroupModel,
  TeamModel,
  DepartmentModel,
  MessageModel: Message,
  ConversationModel,
  NoticeModel: Notice,
  NotificationModel,
  TemplateModel: Template
}
