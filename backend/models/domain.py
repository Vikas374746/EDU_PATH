from enum import Enum

class SkillStatus(str, Enum):
    STRONG = "Strong"
    DEVELOPING = "Developing"
    WEAK = "Weak"
    MISSING = "Missing"

class ProficiencyLevel(str, Enum):
    ADVANCED = "Advanced"
    INTERMEDIATE = "Intermediate"
    NOVICE = "Novice"
    NONE = "None"

class ResourceType(str, Enum):
    VIDEO = "video"
    DOCUMENTATION = "documentation"
    GUIDE = "guide"

class RoadmapWeekStatus(str, Enum):
    ACTIVE = "active"
    LOCKED = "locked"
    COMPLETED = "completed"
    REMEDIATED = "remediated"

class TargetRole(str, Enum):
    DATA_ANALYST = "Data Analyst"
