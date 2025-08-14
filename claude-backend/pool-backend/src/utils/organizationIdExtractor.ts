// src/utils/organizationIdExtractor.ts
/**
 * 组织ID提取工具
 * 从多种来源获取 Claude 组织ID
 */

export interface OrganizationIdResult {
  organizationId: string | null;
  source: 'cookie' | 'url' | 'api' | 'default';
  confidence: 'high' | 'medium' | 'low';
  error?: string;
}

/**
 * 从 Cookie 字符串中提取组织ID
 */
export function extractOrgIdFromCookie(cookieString: string): OrganizationIdResult {
  try {
    // 查找 lastActiveOrg Cookie
    const cookies = cookieString.split('; ');
    const lastActiveOrgCookie = cookies.find(cookie => cookie.startsWith('lastActiveOrg='));
    
    if (lastActiveOrgCookie) {
      const orgId = lastActiveOrgCookie.split('=')[1];
      
      // 验证 UUID 格式
      if (orgId && isValidUUID(orgId)) {
        return {
          organizationId: orgId,
          source: 'cookie',
          confidence: 'high'
        };
      }
    }
    
    return {
      organizationId: null,
      source: 'cookie',
      confidence: 'low',
      error: 'lastActiveOrg cookie not found or invalid format'
    };
    
  } catch (error) {
    return {
      organizationId: null,
      source: 'cookie',
      confidence: 'low',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 从 Claude API URL 中提取组织ID
 */
export function extractOrgIdFromUrl(url: string): OrganizationIdResult {
  try {
    // 匹配 /organizations/{orgId}/ 格式
    const orgMatch = url.match(/\/organizations\/([a-f0-9-]{36})\//);
    
    if (orgMatch && orgMatch[1]) {
      const orgId = orgMatch[1];
      
      if (isValidUUID(orgId)) {
        return {
          organizationId: orgId,
          source: 'url',
          confidence: 'high'
        };
      }
    }
    
    // 尝试通过 URL 分割的方式
    const urlParts = url.split('/');
    const orgIndex = urlParts.indexOf('organizations');
    
    if (orgIndex !== -1 && urlParts[orgIndex + 1]) {
      const orgId = urlParts[orgIndex + 1];
      
      if (isValidUUID(orgId)) {
        return {
          organizationId: orgId,
          source: 'url',
          confidence: 'medium'
        };
      }
    }
    
    return {
      organizationId: null,
      source: 'url',
      confidence: 'low',
      error: 'Organization ID not found in URL'
    };
    
  } catch (error) {
    return {
      organizationId: null,
      source: 'url',
      confidence: 'low',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 通过 API 请求获取组织ID
 */
export async function extractOrgIdFromApi(
  sessionKey: string,
  baseUrl: string = 'https://claude.lqqmail.xyz'
): Promise<OrganizationIdResult> {
  try {
    // 尝试多个可能的 API 端点
    const endpoints = [
      '/api/auth/current_user',
      '/api/organizations',
      '/api/account',
      '/api/me'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Cookie': `sessionKey=${sessionKey}`,
            'Authorization': `Bearer ${sessionKey}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // 查找组织ID字段
          const orgId = findOrganizationIdInData(data);
          
          if (orgId) {
            return {
              organizationId: orgId,
              source: 'api',
              confidence: 'high'
            };
          }
        }
      } catch (error) {
        // 继续尝试下一个端点
        continue;
      }
    }
    
    return {
      organizationId: null,
      source: 'api',
      confidence: 'low',
      error: 'No organization ID found in API responses'
    };
    
  } catch (error) {
    return {
      organizationId: null,
      source: 'api',
      confidence: 'low',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 综合获取组织ID（按优先级尝试多种方法）
 */
export async function getOrganizationId(options: {
  sessionKey?: string;
  cookieString?: string;
  apiUrl?: string;
  baseUrl?: string;
}): Promise<OrganizationIdResult> {
  const { sessionKey, cookieString, apiUrl, baseUrl = 'https://claude.lqqmail.xyz' } = options;
  
  // 方法1: 从 Cookie 获取（最可靠）
  if (cookieString) {
    const cookieResult = extractOrgIdFromCookie(cookieString);
    if (cookieResult.organizationId && cookieResult.confidence === 'high') {
      return cookieResult;
    }
  }
  
  // 方法2: 从 API URL 获取
  if (apiUrl) {
    const urlResult = extractOrgIdFromUrl(apiUrl);
    if (urlResult.organizationId && urlResult.confidence === 'high') {
      return urlResult;
    }
  }
  
  // 方法3: 通过 API 请求获取
  if (sessionKey) {
    const apiResult = await extractOrgIdFromApi(sessionKey, baseUrl);
    if (apiResult.organizationId) {
      return apiResult;
    }
  }
  
  // 方法4: 返回默认值
  return {
    organizationId: '0cf4053c-2e11-46de-ab1c-c3e47b26e756', // 默认组织ID
    source: 'default',
    confidence: 'low',
    error: 'Using default organization ID'
  };
}

/**
 * 在数据对象中查找组织ID
 */
function findOrganizationIdInData(data: any): string | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  
  // 常见的组织ID字段名
  const orgFields = [
    'organization_id',
    'organization_uuid',
    'org_id',
    'org_uuid',
    'organizationId',
    'orgId'
  ];
  
  // 直接查找字段
  for (const field of orgFields) {
    if (data[field] && isValidUUID(data[field])) {
      return data[field];
    }
  }
  
  // 查找 organizations 数组
  if (Array.isArray(data.organizations) && data.organizations.length > 0) {
    const firstOrg = data.organizations[0];
    for (const field of ['uuid', 'id', 'organization_id']) {
      if (firstOrg[field] && isValidUUID(firstOrg[field])) {
        return firstOrg[field];
      }
    }
  }
  
  // 递归查找嵌套对象
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'object' && value !== null) {
      const result = findOrganizationIdInData(value);
      if (result) {
        return result;
      }
    }
  }
  
  return null;
}

/**
 * 验证是否为有效的 UUID 格式
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * 从浏览器请求头中提取 Cookie
 */
export function extractCookieFromHeaders(headers: Record<string, string>): string | null {
  const cookie = headers['cookie'] || headers['Cookie'];
  return cookie || null;
}

/**
 * 生成默认的组织ID（用于测试）
 */
export function generateDefaultOrganizationId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
