# 模板占位符编辑器

一个基于 Vue 3 + Element Plus 的智能文档占位符编辑工具。

## 功能特性

- 📄 支持 Word 文档上传和预览
- 🎯 手动选择文本添加占位符
- 🤖 AI 智能识别并生成占位符
- ✏️ 占位符管理（编辑、删除）
- ↩️ 撤销/重做操作
- 💾 导出带占位符的 Word 文档

## 技术栈

- Vue 3
- Element Plus
- Pinia (状态管理)
- Vue Router
- Docxtemplater (Word 文档处理)
- Mammoth (Word 文档预览)

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 使用说明

1. 上传 Word 文档
2. 在预览区域选择需要替换的文本
3. 点击"手动添加"或使用"AI 生成"自动识别占位符
4. 管理占位符列表
5. 下载带占位符的文档