"""
导出 Swagger/OpenAPI 文档脚本
生成 JSON 和 YAML 格式的 API 文档
"""
import sys
import os
import json
import yaml

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app

def export_swagger():
    """导出 Swagger 文档"""
    # 获取 OpenAPI schema
    openapi_schema = app.openapi()
    
    # 导出目录
    export_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs")
    os.makedirs(export_dir, exist_ok=True)
    
    # 导出 JSON 格式
    json_path = os.path.join(export_dir, "swagger.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2, ensure_ascii=False)
    print(f"✅ Swagger JSON 文档已导出: {json_path}")
    
    # 导出 YAML 格式
    yaml_path = os.path.join(export_dir, "swagger.yaml")
    with open(yaml_path, "w", encoding="utf-8") as f:
        yaml.dump(openapi_schema, f, allow_unicode=True, sort_keys=False)
    print(f"✅ Swagger YAML 文档已导出: {yaml_path}")
    
    # 打印统计信息
    print("\n📊 API 统计:")
    paths = openapi_schema.get("paths", {})
    total_endpoints = sum(len(methods) for methods in paths.values() if isinstance(methods, dict))
    print(f"   - 总接口数: {total_endpoints}")
    print(f"   - 路径数: {len(paths)}")
    
    # 按标签分组统计
    tags = {}
    for path, methods in paths.items():
        if isinstance(methods, dict):
            for method, details in methods.items():
                if isinstance(details, dict):
                    endpoint_tags = details.get("tags", ["未分类"])
                    for tag in endpoint_tags:
                        tags[tag] = tags.get(tag, 0) + 1
    
    print(f"   - 标签数: {len(tags)}")
    print("\n📋 标签统计:")
    for tag, count in sorted(tags.items()):
        print(f"   - {tag}: {count} 个接口")
    
    print(f"\n🌐 在线文档地址:")
    print(f"   - Swagger UI: http://localhost:8000/docs")
    print(f"   - ReDoc: http://localhost:8000/redoc")
    print(f"   - OpenAPI JSON: http://localhost:8000/openapi.json")
    
    return True

if __name__ == "__main__":
    print("开始导出 Swagger 文档...")
    print("=" * 50)
    success = export_swagger()
    print("=" * 50)
    if success:
        print("✅ 导出完成！")
    else:
        print("❌ 导出失败！")
    sys.exit(0 if success else 1)

