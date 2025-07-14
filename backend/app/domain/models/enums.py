from enum import Enum

# User roles
class UserRole(str, Enum):
    ADMIN = "admin"
    QC_MANAGER = "qc_manager"
    SHIFT_CHEMIST = "shift_chemist"
    CHEMIST = "chemist"
    OTHER = "other"

# --- Sample ---

# Sample types
class SampleType(str, Enum):
    WHITE_SUGAR = "white_sugar"
    BROWN_SUGAR = "brown_sugar"
    RAW_SUGAR = "raw_sugar"
    FINE_LIQUOR = "fine_liquor"
    POLISH_LIQUOR = "polish_liquor"
    EVAPORATOR_LIQUOR = "evaporator_liquor"
    SAT_OUT = "sat_out"
    CONDENSATE = "condensate"
    COOLING_WATER = "cooling_water"
    WASH_WATER = "wash_water"

# Test parameters
class TestParameter(str, Enum):
    PH = "pH"
    TDS = "tds"
    COLOUR = "colour"
    DENSITY = "density"
    TURBIDITY = "turbidity"
    TSS = "tss"
    MINUTE_SUGAR = "minute_sugar"
    ASH = "ash"
    SEDIMENT = "sediment"
    STARCH = "starch"
    PARTICLE_SIZE = "particle_size"
    CAO = "cao"
    PURITY = "purity"
    MOISTURE = "moisture"
    SUCROSE = "sucrose"

# Unit types
class UnitType(str, Enum):
    PERCENT = "%"
    GRAMS = "g"
    MILLIGRAMS_PER_KILOGRAM = "mg/kg"
    PARTS_PER_MILLION = "ppm"
    MILLILITERS = "mL"
    MICROMETERS = "µm"
    MILLIMETERS = "mm"
    MILLIGRAMS_PER_LITER = "mg/L"
    ICUMSA_UNIT = "IU"
    GRAMS_PER_CUBIC_METER = "g/m³"
    GRAMS_PER_CUBIC_CENTIMETER = "g/cm³"
    NEPHELOMETRIC_TURBIDITY_UNIT = "NTU"
    NANOMETERS = "nm"
    PH_UNIT = "pH"
    DIMENSIONLESS = "dimensionless"
    OTHER = "other"

# --- Tags ---

# Tags for attachments
class AttachmentTag(str, Enum):
    LAB_SHEET = "lab_sheet"
    MICROSCOPE = "microscope"
    SCAN_RESULT = "scan_result"
    DEVICE_OUTPUT = "device_output"
    IMAGE = "image"
    REPORT = "report"
    CERTIFICATE = "certificate"
    RAW_SCAN = "raw_scan"
    OTHER = "other"

# Attachment types
class AttachmentType(str, Enum):
    PDF = "pdf"
    IMAGE = "image"
    DOCUMENT = "document"
    OTHER = "other"

# Tags for auto-tagging
class AutoTag(str, Enum):
    MICROSCOPE = "microscope"
    LAB_SHEET = "lab_sheet"
    RAW_SCAN = "raw_scan"
    CERTIFICATE = "certificate"
    REPORT = "report"
    IMAGE = "image"

# --- Tests ---

# Test statuses
class TestStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
