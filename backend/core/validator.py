def detect_cycle(courses):
    """
    DFS with three-color marking to find all cycles in the prerequisite graph.
    Returns a list of cycle paths (each path is a list of course codes).
    """
    color = {code: 0 for code in courses}  # 0=unvisited, 1=in-stack, 2=done
    cycles = []

    def dfs(node, path):
        color[node] = 1
        path.append(node)
        for req in courses.get(node, {}).get("req", []):
            if req not in courses:
                continue
            if color[req] == 1:
                cycle_start = path.index(req)
                cycles.append(path[cycle_start:] + [req])
            elif color[req] == 0:
                dfs(req, path)
        path.pop()
        color[node] = 2

    for code in courses:
        if color[code] == 0:
            dfs(code, [])

    return cycles


def detect_missing_prereqs(courses):
    """
    For each course in the selection, checks that all of its prerequisites
    are also present in the selection. A missing prerequisite means the DAG
    has a dangling edge. Kahn's Algorithm cannot produce a correct topological
    sort without a complete subgraph.
    """
    missing = []
    for code, info in courses.items():
        absent = [r for r in info.get("req", []) if r not in courses]
        if absent:
            missing.append({
                "course": code,
                "course_name": info["name"],
                "missing_prereqs": absent,
            })
    return missing
