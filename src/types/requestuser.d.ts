import type { Types } from "mongoose"
import type { IRole, IRoleModel } from "../models/role"
import type { UserModelClass } from "../models/user"

export interface RequestUser extends UserModelClass {
  _id: Types.ObjectId
  role: IRoleModel | IRole
}