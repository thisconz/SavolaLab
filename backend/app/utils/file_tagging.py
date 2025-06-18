from app.domain.models.enums import AttachmentTag, AutoTag

# Auto-tagging logic
def auto_tag_filename(filename: str) -> AttachmentTag:
    """
    Automatically assign a tag based on the filename content.
    :param filename: Name of the file to analyze
    :return: AttachmentTag enum member
    """
    lower_name = filename.lower()

    if "raw" in lower_name or "scan" in lower_name:
        return AttachmentTag.RAW_SCAN
    if "report" in lower_name or "summary" in lower_name:
        return AttachmentTag.REPORT
    if "image" in lower_name or "photo" in lower_name:
        return AttachmentTag.IMAGE
    if "certificate" in lower_name or "certification" in lower_name:
        return AttachmentTag.CERTIFICATE
    if "lab" in lower_name and "sheet" in lower_name:
        return AttachmentTag.LAB_SHEET
    if "micro" in lower_name or "microscope" in lower_name:
        return AttachmentTag.MICROSCOPE
    if "scan" in lower_name or "result" in lower_name:
        return AttachmentTag.SCAN_RESULT
    if "device" in lower_name or "output" in lower_name:
        return AttachmentTag.DEVICE_OUTPUT

    return AttachmentTag.OTHER

# (Optional) Auto-tagging logic based on file content
def auto_tag_from_content(content: bytes) -> AutoTag:
    """
    (Optional) Analyze file content to assign auto tags.
    This is a stub for future enhancements, such as using ML or keywords.
    :param content: Binary content of the file
    :return: AutoTag enum member or None
    """
    text_snippet = content[:100].decode(errors="ignore").lower()

    if "raw" in text_snippet or "scan" in text_snippet:
        return AutoTag.RAW_SCAN
    if "report" in text_snippet or "summary" in text_snippet:
        return AutoTag.REPORT
    if "image" in text_snippet or "photo" in text_snippet:
        return AutoTag.IMAGE
    if "microscope" in text_snippet:
        return AutoTag.MICROSCOPE
    if "lab sheet" in text_snippet:
        return AutoTag.LAB_SHEET
    if "scan" in text_snippet:
        return AutoTag.RAW_SCAN
    if "certificate" in text_snippet:
        return AutoTag.CERTIFICATE

    return None
