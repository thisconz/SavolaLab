def calculate_sucrose(concentration_percent: float, sample_weight: float) -> float:
    """
    Calculates total sucrose content in grams.
    :param concentration_percent: sucrose concentration percentage (e.g. 65.5%)
    :param sample_weight: weight of sample in grams
    :return: sucrose weight in grams
    """
    if concentration_percent < 0 or concentration_percent > 100:
        raise ValueError("Concentration percent must be between 0 and 100")
    if sample_weight <= 0:
        raise ValueError("Sample weight must be a positive value")
    if not isinstance(concentration_percent, (int, float)):
        raise ValueError("Concentration percent must be a numeric type")
    if not isinstance(sample_weight, (int, float)):
        raise ValueError("Sample weight must be a numeric type")
    if concentration_percent is None:
        raise ValueError("Concentration percent cannot be None")
    if sample_weight is None:
        raise ValueError("Sample weight cannot be None")   
    if concentration_percent < 0 or concentration_percent > 100:
        raise ValueError("Concentration percent must be between 0 and 100")

    sucrose_grams = (concentration_percent / 100.0) * sample_weight
    return sucrose_grams

def calculate_sucrose_from_brix(brix_value: float, sample_weight: float) -> float:
    """
    Converts Brix value to sucrose content in grams.
    :param brix_value: Brix value (e.g. 20.0 for 20% sucrose)
    :param sample_weight: weight of sample in grams
    :return: sucrose weight in grams
    """
    if brix_value < 0 or brix_value > 100:
        raise ValueError("Brix value must be between 0 and 100")
    if sample_weight <= 0:
        raise ValueError("Sample weight must be a positive value")
    if not isinstance(brix_value, (int, float)):
        raise ValueError("Brix value must be a numeric type")
    if not isinstance(sample_weight, (int, float)):
        raise ValueError("Sample weight must be a numeric type")
    if brix_value is None:
        raise ValueError("Brix value cannot be None")
    if sample_weight is None:
        raise ValueError("Sample weight cannot be None")

    # Assuming Brix is equivalent to sucrose concentration
    return calculate_sucrose(brix_value, sample_weight)

def calculate_sucrose_from_density(density: float, sample_weight: float) -> float:
    """
    Estimates sucrose content based on density.
    :param density: density of the solution in g/mL
    :param sample_weight: weight of sample in grams
    :return: estimated sucrose weight in grams
    """
    if density <= 0:
        raise ValueError("Density must be a positive value")
    if sample_weight <= 0:
        raise ValueError("Sample weight must be a positive value")
    if not isinstance(density, (int, float)):
        raise ValueError("Density must be a numeric type")
    if not isinstance(sample_weight, (int, float)):
        raise ValueError("Sample weight must be a numeric type")
    if density is None:
        raise ValueError("Density cannot be None")
    if sample_weight is None:
        raise ValueError("Sample weight cannot be None")
    if density < 1.0:
        raise ValueError("Density must be greater than or equal to 1.0 g/mL for sucrose solutions")
    if density > 1.5:
        raise ValueError("Density must be less than or equal to 1.5 g/mL for sucrose solutions")

    # Assuming a linear relationship between density and sucrose concentration
    concentration_percent = (density - 1.0) * 100.0
    return calculate_sucrose(concentration_percent, sample_weight)
