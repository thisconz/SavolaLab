def calculate_turbidity(absorbance: float, calibration_factor: float = 1.0) -> float:
    """
    Calculates turbidity from absorbance using calibration factor.
    :param absorbance: measured absorbance from turbidity meter
    :param calibration_factor: factor from instrument calibration
    :return: turbidity in NTU (Nephelometric Turbidity Units)
    """
    if not isinstance(absorbance, (int, float)):
        raise ValueError("Absorbance must be a numeric type")
    if absorbance < 0:
        raise ValueError("Absorbance must be a non-negative value")
    if not isinstance(calibration_factor, (int, float)):
        raise ValueError("Calibration factor must be a numeric type")
    if calibration_factor <= 0:
        raise ValueError("Calibration factor must be a positive value")
    if absorbance is None:
        raise ValueError("Absorbance cannot be None")
    if calibration_factor is None:
        raise ValueError("Calibration factor cannot be None")

    turbidity = absorbance * calibration_factor
    
    # Ensure turbidity is non-negative
    if turbidity < 0:
        turbidity = 0.0
    return turbidity
