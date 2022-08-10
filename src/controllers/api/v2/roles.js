import _ from 'lodash'
import permissions from '../../../permissions'
import emitter from '../../../emitter'
import apiUtils from '../apiUtils'
import { RoleModel, RoleOrderModel } from '../../../models'

const apiRoles = {}

apiRoles.create = async (req, res) => {
  let name = req.body.name
  if (!name) return apiUtils.sendApiError_InvalidPostData(res)

  name = name.trim()

  try {
    const role = await RoleModel.create({ name })
    if (!role) throw new Error('Invalid Role')

    let roleOrder = await RoleOrderModel.findOne({})
    if (!roleOrder) throw new Error('Invalid Role Order')

    roleOrder.order.push(role._id)

    roleOrder = await roleOrder.save()

    return apiUtils.sendApiSuccess(res, { role, roleOrder })
  } catch (e) {
    return apiUtils.sendApiError(res, 500, e.message)
  }
}

apiRoles.update = async (req, res) => {
  const _id = req.params.id
  const data = req.body
  if (!_id || !data) return apiUtils.sendApiError_InvalidPostData(res)

  const hierarchy = data.hierarchy ? data.hierarchy : false
  const cleaned = _.omit(data, ['_id', 'hierarchy'])
  const grants = permissions.buildGrants(cleaned)

  try {
    const role = await RoleModel.findOne({ _id: data._id })
    if (!role) throw new Error('Invalid Role')

    await role.updateGrantsAndHierarchy(grants, hierarchy)

    emitter.emit('$trudesk:roles:flush')

    return apiUtils.sendApiSuccess(res)
  } catch (e) {
    return apiUtils.sendApiError(res, 500, e.message)
  }
}

apiRoles.updateOrder = async (req, res) => {
  if (!req.body.roleOrder) return apiUtils.sendApiError_InvalidPostData(res)

  try {
    let order = await RoleOrderModel.getOrder()
    if (!order) {
      order = new RoleOrderModel({
        order: req.body.roleOrder
      })

      order = await order.save()
      emitter.emit('$trudesk:roles:flush')

      return apiUtils.sendApiSuccess(res, { roleOrder: order })
    } else {
      order = await order.updateOrder(req.body.roleOrder)

      emitter.emit('$trudesk:roles:flush')

      return apiUtils.sendApiSuccess(res, { roleOrder: order })
    }
  } catch (e) {
    return apiUtils.sendApiError(res, 500, e.message)
  }
}

apiRoles.delete = async (req, res) => {}

export default apiRoles
module.exports = apiRoles
