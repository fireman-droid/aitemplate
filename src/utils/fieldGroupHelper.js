/**
 * 字段分组辅助工具
 * 用于根据配置文件动态生成表单分组
 */

import fieldGroupsConfig from '@/data/fieldGroups.json'
import placeholderMapping from '@/data/placeholderMapping.json'

/**
 * 根据模板类型获取字段分组配置
 * @param {string} templateType - 模板类型，如 'lawsuit_template'
 * @returns {object} 分组配置
 */
export function getFieldGroups(templateType = 'lawsuit_template') {
  return fieldGroupsConfig[templateType] || null
}

/**
 * 根据分组配置和占位符列表，获取分组中的字段
 * @param {object} subgroup - 子分组配置
 * @param {array} placeholders - 所有占位符列表
 * @returns {array} 该分组的占位符列表
 */
export function getFieldsForSubgroup(subgroup, placeholders) {
  // 如果明确指定了 fields，直接使用
  if (subgroup.fields && subgroup.fields.length > 0) {
    return placeholders.filter(p => subgroup.fields.includes(p.name))
  }

  // 使用 prefix 匹配
  if (subgroup.prefix) {
    return placeholders.filter(p => {
      const matchesPrefix = p.name.startsWith(subgroup.prefix)
      
      // 排除特定前缀
      if (subgroup.excludePrefixes) {
        const isExcluded = subgroup.excludePrefixes.some(exclude => 
          p.name.startsWith(exclude)
        )
        return matchesPrefix && !isExcluded
      }
      
      return matchesPrefix
    })
  }

  // 使用正则模式匹配
  if (subgroup.prefixPattern) {
    const pattern = new RegExp(`^(${subgroup.prefixPattern})`)
    return placeholders.filter(p => pattern.test(p.name))
  }

  return []
}

/**
 * 检查是否有性别字段
 * @param {string} prefix - 前缀，如 'p_', 'd_'
 * @param {array} placeholders - 占位符列表
 * @returns {boolean}
 */
export function hasGenderFields(prefix, placeholders) {
  return placeholders.some(p => 
    p.name === `${prefix}gender_m` || p.name === `${prefix}gender_f`
  )
}

/**
 * 获取占位符的中文标签
 * @param {string} name - 占位符名称
 * @returns {string} 中文标签
 */
export function getPlaceholderLabel(name) {
  return placeholderMapping[name] || name
}

/**
 * 判断是否为选择框字段
 * @param {string} name - 占位符名称
 * @returns {boolean}
 */
export function isCheckboxField(name) {
  return name.includes('gender_') || 
         name.includes('_yes') || 
         name.includes('_no') ||
         name.includes('_has') ||
         name.includes('_none') ||
         name.includes('_understand') ||
         name.includes('_type_') ||
         name.includes('_own_') ||
         name.includes('_auth_') ||
         name.includes('_issue') ||
         name.includes('_claim_') ||
         name.includes('_registered') ||
         name.includes('_signed') ||
         name.includes('_sale') ||
         name.includes('_presale')
}

/**
 * 判断是否为大文本字段
 * @param {string} name - 占位符名称
 * @returns {boolean}
 */
export function isTextareaField(name) {
  return name.includes('_detail') ||
         name.includes('_content') ||
         name.includes('_reason') ||
         name.includes('_reasons') ||
         name.includes('_requirement') ||
         name.includes('_agreement') ||
         name.includes('_list') ||
         name.includes('_addr') ||
         name.includes('_address') ||
         name.includes('_location') ||
         name === 'facts_and_reasons' ||
         name === 'claim_content' ||
         name === 'other_request' ||
         name === 'evidence_list'
}

/**
 * 自动检测模板类型
 * @param {array} placeholders - 占位符列表
 * @returns {string} 模板类型
 */
export function detectTemplateType(placeholders) {
  // 根据占位符特征判断模板类型
  const hasLawsuitFields = placeholders.some(p => 
    p.name.startsWith('p_') || p.name.startsWith('d_') || p.name.includes('claim')
  )
  
  if (hasLawsuitFields) {
    return 'lawsuit_template'
  }
  
  // 默认返回通用模板
  return 'lawsuit_template'
}
