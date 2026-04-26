import { getModelForClass } from '@typegoose/typegoose'
import { TicketClass } from './ticket'
import { TicketTypeClass } from './tickettype'
import { TicketPriorityClass } from './ticketpriority'
import { TicketStatusClass } from './ticketStatus'
import { TicketTagClass } from './tag'
import Role from './role'
import RoleOrder from './roleorder'
import Session from './session'
import Setting from './setting'
import { GroupModelClass } from './group'
import { TeamModelClass } from './team'
import { UserModelClass } from './user'
import { DepartmentModelClass } from './department'
import { MessageClass } from './chat/message'
import { ConversationModelClass } from './chat/conversation'
import { NoticeClass } from './notice'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Template from './template'
import { NotificationModelClass } from './notification'

export const TicketModel = getModelForClass(TicketClass)
export const TicketTypeModel = getModelForClass(TicketTypeClass)
export const PriorityModel = getModelForClass(TicketPriorityClass)
export const TicketStatusModel = getModelForClass(TicketStatusClass)
export const TicketTagModel = getModelForClass(TicketTagClass)
export const RoleModel = Role
export const RoleOrderModel = RoleOrder
export const SessionModel = Session
export const SettingModel = Setting
export const GroupModel = getModelForClass(GroupModelClass)
export const TeamModel = getModelForClass(TeamModelClass)
export const UserModel = getModelForClass(UserModelClass)
export const DepartmentModel = getModelForClass(DepartmentModelClass)
export const MessageModel = getModelForClass(MessageClass)
export const ConversationModel = getModelForClass(ConversationModelClass)
export const NoticeModel = getModelForClass(NoticeClass)
export const NotificationModel = getModelForClass(NotificationModelClass)
export const TemplateModel = Template

export default {
  UserModel,
  TicketModel,
  TicketTypeModel,
  PriorityModel,
  TicketTagModel,
  RoleModel,
  RoleOrderModel,
  SessionModel,
  SettingModel,
  GroupModel,
  TeamModel,
  DepartmentModel,
  MessageModel,
  ConversationModel,
  NoticeModel,
  NotificationModel,
  TemplateModel
}
