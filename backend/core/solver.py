from collections import deque


def solve(courses):
    """
    Modified Kahn's Algorithm: Groups courses by semester while enforcing 
    Odd/Even constraints. A course with an odd 'semester' value in JSON 
    can only be placed in a calculated Odd semester (1, 3, 5...).
    """
    in_degree = {code: 0 for code in courses}
    dependents = {code: [] for code in courses}

    for code, info in courses.items():
        for req in info.get("req", []):
            if req in courses:
                in_degree[code] += 1
                dependents[req].append(code)

    # available_pool contains courses with 0 in-degree waiting to be scheduled
    available_pool = [code for code, deg in in_degree.items() if deg == 0]
    semesters = []
    processed_count = 0
    total_courses = len(courses)

    # Safety limit to prevent infinite loops (e.g. if parity makes it impossible)
    max_semesters = total_courses * 2
    
    while processed_count < total_courses and len(semesters) < max_semesters:
        current_semester_num = len(semesters) + 1
        current_semester_list = []
        waiting_for_next_parity = []
        newly_available = []

        for code in available_pool:
            info = courses[code]
            # Parity check: (Original Semester % 2) must match (Calculated Semester % 2)
            original_sem = info.get("semester", 1)
            if (original_sem % 2) == (current_semester_num % 2):
                current_semester_list.append({
                    "code": code,
                    "name": info["name"],
                    "sks": info.get("sks", 0),
                    "original_semester": original_sem
                })
                processed_count += 1
                for dependent in dependents[code]:
                    in_degree[dependent] -= 1
                    if in_degree[dependent] == 0:
                        newly_available.append(dependent)
            else:
                waiting_for_next_parity.append(code)

        # We append the semester even if empty to advance the semester count/parity
        semesters.append(current_semester_list)
        available_pool = waiting_for_next_parity + newly_available

    if processed_count != total_courses:
        raise ValueError("Could not solve schedule. Possible cycle or parity deadlock.")

    return semesters
