# API 文档

本目录包含导出的 Swagger/OpenAPI 文档。

## 文件说明

- `swagger.json`: OpenAPI 3.0 格式的 JSON 文档
- `swagger.yaml`: OpenAPI 3.0 格式的 YAML 文档

## 生成文档

运行以下命令生成文档：

```bash
cd backend
python scripts/export_swagger.py
```

## 在线文档

启动服务器后，可以通过以下地址访问在线文档：

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 使用导出的文档

### 导入到 Postman

1. 打开 Postman
2. 点击 Import
3. 选择 `swagger.json` 或 `swagger.yaml` 文件
4. 所有接口将自动导入

### 导入到其他工具

- **Swagger Editor**: https://editor.swagger.io/
- **Insomnia**: 支持导入 OpenAPI 文档
- **API Blueprint**: 可以转换格式后使用

## 文档更新

当添加新的接口或修改现有接口时，记得重新运行导出脚本更新文档。

