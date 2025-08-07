/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface ActivationRequest {
  /**
   * 激活码
   * @example "ABC123-DEF456-GHI789"
   */
  code: string;
  /**
   * 设备ID
   * @example "device-12345"
   */
  deviceId: string;
  /**
   * 用户代理
   * @example "MyApp/1.0"
   */
  userAgent?: string;
  /**
   * IP地址
   * @example "192.168.1.100"
   */
  ipAddress?: string;
}

export interface ActivationResponse {
  /**
   * 状态码 (0=成功, 其他=失败)
   * @example 0
   */
  status?: number;
  /**
   * 响应消息
   * @example "激活成功"
   */
  message?: string;
  /**
   * 授权文件
   * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   */
  license?: string;
  /**
   * 过期时间戳
   * @example 1640995200000
   */
  expiresAt?: number;
  codeInfo?: {
    /** @example "daily" */
    type?: string;
    /** @example 0 */
    remainingDevices?: number;
  };
}

export interface ValidationRequest {
  /**
   * 授权文件
   * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   */
  license: string;
  /**
   * 设备ID
   * @example "device-12345"
   */
  deviceId: string;
}

export interface ValidationResponse {
  /**
   * 状态码 (0=成功, 其他=失败)
   * @example 0
   */
  status?: number;
  /**
   * 是否有效
   * @example true
   */
  valid?: boolean;
  /**
   * 验证消息
   * @example "授权有效"
   */
  message?: string;
  /**
   * 过期时间戳
   * @example 1640995200000
   */
  expiresAt?: number;
}

export interface GenerateCodesRequest {
  /**
   * 激活码类型
   * @example "daily"
   */
  type: "daily" | "weekly" | "monthly" | "yearly" | "permanent";
  /**
   * 持续时间（小时）
   * @example 24
   */
  duration?: number;
  /**
   * 最大设备数
   * @default 1
   * @example 1
   */
  maxDevices?: number;
  /**
   * 生成数量
   * @min 1
   * @max 1000
   * @example 10
   */
  batchSize: number;
  /**
   * 描述
   * @example "测试激活码"
   */
  description?: string;
  /**
   * 权限列表（增强模式）
   * @example ["basic","premium"]
   */
  permissions?: string[];
  /**
   * 是否使用增强模式
   * @example false
   */
  enhanced?: boolean;
  /**
   * 优先级（增强模式）
   * @min 1
   * @max 10
   * @example 5
   */
  priority?: number;
  /**
   * 标签
   * @example ["test","demo"]
   */
  tags?: string[];
}

export interface GenerateCodesResponse {
  /**
   * 状态码 (0=成功, 其他=失败)
   * @example 0
   */
  status?: number;
  /**
   * 生成的激活码列表
   * @example ["ABC123-DEF456-GHI789","XYZ789-UVW456-RST123"]
   */
  codes?: string[];
  /**
   * 批次ID
   * @example "BATCH_20231201_A1B2C3D4"
   */
  batchId?: string;
  summary?: {
    /** @example 10 */
    total?: number;
    /** @example "daily" */
    type?: string;
    /** @example ["basic"] */
    permissions?: string[];
    /** @example 1640995200000 */
    expiresAt?: number;
  };
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "http://localhost:8888",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title License Server API
 * @version 1.0.0
 * @baseUrl http://localhost:8888
 *
 * Node.js License Server API Documentation
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  v1 = {
    /**
     * No description
     *
     * @tags 激活管理
     * @name ActivateCreate
     * @summary 设备激活
     * @request POST:/v1/activate
     */
    activateCreate: (data: ActivationRequest, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/activate`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags 激活管理
     * @name ValidateCreate
     * @summary 授权验证
     * @request POST:/v1/validate
     */
    validateCreate: (
      data: {
        deviceId: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/validate`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags 管理员接口
     * @name AdminStatsList
     * @summary 获取激活码统计数据
     * @request GET:/v1/admin/stats
     */
    adminStatsList: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example 0 */
          status?: number;
          /** @example "获取统计数据成功" */
          message?: string;
          data?: {
            overview?: {
              /** 激活码总数 */
              totalCodes?: number;
              /** 未使用激活码数 */
              unusedCodes?: number;
              /** 已使用激活码数 */
              usedCodes?: number;
              /** 过期激活码数 */
              expiredCodes?: number;
              /** 暂停激活码数 */
              suspendedCodes?: number;
              /** 活跃设备绑定数 */
              activeDeviceBindings?: number;
            };
            /** 激活码类型分布 */
            typeDistribution?: any[];
            /** 激活码状态分布 */
            statusDistribution?: any[];
            /** 最近7天激活趋势 */
            activationTrend?: any[];
          };
          meta?: {
            /** 是否来自缓存 */
            cached?: boolean;
            /** 响应时间(ms) */
            responseTime?: number;
            /** 数据源 */
            dataSource?: string;
          };
        },
        any
      >({
        path: `/v1/admin/stats`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags 管理员接口
     * @name AdminCodesList
     * @summary 获取激活码列表
     * @request GET:/v1/admin/codes
     */
    adminCodesList: (
      query?: {
        /** 页码 */
        page?: number;
        /** 每页数量 */
        limit?: number;
        /** 状态筛选 */
        status?:
          | "unused"
          | "used"
          | "activated"
          | "expired"
          | "suspended"
          | "disabled";
        /** 类型筛选 */
        type?: string;
        /** 搜索关键词 */
        search?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/admin/codes`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags 管理员接口
     * @name AdminCodesDetail
     * @summary 获取激活码详情
     * @request GET:/v1/admin/codes/{code}
     */
    adminCodesDetail: (code: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/admin/codes/${code}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags 管理员接口
     * @name AdminCodesDelete
     * @summary 删除激活码
     * @request DELETE:/v1/admin/codes/{code}
     */
    adminCodesDelete: (code: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/admin/codes/${code}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags 管理员接口
     * @name AdminGenerateCodesCreate
     * @summary 批量生成激活码
     * @request POST:/v1/admin/generate-codes
     */
    adminGenerateCodesCreate: (
      data: {
        /**
         * 激活码类型
         * @example "monthly"
         */
        type: "daily" | "weekly" | "monthly" | "yearly" | "permanent";
        /**
         * 生成数量
         * @min 1
         * @max 10000
         * @example 100
         */
        batchSize: number;
        /**
         * 持续时间（小时），permanent类型可不填
         * @min 1
         * @example 720
         */
        duration?: number;
        /**
         * 每个激活码最大设备数
         * @min 1
         * @max 100
         * @default 1
         */
        maxDevices?: number;
        /**
         * 批次描述
         * @maxLength 500
         */
        description?: string;
        /** 标签列表 */
        tags?: string[];
        /** 权限列表 */
        permissions?: string[];
        /**
         * 是否增强模式
         * @default false
         */
        enhanced?: boolean;
        /**
         * 优先级
         * @min 1
         * @max 10
         * @default 5
         */
        priority?: number;
        /** 创建者 */
        createdBy?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example 0 */
          status?: number;
          /** @example "激活码生成成功" */
          message?: string;
          data?: {
            /** @example "BATCH_ABC123_DEF456" */
            batchId?: string;
            /** @example ["CODE-1234-ABCD","CODE-5678-EFGH"] */
            codes?: string[];
          };
        },
        void
      >({
        path: `/v1/admin/generate-codes`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags 管理员接口
     * @name AdminCodesSuspendCreate
     * @summary 暂停激活码
     * @request POST:/v1/admin/codes/{code}/suspend
     */
    adminCodesSuspendCreate: (
      code: string,
      data: {
        /** 暂停原因 */
        reason?: string;
        /** 操作者 */
        suspendedBy?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/admin/codes/${code}/suspend`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags 管理员接口
     * @name AdminCodesResumeCreate
     * @summary 恢复激活码
     * @request POST:/v1/admin/codes/{code}/resume
     */
    adminCodesResumeCreate: (code: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/admin/codes/${code}/resume`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags 管理员接口
     * @name AdminChartDataList
     * @summary 获取图表数据
     * @request GET:/v1/admin/chart-data
     */
    adminChartDataList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/admin/chart-data`,
        method: "GET",
        ...params,
      }),
  };
}
