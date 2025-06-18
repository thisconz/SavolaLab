# Calculates the pH value from the raw value.
def calculate_ph(raw_value: float, calibration_offset: float = 0.0) -> float:
    """
    Calibrates and returns the pH value.
    :param raw_value: measured raw pH value from meter
    :param calibration_offset: calibration offset from standard buffer solutions
    :return: calibrated pH value
    """
    calibrated_ph = raw_value + calibration_offset
    # Ensure the raw value is a valid number
    if not isinstance(calibrated_ph, (int, float)):
        raise ValueError("Raw value must be a numeric type")
    if calibrated_ph is None:
        raise ValueError("Raw value cannot be None")
    if not (-14 <= calibrated_ph <= 14):
        raise ValueError("Raw value must be within the range of -14 to 14")
    if calibration_offset is None:
        raise ValueError("Calibration offset cannot be None")
    if not isinstance(calibration_offset, (int, float)):
        raise ValueError("Calibration offset must be a numeric type")
    if calibration_offset < -14 or calibration_offset > 14:
        raise ValueError("Calibration offset must be within the range of -14 to 14")
    if raw_value < 0 or raw_value > 14:
        raise ValueError("Raw value must be within the range of 0 to 14")
    if not isinstance(raw_value, (int, float)):
        raise ValueError("Raw value must be a numeric type")
    if raw_value is None:
        raise ValueError("Raw value cannot be None")
    if not (-14 <= raw_value <= 14):
        raise ValueError("Raw value must be within the range of -14 to 14")

    # Clamp pH between 0 and 14
    if calibrated_ph < 0:
        calibrated_ph = 0.0
    elif calibrated_ph > 14:
        calibrated_ph = 14.0
    return calibrated_ph

# Calculates the pH value from the voltage reading.
def calculate_ph_from_voltage(voltage: float, slope: float = 59.16, offset: float = 0.0) -> float:
    """
    Converts voltage reading from pH meter to pH value.
    :param voltage: measured voltage in mV
    :param slope: slope of the pH electrode (default is 59.16 mV/pH at 25C)
    :param offset: offset for calibration (default is 0.0)
    :return: calculated pH value
    """
    if slope <= 0:
        raise ValueError("Slope must be a positive value")
    if not isinstance(voltage, (int, float)):
        raise ValueError("Voltage must be a numeric type")
    if voltage is None:
        raise ValueError("Voltage cannot be None")
    if not isinstance(slope, (int, float)):
        raise ValueError("Slope must be a numeric type")
    if slope <= 0:
        raise ValueError("Slope must be a positive value")
    if not isinstance(offset, (int, float)):
        raise ValueError("Offset must be a numeric type")
    if offset is None:
        raise ValueError("Offset cannot be None")
    if not (-14 <= voltage <= 14):
        raise ValueError("Voltage must be within the range of -14 to 14 mV")
    if voltage < 0 or voltage > 14:
        raise ValueError("Voltage must be within the range of 0 to 14 mV")
    
    ph_value = (voltage - offset) / slope
    # Clamp pH between 0 and 14
    if ph_value < 0:
        ph_value = 0.0
    elif ph_value > 14:
        ph_value = 14.0
    return ph_value
