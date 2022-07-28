import { DocumentType, modelOptions, pre, prop, Ref, ReturnModelType } from '@typegoose/typegoose'
import _ from 'lodash'
import type { Types } from 'mongoose'
import utils from '../helpers/utils'
import { GroupModelClass } from './group'
import { GroupModel, TeamModel } from './index'
import { TeamModelClass } from './team'

const COLLECTION = 'departments'

@pre('save', function (this: DocumentType<DepartmentModelClass>, next) {
  this.name = utils.sanitizeFieldPlainText(this.name.trim())
  this.normalized = utils.sanitizeFieldPlainText(this.name.trim().toLowerCase())

  return next()
})
@modelOptions({ options: { customName: COLLECTION } })
export class DepartmentModelClass {
  @prop({ required: true, unique: true })
  public name!: string
  @prop({ required: true, unique: true })
  public normalized!: string
  @prop({ ref: () => TeamModelClass })
  public teams?: Ref<TeamModelClass>[]
  @prop({ default: false })
  public allGroups?: boolean
  @prop({ default: false })
  public publicGroups?: boolean
  @prop({ ref: () => GroupModelClass })
  public groups!: Ref<GroupModelClass>[]

  public static async getDepartmentsByTeam(
    this: ReturnModelType<typeof DepartmentModelClass>,
    teamIds: Array<Types.ObjectId | string>
  ) {
    return this.find({ teams: { $in: teamIds } }).exec()
  }

  public static async getUserDepartments(
    this: ReturnModelType<typeof DepartmentModelClass>,
    userId: Types.ObjectId | string
  ) {
    return new Promise<Array<DepartmentModelClass>>((resolve, reject) => {
      ;(async () => {
        try {
          const teams = await TeamModel.getTeamsOfUser(userId)
          const departments = await this.find({ teams: { $in: teams } }).exec()

          return resolve(departments)
        } catch (err) {
          return reject(err)
        }
      })()
    })
  }

  public static async getDepartmentGroupsOfUser(
    this: ReturnModelType<typeof DepartmentModelClass>,
    userId: Types.ObjectId | string
  ) {
    const teams = await TeamModel.getTeamsOfUser(userId)
    const departments = await this.find({ teams: { $in: teams } })

    const hasAllGroups = _.some(departments, { allGroups: true })
    const hasPublicGroups = _.some(departments, { publicGroups: true })

    if (hasAllGroups) {
      return await GroupModel.getAllGroups()
    } else if (hasPublicGroups) {
      const publicGroups = await GroupModel.getAllPublicGroups()
      const mapped = _.flatMapDeep(departments, (department) => department.groups)

      let merged = _.concat(publicGroups as GroupModelClass[], mapped)
      merged = _.flattenDeep(merged)
      merged = _.uniqBy(merged, (i) => i?._id)

      return merged
    } else {
      return _.flattenDeep(departments.map((department) => department.groups))
    }
  }
}
