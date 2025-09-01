/**
 * Swagger配置文件
 * Claude Pool Manager API文档配置
 */

import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Swagger配置选项
const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Claude Pool Manager API',
      version: '0.1.3',
      description: `
        Claude Pool Manager API 文档
        
        ## 功能概述
        - 管理Claude账号池
        - 提供随机和指定账号登录
        - 管理员账号管理功能
        - 使用统计和日志记录
        
        ## 认证方式
        - 管理员接口需要提供 admin_password
        - 用户接口无需认证
        
        ## 数据库
        - 使用MySQL存储账号和日志数据
        - 支持账号使用统计
        - 完整的操作日志记录
      `,
      contact: {
        name: 'Claude Pool Manager',
        url: 'https://github.com/f14XuanLv/fuclaude-pool-manager'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:8787',
        description: '开发环境'
      },
      {
        url: 'https://your-domain.com',
        description: '生产环境'
      }
    ],
    tags: [
      {
        name: 'System',
        description: '系统相关接口'
      },
      {
        name: 'User',
        description: '用户接口 - 获取邮箱列表和登录'
      },
      {
        name: 'Admin',
        description: '管理员接口 - 账号管理和统计'
      }
    ],
    components: {
      schemas: {
        // 通用响应
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: '请求是否成功'
            },
            message: {
              type: 'string',
              description: '响应消息'
            },
            data: {
              type: 'object',
              description: '响应数据'
            }
          }
        },
        
        // 错误响应
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: '错误信息'
            }
          }
        },
        
        // 邮箱列表响应
        EmailListResponse: {
          type: 'object',
          properties: {
            emails: {
              type: 'array',
              items: {
                type: 'string',
                format: 'email'
              },
              description: '可用邮箱列表'
            }
          }
        },
        
        // 登录请求
        LoginRequest: {
          type: 'object',
          properties: {
            mode: {
              type: 'string',
              enum: ['random', 'specific'],
              description: '登录模式：random(随机) 或 specific(指定)'
            },
            email: {
              type: 'string',
              format: 'email',
              description: '指定邮箱（mode为specific时必填）'
            },
            unique_name: {
              type: 'string',
              description: '唯一标识符（可选）'
            },
            expires_in: {
              type: 'integer',
              description: '令牌有效期（秒）'
            }
          },
          required: ['mode']
        },
        
        // 登录响应
        LoginResponse: {
          type: 'object',
          properties: {
            login_url: {
              type: 'string',
              format: 'uri',
              description: 'Claude登录链接'
            },
            warning: {
              type: 'string',
              description: '警告信息（可选）'
            }
          }
        },
        
        // 管理员请求基类
        AdminRequest: {
          type: 'object',
          properties: {
            admin_password: {
              type: 'string',
              description: '管理员密码'
            }
          },
          required: ['admin_password']
        },
        
        // 账号信息
        AccountInfo: {
          type: 'object',
          properties: {
            index: {
              type: 'integer',
              description: '序号'
            },
            email: {
              type: 'string',
              format: 'email',
              description: '邮箱地址'
            },
            sk_preview: {
              type: 'string',
              description: 'Session Key预览'
            },
            usage_count: {
              type: 'integer',
              description: '使用次数'
            },
            last_used_at: {
              type: 'string',
              format: 'date-time',
              description: '最后使用时间'
            },
            status: {
              type: 'integer',
              description: '账号状态：1-活跃，0-禁用'
            }
          }
        },
        
        // 添加账号请求
        AddAccountRequest: {
          allOf: [
            { $ref: '#/components/schemas/AdminRequest' },
            {
              type: 'object',
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  description: '邮箱地址'
                },
                sk: {
                  type: 'string',
                  description: 'Session Key'
                }
              },
              required: ['email', 'sk']
            }
          ]
        },
        
        // 健康检查响应
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'unhealthy'],
              description: '服务状态'
            },
            version: {
              type: 'string',
              description: '版本信息'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: '检查时间'
            },
            database: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  description: '数据库类型'
                },
                host: {
                  type: 'string',
                  description: '数据库主机'
                },
                database: {
                  type: 'string',
                  description: '数据库名称'
                },
                status: {
                  type: 'string',
                  enum: ['connected', 'disconnected'],
                  description: '连接状态'
                }
              }
            }
          }
        }
      }
    }
  },
  apis: [
    './src/server.ts',
    './src/routes/*.ts'
  ]
};

// 生成Swagger规范
const specs = swaggerJSDoc(options);

// 自定义Swagger UI配置
const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #8B55FC; }
    .swagger-ui .scheme-container { background: #f8f9fa; }
  `,
  customSiteTitle: 'Claude Pool Manager API',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    docExpansion: 'list'
  }
};

export {
  specs,
  swaggerUi,
  swaggerUiOptions
};
