# 调试指南

## 问题：上传文件后不跳转到编辑界面

### 调试步骤

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **打开浏览器控制台**
   - 按 F12 打开开发者工具
   - 切换到 Console 标签

3. **上传文件并观察日志**
   
   上传文件时，你应该看到以下日志：
   ```
   [FileUploader] 文件选择: xxx.docx
   [FileUploader] 验证通过，触发 file-selected 事件
   === 开始上传文件 ===
   文件名: xxx.docx
   文件类型: application/vnd.openxmlformats-officedocument.wordprocessingml.document
   文件大小: xxxxx
   [Store] 开始上传模板
   [Store] 检测到内容类型: document
   [Store] 文件读取完成，内容长度: xxxx
   [Store] ArrayBuffer 大小: xxxx
   [Store] 模板设置完成: xxx.docx
   上传成功，currentTemplate: {对象信息}
   ```

4. **检查调试信息面板**
   
   在上传区域下方，你会看到调试信息：
   - currentTemplate: 应该显示 "已设置 ✓"
   - isLoading: 应该显示 "空闲"
   - error: 应该显示 "无"

5. **测试 Store 功能**
   
   点击"测试 Store"按钮，如果界面切换到编辑模式，说明 Store 本身工作正常，问题在于文件上传流程。

### 可能的问题

1. **文件类型验证失败**
   - 检查控制台是否有 "[FileService] 文件类型不匹配" 的日志
   - 确认上传的是 .doc 或 .docx 文件

2. **文件读取失败**
   - 检查是否有 "[Store] 上传失败" 的错误日志
   - 查看具体的错误信息

3. **Mammoth 解析失败**
   - Word 文档可能损坏或格式不支持
   - 尝试使用不同的 Word 文档

4. **Store 响应性问题**
   - 如果"测试 Store"按钮能切换界面，但上传不能，说明是上传流程的问题
   - 检查 handleFileSelected 函数是否被正确调用

### 解决方案

如果发现具体问题，请告诉我控制台的错误信息，我会帮你修复。

### 临时解决方案

如果急需使用，可以：
1. 点击"测试 Store"按钮进入编辑模式
2. 手动复制粘贴文档内容到编辑器中
