"""
依赖关系解析服务
用于确定API的执行顺序
"""
from typing import List, Dict, Set, Optional
from collections import defaultdict, deque


class DependencyResolver:
    """依赖关系解析器"""
    
    @staticmethod
    def resolve_execution_order(
        api_configs: List[Dict],
        api_id_key: str = "api_id",
        depends_on_key: str = "depends_on"
    ) -> Dict:
        """
        解析API执行顺序
        
        Args:
            api_configs: API配置列表，每个配置包含api_id和depends_on
            api_id_key: API ID的键名
            depends_on_key: 依赖关系的键名
            
        Returns:
            包含排序结果和依赖信息的字典
        """
        # 构建依赖图
        graph: Dict[int, List[int]] = defaultdict(list)
        in_degree: Dict[int, int] = defaultdict(int)
        all_api_ids: Set[int] = set()
        
        for config in api_configs:
            api_id = config.get(api_id_key)
            if api_id is None:
                continue
            
            all_api_ids.add(api_id)
            depends_on = config.get(depends_on_key) or []
            
            if not isinstance(depends_on, list):
                depends_on = []
            
            for dep_id in depends_on:
                if dep_id in all_api_ids:
                    graph[dep_id].append(api_id)
                    in_degree[api_id] = in_degree.get(api_id, 0) + 1
            
            if api_id not in in_degree:
                in_degree[api_id] = 0
        
        # 拓扑排序
        ordered_apis: List[int] = []
        queue = deque([api_id for api_id in all_api_ids if in_degree[api_id] == 0])
        
        while queue:
            current = queue.popleft()
            ordered_apis.append(current)
            
            for neighbor in graph[current]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
        
        # 检查循环依赖
        has_circular = len(ordered_apis) < len(all_api_ids)
        circular_dependencies = None
        
        if has_circular:
            # 检测循环依赖
            circular_dependencies = DependencyResolver._detect_cycles(graph, all_api_ids)
        
        # 构建依赖映射
        dependencies: Dict[int, List[int]] = {}
        for config in api_configs:
            api_id = config.get(api_id_key)
            if api_id:
                dependencies[api_id] = config.get(depends_on_key) or []
        
        return {
            "ordered_apis": ordered_apis,
            "dependencies": dependencies,
            "has_circular_dependency": has_circular,
            "circular_dependencies": circular_dependencies
        }
    
    @staticmethod
    def _detect_cycles(graph: Dict[int, List[int]], all_nodes: Set[int]) -> List[List[int]]:
        """检测循环依赖"""
        cycles = []
        visited = set()
        rec_stack = set()
        path = []
        
        def dfs(node: int):
            if node in rec_stack:
                # 找到循环
                cycle_start = path.index(node)
                cycles.append(path[cycle_start:] + [node])
                return
            
            if node in visited:
                return
            
            visited.add(node)
            rec_stack.add(node)
            path.append(node)
            
            for neighbor in graph.get(node, []):
                dfs(neighbor)
            
            rec_stack.remove(node)
            path.pop()
        
        for node in all_nodes:
            if node not in visited:
                dfs(node)
        
        return cycles

