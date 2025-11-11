// 表单模板定义
export const formTemplates = {
  legal_divorce_case: {
    id: 'legal_divorce_case',
    name: '离婚诉讼案件',
    category: '法律文书',
    groups: [
      {
        groupTitle: '当事人信息',
        sections: [
          {
            title: '原告',
            fields: [
              { key: 'yuan_name', label: '姓名', type: 'text', required: true },
              { key: 'checkbox_yuan_male', label: '性别-男', type: 'checkbox-gender', group: 'yuan_gender' },
              { key: 'checkbox_yuan_female', label: '性别-女', type: 'checkbox-gender', group: 'yuan_gender' },
              { key: 'yuan_birth_year', label: '出生年', type: 'text', placeholder: '如：1990' },
              { key: 'yuan_birth_month', label: '出生月', type: 'text', placeholder: '如：1' },
              { key: 'yuan_birth_day', label: '出生日', type: 'text', placeholder: '如：1' },
              { key: 'yuan_ethnicity', label: '民族', type: 'text' },
              { key: 'yuan_work_unit', label: '工作单位', type: 'text' },
              { key: 'yuan_position', label: '职务', type: 'text' },
              { key: 'yuan_phone', label: '联系电话', type: 'tel' },
              { key: 'yuan_registered_address', label: '住所地（户籍所在地）', type: 'textarea' },
              { key: 'yuan_residence_address', label: '经常居住地', type: 'textarea' },
              { key: 'yuan_id_type', label: '证件类型', type: 'text' },
              { key: 'yuan_id_number', label: '证件号码', type: 'text' }
            ]
          },
          {
            title: '被告',
            fields: [
              { key: 'bei_name', label: '姓名', type: 'text', required: true },
              { key: 'checkbox_bei_male', label: '性别-男', type: 'checkbox-gender', group: 'bei_gender' },
              { key: 'checkbox_bei_female', label: '性别-女', type: 'checkbox-gender', group: 'bei_gender' },
              { key: 'bei_birth_year', label: '出生年', type: 'text', placeholder: '如：1990' },
              { key: 'bei_birth_month', label: '出生月', type: 'text', placeholder: '如：1' },
              { key: 'bei_birth_day', label: '出生日', type: 'text', placeholder: '如：1' },
              { key: 'bei_ethnicity', label: '民族', type: 'text' },
              { key: 'bei_work_unit', label: '工作单位', type: 'text' },
              { key: 'bei_position', label: '职务', type: 'text' },
              { key: 'bei_phone', label: '联系电话', type: 'tel' },
              { key: 'bei_registered_address', label: '住所地（户籍所在地）', type: 'textarea' },
              { key: 'bei_residence_address', label: '经常居住地', type: 'textarea' },
              { key: 'bei_id_type', label: '证件类型', type: 'text' },
              { key: 'bei_id_number', label: '证件号码', type: 'text' }
            ]
          }
        ]
      }
    ]
  },
  contract_agreement: {
    id: 'contract_agreement',
    name: '合同协议',
    category: '合同文书',
    sections: [
      {
        title: '甲方',
        fields: [
          { key: 'party_a_name', label: '名称', type: 'text', required: true },
          { key: 'party_a_legal_representative', label: '法定代表人', type: 'text' },
          { key: 'party_a_address', label: '地址', type: 'textarea' },
          { key: 'party_a_phone', label: '联系电话', type: 'tel' },
          { key: 'party_a_email', label: '电子邮箱', type: 'email' },
          { key: 'party_a_bank_account', label: '银行账号', type: 'text' },
          { key: 'party_a_tax_id', label: '纳税人识别号', type: 'text' }
        ]
      },
      {
        title: '乙方',
        fields: [
          { key: 'party_b_name', label: '名称', type: 'text', required: true },
          { key: 'party_b_legal_representative', label: '法定代表人', type: 'text' },
          { key: 'party_b_address', label: '地址', type: 'textarea' },
          { key: 'party_b_phone', label: '联系电话', type: 'tel' },
          { key: 'party_b_email', label: '电子邮箱', type: 'email' },
          { key: 'party_b_bank_account', label: '银行账号', type: 'text' },
          { key: 'party_b_tax_id', label: '纳税人识别号', type: 'text' }
        ]
      }
    ]
  }
}

// 获取所有分类
export function getCategories() {
  const categories = new Set()
  Object.values(formTemplates).forEach(template => {
    categories.add(template.category)
  })
  return Array.from(categories)
}

// 根据分类获取表单
export function getTemplatesByCategory(category) {
  return Object.values(formTemplates).filter(t => t.category === category)
}

// 获取表单的所有字段（扁平化）
export function getAllFields(template) {
  const fields = []
  if (template.groups) {
    // 新格式：groups -> sections -> fields
    template.groups.forEach(group => {
      group.sections.forEach(section => {
        fields.push(...section.fields)
      })
    })
  } else if (template.sections) {
    // 旧格式：sections -> fields
    template.sections.forEach(section => {
      fields.push(...section.fields)
    })
  } else if (template.fields) {
    // 最旧格式：直接fields
    fields.push(...template.fields)
  }
  return fields
}
