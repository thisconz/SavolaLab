# Calculates average particle size based on input measurements.
def calculate_particle_size(sample_data: dict) -> float:
    """
    Calculates average particle size based on input measurements.
    :param sample_data: dict with keys like 'size_distribution' (list of tuples (size, percentage))
    :return: average particle size in microns
    """
    size_distribution = sample_data.get("size_distribution", [])
    if not size_distribution:
        raise ValueError("Size distribution data required")
    if not all(isinstance(item, tuple) and len(item) == 2 for item in size_distribution):
        raise ValueError("Size distribution must be a list of tuples (size, percentage)")
    if not all(isinstance(size, (int, float)) and isinstance(percentage, (int, float)) for size, percentage in size_distribution):
        raise ValueError("Size and percentage must be numeric values")
    if not all(percentage >= 0 for _, percentage in size_distribution):
        raise ValueError("Percentage values must be non-negative")
    if not all(size >= 0 for size, _ in size_distribution):
        raise ValueError("Size values must be non-negative")
    if not any(percentage > 0 for _, percentage in size_distribution):
        raise ValueError("At least one percentage value must be greater than zero")
    if not any(size > 0 for size, _ in size_distribution):
        raise ValueError("At least one size value must be greater than zero")
    if len(size_distribution) == 1:
        raise ValueError("Size distribution must contain more than one size-percentage pair for averaging")

    # Calculate the weighted average size based on the size distribution
    total_weighted_size = 0.0
    total_percentage = 0.0
    for size, percentage in size_distribution:
        total_weighted_size += size * percentage
        total_percentage += percentage
    # Avoid division by zero
    if total_percentage == 0:
        raise ValueError("Total percentage cannot be zero")

    # Calculate the average size
    if total_percentage < 0:
        raise ValueError("Total percentage cannot be negative")
    if total_percentage == 0:
        raise ValueError("Total percentage cannot be zero, cannot calculate average size")
    average_size = total_weighted_size / total_percentage
    return average_size
