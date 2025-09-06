'use strict'

const { Op } = require('sequelize')
const logger = require('../utils/logger')
const errors = require('../constants/errors')
const { 
  User, 
  ActivationCode, 
  UserActivationBinding, 
  UserMembership,
  OperationLog,
  sequelize 
} = require('../models')

class EmailActivationService {
  
  /**
   * 邮箱激活码绑定
   * @param {Object} activationData - 激活数据
   * @param {string} activationData.email - 用户邮箱
   * @param {string} activationData.activationCode - 激活码
   * @param {string} activationData.ipAddress - IP地址
   * @param {string} activationData.userAgent - 用户代理
   */
  async activateByEmail(activationData) {
    const transaction = await sequelize.transaction()
    
    try {
      const { email, activationCode, ipAddress, userAgent } = activationData

      // 1. 查找用户
      const user = await User.findOne({
        where: { email },
        transaction
      })

      if (!user) {
        if (!transaction.finished) {
          await transaction.rollback()
        }
        return {
          success: false,
          code: errors.NOT_FOUND,
          message: '用户不存在，请先注册'
        }
      }

      // 2. 查找激活码
      const codeRecord = await ActivationCode.findOne({
        where: { 
          code: activationCode,
          status: 'unused'
        },
        transaction
      })

      if (!codeRecord) {
        if (!transaction.finished) {
          await transaction.rollback()
        }
        return {
          success: false,
          code: errors.INVALID_INPUT,
          message: '激活码无效或已被使用'
        }
      }

      // 3. 检查激活码是否已被绑定
      const existingBinding = await UserActivationBinding.findOne({
        where: { activation_code_id: codeRecord.id },
        transaction
      })

      if (existingBinding) {
        if (!transaction.finished) {
          await transaction.rollback()
        }
        return {
          success: false,
          code: errors.DUPLICATE_DATA,
          message: '该激活码已被使用'
        }
      }

      // 4. 计算时长
      const durationHours = this.calculateDuration(codeRecord.type, codeRecord.duration)
      const activatedAt = new Date()
      const serviceType = codeRecord.service_type || 'universal'

      // 5. 根据服务类型计算新的过期时间
      const expiryResult = await this.calculateNewExpiresAt(user.id, serviceType, durationHours, activatedAt, transaction)
      const { codeExpiresAt, membershipExpiresAt } = expiryResult

      // 6. 更新激活码状态，设置激活时间和过期时间（主数据）
      // 触发器会自动同步到 user_activation_bindings 表
      await codeRecord.update({
        status: 'used',
        used_count: codeRecord.used_count + 1,
        activated_at: activatedAt,
        expires_at: codeExpiresAt  // 激活码主表的过期时间
      }, { transaction })

      // 7. 创建用户激活绑定记录（初始数据，触发器会自动同步）
      await UserActivationBinding.create({
        user_id: user.id,
        activation_code_id: codeRecord.id,
        activation_code: activationCode,
        duration_hours: durationHours,
        activated_at: activatedAt,
        expires_at: codeExpiresAt,  // 初始值，触发器会确保与主表一致
        ip_address: ipAddress,
        user_agent: userAgent,
        service_type: serviceType   // 添加服务类型
      }, { transaction })

      // 8. 更新或创建用户会员状态（根据服务类型）
      await this.updateUserMembership(user.id, serviceType, durationHours, membershipExpiresAt, activatedAt, transaction)

      // 8. 记录操作日志
      await OperationLog.create({
        user_id: user.id,
        operation_type: 'activation_bind',
        operation_desc: `激活码绑定成功: ${activationCode}`,
        ip_address: ipAddress,
        user_agent: userAgent
      }, { transaction })

      // 在提交前获取更新后的会员状态（该服务类型的）
      const updatedMembership = await UserMembership.findOne({
        where: { 
          user_id: user.id,
          service_type: serviceType 
        },
        transaction
      })

      await transaction.commit()

      logger.info(`激活码绑定成功: ${email} - ${activationCode}`)

      return {
        success: true,
        code: errors.SUCCESS,
        message: '激活码绑定成功',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username
          },
          activation: {
            code: activationCode,
            type: codeRecord.type,
            duration_hours: durationHours,
            activated_at: activatedAt,
            expires_at: codeExpiresAt  // 使用激活码主表的过期时间
          },
          membership: {
            status: updatedMembership.status,
            total_duration_hours: updatedMembership.total_duration_hours,
            remaining_duration_hours: updatedMembership.remaining_duration_hours,
            membership_start_at: updatedMembership.membership_start_at,
            membership_expires_at: updatedMembership.membership_expires_at,
            activation_count: updatedMembership.activation_count
          }
        }
      }

    } catch (error) {
      // 检查事务状态，只有在未完成时才回滚
      if (!transaction.finished) {
        await transaction.rollback()
      }
      logger.error('激活码绑定失败:', error)
      return {
        success: false,
        code: errors.INTERNAL_ERROR,
        message: '激活码绑定失败，请稍后重试'
      }
    }
  }

  /**
   * 获取用户会员状态
   */
  async getUserMembershipStatus(email) {
    try {
      const user = await User.findOne({
        where: { email },
        include: [
          {
            model: UserMembership,
            as: 'memberships',  // 获取所有服务类型的会员状态
            required: false
          },
          {
            model: UserActivationBinding,
            as: 'activationBindings',
            include: [{
              model: ActivationCode,
              as: 'activationCode'
            }],
            order: [['activated_at', 'DESC']]
          }
        ]
      })

      if (!user) {
        return {
          success: false,
          code: errors.NOT_FOUND,
          message: '用户不存在'
        }
      }

      // 整理多服务类型的会员状态
      const membershipsByType = {}
      if (user.memberships) {
        user.memberships.forEach(membership => {
          membershipsByType[membership.service_type] = membership
        })
      }

      // 为了向后兼容，返回主要的会员状态（universal或第一个有效的）
      const primaryMembership = membershipsByType['universal'] || 
                               user.memberships?.[0] || 
                               {
                                 status: 'inactive',
                                 total_duration_hours: 0,
                                 remaining_duration_hours: 0
                               }

      return {
        success: true,
        code: errors.SUCCESS,
        message: '获取会员状态成功',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username
          },
          membership: primaryMembership,
          memberships: membershipsByType,  // 新增：所有服务类型的会员状态
          activations: user.activationBindings.map(binding => ({
            code: binding.activation_code,
            type: binding.activationCode.type,
            service_type: binding.activationCode.service_type, // 添加服务类型
            duration_hours: binding.duration_hours,
            activated_at: binding.activated_at,
            expires_at: binding.expires_at,
            status: binding.status
          }))
        }
      }

    } catch (error) {
      logger.error('获取用户会员状态失败:', error)
      return {
        success: false,
        code: errors.INTERNAL_ERROR,
        message: '获取会员状态失败'
      }
    }
  }

  /**
   * 获取完整用户信息
   */
  async getCompleteUserInfo(email) {
    try {
      const user = await User.findOne({
        where: { email },
        include: [
          {
            model: UserMembership,
            as: 'membership'
          },
          {
            model: UserActivationBinding,
            as: 'activationBindings',
            include: [{
              model: ActivationCode,
              as: 'activationCode'
            }],
            order: [['activated_at', 'DESC']]
          }
        ]
      })

      if (!user) {
        return {
          success: false,
          code: errors.NOT_FOUND,
          message: '用户不存在'
        }
      }

      // 计算统计信息
      const activations = user.activationBindings || []
      const totalActivations = activations.length
      const totalHoursGained = activations.reduce((sum, binding) => sum + (binding.duration_hours || 0), 0)

      // 计算首次激活以来的天数
      let daysSinceFirstActivation = 0
      if (activations.length > 0) {
        const firstActivation = activations[activations.length - 1] // 最后一个是最早的
        const firstDate = new Date(firstActivation.activated_at)
        const now = new Date()
        daysSinceFirstActivation = Math.floor((now - firstDate) / (1000 * 60 * 60 * 24))
      }

      // 判断是否为高级用户（激活次数 >= 3 或总时长 >= 72小时）
      const isPremiumUser = totalActivations >= 3 || totalHoursGained >= 72

      // 格式化会员信息
      const membership = user.membership || {
        status: 'inactive',
        total_duration_hours: 0,
        remaining_duration_hours: 0,
        membership_start_at: null,
        membership_expires_at: null,
        activation_count: 0
      }

      // 计算剩余时间（小时）
      let remainingHours = 0
      if (membership.membership_expires_at) {
        const now = new Date()
        const expiresAt = new Date(membership.membership_expires_at)
        if (expiresAt > now) {
          remainingHours = Math.ceil((expiresAt - now) / (1000 * 60 * 60))
        }
      }

      return {
        success: true,
        code: errors.SUCCESS,
        message: '获取完整用户信息成功',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            avatar: user.avatar,
            created_at: user.created_at
          },
          membership: {
            status: membership.status,
            total_duration_hours: membership.total_duration_hours || 0,
            remaining_duration_hours: membership.remaining_duration_hours || 0,
            remaining_hours_calculated: remainingHours, // 实时计算的剩余小时
            membership_start_at: membership.membership_start_at,
            membership_expires_at: membership.membership_expires_at,
            activation_count: membership.activation_count || 0,
            last_activation_at: membership.last_activation_at
          },
          activations: activations.map(binding => ({
            id: binding.id,
            code: binding.activation_code,
            type: binding.activationCode?.type || 'unknown',
            duration_hours: binding.duration_hours,
            activated_at: binding.activated_at,
            expires_at: binding.activationCode?.expires_at || binding.expires_at, // 优先使用主表的过期时间
            status: binding.status,
            ip_address: binding.ip_address
          })),
          statistics: {
            total_activations: totalActivations,
            total_hours_gained: totalHoursGained,
            days_since_first_activation: daysSinceFirstActivation,
            is_premium_user: isPremiumUser,
            average_hours_per_activation: totalActivations > 0 ? Math.round(totalHoursGained / totalActivations * 10) / 10 : 0
          }
        }
      }

    } catch (error) {
      logger.error('获取完整用户信息失败:', error)
      return {
        success: false,
        code: errors.INTERNAL_ERROR,
        message: '服务器内部错误'
      }
    }
  }

  /**
   * 计算激活码时长
   */
  calculateDuration(type, customDuration) {
    if (customDuration) {
      return customDuration
    }

    const durations = {
      'daily': 24,
      'weekly': 24 * 7,
      'monthly': 24 * 30,
      'yearly': 24 * 365,
      'permanent': 24 * 365 * 100 // 100年
    }

    return durations[type] || 24
  }

  /**
   * 计算新的过期时间（多激活码叠加策略）
   * @param {Date|null} currentExpiresAt - 当前会员过期时间
   * @param {number} durationHours - 要添加的小时数
   * @param {Date} activatedAt - 激活时间
   * @returns {Object} 包含激活码过期时间和会员过期时间的对象
   */
  /**
   * 计算新的过期时间 - 支持多服务类型
   * @param {number} userId - 用户ID
   * @param {string} serviceType - 服务类型
   * @param {number} durationHours - 持续时间（小时）
   * @param {Date} activatedAt - 激活时间
   * @param {Transaction} transaction - 数据库事务
   */
  async calculateNewExpiresAt(userId, serviceType, durationHours, activatedAt, transaction) {
    const now = new Date()

    // 激活码本身的过期时间（固定：激活时间 + 持续时间）
    const codeExpiresAt = new Date(activatedAt.getTime() + durationHours * 60 * 60 * 1000)

    // 查找该用户特定服务类型的现有会员状态
    const existingMembership = await UserMembership.findOne({
      where: { 
        user_id: userId,
        service_type: serviceType 
      },
      transaction
    })

    let membershipExpiresAt

    if (!existingMembership || !existingMembership.membership_expires_at) {
      // 首次激活该服务类型：会员过期时间 = 激活码过期时间
      membershipExpiresAt = codeExpiresAt
    } else {
      const currentExpires = new Date(existingMembership.membership_expires_at)

      if (currentExpires > now) {
        // 同一服务类型且当前会员未过期：在现有过期时间基础上叠加时间
        membershipExpiresAt = new Date(currentExpires.getTime() + durationHours * 60 * 60 * 1000)
      } else {
        // 同一服务类型但当前会员已过期：从激活时间开始重新计算
        membershipExpiresAt = codeExpiresAt
      }
    }

    return {
      codeExpiresAt,      // 激活码的过期时间（用于记录）
      membershipExpiresAt // 会员的过期时间（用于权限判断）
    }
  }

  /**
   * 同步激活码和绑定表的过期时间
   * @param {string} activationCode - 激活码
   * @param {Transaction} transaction - 数据库事务
   */
  async syncActivationCodeExpiry(activationCode, transaction) {
    // 获取激活码主表的过期时间
    const codeRecord = await ActivationCode.findOne({
      where: { code: activationCode },
      transaction
    })

    if (codeRecord && codeRecord.expires_at) {
      // 更新所有相关的用户绑定记录
      await UserActivationBinding.update(
        { expires_at: codeRecord.expires_at },
        {
          where: { activation_code: activationCode },
          transaction
        }
      )
    }
  }

  /**
   * 更新用户会员状态 - 支持多服务类型
   * @param {number} userId - 用户ID
   * @param {string} serviceType - 服务类型
   * @param {number} addedHours - 新增的小时数
   * @param {Date} newExpiresAt - 新的过期时间
   * @param {Date} activatedAt - 激活时间
   * @param {Transaction} transaction - 数据库事务
   */
  async updateUserMembership(userId, serviceType, addedHours, newExpiresAt, activatedAt, transaction) {
    // 查找该用户特定服务类型的会员记录
    let membership = await UserMembership.findOne({
      where: { 
        user_id: userId,
        service_type: serviceType 
      },
      transaction
    })

    const now = new Date()

    if (!membership) {
      // 首次激活该服务类型：创建新的会员记录
      const remainingHours = Math.ceil((newExpiresAt - now) / (1000 * 60 * 60))

      membership = await UserMembership.create({
        user_id: userId,
        service_type: serviceType,
        total_duration_hours: addedHours,
        remaining_duration_hours: Math.max(0, remainingHours),
        membership_start_at: activatedAt,
        membership_expires_at: newExpiresAt,
        status: 'active',
        last_activation_at: activatedAt,
        activation_count: 1
      }, { transaction })
    } else {
      // 后续激活同一服务类型：更新现有会员记录（时间叠加）
      const newTotalHours = membership.total_duration_hours + addedHours
      const remainingHours = Math.ceil((newExpiresAt - now) / (1000 * 60 * 60))

      await membership.update({
        total_duration_hours: newTotalHours,
        remaining_duration_hours: Math.max(0, remainingHours),
        membership_expires_at: newExpiresAt,
        status: 'active',
        last_activation_at: activatedAt,
        activation_count: membership.activation_count + 1
      }, { transaction })
    }

    return membership
  }

  /**
   * 验证用户会员状态
   */
  async validateMembership(email) {
    try {
      const user = await User.findOne({
        where: { email },
        include: [{
          model: UserMembership,
          as: 'membership'
        }]
      })

      if (!user || !user.membership) {
        return {
          success: false,
          code: errors.NOT_FOUND,
          message: '用户无有效会员'
        }
      }

      const membership = user.membership
      const now = new Date()

      // 检查是否过期
      if (membership.membership_expires_at < now) {
        await membership.update({ status: 'expired' })
        return {
          success: false,
          code: errors.EXPIRED,
          message: '会员已过期'
        }
      }

      return {
        success: true,
        code: errors.SUCCESS,
        message: '会员有效',
        data: {
          user: {
            id: user.id,
            email: user.email
          },
          membership: {
            status: membership.status,
            expires_at: membership.membership_expires_at,
            remaining_hours: Math.ceil((membership.membership_expires_at - now) / (1000 * 60 * 60))
          }
        }
      }

    } catch (error) {
      logger.error('验证会员状态失败:', error)
      return {
        success: false,
        code: errors.INTERNAL_ERROR,
        message: '验证失败'
      }
    }
  }
}

module.exports = EmailActivationService
